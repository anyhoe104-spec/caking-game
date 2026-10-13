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


## 回収した採用原本

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/characters/mify/mify-ref-v1.png | 2026-10-11 | ChatGPT画像生成 | [mify-ref-v1.md](prompts/mify-ref-v1.md) | 採用 | 後ろ姿のリボン位置を要修正 |
| art/characters/mify/mify-ref-v2.png | 2026-10-11 | ChatGPT画像生成 | [mify-ref-v2.md](prompts/mify-ref-v2.md) | 採用・現行基準 | 後ろ姿の頭リボンを本人左側の1個に修正 |

## 未採用の制作状況

オーナーの生成画像保存指示により、今回の2候補は通常の候補除外ルールの例外として保管する。正式採用・ゲーム組み込みを意味しない。

| 候補 | プロンプト | 状態 |
|---|---|---|
| [16コマ表情候補](../../art/review-candidates/mify/expressions-16-c1.png) | [生成指示](prompts/mify-expressions-c1.md) | 未採用。髪・輪郭・頭部サイズに微差あり |
| [前半8コマ候補](../../art/review-candidates/mify/expressions-a-c1.png) | [生成指示](prompts/mify-expressions-a-c1.md) | 未採用。髪・肩・輪郭に微差あり |

完全固定のアニメ素材としては未完成。次回は前半の固定化・採否を確認してから感情8コマへ進む。今回回収した原本は上記の保存先に保持する。


## バッチ2 — 2026-10-13 オーナー承認

| ファイル | 生成元 | プロンプト | 状態 |
|---|---|---|---|
| art/characters/mify/mify-pose-offer-cake-v1.png | 組み込みimage_gen | [生成記録](prompts/mify-pose-offer-cake-v1.md) | 採用 |
| art/characters/mify/mify-pose-wiping-v1.png | 組み込みimage_gen | [生成記録](prompts/mify-pose-wiping-v1.md) | 採用 |
| art/props/prop-shortcake-v1.png | 組み込みimage_gen | [生成記録](prompts/prop-shortcake-v1.md) | 採用 |
| art/props/prop-old-key-v1.png | 組み込みimage_gen | [生成記録](prompts/prop-old-key-v1.md) | 採用 |

## ミル右案 — 承認済み原本登録（2026-10-14）

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/characters/miru/miru-ref-v1.png | 2026-10-14 | image_gen | [生成記録](prompts/miru-ref-v1.md) | 採用 | 右案・長髪と帽子。三面図 |
| art/characters/miru/miru-expressions-v1.png | 2026-10-14 | image_gen | [生成記録](prompts/miru-expressions-v1.md) | 採用 | 8コマ。固定パーツ化は別作業 |

バッチ4〜9とミフィ感情Bの21点はcaking-anime PR #1の候補。一括確認待ちであり未採用。以前の「未着手」「感情シートに進めない」は現状を表さない。
