#!/usr/bin/env python3
"""Render the nine Japanese lines with VOICEVOX Core 0.16.3 and FFmpeg.
Runtime, dictionary and VVM are explicit local inputs; no service/API key needed.
See docs/voice-production.md for setup, attribution and reproducibility.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
import wave
from pathlib import Path
from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

ROOT = Path(__file__).resolve().parent.parent
LINES = [
    ('miffy-ready', 'がんばります！', 2, 1.12),
    ('miffy-done', 'できました！', 2, 1.12),
    ('miffy-great', '大成功！', 2, 1.08),
    ('miffy-fail', 'ごめんなさい。', 2, 1.04),
    ('miffy-order', 'ありがとうございます！', 2, 1.20),
    ('miffy-levelup', 'レベルアップ！', 2, 1.12),
    ('miru-hello', 'こんにちは！', 3, 1.12),
    ('miru-cheer', 'その調子！', 3, 1.08),
    ('miru-report', 'おつかれさま！', 3, 1.12),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['runtime', 'dictionary', 'model']:
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args()
    synth = Synthesizer(Onnxruntime.load_once(filename=str(args.runtime)),
                        OpenJtalk(str(args.dictionary)), acceleration_mode='CPU', cpu_num_threads=2)
    with VoiceModelFile.open(str(args.model)) as model:
        synth.load_voice_model(model)
    manifest_path = ROOT / 'public/sounds/manifest.json'
    manifest = json.loads(manifest_path.read_text())
    entries = {a['file']: a for a in manifest['assets']}
    model_sha = hashlib.sha256(args.model.read_bytes()).hexdigest()
    # Stage all files: failed synthesis/encoding must not leave a partial pack.
    with tempfile.TemporaryDirectory() as tmp:
        pending = []
        for key, text, style, speed in LINES:
            query = synth.create_audio_query(text, style)
            query.speed_scale = speed
            query.pitch_scale = .02 if style == 2 else .04
            query.intonation_scale = 1.12
            query.pre_phoneme_length, query.post_phoneme_length = .06, .08
            wav, mp3 = Path(tmp) / (key + '.wav'), Path(tmp) / (key + '.mp3')
            wav.write_bytes(synth.synthesis(query, style))
            with wave.open(str(wav)) as f:
                seconds = f.getnframes() / f.getframerate()
            if not .3 < seconds < 2.5:
                raise ValueError(f'{key}: unexpected duration {seconds}')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af',
                            'loudnorm=I=-19:TP=-2:LRA=7', '-ar', '44100', '-ac', '2',
                            '-codec:a', 'libmp3lame', '-b:a', '128k', str(mp3)], check=True)
            filename = 'voice-' + key + '.mp3'
            entry = entries[filename]
            entry.update(seconds=round(seconds, 3), bytes=mp3.stat().st_size,
                         source='VOICEVOX', styleId=style,
                         credit='VOICEVOX:' + ('四国めたん' if style == 2 else 'ずんだもん'),
                         text=text, speed=speed, modelSha256=model_sha)
            pending.append((mp3, ROOT / 'public/sounds' / filename))
            print(f'{filename}: {seconds:.3f}s {query.kana}')
        for source, dest in pending:
            dest.write_bytes(source.read_bytes())
    manifest.update(generator='scripts/generate_audio.py + scripts/generate_voices.py',
                    method='Procedural BGM/SE; VOICEVOX Core 0.16.3 voices; MP3 encoding',
                    license='BGM/SE: CAKING original. Voices: VOICEVOX:四国めたん / VOICEVOX:ずんだもん; see docs/voice-production.md')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
