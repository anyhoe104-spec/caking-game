# 🍰 CAKING！

猫耳の女の子ミフィと一緒に、港町の小さなケーキ店を繁盛店へ育てる、スマートフォン中心の店舗経営ブラウザゲームです。

**プレイ:** https://anyhoe104-spec.github.io/caking-game/

## 現在の状態

- MVPをGitHub Pagesで公開中
- PCブラウザとスマートフォンで基本動作・リンクを確認済み
- `main` へのpushをGitHub Actionsで自動デプロイ
- Phase 0〜7の機能・画像統合を完了
- 次の重点はPWA最終確認、通しプレイ、ゲームバランス調整、音源収録

最新状況と次の作業は [`docs/current-status.md`](docs/current-status.md) を参照してください。

## 遊び方

1. 「営業スタート！」を押して1日の営業を始めます。
2. 「本日のオーダー」に合うケーキをレシピ画面で作ります。
3. 食材が不足したら食材画面で補充します。食材は時間経過でも回復します。
4. ミッションを達成し、コイン・ポイント・経験値を獲得します。
5. デコレーションやスタッフを購入してお店を強化します。
6. 職人レベル10・所持金100,000Pでエンディングです。

ボトムナビは `営業 / レシピ / デコレーション / 食材 / スタッフ` の5画面です。営業画面では、注文、目標、売上、店舗ステータスを確認できます。

## 主な機能

- 180秒の営業ループ（準備 → 営業 → 日報）
- 12人のお客様とレシピ注文
- 日替わりミッションと報酬
- 8種類のレシピ、成功・大成功・失敗、星評価
- 素材管理、自動回復、レベルアップ
- AI助手ミルの状況別メッセージ
- デコレーション購入・装備
- スタッフ雇用と売上・ポイント・素材回復効果
- V2からV3へのセーブ移行
- PWA manifest、Service Worker、端末内セーブ

## セーブとPWA

セーブデータはブラウザの `localStorage` に保存されます。端末・ブラウザ間では同期されず、サイトデータを削除するとセーブも消えます。

スマートフォンでは、SafariまたはChromeからホーム画面へ追加できます。Service Workerのキャッシュにより更新直後に旧版が表示される場合は、再読み込みまたはPWAの再起動を行ってください。

## 技術構成

- React 19
- Vite 8
- JavaScript / CSS
- Node.js組み込みテストランナー
- GitHub Actions / GitHub Pages
- Web App Manifest / Service Worker

バックエンド、ログイン、決済、外部APIは使用していません。

## ローカル開発

```bash
npm ci
npm run dev
```

品質確認:

```bash
npm test
npm run lint
npm run build
git diff --check
```

`main` に反映された変更は `.github/workflows/deploy.yml` によりGitHub Pagesへ自動デプロイされます。

## プロジェクト資料

- [`docs/current-status.md`](docs/current-status.md): 現在地と次の優先作業
- [`docs/deployment-policy.md`](docs/deployment-policy.md): 公開・配布方針
- [`docs/audio-sources.md`](docs/audio-sources.md): BGM・SE候補とライセンス記録方法
- [`docs/phase-reports/`](docs/phase-reports/): 各開発フェーズの履歴

## 公開と素材

リポジトリとゲームはPublicです。秘密情報をフロントエンドやリポジトリへ追加しないでください。

画像・音源を追加する場合は、生成元、利用条件、クレジット要否を記録します。BGM 3曲と `great.mp3` / `unlock.mp3` は未収録です。

## ライセンス

現時点ではリポジトリ全体に適用するライセンスファイルを設定していません。ソースコードや画像素材の再利用条件は未指定です。
