# ケーキ8枚・飾り1枚 — §2-D 候補

生成: built-in image_gen、2026-10-21。すべて未採用、無加工の透明PNG。
採用済み追加30点の原本登録は [PR #50](https://github.com/anyhoe104-spec/caking-game/pull/50)。

|確認対象|内容|
|---|---|
|[shortcake-cake-c2.png](shortcake-cake-c2.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[pudding-cake-c1.png](pudding-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[tart-cake-c1.png](tart-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[choco-cake-cake-c1.png](choco-cake-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[millefeuille-cake-c2.png](millefeuille-cake-c2.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[fruit-pie-cake-c1.png](fruit-pie-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[decoration-cake-cake-c1.png](decoration-cake-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[royal-cake-cake-c1.png](royal-cake-cake-c1.png)|本体・いちご色の帯だけ・ショコラの帯だけ（3コマ）|
|[cake-tops-c2.png](cake-tops-c2.png)|いちご3粒・ハーブ・真珠・王冠（4コマ）|

## 記録と確認範囲

- 全プロンプトと参照: cake-prompts.json / cake-revision-prompts.json。
- 全12PNGのデコード・透明alpha・生成元SHA256一致: cake-delivery-integrity.json。
- 修正: shortcake初回の丸い帯を斜めへ、millefeuille初回の直線帯を角を回る形へ、tops初回のコマ境界に近い配置を余白付きへ。各1回、旧c1も保存。
- 皿なし、帯のコマに本体なし。タルトのいちご・パイの格子・ミルフィーユのアイシング模様・ガレットの模様は本来の具材／生地表現。
- 生成原本のため、指定32×32／16×12の厳密な格子、16色、コマ比率、帯と本体の画素単位の一致は未保証。topsは出力時に縦余白が増えている。Claudeの変換時にコマ領域・接地位置・帯の位置を確認する。
- 半透明の境界画素も原本のまま保持。変換後checker・ゲーム実寸確認は未実施。
- art-inboxは候補専用でPR作成・mainマージなし。採否はオーナー。
