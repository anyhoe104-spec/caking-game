
## 2026-10-21 — ドット絵をゲームに組み込み（Claude）

`art/pixel/` の原本44点（パレット・客アイコン12・ちびキャラ13・製造9工程・ケーキ8・飾り1）から、`python3 scripts/process_game_art.py --pixel` で `public/images/pixel/` の43点と、製造中のケーキ用の脇机4点を作り、ゲームに組み込んだ。

- 注文一覧: 客アイコン（48×48）。客の名前も同時に新しい名前に切り替えた（characters.md）
- 店先: ミフィと客がちびキャラ（2コマの待機）
- 製造: 9工程のドット絵アニメ（4コマ）。重ね・絞り・艶がけ・冷ましでは、脇机にドット絵のケーキを置き、装備した帯と上の飾りを重ねる。作業台はミフィの前に空きが約16ドットしかなく、32ドットのケーキが乗らないため、同じ高さの脇机を足した
- 休憩の画面: ちびキャラのミフィ
- できあがりの画面は水彩のまま
- 置く位置（脇机の高さ、ケーキの上面）は画像から測って `src/game/pixelAnchors.json` に書き出す

---

## 2026-10-18 (2) — スタッフ3名を設定のキャラに切り替え（Claude）

- オーナーの指示で、スタッフを世界観の設定（`docs/world/characters.md`）にいる商会の3名に切り替えた
  - 見習いパティシエ → 商会メイドのアニス
  - 仕入れ上手のリコ → 侍従長のクミン
  - 販売名人ソラ → 経理のシナモン
- 効果・価格・内部ID（baker / buyer / seller）は変えていない。雇用済みのセーブはそのまま引き継がれる
- 立ち絵: 各キャラの三面図の正面から、`scripts/process_game_art.py` で頭と肩の部分を切り出した（`public/images/characters/staff-*.png`、256px）。スタッフ画面の 👤 を置き換えた

---

## 2026-10-18 — ゲーム表示用の画像26点を原本から作成（Claude）

`scripts/process_game_art.py` で、`art/` の承認済みシートから `public/images/` の表示用画像を作り、旧絵を置き換えた。原本は無加工。ファイル名は既存と同じなので、画像の置き換えだけで画面に反映される。

| 置き換え | 点数 | 元のシート |
|---|---|---|
| ミフィ立ち絵（normal / happy / sad / excited / working） | 5 | mify-game-a・mify-game-b |
| ミル立ち絵（normal / happy / thinking） | 3 | miru-game |
| ケーキ | 8 | recipes-a・recipes-b |
| 素材 | 7 | ingredients |
| 背景（店・厨房・エンディング） | 3 | bg-shop・bg-kitchen・bg-ending |

- 加工内容
  - シート上で一体ずつつながった形として切り出す。ミルのシートは3体が羽や光の粒でつながっているため、インクの少ない経路で切り分けた
  - 外周につながる紙の白だけを透過する。エプロンや皿など、内側の白は残す
  - 輪郭は半透明にし、白のにじみを抜く
  - キャラはポーズ間の大きさをそろえ、足元を一致させる
- 素材の絵はこれまでどこにも表示されていなかった（食材タブは絵文字だった）。食材タブで新しい絵を表示するようにした
- **客12名は対象外。** 新しい客の絵は現行の12名と別人のため、名前の決定（[production-plan](production-plan.md) の 1-5、オーナー判断）を待つ
- 再生成: `python3 -m pip install pillow numpy scipy` のあと `python3 scripts/process_game_art.py`

---

## 2026-10-16 — 修正4点も承認・原本登録

オーナーの「画像類も承認でプッシュ」により修正c2の4点を採用。先行17点と合わせ21点すべて承認済み。過去記録の承認待ちは解消。本番組込み・マージは別作業。

- art/characters/pepper/pepper-ref-v1.png
- art/props/recipes-a-v1.png
- art/characters/customers/customers-b-v1.png
- art/backgrounds/bg-ending-v1.png

PR #1候補28PNGはオーナー承認のGit外保管先review-archive/caking-anime-pr1/へSHA照合して保存。PR先端から除外、過去履歴は維持。

---
# プロンプトパック制作状況 — 2026-10-15

- バッチ2とMiru2点のPR #37はマージ済み（GitHub MCPで2026-10-15確認）。
- caking-anime PR #1の21点のうち17点をオーナーが承認。今回art/原本へ登録。下表参照。
- 残り4点は指定どおり修正c2を作成し、caking-anime/art/_inbox/20261015/へ保存。Git未登録・承認待ち。
- 今後の候補PNGはart/_inbox/に置きGitへ入れない。PR #1の既存PNGは移動先と除外をオーナーに確認するまで保持。マージ未実施。
- public/images/・ゲーム・動画への組込みは今回対象外。表情A・16コマ旧候補の採用は未決定。

| 原本 | 状態 |
|---|---|
| art/backgrounds/bg-shop-before-v1.png | 承認済み・原本登録 |
| art/backgrounds/bg-shop-after-v1.png | 承認済み・原本登録 |
| art/backgrounds/bg-harbor-window-v1.png | 承認済み・原本登録 |
| art/backgrounds/bg-door-key-v1.png | 承認済み・原本登録 |
| art/characters/mify/mify-game-a-v1.png | 承認済み・原本登録 |
| art/characters/mify/mify-game-b-v1.png | 承認済み・原本登録 |
| art/characters/miru/miru-game-v1.png | 承認済み・原本登録 |
| art/characters/anis/anis-ref-v1.png | 承認済み・原本登録 |
| art/characters/cumin/cumin-ref-v1.png | 承認済み・原本登録 |
| art/characters/cinnamon/cinnamon-ref-v1.png | 承認済み・原本登録 |
| art/characters/laurel/laurel-ref-v1.png | 承認済み・原本登録 |
| art/characters/customers/customers-a-v1.png | 承認済み・原本登録 |
| art/backgrounds/bg-shop-v1.png | 承認済み・原本登録 |
| art/backgrounds/bg-kitchen-v1.png | 承認済み・原本登録 |
| art/props/recipes-b-v1.png | 承認済み・原本登録 |
| art/props/ingredients-v1.png | 承認済み・原本登録 |
| art/characters/mify/mify-expressions-b-v1.png | 承認済み・原本登録 |

| 修正候補 | 修正内容 | 状態 |
|---|---|---|
| pepper-ref-c2 | 犬の垂れ耳と巻き尾 | 承認待ち |
| recipes-a-c2 | 右端タルトをいちごのみへ | 承認待ち |
| customers-b-c2 | シェフ帽子全体が収まる余白 | 承認待ち |
| bg-ending-c2 | 独立ガラスケースと上部中央の文字余白、夕焼け港町維持 | 承認待ち |

<details><summary>過去の棚卸し履歴（現在の作業指示ではない）</summary>

> 2026-10-14更新: Mify v2・バッチ2の4点・Miru右案の三面図と表情2点は採用済み。今回Miru原本2点をPR #37へ登録。バッチ4〜9の20点とMify感情B1点はcaking-anime PR #1へ候補保存。全バッチに画像あり、未採用・修正候補あり。本番未組込み。GitHub MCPで2026-10-14確認。
>
> [新規21点レビュー一覧](https://github.com/anyhoe104-spec/caking-anime/blob/codex/art-batch2/docs/art/review-batches-4-9.md)。以下は過去の棚卸し履歴。

> 2026-10-13更新: 既存画像4枚を回収。三面図v2は登録済み、表情2枚は未採用候補。以下は10月12日時点の棚卸し記録であり、再生成の指示ではない。最新状況は [作業ログ](checkpoint-20261013.md) と [台帳](asset-log.md) を参照。

# プロンプトパック制作状況

確認日: 2026-10-12 JST。基準: origin/main `2a8c1d4`、採用台帳、art/、Canva検索。

## 確認結果

- brandingの9枚は台帳登録済み。プロンプトパックの設定画像とは別の成果物。
- 下表はリポジトリ内に採用原本がないもの。外部で未作成と断定するものではない。
- Canvaで「CAKING」「ミフィ」「mify」を検索。CAKING関連デザイン6件はロゴ・エンドカード・ストア台紙・フィーチャー画像。基準3面図は確認できなかった。
- プロジェクト、Downloads、Obsidianのファイル名検索でもmify-refを確認できなかった。
- 生成・採用は0件。採用台帳を増やしていない。

## 再開

1. 採用済みミフィ3面図の原本または保存先を受領し、内容を確認する。
2. バッチ1-1（リボン位置の修正）から着手する。本人の左側を基準にし、背面では画面左側になる点を確認する。
3. Canvaに原本を参照画像として渡す。候補をart/_inbox/へ保存し、見せて採用判断を受ける。
4. 採用後、表情A→表情Bを進め、同じ頭部位置・大きさを検証する。
5. 採用原本・生成プロンプト・台帳を登録し、コミット・push・PR作成まで行う。

すべてのバッチが参照画像Aを要求するため、旧ゲーム立ち絵で代用して先行生成しない。ミル新規デザイン時は作者の漫画ページBも必要。

## ファイル別一覧

| 項番 | 予定ファイル | 確認状態 |
|---|---|---|
| 1-1 | `mify-ref-v2.png` | 未登録・基準画像待ち |
| 1-2 | `mify-expressions-a-v1.png` | 未登録・基準画像待ち |
| 1-3 | `mify-expressions-b-v1.png` | 未登録・基準画像待ち |
| 2-1 | `mify-pose-offer-cake-v1.png` | 未登録・基準画像待ち |
| 2-2 | `mify-pose-wiping-v1.png` | 未登録・基準画像待ち |
| 2-3 | `prop-shortcake-v1.png` | 未登録・基準画像待ち |
| 2-4 | `prop-old-key-v1.png` | 未登録・基準画像待ち |
| 3-1 | `miru-concept-v1.png` | 未登録・基準画像待ち |
| 3-2 | `miru-ref-v1.png` | 未登録・基準画像待ち |
| 3-3 | `miru-expressions-v1.png` | 未登録・基準画像待ち |
| 4-1 | `bg-shop-before-v1.png` | 未登録・基準画像待ち |
| 4-2 | `bg-shop-after-v1.png` | 未登録・基準画像待ち |
| 4-3 | `bg-harbor-window-v1.png` | 未登録・基準画像待ち |
| 4-4 | `bg-door-key-v1.png` | 未登録・基準画像待ち |
| 5-1 | `mify-game-a-v1.png` | 未登録・基準画像待ち |
| 5-2 | `mify-game-b-v1.png` | 未登録・基準画像待ち |
| 5-3 | `miru-game-v1.png` | 未登録・基準画像待ち |
| 6-1 | `anis-ref-v1.png` | 未登録・基準画像待ち |
| 6-2 | `cumin-ref-v1.png` | 未登録・基準画像待ち |
| 6-3 | `cinnamon-ref-v1.png` | 未登録・基準画像待ち |
| 6-4 | `pepper-ref-v1.png` | 未登録・基準画像待ち |
| 6-5 | `laurel-ref-v1.png` | 未登録・基準画像待ち |
| 7-1 | `customers-a-v1.png` | 未登録・基準画像待ち |
| 8-1 | `customers-b-v1.png` | 未登録・基準画像待ち |
| 8-2 | `bg-shop-v1.png` | 未登録・基準画像待ち |
| 8-3 | `bg-kitchen-v1.png` | 未登録・基準画像待ち |
| 8-4 | `bg-ending-v1.png` | 未登録・基準画像待ち |
| 9-1 | `recipes-a-v1.png` | 未登録・基準画像待ち |
| 9-2 | `recipes-b-v1.png` | 未登録・基準画像待ち |
| 9-3 | `ingredients-v1.png` | 未登録・基準画像待ち |

</details>
