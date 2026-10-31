"""Objective checks of the generated audio + an annotated spectrogram.

Usage: python3 -I tools/audio_check.py <project_dir> <out.png>
Prints DC offset, stereo correlation, kick onsets vs the 120 BPM grid,
and draws a log-frequency spectrogram with the key frames marked.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import signal
from scipy.io import wavfile


def main(project: str, out_png: str) -> None:
    proj = Path(project)
    sr, mix = wavfile.read(proj / "public/audio/sony-scala-mix.wav")
    _, mus = wavfile.read(proj / "public/audio/music.wav")
    _, sfx = wavfile.read(proj / "public/audio/sfx.wav")
    x = mix.astype(float) / 32768.0
    print(f"samples {len(x)}  sr {sr}  dur {len(x) / sr:.4f}s  channels {x.shape[1]}")
    print(f"DC offset L {x[:, 0].mean():+.2e}  R {x[:, 1].mean():+.2e}")
    corr = np.corrcoef(x[:, 0], x[:, 1])[0, 1]
    print(f"stereo correlation {corr:+.3f} (mono-safe if > 0)")
    stem_sum = (mus.astype(float) + sfx.astype(float)) / 32768.0
    err = np.max(np.abs(stem_sum - x))
    print(f"max |music+sfx - mix| = {err * 32768:.1f} LSB")

    # kick onsets: low band energy flux
    low = signal.sosfilt(signal.butter(4, 120, "lowpass", fs=sr, output="sos"), x.mean(axis=1))
    env = np.abs(signal.hilbert(low))
    hop = sr // 200
    e = env[::hop]
    flux = np.maximum(np.diff(e), 0)
    peaks, _ = signal.find_peaks(flux, height=flux.max() * 0.25, distance=40)
    onsets = peaks * hop / sr
    grid = 0.5
    dev = [(o, (o / grid - round(o / grid)) * grid * 1000) for o in onsets if o > 1.5]
    print("low-end onsets (s) and deviation from the beat grid (ms):")
    print("  " + "  ".join(f"{o:.3f}({d:+.0f})" for o, d in dev[:24]))

    # spectrogram
    f, t, S = signal.spectrogram(x.mean(axis=1), fs=sr, nperseg=2048, noverlap=1536)
    S = 10 * np.log10(S + 1e-12)
    fmin, fmax = 30, 16000
    rows = 360
    logf = np.geomspace(fmin, fmax, rows)
    img = np.array([np.interp(logf, f, S[:, j]) for j in range(S.shape[1])]).T[::-1]
    lo, hi = np.percentile(img, 35), np.percentile(img, 99.7)
    v = np.clip((img - lo) / (hi - lo), 0, 1)
    rgb = np.stack([v ** 0.6 * 255, v ** 1.4 * 200, (1 - v) * v * 4 * 120 + v ** 3 * 60], axis=-1).astype(np.uint8)
    W = 1500
    im = Image.fromarray(rgb).resize((W, rows * 2), Image.BILINEAR)
    canvas = Image.new("RGB", (W + 80, rows * 2 + 70), (12, 12, 14))
    canvas.paste(im, (60, 10))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    cues = json.loads((proj / "src/timeline/cues.json").read_text())
    marks = {
        "SONY": 0, "whip": cues["opening"]["exit"][0], "AF": cues["kit"]["focusSnap"], "push": cues["kit"]["push"]["start"],
        "iris": cues["iris"]["close"]["start"], "shutter": cues["iris"]["shutter"]["start"], "drop": 240,
        "G MASTER": cues["pro"]["seal"]["glint"], "flash": cues["closing"]["flash"], "hit": cues["closing"]["accent"],
    }
    for name, fr in marks.items():
        xx = 60 + int(fr / 450 * W)
        d.line([(xx, 10), (xx, rows * 2 + 10)], fill=(255, 255, 255), width=1)
        d.text((xx + 3, rows * 2 + 14 + (12 if name in ("push", "shutter", "G MASTER", "hit") else 0)), name, fill=(230, 230, 230), font=font)
    for fr_hz in [50, 100, 500, 1000, 5000, 10000]:
        yy = 10 + int((1 - np.log(fr_hz / fmin) / np.log(fmax / fmin)) * rows * 2)
        d.text((4, yy - 7), f"{fr_hz if fr_hz < 1000 else str(fr_hz // 1000) + 'k'}", fill=(180, 180, 180), font=font)
    for s in range(0, 16):
        xx = 60 + int(s / 15 * W)
        d.text((xx - 4, rows * 2 + 46), f"{s}s", fill=(150, 150, 150), font=font)
    canvas.save(out_png)
    print("spectrogram ->", out_png)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
