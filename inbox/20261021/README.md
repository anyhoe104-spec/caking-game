# ドット絵の追加候補 — 2026-10-21

オーナーの制作指示による追加30素材。すべて未採用の候補です。
生成元: built-in image_gen。PNGは生成出力を無加工コピーし、縮小・減色・切り抜きはしていません。

採用済み試作5点の正式登録は [PR #48](https://github.com/anyhoe104-spec/caking-game/pull/48)。
この art-inbox ブランチは main にマージせず、PRも作りません。

## 確認対象

|種類|候補|コマ数|
|---|---|---|
|icon|[noix-icon-c1.png](noix-icon-c1.png)|1|
|icon|[fig-icon-c1.png](fig-icon-c1.png)|1|
|icon|[olive-icon-c1.png](olive-icon-c1.png)|1|
|icon|[toma-icon-c1.png](toma-icon-c1.png)|1|
|icon|[beurre-icon-c2.png](beurre-icon-c2.png)|1|
|icon|[peche-icon-c1.png](peche-icon-c1.png)|1|
|icon|[mint-icon-c1.png](mint-icon-c1.png)|1|
|icon|[melissa-icon-c2.png](melissa-icon-c2.png)|1|
|icon|[aprico-icon-c1.png](aprico-icon-c1.png)|1|
|icon|[cardamom-icon-c1.png](cardamom-icon-c1.png)|1|
|chibi|[cerise-idle-c1.png](cerise-idle-c1.png)|2|
|chibi|[noix-idle-c1.png](noix-idle-c1.png)|2|
|chibi|[fig-idle-c1.png](fig-idle-c1.png)|2|
|chibi|[sage-idle-c1.png](sage-idle-c1.png)|2|
|chibi|[olive-idle-c1.png](olive-idle-c1.png)|2|
|chibi|[toma-idle-c1.png](toma-idle-c1.png)|2|
|chibi|[beurre-idle-c1.png](beurre-idle-c1.png)|2|
|chibi|[peche-idle-c1.png](peche-idle-c1.png)|2|
|chibi|[mint-idle-c1.png](mint-idle-c1.png)|2|
|chibi|[melissa-idle-c1.png](melissa-idle-c1.png)|2|
|chibi|[aprico-idle-c1.png](aprico-idle-c1.png)|2|
|chibi|[cardamom-idle-c1.png](cardamom-idle-c1.png)|2|
|craft|[craft-oven-c2.png](craft-oven-c2.png)|4|
|craft|[craft-layer-c2.png](craft-layer-c2.png)|4|
|craft|[craft-decorate-c1.png](craft-decorate-c1.png)|4|
|craft|[craft-glaze-c1.png](craft-glaze-c1.png)|4|
|craft|[craft-roll-c1.png](craft-roll-c1.png)|4|
|craft|[craft-fold-c1.png](craft-fold-c1.png)|4|
|craft|[craft-steam-c1.png](craft-steam-c1.png)|4|
|craft|[craft-cool-c1.png](craft-cool-c1.png)|4|

## 制作記録

- 基本30点のプロンプトと参照: production-prompts.json。
- beurre / melissa の余白修正: icon-margin-revisions.json。
- 最後の4工程と oven / layer 修正版: craft-final-prompts.json。
- PNG検証・生成出力とのSHA256一致: delivery-integrity.json。
- beurre-icon-c1 は帽子上部、melissa-icon-c1 は耳上部の余白不足のため c2 を追加。
- craft-oven-c1 は右側の重ね合わせ領域を窯が占めるため c2 を追加。
- craft-layer-c1 は参照の混ぜる動作を引き継いだため、空の手で積み重ねる動作の c2 を追加。
- c1 は経緯を残すため削除していません。確認対象30点と旧候補4点、計34PNGです。

## 検証の範囲

アイコンは採用c2と同じ横48ドット相当の粗さ・髪3〜4色の塊を指定。
待機は2コマ、製造は4コマで、ケーキ本体を描かず右側の作業台を空けるよう指定しました。
生成原本の寸法・色数・格子は実装用規格への変換前です。
工程間でキャラ・台の縮尺や余白が異なります。layer-c2の手の動きとcool-c1の扇・風の描画も含め、実装時はケーキの重ね合わせ領域と干渉しないか確認が必要です。
見た目の確認とPNG・バイト一致検証は、変換後checkerや実寸でのゲーム表示確認の合格を意味しません。
次はClaudeによる変換・実寸確認とオーナー採否。public/images とゲームコードへの組み込みは行っていません。
