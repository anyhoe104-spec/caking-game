"""ブランディング素材の加工版を作る。

    python scripts/process_branding.py

- art/branding/logo-v1.png → art/branding/logo-v1-cutout.png（背景透過）
  Canva から書き出したロゴは、クリーム色の背景が画像に含まれていて透過にならなかった。
  画像の外周につながった背景色の部分だけを透明にする。ロゴ中央のプレートも同じクリーム色だが、
  茶色の輪郭線で囲まれているので残る。

原本（art/branding/logo-v1.png）は変更しない。docs/art/asset-management.md の
「加工はスクリプトで行い、art/ から再生成できるようにする」に従う。
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent

LOGOS = [
    ("art/branding/logo-v1.png", "art/branding/logo-v1-cutout.png"),
]

# 背景とみなす色の差（RGB の差の合計）。輪郭線のアンチエイリアス（差 60 前後）は残す
THRESHOLD = 40
# 輪郭線の切れ目をふさぐ太さ（px）。プレートの内側も背景と同じ色なので、切れ目から塗りがもれないようにする
GAP_CLOSE = 4
MARGIN = 16


def cut_out_background(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    w, h = rgb.size
    background = rgb.getpixel((0, 0))
    # 背景色との差が大きい画素＝ロゴの一部（輪郭線を含む）
    diff = ImageChops.difference(rgb, Image.new("RGB", (w, h), background)).convert("L").point(lambda v: v * 3)
    solid = diff.point(lambda v: 255 if v > THRESHOLD else 0)
    # 輪郭線を太らせて切れ目をふさいでから、外周につながった背景を塗る
    closed = solid.filter(ImageFilter.MaxFilter(GAP_CLOSE * 2 + 1))
    padded = Image.new("L", (w + 2, h + 2), 0)
    padded.paste(closed, (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 128)
    outside = padded.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)
    # 太らせた分だけ外側を広げ直す（ロゴの画素は外側にしない）
    outside = ImageChops.subtract(outside.filter(ImageFilter.MaxFilter(GAP_CLOSE * 2 + 1)), solid)
    alpha = ImageChops.invert(outside).filter(ImageFilter.GaussianBlur(0.8))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    left, top, right, bottom = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    return out.crop((max(0, left - MARGIN), max(0, top - MARGIN), min(w, right + MARGIN), min(h, bottom + MARGIN)))


def main() -> None:
    for source, destination in LOGOS:
        result = cut_out_background(Image.open(ROOT / source))
        result.save(ROOT / destination, optimize=True)
        print(f"{destination}: {result.width}x{result.height}")


if __name__ == "__main__":
    main()
