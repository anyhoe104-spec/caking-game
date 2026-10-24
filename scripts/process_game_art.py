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
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
import convert_pixel_art as pixel  # noqa: E402

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
# Staff portraits: the front view (left figure) of each three-view sheet, head and shoulders.
STAFF_PORTRAITS = [
    ("characters/anis/anis-ref-v1.png", "staff-anis"),
    ("characters/cumin/cumin-ref-v1.png", "staff-cumin"),
    ("characters/cinnamon/cinnamon-ref-v1.png", "staff-cinnamon"),
]
PORTRAIT_SIZE = 256
# Story bust-ups (chest up), shown when a chapter takes place indoors. Mify's sheet is
# already chest-up; Miru's is full length, so her busts are cut from the top of each
# figure. Names follow the generation prompts' cell order; None skips a cell (Miru's
# first row is mouth shapes for animation, not expressions).
BUST_SHEETS = [
    ("characters/mify/mify-expressions-b-v1.png", (4, 2), "mify",
     ["moved", "savoring", "gentle", "troubled", "beaming", "bashful", "energetic", "neutral"], None),
    ("characters/miru/miru-expressions-v1.png", (4, 2), "miru",
     [None, None, None, None, "smug", "prim", "serene", "neutral"], 0.52),
]
BUST_SIZE = (360, 480)
GAP_PAPER = 248     # enclosed regions this white and this large are gaps (see grid_items)
GAP_MIN_AREA = 400
BACKGROUNDS = [
    ("backgrounds/bg-shop-v1.png", "bg-shop"),
    ("backgrounds/bg-kitchen-v1.png", "bg-kitchen"),
    ("backgrounds/bg-ending-v1.png", "bg-ending"),
    ("backgrounds/bg-shop-before-v1.png", "bg-shop-before"),
    ("backgrounds/bg-shop-after-v1.png", "bg-shop-after"),
    ("backgrounds/bg-harbor-window-v1.png", "bg-harbor-window"),
]
# Pixel art: originals in art/pixel/ (generator output, unmodified) become exact-size
# sprites under public/images/pixel/ through scripts/convert_pixel_art.py.
PIXEL = ART / "pixel"
PIXEL_OUT = OUT / "pixel"
PIXEL_ANCHORS = ROOT / "src" / "game" / "pixelAnchors.json"
CAKE_STEPS = ("layer", "decorate", "glaze", "cool")  # crafting steps that show the cake on the table
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


def bust(figure: Image.Image, size: int, share: float = 0.34) -> Image.Image:
    """A square head-and-shoulders crop from a full-length figure, centred on the head."""
    alpha = np.asarray(figure)[..., 3] > 0
    side = round(figure.height * share)
    head = alpha[: round(figure.height * 0.15)]
    cx = int(np.nonzero(head)[1].mean()) if head.any() else figure.width // 2
    left = min(max(0, cx - side // 2), max(0, figure.width - side))
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    part = figure.crop((left, 0, left + side, side))
    square.paste(part, (0, 0), part)
    return square.resize((size, size), Image.Resampling.LANCZOS)


def grid_items(sheet: Path, grid: tuple[int, int], names: list[str | None]) -> dict[str, Image.Image]:
    """Items laid out in equal cells, cut out one cell at a time.

    For sheets whose neighbours touch across rows (puffed sleeves above the next
    row's ears), which the shape search in locate_items cannot separate.
    """
    rgb = np.asarray(Image.open(sheet).convert("RGB"))
    columns, rows = grid
    h, w = rgb.shape[0] // rows, rgb.shape[1] // columns
    items = {}
    for i, name in enumerate(names):
        if not name:
            continue
        cell = rgb[(i // columns) * h:(i // columns + 1) * h, (i % columns) * w:(i % columns + 1) * w]
        joined = ndimage.binary_dilation(cell.min(axis=2) < INK, iterations=4)
        labels, n = ndimage.label(joined)
        sizes = ndimage.sum(np.ones(labels.shape), labels, index=np.arange(1, n + 1))
        # The figure and its own details; slivers of a neighbour reaching over the edge go.
        own = ndimage.binary_fill_holes(np.isin(labels, np.flatnonzero(sizes >= 0.02 * sizes.max()) + 1))
        # Paper enclosed between hair, ear and ribbon is background seen through a gap,
        # not a white part of the figure: large enclosed regions of it become clear.
        gaps, m = ndimage.label(cell.min(axis=2) >= GAP_PAPER)
        if m:
            areas = ndimage.sum(np.ones(gaps.shape), gaps, index=np.arange(1, m + 1))
            edge = np.unique(np.concatenate([gaps[0], gaps[-1], gaps[:, 0], gaps[:, -1]]))
            big = [k + 1 for k in np.flatnonzero(areas >= GAP_MIN_AREA) if k + 1 not in edge]
            own &= ~np.isin(gaps, big)
        ys, xs = np.nonzero(own)
        item = cut_out(cell, own).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        items[name] = item
    return items


def bust_frame(figure: Image.Image, size: tuple[int, int], share: float | None) -> Image.Image:
    """Fit a chest-up figure into `size`, centred and standing on the bottom edge.

    With `share`, the figure is full length and only its top `share` of height is
    used, centred on the head.
    """
    if share:
        alpha = np.asarray(figure)[..., 3] > 0
        height = round(figure.height * share)
        head = alpha[: round(figure.height * 0.15)]
        cx = int(np.nonzero(head)[1].mean()) if head.any() else figure.width // 2
        width = round(height * size[0] / size[1])
        part = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        piece = figure.crop((cx - width // 2, 0, cx - width // 2 + width, height))
        part.paste(piece, (0, 0), piece)
        figure = part
    scale = min(size[0] / figure.width, size[1] / figure.height)
    scaled = figure.resize((round(figure.width * scale), round(figure.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.paste(scaled, ((size[0] - scaled.width) // 2, size[1] - scaled.height), scaled)
    return canvas


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

    for sheet, name in STAFF_PORTRAITS:
        front = crop_items(ART / sheet, (3, 1), [name, "side", "back"])[name]
        outputs.append((OUT / "characters" / f"{name}.png", bust(front, PORTRAIT_SIZE)))

    for sheet, grid, who, names, share in BUST_SHEETS:
        for mood, im in grid_items(ART / sheet, grid, names).items():
            outputs.append((OUT / "characters" / "bust" / f"{who}-{mood}.png", bust_frame(im, BUST_SIZE, share)))

    for sheet, name in BACKGROUNDS:
        im = Image.open(ART / sheet).convert("RGB")
        im = im.resize((BACKGROUND_WIDTH, round(im.height * BACKGROUND_WIDTH / im.width)), Image.Resampling.LANCZOS)
        outputs.append((OUT / "backgrounds" / f"{name}.png", im))

    write(outputs, check)
    return outputs


SCENE_WIDTH = 170          # dots: the 128-dot crafting frame plus a side table for the cake
SIDE_TABLE = (126, 166)    # its left and right edge, in dots


def table_rows(sheet: Image.Image, frames: int = 4) -> dict[str, int]:
    """The work table's top row and the floor row (lowest drawn row), in dots.

    The table top is the first row in the lower half whose opaque run is nearly as wide
    as the widest run there. The cake does not fit on the work table beside Mify (about
    16 dots are free), so it stands on a side table at the same height (2026-10-21).
    """
    a = np.asarray(sheet)[..., 3] > 0
    w = a.shape[1] // frames
    any_frame = np.stack([a[:, f * w:(f + 1) * w] for f in range(frames)]).any(axis=0)
    def widest(row):
        best = cur = 0
        for v in row:
            cur = cur + 1 if v else 0
            best = max(best, cur)
        return best
    h = any_frame.shape[0]
    widths = [widest(any_frame[y]) for y in range(h)]
    target = 0.85 * max(widths[h // 2:])
    top = next(y for y in range(h // 2, h) if widths[y] >= target)
    floor = int(np.flatnonzero(any_frame.any(axis=1)).max())
    return {"top": int(top), "floor": floor}


def side_table(rows: dict[str, int], palette: np.ndarray) -> Image.Image:
    """A small wooden table in the work table's colours, drawn from palette colours only."""
    def near(rgb):
        return tuple(int(v) for v in palette[np.argmin(((palette.astype(int) - np.array(rgb)) ** 2).sum(axis=1))]) + (255,)
    dark, mid, light = near((70, 45, 40)), near((150, 90, 60)), near((193, 139, 98))
    x0, x1 = SIDE_TABLE
    top, floor = rows["top"], rows["floor"]
    im = Image.new("RGBA", (x1 - x0 + 1, floor - top + 1), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w = x1 - x0
    d.rectangle([0, 0, w, 4], fill=dark)
    d.rectangle([1, 1, w - 1, 3], fill=mid)
    d.line([1, 1, w - 1, 1], fill=light)
    for lx in (3, w - 6):
        d.rectangle([lx, 5, lx + 3, floor - top], fill=dark)
        d.rectangle([lx + 1, 5, lx + 2, floor - top - 1], fill=mid)
    d.rectangle([3, 15, w - 3, 17], fill=dark)
    d.line([4, 16, w - 4, 16], fill=mid)
    return im


def top_spot(body: Image.Image) -> dict[str, int]:
    """Where a top decoration sits on a cake body: centre x and the cake's top y, in dots."""
    a = np.asarray(body)[..., 3] > 0
    cols = np.flatnonzero(a.any(axis=0))
    cx = int((cols.min() + cols.max()) // 2)
    return {"x": cx, "top": int(np.flatnonzero(a[:, cx]).min())}


def build_pixel(check: bool) -> list[tuple[Path, Image.Image]]:
    palette = pixel.palette_from_sheet(PIXEL / "palette-v1.png")
    outputs: list[tuple[Path, Image.Image]] = []
    jobs = [("icon", p, PIXEL_OUT / "customers" / p.name.replace("-icon-v1", "")) for p in sorted((PIXEL / "customers").glob("*-icon-v1.png"))]
    jobs += [("chibi", p, PIXEL_OUT / "chibi" / p.name.replace("-idle-v1", "")) for p in sorted((PIXEL / "chibi").glob("*-idle-v1.png"))]
    jobs += [("craft", p, PIXEL_OUT / "craft" / p.name.replace("craft-", "").replace("-v1", "")) for p in sorted((PIXEL / "craft").glob("craft-*-v1.png"))]
    jobs += [("cake", p, PIXEL_OUT / "cakes" / p.name.replace("-cake-v1", "")) for p in sorted((PIXEL / "cakes").glob("*-cake-v1.png"))]
    jobs += [("tops", PIXEL / "cakes" / "cake-tops-v1.png", PIXEL_OUT / "cakes" / "tops.png")]
    anchors: dict[str, dict] = {"sceneWidth": SCENE_WIDTH, "craft": {}, "cakes": {}}
    for kind, src, dst in jobs:
        im = pixel.convert(src, kind, palette)
        outputs.append((dst, im))
        if kind == "craft" and dst.stem in CAKE_STEPS:
            rows = table_rows(im)
            table = side_table(rows, palette)
            outputs.append((PIXEL_OUT / "craft" / f"side-table-{dst.stem}.png", table))
            # cake: centred on the side table, standing on its top board
            anchors["craft"][dst.stem] = {"tableX": SIDE_TABLE[0], "tableY": rows["top"], "tableW": table.width, "tableH": table.height,
                                          "cakeX": (SIDE_TABLE[0] + SIDE_TABLE[1]) // 2, "cakeBottom": rows["top"] + 2}
        if kind == "cake":
            anchors["cakes"][dst.stem] = top_spot(im.crop((0, 0, 32, 32)))
    write(outputs, check)
    text = json.dumps(anchors, indent=2, ensure_ascii=False) + "\n"
    if check:
        print(f"would write {PIXEL_ANCHORS.relative_to(ROOT)}")
    else:
        PIXEL_ANCHORS.write_text(text)
        print(f"wrote {PIXEL_ANCHORS.relative_to(ROOT)}")
    return outputs


def write(outputs: list[tuple[Path, Image.Image]], check: bool) -> None:
    for path, im in outputs:
        rel = path.relative_to(ROOT)
        if check:
            print(f"would write {rel} {im.size[0]}x{im.size[1]} {im.mode}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            im.save(path, optimize=True)
            print(f"wrote {rel} {im.size[0]}x{im.size[1]} {im.mode} {path.stat().st_size // 1024}KB")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="report outputs without writing")
    parser.add_argument("--pixel", action="store_true", help="only the pixel art (art/pixel/ -> public/images/pixel/)")
    args = parser.parse_args()
    outputs = build_pixel(args.check) if args.pixel else build(args.check) + build_pixel(args.check)
    print(f"{len(outputs)} images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
