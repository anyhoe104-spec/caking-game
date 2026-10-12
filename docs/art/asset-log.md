# 採用画像の台帳

採用した画像を1行ずつ記録する。ルールは [asset-management.md](asset-management.md) を参照。

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/branding/logo-v1.png | 2026-10-12 | Canva（デザイン `DAHXn7xgNhM`「CAKING! タイトルロゴ」） | — | 採用 | 2000×2000。**背景透過で書き出したが、クリーム色（#FEF7E5）の背景が画像に含まれていて透過にならなかった。** 透過版はスクリプトで作る |
| art/branding/logo-v1-cutout.png | 2026-10-12 | スクリプト（`scripts/process_branding.py` で logo-v1.png の外側の背景を透明化） | — | 採用 | 1915×990。背景透過版。プレート内側のクリーム色は残している。logo-v1.png を差し替えたら再実行する |
| art/branding/endcard-v1.png | 2026-10-12 | Canva（デザイン `DAHXn5t8w_U`） | — | 採用 | 1920×1080。ティザー第1話 C8 の背景。キャッチコピー・案内・URL・VOICEVOX のクレジットが入っている |
| art/branding/play-feature-v1.png | 2026-10-12 | Canva（デザイン `DAHXrsYAZto`） | — | 採用 | 1024×500。Google Play のフィーチャーグラフィック |
| art/branding/store-frame-01-v1.png | 2026-10-12 | Canva（デザイン `DAHXr4myAuI` 1ページ目） | — | 採用 | 1080×1920。ストア用スクショ台紙「海風と、焼きたて。」。画面枠は x=90・y=320・幅900・高さ1380 |
| art/branding/store-frame-02-v1.png | 2026-10-12 | Canva（同 2ページ目） | — | 採用 | 「今日のひと皿を、心をこめて」 |
| art/branding/store-frame-03-v1.png | 2026-10-12 | Canva（同 3ページ目） | — | 採用 | 「ケーキにも、あなたらしさを」 |
| art/branding/store-frame-04-v1.png | 2026-10-12 | Canva（同 4ページ目） | — | 採用 | 「お客様の「食べたい」に応えよう」 |
| art/branding/store-frame-05-v1.png | 2026-10-12 | Canva（同 5ページ目） | — | 採用 | 「少しずつ、大きくなる工房」 |
| art/branding/store-frame-06-v1.png | 2026-10-12 | Canva（同 6ページ目） | — | 採用 | 「小さなお店の物語」 |

- Canva の4デザインは、claude.ai のチャット（2026-10-09〜10-11）で作成した。デザインの中で Canva の AI 生成を使った要素があるかは、この台帳の作成時には確認していない。公開時に AI 生成物を人の手描きとして発表しないこと
- Canva Pro は 2026-11-08 に終了予定。上の画像はそれより前に PNG（ロスレス）で書き出した
