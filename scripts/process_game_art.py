#!/usr/bin/env python3
"""Build the game's display images in public/images/ from the approved art/ sheets.

The originals in art/ are never modified (docs/art/asset-management.md). Each
sheet is a row or grid of items on a white background; this script finds each
item as its own connected shape of ink, removes the white that touches the outer
edge (enclosed whites such as an apron stay opaque), softens that edge, and
writes files under the names the game already loads, so no game code has to
change to pick them up.

    python3 -m pip install pillow numpy scipy
    python3 scripts/process_game_art.py            # write all outputs
    python3 scripts/process_game_art.py --check    # report what would be written

Customer portraits are deliberately not handled yet: the new sheets show
different people from the current twelve, and their names are the owner's
decision (docs/art/production-plan.md, item 1-5).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art"
OUT = ROOT / "public" / "images"

# A pixel this close to white on every channel counts as paper. The sheets' paper
# measures 252-255; cream, sugar and flour sit mostly at 236-250, so they stay.
PAPER = 250
# Items are located with a looser threshold so faint watercolour edges still count.
INK = 236
# Partial alpha is applied in a band this wide around the cut-out edge.
EDGE_BAND = 5

# sheet, grid (columns, rows), output names in reading order (None = empty cell)
CHARACTER_GROUPS = {
    "mify": [
        ("characters/mify/mify-game-a-v1.png", (3, 1), ["mify-normal", "mify-happy", "mify-sad"]),
        ("characters/mify/mify-game-b-v1.png", (2, 1), ["mify-excited", "mify-working"]),
    ],
    "miru": [
        ("characters/miru/miru-game-v1.png", (3, 1), ["miru-normal", "miru-happy", "miru-thinking"]),
    ],
}
PROP_SHEETS = [
    ("props/recipes-a-v1.png", (4, 1), ["shortcake", "choco-cake", "pudding", "tart"], "recipes", 640),
    ("props/recipes-b-v1.png", (4, 1), ["millefeuille", "fruit-pie", "decoration-cake", "royal-cake"], "recipes", 640),
    ("props/ingredients-v1.png", (4, 2), ["flour", "sugar", "egg", "butter", "milk", "cream", "strawberry", None], "ingredients", 512),
]
BACKGROUNDS = [
    ("backgrounds/bg-shop-v1.png", "bg-shop"),
    ("backgrounds/bg-kitchen-v1.png", "bg-kitchen"),
    ("backgrounds/bg-ending-v1.png", "bg-ending"),
]
CHARACTER_HEIGHT = 768  # matches the existing portraits, which the layout is tuned for
BACKGROUND_WIDTH = 1536


def locate_items(rgb: np.ndarray, grid: tuple[int, int], count: int) -> list[np.ndarray]:
    """One boolean mask per item, in reading order (row by row, left to right).

    Items are the `count` largest shapes of ink on the sheet. A shape's own
    detached details (sparkles, splashes, a tail tip) are attached to the nearest
    item. Every mask is separate, so a wing that reaches past another figure's
    bounding box never brings the neighbour along.
    """
    ink = rgb.min(axis=2) < INK
    # Join a figure's strokes into one shape without bridging the gaps between figures.
    joined = ndimage.binary_dilation(ink, iterations=4)
    labels, n = ndimage.label(joined)
    sizes = ndimage.sum(np.ones(labels.shape), labels, index=np.arange(1, n + 1))
    order = np.argsort(sizes)[::-1]
    if n < count or sizes[order[count - 1]] < 0.2 * sizes[order[0]]:
        # Figures touch (a wing, a sparkle trail): cut between them along the
        # path that crosses the least ink, then treat each side as one shape.
        columns, rows = grid
        if rows != 1:
            raise SystemExit("items touch each other; seam splitting supports single-row sheets only")
        joined = joined & ~seam_lines(ink, columns)
        labels, n = ndimage.label(joined)
        sizes = ndimage.sum(np.ones(labels.shape), labels, index=np.arange(1, n + 1))
        order = np.argsort(sizes)[::-1]
        if n < count or sizes[order[count - 1]] < 0.2 * sizes[order[0]]:
            raise SystemExit(f"could not separate {count} items; check the sheet layout")
    mains = [int(i) + 1 for i in order[:count]]
    centers = ndimage.center_of_mass(joined, labels, mains)
    boxes = ndimage.find_objects(labels)

    masks = {m: labels == m for m in mains}
    for other in range(1, n + 1):
        if other in masks:
            continue
        sl = boxes[other - 1]
        cy, cx = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        # Attach a detail only if it lies within an item's reach (its box grown by 8%).
        best, best_d = None, None
        for m, (my, mx) in zip(mains, centers):
            mb = boxes[m - 1]
            gy, gx = 0.08 * (mb[0].stop - mb[0].start), 0.08 * (mb[1].stop - mb[1].start)
            if mb[0].start - gy <= cy <= mb[0].stop + gy and mb[1].start - gx <= cx <= mb[1].stop + gx:
                d = (cy - my) ** 2 + (cx - mx) ** 2
                if best_d is None or d < best_d:
                    best, best_d = m, d
        if best is not None:
            masks[best] |= labels == other

    columns, rows = grid
    h = rgb.shape[0]
    def reading_key(item):
        m, (cy, cx) = item
        return (min(rows - 1, int(cy / h * rows)), cx)
    return [masks[m] for m, _ in sorted(zip(mains, centers), key=reading_key)]


def seam_lines(ink: np.ndarray, columns: int, window: float = 0.12) -> np.ndarray:
    """Vertical seams between equal columns, each following the least-ink path.

    Each seam may drift one pixel sideways per row within `window` of the
    column boundary, so it bends around a wing or a tail instead of cutting it.
    """
    h, w = ink.shape
    cost = ink.astype(np.float64) + 0.001
    cut = np.zeros_like(ink)
    for c in range(1, columns):
        lo, hi = max(0, int((c / columns - window) * w)), min(w, int((c / columns + window) * w))
        band = cost[:, lo:hi]
        acc = band.copy()
        for y in range(1, h):
            prev = acc[y - 1]
            left = np.concatenate(([np.inf], prev[:-1]))
            right = np.concatenate((prev[1:], [np.inf]))
            acc[y] += np.minimum(np.minimum(left, prev), right)
        x = int(np.argmin(acc[-1]))
        for y in range(h - 1, -1, -1):
            cut[y, lo + x] = True
            if y:
                candidates = [(acc[y - 1, k], k) for k in (x - 1, x, x + 1) if 0 <= k < hi - lo]
                x = min(candidates)[1]
    # Two pixels wide, so the 8-connected labelling cannot step across diagonally.
    return ndimage.binary_dilation(cut, structure=np.ones((1, 3), dtype=bool))


def cut_out(rgb: np.ndarray, own: np.ndarray) -> Image.Image:
    """Make the paper transparent, keeping enclosed whites, limited to this item's own shape."""
    h, w = rgb.shape[:2]
    paper = (rgb.min(axis=2) >= PAPER).astype(np.uint8) * 255
    # Pad so the flood fill can travel all the way round the item.
    padded = Image.new("L", (w + 2, h + 2), 255)
    padded.paste(Image.fromarray(paper, "L"), (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 128, thresh=0)
    outside = (np.asarray(padded)[1:-1, 1:-1] == 128) | ~own

    # Soft edge: near the outside region, alpha follows how far a pixel is from the
    # paper, and the paper colour is taken back out so no pale rim remains.
    near = ndimage.binary_dilation(outside, iterations=EDGE_BAND)
    darkness = (PAPER + 2 - rgb.min(axis=2).astype(np.float32)) / (PAPER + 2 - 200)
    alpha = np.where(outside, 0.0, np.where(near, np.clip(darkness, 0, 1), 1.0))
    rgbf = rgb.astype(np.float32)
    a = np.maximum(alpha[..., None], 1e-3)
    unmixed = np.clip((rgbf - 255 * (1 - a)) / a, 0, 255)
    rgbf = np.where((near & ~outside)[..., None], unmixed, rgbf)
    out = np.dstack([rgbf, alpha * 255]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def crop_items(sheet: Path, grid: tuple[int, int], names: list[str | None], pad: int = 6) -> dict[str, Image.Image]:
    rgb = np.asarray(Image.open(sheet).convert("RGB"))
    wanted = [n for n in names if n]
    try:
        masks = locate_items(rgb, grid, len(wanted))
    except SystemExit as error:
        raise SystemExit(f"{sheet.relative_to(ROOT)}: {error}") from None
    items = {}
    for name, mask in zip(wanted, masks):
        # The shape is built from ink, so enclosed whites (an apron, a plate) are holes
        # in it; they belong to the item.
        mask = ndimage.binary_fill_holes(mask)
        ys, xs = np.nonzero(mask)
        t, b = max(0, ys.min() - pad), min(rgb.shape[0], ys.max() + 1 + pad)
        l, r = max(0, xs.min() - pad), min(rgb.shape[1], xs.max() + 1 + pad)
        items[name] = cut_out(rgb[t:b, l:r], mask[t:b, l:r])
    return items


def fit_square(item: Image.Image, size: int, margin: float = 0.04) -> Image.Image:
    inner = round(size * (1 - 2 * margin))
    scale = inner / max(item.size)
    scaled = item.resize((max(1, round(item.width * scale)), max(1, round(item.height * scale))), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2), scaled)
    return canvas


def build(check: bool) -> list[tuple[Path, Image.Image]]:
    outputs: list[tuple[Path, Image.Image]] = []

    # Characters: one scale per character so every pose keeps the sheet's relative size,
    # bottom-aligned so they all stand on the same floor line.
    for group in CHARACTER_GROUPS.values():
        items: dict[str, Image.Image] = {}
        for sheet, grid, names in group:
            items.update(crop_items(ART / sheet, grid, names))
        scale = CHARACTER_HEIGHT / max(im.height for im in items.values())
        for name, im in items.items():
            scaled = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (scaled.width, CHARACTER_HEIGHT), (0, 0, 0, 0))
            canvas.paste(scaled, (0, CHARACTER_HEIGHT - scaled.height), scaled)
            outputs.append((OUT / "characters" / f"{name}.png", canvas))

    for sheet, grid, names, folder, size in PROP_SHEETS:
        for name, im in crop_items(ART / sheet, grid, names).items():
            outputs.append((OUT / folder / f"{name}.png", fit_square(im, size)))

    for sheet, name in BACKGROUNDS:
        im = Image.open(ART / sheet).convert("RGB")
        im = im.resize((BACKGROUND_WIDTH, round(im.height * BACKGROUND_WIDTH / im.width)), Image.Resampling.LANCZOS)
        outputs.append((OUT / "backgrounds" / f"{name}.png", im))

    for path, im in outputs:
        rel = path.relative_to(ROOT)
        if check:
            print(f"would write {rel} {im.size[0]}x{im.size[1]} {im.mode}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            im.save(path, optimize=True)
            print(f"wrote {rel} {im.size[0]}x{im.size[1]} {im.mode} {path.stat().st_size // 1024}KB")
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="report outputs without writing")
    args = parser.parse_args()
    outputs = build(args.check)
    print(f"{len(outputs)} images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
