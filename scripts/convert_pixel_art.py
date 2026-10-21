#!/usr/bin/env python3
"""Convert a generated "pixel style" image into exact-size pixel art.

Image generators cannot output a true dot grid: their pixel art comes out at the
generator's own size, with dots of varying size and blurred edges (the 2026-10-20
trial batch was 1254x1254 and 1774x887, with over 11,000 colours). This script
makes the real thing from such an original, which stays unmodified in art/:

1. paper connected to the border, and large enclosed gaps of pure white (between
   the legs), become transparent; a transparent original keeps its own alpha
2. every pixel snaps to the nearest palette colour as the eye sees it (Lab, with
   lightness weighted double so pale faces stay pale)
3. each target dot takes the palette colour covering most of its area, which keeps
   dots crisp whatever grid the source was drawn on
4. the most-used 16 colours are kept; rarer ones merge into their nearest kept colour

    python3 -m pip install pillow numpy scipy
    python3 scripts/convert_pixel_art.py palette RAW.png OUT.png
    python3 scripts/convert_pixel_art.py icon    RAW.png OUT.png --palette art/pixel/palette-v1.png
    python3 scripts/convert_pixel_art.py chibi   RAW.png OUT.png --palette ...   # 2 frames side by side
    python3 scripts/convert_pixel_art.py craft   RAW.png OUT.png --palette ...   # 4 frames side by side
    python3 scripts/convert_pixel_art.py cake    RAW.png OUT.png --palette ...   # body, ribbon band, chocolate band
    python3 scripts/convert_pixel_art.py tops    RAW.png OUT.png --palette ...   # 4 top decorations

Check the result with scripts/check_pixel_art.py. Conversion cannot add detail the
size cannot hold: art drawn at far more dots than the target (an icon drawn ~100
dots across, squeezed to 48) comes out speckled, and has to be redrawn coarser.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
# kind: (frame width, frame height, frames)
KINDS = {"icon": (48, 48, 1), "chibi": (48, 64, 2), "craft": (128, 96, 4),
         "cake": (32, 32, 3), "tops": (20, 15, 4)}  # cake: body, ribbon band, chocolate band
COLOUR_LIMIT = 16
PAPER = 243        # darkest channel at or above this, touching the border: background
GAP_WHITE = 250    # enclosed regions this white and this large are gaps, not highlights
GAP_MIN_AREA = 400
LIGHTNESS_WEIGHT = 2.0  # Lab L counts this much more than hue, so faces keep their brightness



def palette_from_sheet(path: Path, cols: int = 8, rows: int = 4) -> np.ndarray:
    """Read swatch colours from the middle of each cell of a palette sheet."""
    a = np.asarray(Image.open(path).convert("RGB"))
    if a.shape[0] <= rows and a.shape[1] <= cols:  # already a 1-pixel-per-colour palette
        # Keep the sheet's order: ties in snapping and voting break by palette order.
        flat = a.reshape(-1, 3)
        _, first = np.unique(flat, axis=0, return_index=True)
        return flat[np.sort(first)]
    h, w = a.shape[:2]
    cells = []
    for r in range(rows):
        for c in range(cols):
            y0, y1 = int((r + .3) * h / rows), int((r + .7) * h / rows)
            x0, x1 = int((c + .3) * w / cols), int((c + .7) * w / cols)
            cells.append(np.median(a[y0:y1, x0:x1].reshape(-1, 3), axis=0))
    return np.array(cells).round().astype(np.uint8)


def background(a: np.ndarray) -> np.ndarray:
    paper = a.min(axis=2) >= PAPER
    lab, _ = ndimage.label(paper)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    clear = np.isin(lab, list(edge))
    gaps, n = ndimage.label((a.min(axis=2) >= GAP_WHITE) & ~clear)
    if n:
        sizes = ndimage.sum(np.ones(gaps.shape), gaps, np.arange(1, n + 1))
        clear |= np.isin(gaps, np.flatnonzero(sizes >= GAP_MIN_AREA) + 1)
    return clear


def to_lab(rgb: np.ndarray) -> np.ndarray:
    """sRGB (0-255) to CIE Lab, so "nearest colour" means nearest to the eye."""
    c = rgb.astype(np.float32) / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]], np.float32)
    xyz /= np.array([0.9505, 1.0, 1.089], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def snap(a: np.ndarray, pal: np.ndarray) -> np.ndarray:
    # Plain RGB distance sent pale beard greys to the palette's olive (2026-10-20, sage c2).
    weight = np.array([LIGHTNESS_WEIGHT, 1.0, 1.0], np.float32)
    lab, plab = to_lab(a) * weight, to_lab(pal) * weight
    out = np.empty(a.shape[:2], np.int32)
    for y in range(0, a.shape[0], 128):  # in bands, to keep memory small
        d = ((lab[y:y + 128, :, None, :] - plab[None, None]) ** 2).sum(axis=3)
        out[y:y + 128] = d.argmin(axis=2)
    return out


def fit_box(mask: np.ndarray, aspect: float, pad: float = 0.02) -> tuple[int, int, int, int]:
    """A box around the content with the target aspect (w/h), centred, bottom-aligned."""
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    w, h = x1 - x0, y1 - y0
    w, h = (h * aspect, h) if w / h < aspect else (w, w / aspect)
    w, h = w * (1 + pad), h * (1 + pad)
    cx = (x0 + x1) / 2
    return int(cx - w / 2), int(y1 - h), int(cx + w / 2), int(y1)


def mode_downscale(lab: np.ndarray, box: tuple[int, int, int, int], size: tuple[int, int], clear_label: int) -> np.ndarray:
    """Each target dot takes the label covering most of its source area (the box may overhang)."""
    x0, y0, x1, y1 = box
    H, W = lab.shape
    padded = np.pad(lab, ((max(0, -y0), max(0, y1 - H)), (max(0, -x0), max(0, x1 - W))), constant_values=clear_label)
    ox, oy = max(0, -x0), max(0, -y0)
    region = padded[y0 + oy:y1 + oy, x0 + ox:x1 + ox]
    h, w = region.shape
    tw, th = size
    out = np.full((th, tw), clear_label, np.int32)
    for ty in range(th):
        ya = int(ty * h / th); yb = max(ya + 1, int((ty + 1) * h / th))
        for tx in range(tw):
            xa = int(tx * w / tw); xb = max(xa + 1, int((tx + 1) * w / tw))
            counts = np.bincount(region[ya:yb, xa:xb].ravel(), minlength=clear_label + 1)
            if counts[clear_label] > counts.sum() / 2:
                continue
            counts[clear_label] = 0
            out[ty, tx] = int(counts.argmax())
    return out


def cap_colours(lab: np.ndarray, pal: np.ndarray, limit: int = COLOUR_LIMIT) -> np.ndarray:
    k = len(pal)
    used, freq = np.unique(lab[lab < k], return_counts=True)
    if len(used) > limit:
        keep = used[np.argsort(freq)[::-1][:limit]]
        for u in used:
            if u not in keep:
                lab[lab == u] = keep[np.argmin(((to_lab(pal[keep]) - to_lab(pal[u])) ** 2).sum(axis=1))]
    return lab


def render(lab: np.ndarray, pal: np.ndarray) -> Image.Image:
    rgba = np.zeros(lab.shape + (4,), np.uint8)
    solid = lab < len(pal)
    rgba[solid, :3] = pal[lab[solid]]
    rgba[solid, 3] = 255
    return Image.fromarray(rgba, "RGBA")


def convert(raw: Path, kind: str, pal: np.ndarray) -> Image.Image:
    width, height, frames = KINDS[kind]
    rgba = np.asarray(Image.open(raw).convert("RGBA"))
    a = rgba[..., :3]
    if (rgba[..., 3] < 128).any():
        # A transparent original: trust its alpha. Detecting the background by white
        # would also erase near-white cream on a cake (2026-10-21, shortcake).
        clear = rgba[..., 3] < 128
    else:
        clear = background(a)
    k = len(pal)
    lab = np.where(clear, k, snap(a, pal))
    W = a.shape[1]
    step = W // frames
    # One box for every frame, so the figure does not shift between frames.
    union = np.zeros((a.shape[0], step), bool)
    for f in range(frames):
        union |= ~clear[:, f * step:(f + 1) * step]
    box = fit_box(union, width / height)
    parts = [mode_downscale(lab[:, f * step:(f + 1) * step], box, (width, height), k) for f in range(frames)]
    return render(cap_colours(np.hstack(parts), pal), pal)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("kind", choices=["palette", *KINDS])
    parser.add_argument("raw", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--palette", type=Path, default=ROOT / "art" / "pixel" / "palette-v1.png")
    args = parser.parse_args()
    if args.kind == "palette":
        pal = palette_from_sheet(args.raw)
        Image.fromarray(pal.reshape(4, 8, 3) if len(pal) == 32 else pal[None], "RGB").save(args.out)
        print(f"wrote {args.out} ({len({tuple(c) for c in pal})} colours)")
        return 0
    pal = palette_from_sheet(args.palette)
    convert(args.raw, args.kind, pal).save(args.out)
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
