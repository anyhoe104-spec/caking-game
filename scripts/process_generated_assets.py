from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image


def split_grid(source: Path, columns: int, rows: int, names: list[str], out_dir: Path, *, max_size: tuple[int, int]) -> list[Path]:
    image = Image.open(source).convert("RGB")
    out_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for index, name in enumerate(names):
        column, row = index % columns, index // columns
        left = round(column * image.width / columns) + 2
        right = round((column + 1) * image.width / columns) - 2
        top = round(row * image.height / rows) + 2
        bottom = round((row + 1) * image.height / rows) - 2
        cell = image.crop((left, top, right, bottom))
        cell.thumbnail(max_size, Image.Resampling.LANCZOS)
        output = out_dir / f"{name}.png"
        cell.save(output, optimize=True)
        outputs.append(output)
    return outputs


def remove_green(files: list[Path], helper: Path) -> None:
    for source in files:
        temporary = source.with_name(f"{source.stem}-rgba.png")
        subprocess.run([
            sys.executable,
            str(helper),
            "--input", str(source),
            "--out", str(temporary),
            "--auto-key", "border",
            "--soft-matte",
            "--transparent-threshold", "12",
            "--opaque-threshold", "220",
            "--despill",
            "--edge-contract", "1",
        ], check=True)
        temporary.replace(source)


def copy_background(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGB")
    image.thumbnail((1536, 1024), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--miffy", type=Path, required=True)
    parser.add_argument("--miru", type=Path, required=True)
    parser.add_argument("--customers", type=Path, required=True)
    parser.add_argument("--recipes", type=Path, required=True)
    parser.add_argument("--kitchen", type=Path, required=True)
    parser.add_argument("--ending", type=Path, required=True)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--helper", type=Path, required=True)
    args = parser.parse_args()

    character_dir = args.project / "public/images/characters"
    recipe_dir = args.project / "public/images/recipes"
    background_dir = args.project / "public/images/backgrounds"

    character_files = split_grid(args.miffy, 5, 1, [
        "miffy-normal", "miffy-happy", "miffy-sad", "miffy-excited", "miffy-working"
    ], character_dir, max_size=(512, 768))
    character_files += split_grid(args.miru, 3, 1, [
        "miru-normal", "miru-happy", "miru-thinking"
    ], character_dir, max_size=(512, 768))
    character_files += split_grid(args.customers, 4, 3, [
        "customer-sakura", "customer-hiroto", "customer-madame-rose", "customer-grandpa",
        "customer-michiru", "customer-kai", "customer-chef", "customer-yui",
        "customer-twins-a", "customer-twins-b", "customer-hana", "customer-traveler"
    ], character_dir, max_size=(512, 512))
    remove_green(character_files, args.helper)

    split_grid(args.recipes, 3, 1, ["choco-cake", "fruit-pie", "royal-cake"], recipe_dir, max_size=(640, 640))
    copy_background(args.kitchen, background_dir / "bg-kitchen.png")
    copy_background(args.ending, background_dir / "bg-ending.png")


if __name__ == "__main__":
    main()
