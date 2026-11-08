"""ブランディング素材の加工版と、アプリのアイコン・起動画面を作る。

    python scripts/process_branding.py

- art/branding/logo-v1.png → art/branding/logo-v1-cutout.png（背景透過）
  Canva から書き出したロゴは、クリーム色の背景が画像に含まれていて透過にならなかった。
  画像の外周につながった背景色の部分だけを透明にする。ロゴ中央のプレートも同じクリーム色だが、
  茶色の輪郭線で囲まれているので残る。

- アイコン: ミフィの表情シート（笑顔のコマ）を桃色の地に置く。
  PWA（192/512・apple-touch・maskable）、Android 各密度（通常・丸・アダプティブ前景）、iOS 1024
- 起動画面: クリーム色の地に透過ロゴ。Android の縦横各密度と iOS
- ゲーム内のロゴ: public/images/branding/logo.png（タイトル画面用）

原本（art/branding/logo-v1.png）は変更しない。docs/art/asset-management.md の
「加工はスクリプトで行い、art/ から再生成できるようにする」に従う。
"""

from __future__ import annotations

from pathlib import Path

import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import process_game_art as game_art  # noqa: E402  表情シートの切り出しを共用する

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


ICON_SHEET = "characters/mify/mify-expressions-b-v1.png"
ICON_MOOD = "beaming"
ICON_TOP, ICON_BOTTOM = (255, 228, 234), (247, 192, 208)  # 桃色のグラデーション
ICON_BACKGROUND = "#f9d2dc"  # Android アダプティブアイコンの背景色（グラデーションの中間）
SPLASH_BACKGROUND = (255, 248, 236)  # capacitor.config.json の backgroundColor と同じ
SPLASH_LOGO = 0.62  # 起動画面の短い辺に対するロゴの幅
NATIVE_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ASSETS = ROOT / "ios" / "App" / "App" / "Assets.xcassets"


def gradient(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(image)
    for y in range(size):
        t = y / size
        draw.line([(0, y), (size, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(ICON_TOP, ICON_BOTTOM)) + (255,))
    return image


def icon(size: int, figure: Image.Image, share: float, background: bool = True) -> Image.Image:
    """ミフィの胸から上を、下端にそろえて置く。share はアイコンの幅に対する絵の幅。

    アダプティブアイコンや maskable は外周が切り取られるので、share を小さくして耳まで内側に収める。
    """
    canvas = gradient(size) if background else Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 縦長の絵なので、幅だけで決めると頭の上が切れる。高さも share 以内に収める
    width = round(min(size * share, size * share * figure.width / figure.height))
    scaled = figure.resize((width, round(figure.height * width / figure.width)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, ((size - width) // 2, size - scaled.height))
    return canvas


def round_mask(image: Image.Image) -> Image.Image:
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, image.width - 1, image.height - 1), fill=255)
    out = image.copy()
    out.putalpha(mask)
    return out


def splash(size: tuple[int, int], logo: Image.Image) -> Image.Image:
    canvas = Image.new("RGBA", size, SPLASH_BACKGROUND + (255,))
    width = round(min(size) * SPLASH_LOGO)
    scaled = logo.resize((width, round(logo.height * width / logo.width)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, ((size[0] - width) // 2, (size[1] - scaled.height) // 2))
    return canvas


def save(path: Path, image: Image.Image, opaque: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    (image.convert("RGB") if opaque else image).save(path, optimize=True)
    print(f"{path.relative_to(ROOT)}: {image.width}x{image.height}")


def main() -> None:
    for source, destination in LOGOS:
        result = cut_out_background(Image.open(ROOT / source))
        result.save(ROOT / destination, optimize=True)
        print(f"{destination}: {result.width}x{result.height}")
    logo = Image.open(ROOT / LOGOS[0][1]).convert("RGBA")
    save(ROOT / "public" / "images" / "branding" / "logo.png", logo.resize((960, round(logo.height * 960 / logo.width)), Image.Resampling.LANCZOS))

    # 表情シートのコマは胸の下で切れているので、その切り口がアイコンの下端に来るように置く
    figure = game_art.grid_items(game_art.ART / ICON_SHEET, (4, 2), [None] * 4 + [ICON_MOOD, None, None, None])[ICON_MOOD]
    full, safe = 1.0, 0.7
    save(ROOT / "public" / "icons" / "icon-512.png", icon(512, figure, full), opaque=True)
    save(ROOT / "public" / "icons" / "icon-192.png", icon(192, figure, full), opaque=True)
    save(ROOT / "public" / "icons" / "icon-maskable-512.png", icon(512, figure, safe), opaque=True)
    save(ROOT / "public" / "icons" / "apple-touch-icon.png", icon(180, figure, full), opaque=True)
    save(IOS_ASSETS / "AppIcon.appiconset" / "AppIcon-512@2x.png", icon(1024, figure, full), opaque=True)

    for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        folder = NATIVE_RES / f"mipmap-{density}"
        save(folder / "ic_launcher.png", icon(size, figure, full), opaque=True)
        save(folder / "ic_launcher_round.png", round_mask(icon(size, figure, full)))
        # アダプティブの前景は 108dp で、見えるのは中央の 72dp（外周は端末ごとの形で切られる）
        save(folder / "ic_launcher_foreground.png", icon(size * 9 // 4, figure, 0.72, background=False))
    background = NATIVE_RES / "values" / "ic_launcher_background.xml"
    background.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
                          f'    <color name="ic_launcher_background">{ICON_BACKGROUND}</color>\n</resources>\n')

    for path in sorted(NATIVE_RES.glob("drawable*/splash.png")) + sorted((IOS_ASSETS / "Splash.imageset").glob("*.png")):
        save(path, splash(Image.open(path).size, logo))


if __name__ == "__main__":
    main()
