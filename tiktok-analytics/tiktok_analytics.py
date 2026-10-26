#!/usr/bin/env python3
"""Cliente de la API oficial de TikTok (Login Kit + Display API v2).

Descarga las estadísticas públicas de la cuenta autorizada y de cada video
(vistas, likes, comentarios, compartidos) y genera un reporte en Markdown.

Solo usa la librería estándar de Python 3.9+. Ver README.md para la
configuración de la app en developers.tiktok.com.

Uso:
    python3 tiktok_analytics.py auth-url
    python3 tiktok_analytics.py token "<URL a la que te redirigió TikTok>"
    python3 tiktok_analytics.py pull
    python3 tiktok_analytics.py report
"""

import argparse
import csv
import json
import os
import secrets
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"
VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/"

DEFAULT_SCOPES = "user.info.basic,user.info.profile,user.info.stats,video.list"

USER_FIELDS_BY_SCOPE = {
    "user.info.basic": ["open_id", "display_name", "avatar_url"],
    "user.info.profile": ["username", "bio_description", "is_verified", "profile_deep_link"],
    "user.info.stats": ["follower_count", "following_count", "likes_count", "video_count"],
}

VIDEO_FIELDS = [
    "id", "create_time", "title", "video_description", "duration",
    "view_count", "like_count", "comment_count", "share_count",
    "share_url", "cover_image_url",
]

# Ecuador continental no tiene horario de verano: UTC-5 todo el año.
LOCAL_TZ = timezone(timedelta(hours=-5), "Ecuador")
WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

HERE = Path(__file__).resolve().parent


class TikTokError(RuntimeError):
    pass


def load_env(path):
    """Carga KEY=VALUE de un archivo .env sin pisar variables ya definidas."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name):
    value = os.environ.get(name)
    if not value:
        sys.exit(f"Falta {name}. Cópialo en tiktok-analytics/.env (ver .env.example).")
    return value


def http(method, url, *, headers=None, data=None, json_body=None):
    headers = dict(headers or {})
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode()
        headers["Content-Type"] = "application/json"
    elif data is not None:
        body = urllib.parse.urlencode(data).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode())
        except ValueError:
            raise TikTokError(f"HTTP {e.code} en {url}") from e

    # El endpoint de token devuelve {"error": "...", "error_description": ...};
    # los de datos devuelven {"error": {"code": "ok" | "...", "message": ...}}.
    err = payload.get("error")
    if isinstance(err, str) and err:
        raise TikTokError(f"{err}: {payload.get('error_description', '')} (log_id {payload.get('log_id')})")
    if isinstance(err, dict) and err.get("code") not in (None, "ok"):
        raise TikTokError(f"{err.get('code')}: {err.get('message', '')} (log_id {err.get('log_id')})")
    return payload


# ---------- OAuth ----------

def cmd_auth_url(args):
    client_key = require_env("TIKTOK_CLIENT_KEY")
    redirect_uri = require_env("TIKTOK_REDIRECT_URI")
    scopes = os.environ.get("TIKTOK_SCOPES", DEFAULT_SCOPES)
    state = secrets.token_urlsafe(16)
    args.data_dir.mkdir(parents=True, exist_ok=True)
    (args.data_dir / "oauth_state.txt").write_text(state, encoding="utf-8")
    query = urllib.parse.urlencode({
        "client_key": client_key,
        "response_type": "code",
        "scope": scopes,
        "redirect_uri": redirect_uri,
        "state": state,
    })
    print("1. Abre este enlace con la sesión de @olieli.barber iniciada y autoriza la app:\n")
    print(f"{AUTH_URL}?{query}\n")
    print("2. TikTok te redirige a tu redirect URI (aunque la página no cargue, no importa).")
    print("3. Copia la URL completa de la barra de direcciones y ejecuta:")
    print('   python3 tiktok_analytics.py token "<URL copiada>"')


def save_token(args, payload):
    payload["obtained_at"] = int(time.time())
    path = args.data_dir / "token.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    os.chmod(path, 0o600)


def cmd_token(args):
    client_key = require_env("TIKTOK_CLIENT_KEY")
    client_secret = require_env("TIKTOK_CLIENT_SECRET")
    redirect_uri = require_env("TIKTOK_REDIRECT_URI")

    raw = args.redirected_url.strip()
    params = urllib.parse.parse_qs(urllib.parse.urlparse(raw).query)
    if "error" in params:
        sys.exit(f"TikTok rechazó la autorización: {params['error'][0]} {params.get('error_description', [''])[0]}")
    code = params["code"][0] if "code" in params else raw
    state_file = args.data_dir / "oauth_state.txt"
    if "state" in params and state_file.exists():
        if params["state"][0] != state_file.read_text(encoding="utf-8").strip():
            sys.exit("El parámetro state no coincide. Genera un enlace nuevo con auth-url.")

    payload = http("POST", TOKEN_URL, data={
        "client_key": client_key,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    })
    save_token(args, payload)
    print(f"Token guardado. Permisos concedidos: {payload.get('scope')}")
    print("Ahora ejecuta: python3 tiktok_analytics.py pull")


def refresh(args, token):
    payload = http("POST", TOKEN_URL, data={
        "client_key": require_env("TIKTOK_CLIENT_KEY"),
        "client_secret": require_env("TIKTOK_CLIENT_SECRET"),
        "grant_type": "refresh_token",
        "refresh_token": token["refresh_token"],
    })
    save_token(args, payload)
    return payload


def get_token(args):
    path = args.data_dir / "token.json"
    if not path.exists():
        sys.exit("No hay token. Ejecuta primero auth-url y token.")
    token = json.loads(path.read_text(encoding="utf-8"))
    # Renueva con 5 minutos de margen; el access token dura 24 h.
    if time.time() > token["obtained_at"] + token.get("expires_in", 0) - 300:
        token = refresh(args, token)
    return token


def cmd_refresh(args):
    path = args.data_dir / "token.json"
    if not path.exists():
        sys.exit("No hay token. Ejecuta primero auth-url y token.")
    payload = refresh(args, json.loads(path.read_text(encoding="utf-8")))
    print(f"Token renovado. Vence en {payload.get('expires_in')} s.")


# ---------- Descarga de datos ----------

def cmd_pull(args):
    token = get_token(args)
    auth = {"Authorization": f"Bearer {token['access_token']}"}
    granted = set(token.get("scope", "").split(","))

    user_fields = [f for scope, fields in USER_FIELDS_BY_SCOPE.items() if scope in granted for f in fields]
    profile = http("GET", f"{USER_INFO_URL}?fields={','.join(user_fields)}", headers=auth)["data"]["user"]

    if "video.list" not in granted:
        sys.exit("La app no tiene el permiso video.list. Actívalo en el portal y vuelve a autorizar.")
    videos, cursor = [], None
    while True:
        body = {"max_count": 20}
        if cursor is not None:
            body["cursor"] = cursor
        data = http("POST", f"{VIDEO_LIST_URL}?fields={','.join(VIDEO_FIELDS)}",
                    headers=auth, json_body=body)["data"]
        videos.extend(data.get("videos", []))
        if not data.get("has_more"):
            break
        cursor = data.get("cursor")

    pulled_at = datetime.now(timezone.utc).isoformat()
    (args.data_dir / "profile.json").write_text(
        json.dumps({"pulled_at": pulled_at, **profile}, indent=2, ensure_ascii=False), encoding="utf-8")
    (args.data_dir / "videos.json").write_text(
        json.dumps({"pulled_at": pulled_at, "videos": videos}, indent=2, ensure_ascii=False), encoding="utf-8")
    write_csv(args.data_dir / "videos.csv", [enrich(v) for v in videos])
    print(f"Perfil: {profile.get('display_name')} — {profile.get('follower_count', '?')} seguidores")
    print(f"{len(videos)} videos guardados en {args.data_dir}")


# ---------- Reporte ----------

def enrich(v):
    views = v.get("view_count") or 0
    likes, comments, shares = (v.get(k) or 0 for k in ("like_count", "comment_count", "share_count"))
    posted = datetime.fromtimestamp(v.get("create_time", 0), LOCAL_TZ)
    return {
        "id": v.get("id"),
        "fecha_ecuador": posted.strftime("%Y-%m-%d %H:%M"),
        "dia": WEEKDAYS[posted.weekday()],
        "hora": posted.hour,
        "duracion_s": v.get("duration"),
        "vistas": views,
        "likes": likes,
        "comentarios": comments,
        "compartidos": shares,
        "engagement_pct": round(100 * (likes + comments + shares) / views, 2) if views else 0,
        "compartidos_pct": round(100 * shares / views, 3) if views else 0,
        "titulo": (v.get("title") or v.get("video_description") or "").replace("\n", " ")[:120],
        "url": v.get("share_url"),
    }


def write_csv(path, rows):
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def median_table(rows, key, order=None):
    groups = defaultdict(list)
    for r in rows:
        groups[r[key]].append(r["vistas"])
    keys = order or sorted(groups)
    lines = [f"| {key} | videos | vistas medianas |", "|---|---|---|"]
    for k in keys:
        if k in groups:
            lines.append(f"| {k} | {len(groups[k])} | {int(statistics.median(groups[k])):,} |")
    return "\n".join(lines)


def duration_bucket(seconds):
    if seconds is None:
        return "?"
    for limit, label in ((15, "0–15 s"), (30, "16–30 s"), (60, "31–60 s")):
        if seconds <= limit:
            return label
    return "60 s +"


def cmd_report(args):
    path = args.data_dir / "videos.json"
    if not path.exists():
        sys.exit("No hay datos. Ejecuta primero pull.")
    raw = json.loads(path.read_text(encoding="utf-8"))
    rows = [enrich(v) for v in raw["videos"]]
    if not rows:
        sys.exit("La cuenta no tiene videos públicos.")
    profile_path = args.data_dir / "profile.json"
    profile = json.loads(profile_path.read_text(encoding="utf-8")) if profile_path.exists() else {}

    med = statistics.median(r["vistas"] for r in rows)
    by_views = sorted(rows, key=lambda r: r["vistas"], reverse=True)
    for r in rows:
        r["duracion"] = duration_bucket(r["duracion_s"])

    def video_table(items):
        if not items:
            return "Ninguno."
        lines =["| fecha (EC) | vistas | x mediana | eng % | compartidos | título |", "|---|---|---|---|---|---|"]
        for r in items:
            ratio = r["vistas"] / med if med else 0
            lines.append(f"| {r['fecha_ecuador']} | {r['vistas']:,} | {ratio:.1f}x | {r['engagement_pct']} "
                         f"| {r['compartidos']} | [{r['titulo'] or '(sin título)'}]({r['url']}) |")
        return "\n".join(lines)

    out = [
        f"# Reporte TikTok — @{profile.get('username', '?')}",
        f"Datos descargados: {raw.get('pulled_at')}  ",
        f"Seguidores: {profile.get('follower_count', '?')} · Me gusta: {profile.get('likes_count', '?')} "
        f"· Videos: {profile.get('video_count', len(rows))}",
        "",
        "## Resumen",
        f"- Videos analizados: {len(rows)}",
        f"- Vistas totales: {sum(r['vistas'] for r in rows):,}",
        f"- Vistas medianas por video: {int(med):,}",
        f"- Engagement medio: {statistics.mean(r['engagement_pct'] for r in rows):.2f} %",
        "",
        "## Top 10 por vistas",
        video_table(by_views[:10]),
        "",
        "## Videos fuera de serie (≥ 3x la mediana)",
        video_table([r for r in by_views if med and r["vistas"] >= 3 * med]),
        "",
        "## 10 con menos vistas",
        video_table(by_views[-10:][::-1]),
        "",
        "## Vistas según día de publicación (hora de Ecuador)",
        median_table(rows, "dia", WEEKDAYS),
        "",
        "## Vistas según hora de publicación (hora de Ecuador)",
        median_table(rows, "hora"),
        "",
        "## Vistas según duración",
        median_table(rows, "duracion", ["0–15 s", "16–30 s", "31–60 s", "60 s +", "?"]),
        "",
        "> Ojo: día y hora muestran cuándo se publicó cada video y cómo le fue, no cuándo está",
        "> conectada la audiencia. Ese dato (actividad de seguidores) solo aparece en TikTok Studio.",
        "> Con pocos videos por grupo, las medianas son orientativas.",
    ]
    report_path = args.data_dir / "reporte.md"
    report_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    write_csv(args.data_dir / "videos.csv", rows)
    print(f"Reporte generado: {report_path}")


def main():
    load_env(HERE / ".env")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data-dir", type=Path, default=HERE / "data",
                        help="carpeta donde se guardan token y datos (por defecto ./data)")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("auth-url", help="genera el enlace de autorización").set_defaults(func=cmd_auth_url)
    p = sub.add_parser("token", help="canjea el código de autorización por un token")
    p.add_argument("redirected_url", help="URL completa a la que te redirigió TikTok (o solo el code)")
    p.set_defaults(func=cmd_token)
    sub.add_parser("refresh", help="renueva el access token").set_defaults(func=cmd_refresh)
    sub.add_parser("pull", help="descarga perfil y videos").set_defaults(func=cmd_pull)
    sub.add_parser("report", help="genera data/reporte.md y data/videos.csv").set_defaults(func=cmd_report)
    args = parser.parse_args()
    args.data_dir.mkdir(parents=True, exist_ok=True)
    try:
        args.func(args)
    except TikTokError as e:
        sys.exit(f"Error de la API de TikTok: {e}")


if __name__ == "__main__":
    main()
