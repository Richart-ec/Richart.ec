# TikTok Analytics — @olieli.barber

Conecta la cuenta de TikTok con la **API oficial de TikTok** (Login Kit + Display API v2)
y descarga las estadísticas de todos los videos para analizarlas.

## Qué datos da y cuáles no

| Sí da (Display API) | No da (solo TikTok Studio o API for Business) |
|---|---|
| Seguidores, seguidos, me gusta y número de videos | Retención y tiempo medio de visualización |
| Por video: vistas, likes, comentarios, compartidos | % que vio el video completo |
| Fecha y hora de publicación, duración, título | Fuentes de tráfico y búsquedas |
| Enlace a cada video | Actividad de seguidores por hora/día, edad, país |
| | Guardados |

Los datos de la columna derecha se toman de capturas de TikTok Studio o, más adelante,
de la API for Business (requiere cuenta de empresa y otra app aprobada).

## 1. Crear la app en TikTok for Developers (una sola vez)

1. Entra a <https://developers.tiktok.com>, inicia sesión y ve a **Manage apps → Connect an app**.
2. Completa los datos de la app: nombre (p. ej. "OliEli Analytics"), ícono, categoría
   y plataforma **Web**.
3. En **Products**, agrega **Login Kit** (y **Display API** si aparece como producto aparte).
4. En **Scopes**, activa: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`.
5. En Login Kit → **Redirect URI**, registra una URL `https://` tuya, sin parámetros
   (p. ej. `https://tu-dominio.com/tiktok/callback`). La página no tiene que existir:
   solo hay que copiar la URL a la que TikTok redirige.
6. **Sandbox** (para no esperar la revisión de TikTok): crea un sandbox y, en
   **Target users → Add account**, inicia sesión con **@olieli.barber**. Puede tardar
   hasta una hora en aparecer.
7. Copia el **Client key** y el **Client secret** del sandbox.

## 2. Configurar

```bash
cd tiktok-analytics
cp .env.example .env   # y rellena TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI
```

`.env` y la carpeta `data/` están en `.gitignore`: el secret y el token nunca se suben al repo.

## 3. Usar

Solo necesita Python 3.9 o superior, sin instalar nada más.

```bash
python3 tiktok_analytics.py auth-url             # 1. imprime el enlace para autorizar
python3 tiktok_analytics.py token "<URL de vuelta>"  # 2. pega la URL a la que te llevó TikTok
python3 tiktok_analytics.py pull                 # 3. descarga perfil y videos
python3 tiktok_analytics.py report               # 4. genera el reporte
```

Resultados en `data/`:

- `reporte.md`: top 10, videos fuera de serie (3x la mediana o más), los 10 más flojos,
  y vistas medianas según día, hora (hora de Ecuador) y duración.
- `videos.csv`: todos los videos con engagement %, para abrir en Excel o Google Sheets.
- `profile.json`, `videos.json`: datos crudos.

El access token dura 24 h y se renueva solo con el refresh token, que vale 365 días.
Para actualizar los datos basta con volver a ejecutar `pull` y `report`.
