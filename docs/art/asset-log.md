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

## 2026-10-15 — 一括レビュー承認17点

オーナーがcaking-anime PR #1のc1画像を個別指定で承認。再生成・加工なしで原本登録。miru-gameの跳躍ポーズ、mify-game-bの効果、mify-expressions-bも今回承認された。アニメ用固定パーツ化の完了とは別。

| ファイル | 日付 | 生成元 | プロンプト | 状態 |
|---|---|---|---|---|
| art/backgrounds/bg-shop-before-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-shop-before-v1.md) | 採用 |
| art/backgrounds/bg-shop-after-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-shop-after-v1.md) | 採用 |
| art/backgrounds/bg-harbor-window-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-harbor-window-v1.md) | 採用 |
| art/backgrounds/bg-door-key-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-door-key-v1.md) | 採用 |
| art/characters/mify/mify-game-a-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/mify-game-a-v1.md) | 採用 |
| art/characters/mify/mify-game-b-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/mify-game-b-v1.md) | 採用 |
| art/characters/miru/miru-game-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/miru-game-v1.md) | 採用 |
| art/characters/anis/anis-ref-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/anis-ref-v1.md) | 採用 |
| art/characters/cumin/cumin-ref-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/cumin-ref-v1.md) | 採用 |
| art/characters/cinnamon/cinnamon-ref-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/cinnamon-ref-v1.md) | 採用 |
| art/characters/laurel/laurel-ref-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/laurel-ref-v1.md) | 採用 |
| art/characters/customers/customers-a-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/customers-a-v1.md) | 採用 |
| art/backgrounds/bg-shop-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-shop-v1.md) | 採用 |
| art/backgrounds/bg-kitchen-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/bg-kitchen-v1.md) | 採用 |
| art/props/recipes-b-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/recipes-b-v1.md) | 採用 |
| art/props/ingredients-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/ingredients-v1.md) | 採用 |
| art/characters/mify/mify-expressions-b-v1.png | 2026-10-15 | image_gen | [生成記録](prompts/mify-expressions-b-v1.md) | 採用 |

未採用: pepper-ref / recipes-a / customers-b / bg-endingの修正c2。修正候補はcaking-animeのart/_inbox/20261015/にローカル保存、Git対象外。既存PR #1候補PNGの別保管・除外はマージ前にオーナー確認する。

## 2026-10-16 — 修正4点も承認・原本登録

オーナーの「画像類も承認でプッシュ」により修正c2の4点を採用。先行17点と合わせ21点すべて承認済み。過去記録の承認待ちは解消。本番組込み・マージは別作業。

| ファイル | 日付 | 生成元 | プロンプト | 状態 |
|---|---|---|---|---|
| art/characters/pepper/pepper-ref-v1.png | 2026-10-16 | image_gen | [生成記録](prompts/pepper-ref-v1.md) | 採用 |
| art/props/recipes-a-v1.png | 2026-10-16 | image_gen | [生成記録](prompts/recipes-a-v1.md) | 採用 |
| art/characters/customers/customers-b-v1.png | 2026-10-16 | image_gen | [生成記録](prompts/customers-b-v1.md) | 採用 |
| art/backgrounds/bg-ending-v1.png | 2026-10-16 | image_gen | [生成記録](prompts/bg-ending-v1.md) | 採用 |


## 2026-10-20 — ドット絵試作5点の採用

オーナーがパレット・ミフィ待機・whiskのc1、cerise・sageのc2を採用。生成出力を無加工で登録。変換・ゲームへの組込みは別工程。

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/pixel/palette-v1.png | 2026-10-20 | image_gen | [生成記録](prompts/pixel-palette-v1.md) | 採用 | palette-c1.png、無加工 |
| art/pixel/chibi/mify-idle-v1.png | 2026-10-20 | image_gen | [生成記録](prompts/pixel-mify-idle-v1.md) | 採用 | mify-idle-c1.png、無加工 |
| art/pixel/craft/craft-whisk-v1.png | 2026-10-20 | image_gen | [生成記録](prompts/pixel-craft-whisk-v1.md) | 採用 | craft-whisk-c1.png、無加工 |
| art/pixel/customers/cerise-icon-v1.png | 2026-10-20 | image_gen | [生成記録](prompts/pixel-cerise-icon-v1.md) | 採用 | cerise-icon-c2.png、無加工 |
| art/pixel/customers/sage-icon-v1.png | 2026-10-20 | image_gen | [生成記録](prompts/pixel-sage-icon-v1.md) | 採用 | sage-icon-c2.png、無加工 |

## 2026-10-21 — 追加ドット絵30点の採用

オーナーのチャット承認。無加工の生成原本を登録。変換・ゲーム組み込みは別工程。

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/pixel/customers/noix-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-noix-icon-v1.md) | 採用 | noix-icon-c1、無加工 |
| art/pixel/customers/fig-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-fig-icon-v1.md) | 採用 | fig-icon-c1、無加工 |
| art/pixel/customers/olive-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-olive-icon-v1.md) | 採用 | olive-icon-c1、無加工 |
| art/pixel/customers/toma-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-toma-icon-v1.md) | 採用 | toma-icon-c1、無加工 |
| art/pixel/customers/beurre-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-beurre-icon-v1.md) | 採用 | beurre-icon-c2、無加工 |
| art/pixel/customers/peche-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-peche-icon-v1.md) | 採用 | peche-icon-c1、無加工 |
| art/pixel/customers/mint-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-mint-icon-v1.md) | 採用 | mint-icon-c1、無加工 |
| art/pixel/customers/melissa-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-melissa-icon-v1.md) | 採用 | melissa-icon-c2、無加工 |
| art/pixel/customers/aprico-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-aprico-icon-v1.md) | 採用 | aprico-icon-c1、無加工 |
| art/pixel/customers/cardamom-icon-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-cardamom-icon-v1.md) | 採用 | cardamom-icon-c1、無加工 |
| art/pixel/chibi/cerise-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-cerise-idle-v1.md) | 採用 | cerise-idle-c1、無加工 |
| art/pixel/chibi/noix-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-noix-idle-v1.md) | 採用 | noix-idle-c1、無加工 |
| art/pixel/chibi/fig-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-fig-idle-v1.md) | 採用 | fig-idle-c1、無加工 |
| art/pixel/chibi/sage-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-sage-idle-v1.md) | 採用 | sage-idle-c1、無加工 |
| art/pixel/chibi/olive-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-olive-idle-v1.md) | 採用 | olive-idle-c1、無加工 |
| art/pixel/chibi/toma-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-toma-idle-v1.md) | 採用 | toma-idle-c1、無加工 |
| art/pixel/chibi/beurre-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-beurre-idle-v1.md) | 採用 | beurre-idle-c1、無加工 |
| art/pixel/chibi/peche-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-peche-idle-v1.md) | 採用 | peche-idle-c1、無加工 |
| art/pixel/chibi/mint-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-mint-idle-v1.md) | 採用 | mint-idle-c1、無加工 |
| art/pixel/chibi/melissa-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-melissa-idle-v1.md) | 採用 | melissa-idle-c1、無加工 |
| art/pixel/chibi/aprico-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-aprico-idle-v1.md) | 採用 | aprico-idle-c1、無加工 |
| art/pixel/chibi/cardamom-idle-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-cardamom-idle-v1.md) | 採用 | cardamom-idle-c1、無加工 |
| art/pixel/craft/craft-oven-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-oven-v1.md) | 採用 | craft-oven-c2、無加工 |
| art/pixel/craft/craft-layer-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-layer-v1.md) | 採用 | craft-layer-c2、無加工 |
| art/pixel/craft/craft-decorate-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-decorate-v1.md) | 採用 | craft-decorate-c1、無加工 |
| art/pixel/craft/craft-glaze-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-glaze-v1.md) | 採用 | craft-glaze-c1、無加工 |
| art/pixel/craft/craft-roll-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-roll-v1.md) | 採用 | craft-roll-c1、無加工 |
| art/pixel/craft/craft-fold-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-fold-v1.md) | 採用 | craft-fold-c1、無加工 |
| art/pixel/craft/craft-steam-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-steam-v1.md) | 採用 | craft-steam-c1、無加工 |
| art/pixel/craft/craft-cool-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-craft-cool-v1.md) | 採用 | craft-cool-c1、無加工 |

## 2026-10-21 — ケーキ8枚と飾り1枚の採用

オーナーがshortcake・millefeuille・cake-topsのc2、ほか6点のc1を採用。生成原本を無加工登録。

| ファイル | 日付 | 生成元 | プロンプト | 状態 | メモ |
|---|---|---|---|---|---|
| art/pixel/cakes/shortcake-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-shortcake-cake-v1.md) | 採用 | shortcake-cake-c2、無加工 |
| art/pixel/cakes/pudding-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-pudding-cake-v1.md) | 採用 | pudding-cake-c1、無加工 |
| art/pixel/cakes/tart-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-tart-cake-v1.md) | 採用 | tart-cake-c1、無加工 |
| art/pixel/cakes/choco-cake-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-choco-cake-cake-v1.md) | 採用 | choco-cake-cake-c1、無加工 |
| art/pixel/cakes/millefeuille-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-millefeuille-cake-v1.md) | 採用 | millefeuille-cake-c2、無加工 |
| art/pixel/cakes/fruit-pie-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-fruit-pie-cake-v1.md) | 採用 | fruit-pie-cake-c1、無加工 |
| art/pixel/cakes/decoration-cake-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-decoration-cake-cake-v1.md) | 採用 | decoration-cake-cake-c1、無加工 |
| art/pixel/cakes/royal-cake-cake-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-royal-cake-cake-v1.md) | 採用 | royal-cake-cake-c1、無加工 |
| art/pixel/cakes/cake-tops-v1.png | 2026-10-21 | image_gen | [生成記録](prompts/pixel-cake-tops-v1.md) | 採用 | cake-tops-c2、無加工 |
