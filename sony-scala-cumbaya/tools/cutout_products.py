"""Cuts official Sony product photos (shot on pure white) out to RGBA PNGs.

Method
1. Background = near-white pixels connected to the image border (flood fill
   via connected components, scipy.ndimage.label). Enclosed pure-white holes
   (strap-lug rings) are removed too when they are clearly paper-white.
2. Edge band (<= BAND px from the background): alpha is estimated from how
   much white is mixed in, using the local foreground colour as reference,
   alpha = (255 - Y) / (255 - Yf). Colour is then un-mixed from white:
   F = (C - (1 - alpha) * 255) / alpha  -> no white halo on dark backgrounds.
3. Trim to the content bounding box with a small margin.

Also measures anchors used by the animation (lens centre, sensor centre, G
badge) and writes them to src/lib/productMeta.json.

Usage: python3 -I tools/cutout_products.py <originals_dir> <project_dir>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

BAND = 3          # px from background where alpha is soft
WHITE_T = 251     # min(R,G,B) above this counts as background (Sony shoots on pure 255)
HOLE_MIN = 60     # min area of an enclosed hole to remove
HOLE_MEAN = 251   # enclosed region must be this white (paper white, not print)
HOLE_EDGE = 70    # holes only within this many px of the left/right extremes
                  # (strap lugs) - never the white SONY / α prints on the body
MARGIN = 6

JOBS = [
    # (source, output name, crop box (x0, y0, x1, y1) or None)
    ("prod-ILCE-6400K-06-Front.jpg", "a6400-kit.png", None),
    ("prod-GENBA_ILCE-7M5_01_Main_SSO_1000x1000px.jpg", "a7v-body.png", None),
    ("prod-SEL2470GM2-1-Main-A.jpg", "sel2470gm2.png", (460, 150, 960, 880)),
]


def luminance(rgb):
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def cut(rgb):
    h, w, _ = rgb.shape
    near_white = rgb.min(axis=2) > WHITE_T
    lab, n = ndimage.label(near_white)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])

    # enclosed paper-white holes (strap lug rings only: near the lateral extremes)
    holes = 0
    lum = luminance(rgb)
    fx = np.nonzero((~bg).any(axis=0))[0]
    left_x, right_x = fx.min(), fx.max()
    for i in range(1, n + 1):
        if i in border:
            continue
        region = lab == i
        area = int(region.sum())
        rx = np.nonzero(region.any(axis=0))[0]
        lateral = rx.max() < left_x + HOLE_EDGE or rx.min() > right_x - HOLE_EDGE
        if lateral and area >= HOLE_MIN and lum[region].mean() >= HOLE_MEAN:
            bg |= region
            holes += 1

    # remove 1-2 px spikes/specks (JPEG ringing around bright metal) with a
    # morphological opening of the foreground mask
    cross = ndimage.generate_binary_structure(2, 1)
    bg = ~ndimage.binary_opening(~bg, structure=cross, iterations=1)

    # drop tiny foreground islands (JPEG speckles around bright metal)
    fg_lab, fg_n = ndimage.label(~bg)
    if fg_n > 1:
        sizes = ndimage.sum(~bg, fg_lab, range(1, fg_n + 1))
        for i, s in enumerate(sizes, start=1):
            if s < 400:
                bg |= fg_lab == i

    dist = ndimage.distance_transform_edt(~bg)
    alpha = np.ones((h, w))
    alpha[bg] = 0.0
    band = (~bg) & (dist <= BAND)

    # foreground reference = colour of the nearest pixel just inside the band
    inner = (~bg) & (dist > BAND) & (dist <= BAND + 1.5)
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    ref = rgb[iy, ix]
    ref_y = luminance(ref)

    out = rgb.copy()
    dark_ref = band & (ref_y < 170)
    bright_ref = band & ~dark_ref

    # dark/mid foreground: alpha from the amount of white mixed in, then un-mix
    a_est = np.clip((255.0 - lum) / np.maximum(255.0 - ref_y, 12.0), 0.0, 1.0)
    alpha[dark_ref] = a_est[dark_ref]
    a3 = alpha[..., None]
    unmixed = np.clip((rgb - (1.0 - a3) * 255.0) / np.maximum(a3, 1e-3), 0, 255)
    part = dark_ref & (alpha > 0.03)
    out[part] = unmixed[part]
    out[dark_ref & (alpha <= 0.03)] = ref[dark_ref & (alpha <= 0.03)]

    # bright metal (strap lugs): colour-based alpha is unstable, use an
    # anti-aliased version of the hard mask and keep the original colour
    soft = np.clip(ndimage.gaussian_filter((~bg).astype(float), 0.7) * 2.0 - 0.15, 0.0, 1.0)
    # ...but never let a near-paper-white edge pixel (JPEG ringing) stay opaque
    a_bright = np.clip((255.0 - lum) / np.maximum(255.0 - ref_y, 25.0), 0.0, 1.0)
    alpha[bright_ref] = np.minimum(soft, a_bright)[bright_ref]

    # give fully transparent pixels the nearest opaque colour (no white fringes
    # if anything samples straight-alpha RGB)
    _, (oy, ox) = ndimage.distance_transform_edt(alpha < 0.5, return_indices=True)
    clear = alpha <= 0.0
    out[clear] = out[oy[clear], ox[clear]]
    return out, alpha, holes


def save(out_rgb, alpha, path):
    ys, xs = np.nonzero(alpha > 0.01)
    y0, y1 = max(ys.min() - MARGIN, 0), min(ys.max() + MARGIN + 1, alpha.shape[0])
    x0, x1 = max(xs.min() - MARGIN, 0), min(xs.max() + MARGIN + 1, alpha.shape[1])
    rgba = np.dstack([out_rgb, alpha * 255.0])[y0:y1, x0:x1]
    Image.fromarray(np.round(rgba).astype(np.uint8), "RGBA").save(path, optimize=True)
    return (int(x0), int(y0), int(x1 - x0), int(y1 - y0))


def radial_center(gray, guess, rmin, rmax, search=20):
    """Centre of concentric rings: minimises luminance variance along circles."""
    a = ndimage.gaussian_filter(gray, 1.0)
    th = np.linspace(0, 2 * np.pi, 180, endpoint=False)
    radii = np.arange(rmin, rmax, 2.0)

    def score(cx, cy):
        xs = cx + np.outer(radii, np.cos(th))
        ys = cy + np.outer(radii, np.sin(th))
        v = ndimage.map_coordinates(a, [ys.ravel(), xs.ravel()], order=1)
        return v.reshape(len(radii), len(th)).var(axis=1).mean()

    best = min(
        ((score(guess[0] + dx, guess[1] + dy), guess[0] + dx, guess[1] + dy)
         for dx in range(-search, search + 1, 2) for dy in range(-search, search + 1, 2)),
        key=lambda t: t[0],
    )
    _, cx0, cy0 = best
    fine = min(
        ((score(cx0 + dx, cy0 + dy), cx0 + dx, cy0 + dy)
         for dx in np.arange(-2, 2.01, 0.5) for dy in np.arange(-2, 2.01, 0.5)),
        key=lambda t: t[0],
    )
    return {"x": float(fine[1]), "y": float(fine[2])}


def blob_centroid(mask):
    lab, n = ndimage.label(mask)
    if n == 0:
        return None
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    k = int(np.argmax(sizes)) + 1
    cy, cx = ndimage.center_of_mass(lab == k)
    ys, xs = np.nonzero(lab == k)
    return {"x": float(cx), "y": float(cy), "w": int(xs.max() - xs.min() + 1), "h": int(ys.max() - ys.min() + 1)}


def main(originals: str, project: str) -> None:
    src_dir = Path(originals)
    out_dir = Path(project, "public/products")
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {}
    for src, name, crop in JOBS:
        im = Image.open(src_dir / src).convert("RGB")
        offset = (0, 0)
        if crop:
            im = im.crop(crop)
            offset = (crop[0], crop[1])
        rgb = np.asarray(im, dtype=float)
        out_rgb, alpha, holes = cut(rgb)
        x0, y0, w, h = save(out_rgb, alpha, out_dir / name)
        entry = {"file": f"products/{name}", "width": w, "height": h, "source": src,
                 "trim": [x0 + offset[0], y0 + offset[1]], "holesRemoved": holes}

        # anchors in the trimmed PNG's pixel space
        to_local = lambda p: {"x": round(p["x"] - x0, 2), "y": round(p["y"] - y0, 2)}
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        if name.startswith("a6400"):
            # optical axis = centre of the concentric lens rings
            c = radial_center(luminance(rgb), (617, 497), 20, 200)
            entry["lensCenter"] = to_local(c)
            entry["lensBarrelRadius"] = 212
        if name.startswith("a7v"):
            mx, mn = rgb.max(axis=2), rgb.min(axis=2)
            sat = (mx - mn) / np.maximum(mx, 1)
            sensor = (sat > 0.35) & (mx > 90) & (b > r)
            c = blob_centroid(sensor)
            lab, _ = ndimage.label(sensor)
            ys, xs = np.nonzero(lab == lab[int(c["y"]), int(c["x"])]) if lab[int(c["y"]), int(c["x"])] else np.nonzero(sensor)
            box = {"x": (xs.min() + xs.max()) / 2.0, "y": (ys.min() + ys.max()) / 2.0}
            entry["sensorCenter"] = to_local(box)
            entry["sensorSize"] = {"w": int(xs.max() - xs.min() + 1), "h": int(ys.max() - ys.min() + 1)}
        if name.startswith("sel2470"):
            badge = (r > 170) & (r - b > 120) & (g < 140)
            c = blob_centroid(badge)
            entry["gBadge"] = to_local(c)
            entry["gBadgeSize"] = {"w": c["w"], "h": c["h"]}
        meta[name.replace(".png", "")] = entry
        print(name, entry)
    Path(project, "src/lib/productMeta.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
