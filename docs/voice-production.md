# 日本語ボイス収録（2026-09-30）

従来のフォルマント疑似ボイス9件を、VOICEVOXで発話した日本語へ差し替え。
ミフィは **VOICEVOX:四国めたん**（ノーマル、style 2）、
ミルは **VOICEVOX:ずんだもん**（ノーマル、style 3）。キャラクターの造形/設定はCAKINGのままです。

| 役 | ファイル末尾 | 台詞 |
|---|---|---|
| ミフィ | ready | がんばります！ |
| ミフィ | done | できました！ |
| ミフィ | great | 大成功！ |
| ミフィ | fail | ごめんなさい。 |
| ミフィ | order | ありがとうございます！ |
| ミフィ | levelup | レベルアップ！ |
| ミル | hello | こんにちは！ |
| ミル | cheer | その調子！ |
| ミル | report | おつかれさま！ |

## 出典・利用条件

確認日: 2026-09-30。費用0円、外部APIへの送信なし、ローカルCPU生成。

- [VOICEVOX Core 0.16.3](https://github.com/VOICEVOX/voicevox_core/releases/tag/0.16.3)
- [VVM 0.16.0 / 0.vvm・利用規約](https://github.com/VOICEVOX/voicevox_vvm/blob/0.16.0/README.md)
- [VOICEVOX利用規約](https://voicevox.hiroshiba.jp/term/)
- [四国めたん・ずんだもん音声ライブラリ規約](https://zunko.jp/con_ongen_kiyaku.html)

商用/非商用ともクレジット表記と各規約の遵守が条件。READMEとアプリ設定に記載済み。
生成音声を他者に許諾する場合にも、音声ライブラリ規約とこの遵守義務を引き継ぎます。
音声ライブラリの権利をCAKINGの独占物とせず、モデル/ランタイムはゲームに同梱しません。
BGM/SE20件は従来の自作音源のままです。

## 再生成

Python 3.12の専用venvへCore 0.16.3の対応wheelをインストール。
公式ダウンローダーまたは公式ReleaseからCPU版ONNX Runtime 1.17.3とVVM 0.16.0の0.vvmを取得。
辞書は今回はPyPIの `pyopenjtalk-plus==0.4.1.post9` wheel内の `pyopenjtalk/dictionary/` を使用。
Open JTalk公式辞書URLがHTTP 502となったため、同形式の同梱辞書を使用しました。
Core公式ガイド: https://github.com/VOICEVOX/voicevox_core/blob/0.16.3/docs/guide/user/usage.md

```bash
python scripts/generate_voices.py --runtime PATH_TO_ONNX_SHARED_LIBRARY --dictionary PATH_TO_DICTIONARY --model PATH_TO_0_VVM
```

FFmpeg 6.1.1/libmp3lameを利用。台詞・速度はスクリプトに固定。
pitch_scaleはミフィ0.02/ミル0.04、intonation_scaleは1.12、前後無音は0.06/0.08秒。
FFmpeg loudnormの目標値は-19 LUFS / -2 dBTP / LRA 7、44.1kHz stereo 128kbps MP3。
`manifest.json` は台詞・話者・style・速度・生成モデルのSHA-256・秒数・サイズを保持します。
異なる依存版/CPUでは音声バイト列の完全一致は保証しません。

今回の入力SHA-256:
- 0.vvm: `917e592cae92a02fb7668bd9e168df4e39c8ab2f5302c2be71906c70ec4e2df2`
- sys.dic: `0328ca62355100aba6df13af56912ad88cf10246e2a286005b89cb8ce2cef652`

`generate_audio.py` はBGM/SEだけを生成し、ボイスとその出典メタデータを保全します。
旧 `scripts/audio/voice.py` は旧方式の記録で、現行生成処理から呼びません。

## 確認と残り

9件の読み・尺・MP3デコード、44.1kHz stereo、音量/ピーク、ブラウザの再生経路を確認。
音の最終採否は実機スピーカー/イヤホンで確認してください。声の好みと演技の評価は未確定です。
公開後は既存PWAが新しいService Workerへ更新してから聞き比べます。
