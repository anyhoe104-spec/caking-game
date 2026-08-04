# ブランチ統合完了レポート

作成日: 2026-08-04

## 統合元

- UI基準: `main` (`2561447`)
- 機能・素材: `codex/phase0-to-phase7` (`65f36ca`、計画追記 `3e8a8e2`)
- 統合ブランチ: `integrate/phase0-to-phase7`

## 実施内容

- `main` の画面構成、営業画面、ボトムナビ、操作導線を維持した。
- `src/game/` のセーブ移行、営業、顧客、ミッション、判定、ショップ、MiruロジックをUIへ接続した。
- 営業時間は統合方針どおり180秒を採用した。
- ミッションは日替わり生成と報酬の一度だけの付与を採用した。
- 顧客画像、Miru、レシピ評価、装飾の購入・装備、スタッフの雇用・効果を接続した。
- キャラクター、背景、レシピ、素材画像を `public/images/` に統一し、旧 `images/ingradients/` を廃止した。
- GitHub PagesのベースURLとService Workerのスコープ、キャッシュ更新処理を統合した。
- BGM/SEはライセンス確認前のため収録せず、`docs/audio-sources.md` の候補一覧を維持した。

## 自動検証

- `npm test`: 9件成功
- `npm run lint`: 成功
- `npm run build`: 成功
- `git diff --check`: 成功

## 公開後の確認事項

- GitHub Pagesの `/caking-game/` で主要画像が表示されること
- Service Worker更新後の再読み込みとオフライン再表示
- モバイル実機で主要操作が画面下部に隠れないこと

## 結果

`branch-integration-plan.md` の方針に従い、後発`main`のUIを基準としてPR #2のモジュール、テスト、画像、実装済み機能を統合した。旧PR #2は統合PRへのリンクを残して閉じる。
