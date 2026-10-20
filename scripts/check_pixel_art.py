#!/usr/bin/env python3
"""Check pixel art against the acceptance rules in docs/art/pixel-art-brief.md §4.

Run it before registering or pushing pixel art, so problems are caught where the
art was made rather than after a round trip:

    python3 -m pip install pillow numpy
    python3 scripts/check_pixel_art.py                       # everything under art/pixel/
    python3 scripts/check_pixel_art.py art/_inbox/20261020/*.png --kind icon
    python3 scripts/check_pixel_art.py --palette art/pixel/palette-v1.png FILE...

The kind of each file (icon / chibi / craft / palette) comes from its folder under
art/pixel/, or from --kind for candidates that are not filed yet. Output is one
line per file with PASS or FAIL and the reasons; nothing about the image itself
is printed. Exit status is 1 if any file fails.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# kind: (frame width, frame height, frames, colour limit)
KINDS = {
    "icon": (48, 48, 1, 16),
    "chibi": (48, 64, 2, 16),
    "craft": (128, 96, 4, 16),
    "palette": (None, None, 1, 32),
}
FOLDERS = {"customers": "icon", "chibi": "chibi", "craft": "craft"}
ICON_CENTRE_TOLERANCE = 4  # dots either side of the middle column


def kind_of(path: Path) -> str | None:
    if path.name.startswith("palette"):
        return "palette"
    return FOLDERS.get(path.parent.name)


def to_logical(rgba: np.ndarray, width: int | None, height: int | None) -> tuple[np.ndarray | None, int, list[str]]:
    """Reduce an integer-scaled export to one pixel per dot. Returns (image, scale, problems)."""
    h, w = rgba.shape[:2]
    if width is None or (w, h) == (width, height):
        return rgba, 1, []
    if w % width or h % height or w // width != h // height:
        return None, 0, [f"size {w}x{h} is neither {width}x{height} nor an even multiple of it"]
    k = w // width
    blocks = rgba.reshape(height, k, width, k, 4)
    uneven = int((blocks != blocks[:, :1, :, :1]).any(axis=(1, 3, 4)).sum())
    if uneven:
        return None, k, [f"exported at {k}x but {uneven} dots are not uniform {k}x{k} blocks (grid is uneven or anti-aliased)"]
    return blocks[:, 0, :, 0], k, []


def white_to_clear(rgba: np.ndarray) -> np.ndarray:
    """The brief allows a pure white background: treat white touching the border as transparent."""
    if (rgba[..., 3] < 255).any():
        return rgba
    white = (rgba[..., :3] == 255).all(axis=2)
    outside = np.zeros_like(white)
    outside[0, :], outside[-1, :], outside[:, 0], outside[:, -1] = white[0, :], white[-1, :], white[:, 0], white[:, -1]
    while True:
        grown = outside.copy()
        grown[1:] |= outside[:-1]
        grown[:-1] |= outside[1:]
        grown[:, 1:] |= outside[:, :-1]
        grown[:, :-1] |= outside[:, 1:]
        grown &= white
        if (grown == outside).all():
            break
        outside = grown
    out = rgba.copy()
    out[outside, 3] = 0
    return out


def colours(rgba: np.ndarray) -> set[tuple[int, int, int]]:
    solid = rgba[rgba[..., 3] == 255][:, :3]
    return {tuple(int(v) for v in c) for c in np.unique(solid, axis=0)} if len(solid) else set()


def check(path: Path, kind: str, palette: set[tuple[int, int, int]] | None) -> list[str]:
    width, height, frames, limit = KINDS[kind]
    rgba = np.asarray(Image.open(path).convert("RGBA"))
    image, scale, problems = to_logical(rgba, None if width is None else width * frames, height)
    if image is None:
        return problems
    image = white_to_clear(image)

    partial = int(((image[..., 3] > 0) & (image[..., 3] < 255)).sum())
    if partial:
        problems.append(f"{partial} semi-transparent dots")
    used = colours(image)
    if len(used) > limit:
        problems.append(f"{len(used)} colours (limit {limit})")
    if palette is not None and kind != "palette":
        outside = used - palette
        if outside:
            problems.append(f"{len(outside)} colours not in the shared palette")
    if not used:
        problems.append("no opaque dots")
        return problems

    if frames > 1:
        feet = []
        for f in range(frames):
            rows = np.flatnonzero((image[:, f * width:(f + 1) * width, 3] == 255).any(axis=1))
            feet.append(int(rows.max()) if len(rows) else None)
        if len(set(feet)) > 1:
            problems.append(f"feet rows differ between frames: {feet}")
    if kind == "icon":
        cols = np.flatnonzero((image[..., 3] == 255).any(axis=0))
        centre = (cols.min() + cols.max()) / 2
        if abs(centre - (width - 1) / 2) > ICON_CENTRE_TOLERANCE:
            problems.append(f"figure is off centre by {centre - (width - 1) / 2:+.1f} dots")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("files", nargs="*", type=Path, help="default: every PNG under art/pixel/")
    parser.add_argument("--kind", choices=sorted(KINDS), help="kind for files outside art/pixel/<folder>/")
    parser.add_argument("--palette", type=Path, help="default: art/pixel/palette-v1.png when it exists")
    args = parser.parse_args()

    files = args.files or sorted((ROOT / "art" / "pixel").rglob("*.png"))
    if not files:
        print("no files to check")
        return 0
    palette_path = args.palette or ROOT / "art" / "pixel" / "palette-v1.png"
    palette = colours(white_to_clear(np.asarray(Image.open(palette_path).convert("RGBA")))) if palette_path.exists() else None
    if palette is None:
        print("note: no shared palette found; palette membership not checked")

    failed = 0
    for path in files:
        kind = args.kind or kind_of(path)
        label = path.relative_to(ROOT) if path.is_absolute() and ROOT in path.parents else path
        if kind is None:
            print(f"SKIP {label}: unknown kind (use --kind)")
            continue
        problems = check(path, kind, palette)
        if problems:
            failed += 1
            print(f"FAIL {label} [{kind}]: " + "; ".join(problems))
        else:
            print(f"PASS {label} [{kind}]")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
