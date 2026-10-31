"""Prepares 12x upscaled, thresholded bitmaps of the G glyph and the MASTER
wordmark from the official /lentes-gm banner, for tracing with potrace.

The emblem itself is NOT traced: it is rebuilt geometrically from the fitted
parameters below (parabolic sides, flat top/bottom, tiny corner radius).

Usage: python3 -I tools/prep_gmaster_bitmaps.py <banner.jpg> <out_dir>
Writes: g.png, master.png and crops.json (offsets/scale to map paths back).
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SCALE = 12
# Gaussian pre-smoothing (in source pixels) applied after upscaling: removes the
# JPEG 8x8 ringing that otherwise turns straight edges into wobbles.
SMOOTH = float(os.environ.get("GM_SMOOTH", "0.35"))
# Fitted on the banner (subpixel, from anti-aliased edges): see BRAND-NOTES.md
EMBLEM = {
    "cx": 1058.96,
    "cy": 105.01,
    "height": 94.03,
    "half_w_mid": 68.485,  # (1127.444 - 990.478) / 2
    "half_w_top": 60.980,  # (1119.803 - 997.842) / 2
}


def emblem_mask(xs, ys):
    """True inside the fitted emblem (parabolic sides, flat top/bottom)."""
    e = EMBLEM
    dy = ys - e["cy"]
    half_h = e["height"] / 2
    k = (e["half_w_mid"] - e["half_w_top"]) / half_h**2
    half_w = e["half_w_mid"] - k * dy**2
    return (np.abs(dy) <= half_h) & (np.abs(xs - e["cx"]) <= half_w)


def upscale(arr, box):
    x0, y0, x1, y1 = box
    crop = Image.fromarray(arr[y0:y1, x0:x1].astype(np.uint8))
    up = np.asarray(
        crop.resize(((x1 - x0) * SCALE, (y1 - y0) * SCALE), Image.BICUBIC), dtype=float
    )
    return ndimage.gaussian_filter(up, SMOOTH * SCALE) if SMOOTH > 0 else up


def main(banner: str, out_dir: str) -> None:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(banner).convert("RGB"), dtype=float)

    # --- G glyph: white on orange. Blue channel: orange ~3, white ~250.
    g_box = (1000, 64, 1118, 146)
    blue = upscale(rgb[..., 2], g_box)
    h, w = blue.shape
    yy, xx = np.mgrid[0:h, 0:w]
    src_x = g_box[0] + (xx + 0.5) / SCALE - 0.5
    src_y = g_box[1] + (yy + 0.5) / SCALE - 0.5
    inside = emblem_mask(src_x + 0.5, src_y + 0.5)
    # shrink the mask a bit so the light background never leaks into the G trace
    inside &= emblem_mask(src_x + 0.5 + 2.5, src_y + 0.5) & emblem_mask(src_x + 0.5 - 2.5, src_y + 0.5)
    g_black = (blue > (3 + 250) / 2) & inside  # G pixels -> black for potrace
    Image.fromarray(np.where(g_black, 0, 255).astype(np.uint8)).save(out / "g.png")

    # --- MASTER: black text on light-gray banner background.
    m_box = (1150, 80, 1370, 130)
    lum = upscale(rgb.mean(axis=2), m_box)
    bg = np.median(lum[:SCALE * 2])
    m_black = lum < bg / 2
    Image.fromarray(np.where(m_black, 0, 255).astype(np.uint8)).save(out / "master.png")

    (out / "crops.json").write_text(
        json.dumps({"scale": SCALE, "g_box": g_box, "master_box": m_box, "emblem": EMBLEM}, indent=2)
    )
    print("wrote", out / "g.png", out / "master.png", "bg", round(float(bg), 1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
