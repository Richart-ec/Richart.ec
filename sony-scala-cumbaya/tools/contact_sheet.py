"""Contact sheet of rendered frames with frame labels.

Usage: python3 -I tools/contact_sheet.py <frames_dir> <out.jpg> <first_frame> <f1,f2,...> [cols] [tile_w]
<first_frame> is the global frame number of element-00 in the folder.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def main() -> None:
    frames_dir, out, first = Path(sys.argv[1]), sys.argv[2], int(sys.argv[3])
    wanted = [int(x) for x in sys.argv[4].split(",")]
    cols = int(sys.argv[5]) if len(sys.argv) > 5 else 6
    tile_w = int(sys.argv[6]) if len(sys.argv) > 6 else 270
    files = sorted(frames_dir.glob("element-*.*"))
    tile_h = tile_w * 16 // 9
    rows = (len(wanted) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tile_w + 6) + 6, rows * (tile_h + 30) + 6), (40, 40, 44))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    for i, f in enumerate(wanted):
        idx = f - first
        if idx < 0 or idx >= len(files):
            continue
        im = Image.open(files[idx]).convert("RGB").resize((tile_w, tile_h), Image.LANCZOS)
        x = 6 + (i % cols) * (tile_w + 6)
        y = 6 + (i // cols) * (tile_h + 30)
        sheet.paste(im, (x, y + 24))
        draw.text((x + 2, y + 2), f"f{f}  {f / 30:.2f}s", fill=(230, 230, 230), font=font)
    sheet.save(out, quality=88)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
