#!/usr/bin/env python3
"""Generate every BGM, SE and voice file shipped in public/sounds/.

The audio is synthesised from code, so the repository owns the result outright:
no stock licence, no attribution requirement, no Content ID exposure. Output is
deterministic — rerunning this script reproduces byte-identical audio.

    python3 -m pip install numpy lameenc
    python3 scripts/generate_audio.py              # everything
    python3 scripts/generate_audio.py --only great # one asset
    python3 scripts/generate_audio.py --manifest   # rewrite the manifest only

See docs/audio-generation.md for how to replace these with Suno / ElevenLabs
output without touching any game code.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audio.music import TRACKS  # noqa: E402
from audio.sfx import EFFECTS  # noqa: E402
from audio.synth import SR  # noqa: E402
from audio.voice import VOICES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sounds"
MANIFEST = OUT / "manifest.json"

BITRATE = {"bgm": 128, "se": 112, "voice": 112}


def trim_tail(audio: np.ndarray, threshold: float = 0.0015, pad: float = 0.06) -> np.ndarray:
    """Drop the dead air after a one-shot so the files stay small.

    Never applied to BGM: a loop's trailing samples are part of the seam.
    """
    mono = audio.mean(axis=1) if audio.ndim == 2 else audio
    loud = np.flatnonzero(np.abs(mono) > threshold)
    if len(loud) == 0:
        return audio
    end = min(len(audio), int(loud[-1] + pad * SR))
    return audio[:end]


def to_pcm16(audio: np.ndarray) -> np.ndarray:
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=1)
    clipped = np.clip(audio, -1.0, 1.0)
    return (clipped * 32767.0).astype("<i2")


def encode_mp3(audio: np.ndarray, bitrate: int) -> bytes:
    import lameenc

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(SR)
    encoder.set_channels(2)
    encoder.set_quality(2)
    return bytes(encoder.encode(to_pcm16(audio).tobytes())) + bytes(encoder.flush())


def render(kind: str, key: str, factory, description: str) -> dict:
    audio = factory()
    if kind != "bgm":
        audio = trim_tail(audio)
    seconds = len(audio) / SR
    data = encode_mp3(audio, BITRATE[kind])
    path = OUT / f"{key}.mp3"
    path.write_bytes(data)
    print(f"  {kind:5s} {key:22s} {seconds:6.2f}s  {len(data) / 1024:7.1f} KB  {description}")
    return {
        "file": f"{key}.mp3",
        "kind": kind,
        "seconds": round(seconds, 3),
        "bytes": len(data),
        "description": description,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", action="append", default=[], help="render just these keys")
    parser.add_argument("--manifest", action="store_true", help="rewrite manifest.json from existing files")
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    groups = [("bgm", TRACKS), ("se", EFFECTS), ("voice", VOICES)]

    if args.manifest:
        entries = []
        for kind, group in groups:
            for key, (_, description) in group.items():
                path = OUT / f"{key}.mp3"
                if path.exists():
                    entries.append({"file": path.name, "kind": kind, "bytes": path.stat().st_size, "description": description})
        _write_manifest(entries)
        return 0

    entries = []
    for kind, group in groups:
        print(f"\n{kind.upper()}")
        for key, (factory, description) in group.items():
            if args.only and key not in args.only:
                continue
            entries.append(render(kind, key, factory, description))

    if not args.only:
        _write_manifest(entries)
    total = sum(entry["bytes"] for entry in entries)
    print(f"\n{len(entries)} files, {total / 1024 / 1024:.2f} MB total -> {OUT.relative_to(ROOT)}")
    return 0


def _write_manifest(entries: list[dict]) -> None:
    payload = {
        "generator": "scripts/generate_audio.py",
        "method": "procedural synthesis (numpy) + LAME encoding",
        "license": "Original to the CAKING project. No third-party rights, no credit required.",
        "sampleRate": SR,
        "assets": entries,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nmanifest -> {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    raise SystemExit(main())
