"""ストア用スクリーンショットを、Canva で作った台紙（art/branding/store-frame-0N-v1.png）に合成する。

    python scripts/compose_store_screenshots.py                 # store/screenshots/raw/ → store/screenshots/out/
    python scripts/compose_store_screenshots.py --placeholder   # 撮影前の確認用。無い画面は仮の灰色で埋める
    python scripts/compose_store_screenshots.py --fit cover     # 画面枠いっぱいに広げる（はみ出た上下・左右は切る）

撮影した画面は store/screenshots/raw/01.png〜06.png に置く（.png / .jpg）。撮る画面と順番は
docs/store-submission-draft.md の「2. スクリーンショットの構成」に従う。撮影のための合成UIは加えない。
出力は 1080×1920（Google Play のスマートフォン用。9:16）。App Store 用のサイズは別途必要。
store/screenshots/ は git に入れない。
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FRAMES = [ROOT / f"art/branding/store-frame-{i:02d}-v1.png" for i in range(1, 7)]

# 台紙の画面枠（Canva で決めた値）。枠線の内側に少し余白をとって、角の丸みを合わせる
WINDOW = (90, 320, 900, 1380)  # x, y, 幅, 高さ
INSET = 6
RADIUS = 44


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    # 4倍で描いてから縮め、角をなめらかにする
    big = Image.new("L", (size[0] * 4, size[1] * 4), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, big.width - 1, big.height - 1), radius * 4, fill=255)
    return big.resize(size, Image.Resampling.LANCZOS)


def fit_screen(shot: Image.Image, box: tuple[int, int], fit: str) -> tuple[Image.Image, tuple[int, int]]:
    """画面を枠に収める。contain は全体を見せる（左右か上下に余白）、cover は枠いっぱい（上を基準に切る）"""
    bw, bh = box
    scale = (min if fit == "contain" else max)(bw / shot.width, bh / shot.height)
    w, h = round(shot.width * scale), round(shot.height * scale)
    resized = shot.resize((w, h), Image.Resampling.LANCZOS)
    if fit == "cover":
        left = (w - bw) // 2
        return resized.crop((left, 0, left + bw, bh)), (0, 0)
    return resized, ((bw - w) // 2, (bh - h) // 2)


def placeholder_screen(index: int) -> Image.Image:
    img = Image.new("RGB", (1080, 1920), (200, 200, 205))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("YuGothM.ttc", 80)
    except OSError:
        font = ImageFont.load_default(80)
    draw.text((540, 960), f"画面 {index:02d}（未撮影）", fill=(90, 90, 100), font=font, anchor="mm")
    return img


def compose(frame: Path, shot: Image.Image, fit: str) -> Image.Image:
    out = Image.open(frame).convert("RGBA")
    x, y, w, h = WINDOW
    box = (w - INSET * 2, h - INSET * 2)
    screen, (dx, dy) = fit_screen(shot.convert("RGBA"), box, fit)
    left, top = x + INSET + dx, y + INSET + dy
    mask = rounded_mask(screen.size, RADIUS)
    # 画面の下に薄い影を落とす
    shadow = Image.new("RGBA", out.size, (0, 0, 0, 0))
    shadow.paste((60, 40, 30, 70), (left, top + 8), mask)
    out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    layer = Image.new("RGBA", out.size, (0, 0, 0, 0))
    layer.paste(screen, (left, top), mask)
    out.alpha_composite(layer)
    return out.convert("RGB")


def find_shot(raw_dir: Path, index: int) -> Path | None:
    for ext in ("png", "jpg", "jpeg"):
        p = raw_dir / f"{index:02d}.{ext}"
        if p.exists():
            return p
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "store/screenshots/raw")
    parser.add_argument("--out-dir", type=Path, default=ROOT / "store/screenshots/out")
    parser.add_argument("--fit", choices=["contain", "cover"], default="contain")
    parser.add_argument("--placeholder", action="store_true", help="撮影していない画面を仮の灰色で埋める")
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    missing = []
    for index, frame in enumerate(FRAMES, start=1):
        path = find_shot(args.raw_dir, index)
        if path is None and not args.placeholder:
            missing.append(index)
            continue
        shot = Image.open(path) if path else placeholder_screen(index)
        result = compose(frame, shot, args.fit)
        out = args.out_dir / f"store-screenshot-{index:02d}.png"
        result.save(out, optimize=True)
        print(f"{out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}: {path.name if path else '仮の画面'}")
    if missing:
        names = "、".join(f"{i:02d}" for i in missing)
        raise SystemExit(f"撮影した画面がありません: {names}（{args.raw_dir} に置くか、--placeholder で仮の画面を使う）")


if __name__ == "__main__":
    main()
