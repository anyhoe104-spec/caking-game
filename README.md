# 🍰 CAKING！

猫耳の女の子ミフィと一緒に、港町の小さなケーキ店を繁盛店へ育てる、スマートフォン中心の店舗経営ブラウザゲームです。

**プレイ:** https://anyhoe104-spec.github.io/caking-game/

## 現在の状態

- MVPをGitHub Pagesで公開中
- PCブラウザとスマートフォンで基本動作・リンクを確認済み
- `main` へのpushをGitHub Actionsで自動デプロイ
- Phase 0〜7の機能・画像統合を完了
- BGM5曲・効果音15種・ボイス9種を実装済み（すべて自作の生成音源）
- UI刷新・アニメーション・サウンド設定を追加
- 次の重点はPWA最終確認、通しプレイ、ゲームバランス調整

最新状況と次の作業は [`docs/current-status.md`](docs/current-status.md) を参照してください。

## 遊び方

1. 「営業スタート！」を押して1日の営業を始めます。
2. 「本日のオーダー」に合うケーキをレシピ画面で作ります。
3. 食材が不足したら食材画面で補充します。食材は時間経過でも回復します。
4. ミッションを達成し、コイン・ポイント・経験値を獲得します。
5. デコレーションやスタッフを購入してお店を強化します。
6. 職人レベル10・所持金100,000Pでエンディングです。

ボトムナビは `営業 / レシピ / デコレーション / 食材 / スタッフ` の5画面です。営業画面は `オーダー / 目標 / ステータス` の3つに切り替えられ、営業中は自動的にオーダーが開きます。注文をタップするとレシピ画面の該当レシピへ移動します。

音量とミュートはヘッダー右上の ⚙ から設定できます。BGM・効果音・ボイスを個別に調整でき、アニメーションを減らす設定も同じ場所にあります。

## 主な機能

- 180秒の営業ループ（準備 → 営業 → 日報）
- 12人のお客様とレシピ注文
- 日替わりミッションと報酬
- 8種類のレシピ、成功・大成功・失敗、星評価
- 素材管理、自動回復、レベルアップ
- AI助手ミルの状況別メッセージ
- デコレーション購入・装備
- スタッフ雇用と売上・ポイント・素材回復効果
- 場面別BGM5曲（オープニング / メニュー / 営業中 / 日報 / エンディング）とフェードイン・アウト
- 効果音15種とキャラクターボイス9種
- BGM・効果音・ボイスの個別音量とミュート設定
- UI遷移・ケーキ完成・注文成立・レベルアップのアニメーション
- `prefers-reduced-motion` 対応とアニメーション軽減設定
- V2・V3からV4へのセーブ移行
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

配信先は固定されていません。GitHub Pagesはサブパス（`/caking-game/`）、Cloudflare PagesやNetlifyはルート配信ですが、どちらもソースの変更なしでビルドできます。

```bash
npm run build         # GitHub Pages 向け
npm run build:root    # ルート配信向け
```

詳細は [`docs/deployment-policy.md`](docs/deployment-policy.md) を参照してください。

## プロジェクト資料

- [`docs/current-status.md`](docs/current-status.md): 現在地と次の優先作業
- [`docs/deployment-policy.md`](docs/deployment-policy.md): 公開・配布方針
- [`docs/audio-generation.md`](docs/audio-generation.md): 音源の生成方法と差し替え手順
- [`docs/audio-licenses.md`](docs/audio-licenses.md): 音源のライセンス台帳
- [`docs/audio-sources.md`](docs/audio-sources.md): 外部BGM・SE候補の調査記録
- [`docs/phase-reports/`](docs/phase-reports/): 各開発フェーズの履歴

## 公開と素材

リポジトリとゲームはPublicです。秘密情報をフロントエンドやリポジトリへ追加しないでください。

画像・音源を追加する場合は、生成元、利用条件、クレジット要否を [`docs/audio-licenses.md`](docs/audio-licenses.md) に記録します。

音源はすべて `scripts/generate_audio.py` によるコード合成で生成したCAKINGのオリジナルです。第三者の権利を含まないため、クレジット表記は不要です。再生成は次のコマンドで行えます。

```bash
python3 -m pip install numpy lameenc
python3 scripts/generate_audio.py
```

## ライセンス

現時点ではリポジトリ全体に適用するライセンスファイルを設定していません。ソースコードや画像素材の再利用条件は未指定です。
