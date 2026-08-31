#!/usr/bin/env python3
"""Drop an externally produced audio file into public/sounds/.

Replacing a generated asset by hand means remembering to update the duration in
public/sounds/manifest.json — and the BGM loop points are read from it, so a
stale value degrades looping silently. This script does that step for you.

    python3 scripts/import_audio.py ~/Downloads/track.mp3 --as shop-bgm
    python3 scripts/import_audio.py ~/Downloads/voice.wav --as voice-miffy-done
    python3 scripts/import_audio.py ~/Downloads/track.mp3 --as shop-bgm --dry-run

WAV input is encoded to MP3 at the project's bitrate (needs `pip install lameenc`).
MP3 input is copied as-is and its duration read from the frame headers.

See docs/audio-generation.md.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sounds"
MANIFEST = OUT / "manifest.json"

BITRATE = {"bgm": 128, "se": 112, "voice": 112}
SR = 44100

# ── MPEG audio frame tables ───────────────────────────────────
_BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
_BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
_RATES = {3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000]}


def _skip_id3(data: bytes) -> int:
    if data[:3] != b"ID3":
        return 0
    # Syncsafe 28-bit size, excluding the 10-byte header.
    size = (data[6] & 0x7F) << 21 | (data[7] & 0x7F) << 14 | (data[8] & 0x7F) << 7 | (data[9] & 0x7F)
    return 10 + size


def _lame_padding(frame: bytes) -> tuple[int, int]:
    """Encoder delay and end padding, in samples, from a LAME/Lavc info frame.

    An MP3 decodes ~1100 samples longer than the audio that went in, because the
    encoder prepends delay and pads the final frame. The manifest duration feeds
    the BGM loop end, so counting those samples would push the loop point past
    the last bar and reopen the seam. LAME records both values, so subtract them.
    """
    for tag in (b"LAME", b"Lavc", b"Lavf"):
        index = frame.find(tag)
        if index < 0 or index + 24 > len(frame):
            continue
        raw = frame[index + 21 : index + 24]
        delay = (raw[0] << 4) | (raw[1] >> 4)
        padding = ((raw[1] & 0x0F) << 8) | raw[2]
        if 0 <= delay < 4096 and 0 <= padding < 4096:
            return delay, padding
    return 0, 0


def mp3_info(path: Path) -> dict:
    """Duration and format, by walking the MPEG frame headers.

    Counts frames rather than trusting a bitrate field, so VBR files measure
    correctly, then subtracts the encoder delay and padding so the result is the
    length of the audio as authored.
    """
    data = path.read_bytes()
    offset = _skip_id3(data)
    frames = 0
    samples = 0
    sample_rate = None
    channels = None
    bitrates = set()
    lame_delay = lame_padding = 0

    while offset < len(data) - 4:
        if data[offset] != 0xFF or (data[offset + 1] & 0xE0) != 0xE0:
            offset += 1
            continue
        header = data[offset : offset + 4]
        version_bits = (header[1] >> 3) & 0x03  # 3=MPEG1, 2=MPEG2, 0=MPEG2.5
        layer_bits = (header[1] >> 1) & 0x03    # 1 = Layer III
        rate_index = (header[2] >> 2) & 0x03
        bitrate_index = (header[2] >> 4) & 0x0F
        padding = (header[2] >> 1) & 0x01
        mode = (header[3] >> 6) & 0x03

        if layer_bits != 1 or version_bits == 1 or rate_index == 3 or bitrate_index in (0, 15):
            offset += 1
            continue

        rate = _RATES[version_bits][rate_index]
        table = _BITRATES_V1_L3 if version_bits == 3 else _BITRATES_V2_L3
        kbps = table[bitrate_index]
        per_frame = 1152 if version_bits == 3 else 576
        length = (144 if version_bits == 3 else 72) * kbps * 1000 // rate + padding
        if length <= 4:
            offset += 1
            continue

        tag = data[offset : offset + length]
        if b"Xing" in tag[:40] or b"Info" in tag[:40]:
            lame_delay, lame_padding = _lame_padding(tag)  # header frame, carries no audio
            offset += length
            continue

        frames += 1
        samples += per_frame
        sample_rate = rate
        channels = 1 if mode == 3 else 2
        bitrates.add(kbps)
        offset += length

    if frames == 0:
        raise SystemExit(f"error: no MPEG audio frames found in {path}")
    return {
        "seconds": max(0, samples - lame_delay - lame_padding) / sample_rate,
        "sampleRate": sample_rate,
        "channels": channels,
        "bitrates": sorted(bitrates),
        "frames": frames,
        "encoderPadding": lame_delay + lame_padding,
    }


def wav_to_mp3(path: Path, bitrate: int) -> tuple[bytes, dict]:
    import lameenc
    import numpy as np

    with wave.open(str(path), "rb") as handle:
        channels = handle.getnchannels()
        width = handle.getsampwidth()
        rate = handle.getframerate()
        raw = handle.readframes(handle.getnframes())

    if width != 2:
        raise SystemExit(f"error: only 16-bit WAV is supported ({path} is {width * 8}-bit)")
    audio = np.frombuffer(raw, dtype="<i2").reshape(-1, channels)
    if channels == 1:
        audio = np.repeat(audio, 2, axis=1)

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(2)
    encoder.set_quality(2)
    data = bytes(encoder.encode(audio.astype("<i2").tobytes())) + bytes(encoder.flush())
    return data, {"seconds": len(audio) / rate, "sampleRate": rate, "channels": channels}


def load_manifest() -> dict:
    if not MANIFEST.exists():
        raise SystemExit("error: public/sounds/manifest.json is missing — run scripts/generate_audio.py first")
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path, help="the .mp3 or .wav you produced")
    parser.add_argument("--as", dest="key", required=True, help="asset key to replace, e.g. shop-bgm")
    parser.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    parser.add_argument("--seconds", type=float, help="exact authored length, overriding what is read from the file")
    parser.add_argument("--bpm", type=float, help="with --bars, compute the exact loop length for a BGM track")
    parser.add_argument("--bars", type=float, help="number of bars in the loop")
    parser.add_argument("--beats-per-bar", type=float, default=4.0, help="default 4")
    args = parser.parse_args()

    if not args.source.exists():
        raise SystemExit(f"error: {args.source} not found")

    manifest = load_manifest()
    entry = next((a for a in manifest["assets"] if a["file"] == f"{args.key}.mp3"), None)
    if entry is None:
        known = ", ".join(sorted(a["file"][:-4] for a in manifest["assets"]))
        raise SystemExit(f"error: unknown asset key '{args.key}'.\nknown keys: {known}")

    suffix = args.source.suffix.lower()
    if suffix == ".wav":
        payload, info = wav_to_mp3(args.source, BITRATE[entry["kind"]])
    elif suffix == ".mp3":
        payload = args.source.read_bytes()
        info = mp3_info(args.source)
    else:
        raise SystemExit(f"error: unsupported format '{suffix}' — provide .mp3 or .wav")

    measured = info["seconds"]
    if args.bpm and args.bars:
        authored = args.bars * args.beats_per_bar * 60.0 / args.bpm
        source_of_length = f"{args.bars:g}小節 @ {args.bpm:g} BPM から算出"
    elif args.seconds:
        authored = args.seconds
        source_of_length = "--seconds 指定値"
    else:
        authored = measured
        source_of_length = "ファイルから実測"

    old = entry.get("seconds")
    print(f"{args.key}  ({entry['kind']}) — {entry['description']}")
    print(f"  置き換え前 : {old:.3f}s, {entry['bytes'] / 1024:.1f} KB")
    print(f"  置き換え後 : {authored:.3f}s, {len(payload) / 1024:.1f} KB, {info['sampleRate']} Hz")
    print(f"  長さの根拠 : {source_of_length}（ファイル実測 {measured:.3f}s）")

    warnings = []
    if suffix == ".mp3" and not info.get("encoderPadding"):
        warnings.append(
            "このMP3にXing/LAMEヘッダがないため、実測値にエンコーダのパディング"
            "（最大50ms程度）が含まれます"
        )
    if entry["kind"] == "bgm" and authored == measured:
        warnings.append(
            "BGMのループ終端にこの値を使います。継ぎ目を正確にしたい場合は "
            "--bpm と --bars、または --seconds で楽曲上の正確な長さを指定してください"
        )
    if info["sampleRate"] != SR:
        warnings.append(f"サンプルレートが {info['sampleRate']} Hz です。ゲームの他の音源は {SR} Hz です")
    if entry["kind"] == "bgm" and authored < 8:
        warnings.append("BGMが8秒未満です。ループが忙しなく感じられます")
    if entry["kind"] != "bgm" and authored > 4:
        warnings.append("効果音・ボイスが4秒を超えています。操作の邪魔になりやすい長さです")
    if old and abs(authored - old) / old > 0.5:
        warnings.append(f"長さが元の音源から大きく変わります（{old:.1f}s → {authored:.1f}s）")
    for line in warnings:
        print(f"  警告 : {line}")

    if args.dry_run:
        print("\n--dry-run のため書き込みませんでした。")
        return 0

    target = OUT / f"{args.key}.mp3"
    backup = OUT / f"{args.key}.mp3.bak"
    if target.exists():
        shutil.copy2(target, backup)
    target.write_bytes(payload)

    entry["seconds"] = round(authored, 3)
    entry["bytes"] = len(payload)
    entry["source"] = "external"  # flags it as no longer reproducible from generate_audio.py
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\n書き込み: {target.relative_to(ROOT)}")
    print(f"バックアップ: {backup.relative_to(ROOT)}（戻す場合はこれをリネーム）")
    print("manifest.json の seconds と bytes を更新しました。")
    if entry["kind"] == "bgm":
        print("BGMのループ終端はこの seconds を使います。ゲームで継ぎ目を確認してください。")
    print("\n出典と利用条件を docs/audio-licenses.md へ追記してください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
