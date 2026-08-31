# Cloudflare Pages への移行手順

作成日: 2026-08-31

`docs/deployment-policy.md` で定義した移行トリガーに該当したとき、この手順で移行します。
**コード側の準備は完了済み**なので、以下はアカウント操作が中心です。

## 移行トリガー（再掲）

次のいずれかを決めた時点で移行します。それまではGitHub Pages + Publicのままで問題ありません。

1. 有料のAI生成音源（Suno等）を導入すると決めたとき
2. itch.ioで有料販売すると決めたとき

## 事前に済んでいること

| 項目 | 状態 |
|---|---|
| ベースパスの外部化 | 完了。`CF_PAGES` を自動判定してルート配信になる |
| manifest.json | 完了。相対パス化済み |
| Service Worker | 完了。`self.location` から配信位置を導出 |
| キャッシュヘッダ | 完了。`public/_headers` |
| SPAフォールバック | 完了。`public/_redirects` |

## 手順

### 1. Cloudflare Pages プロジェクトを作成

1. Cloudflareダッシュボード → Workers & Pages → Create → Pages → Connect to Git
2. GitHubアカウントを連携し、`anyhoe104-spec/caking-game` を選択
3. ビルド設定:

   | 項目 | 値 |
   |---|---|
   | Framework preset | None（またはVite） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | （空欄） |

   環境変数の設定は不要です。Cloudflareが `CF_PAGES=1` を自動で渡すため、
   `vite.config.js` がルート配信用のベースパスを選びます。

4. Save and Deploy

### 2. プレビューURLを確認

Production branch は `main` のままにします。それ以外のブランチをpushすると
`https://<ブランチ名>.<プロジェクト名>.pages.dev` が自動生成されます。

**これが移行の主目的です。** ブランチをpushするだけでHTTPSのURLが生え、
スマートフォンからそのまま開けます。`main` へのマージもUSB接続も不要になります。

### 3. 動作確認

デプロイされたURLで以下を確認します。

- [ ] ゲームが起動し、ボトムナビ5項目が表示される
- [ ] オープニング→営業→日報まで進む
- [ ] BGMが場面ごとに切り替わる（DevToolsのNetworkを `sounds` で絞る）
- [ ] Application → Service Workers に登録がある。scopeが `/`
- [ ] Application → Cache Storage に `caking-shell-v5` があり、`/assets/` が含まれる
- [ ] 機内モードにして再読み込みしてもゲームが起動する
- [ ] ホーム画面へ追加してstandalone表示になる

### 4. リポジトリをPrivateへ変更

**この順序を守ってください。** Cloudflare Pagesの動作確認が終わってからPrivate化します。

1. GitHub → Settings → General → Danger Zone → Change repository visibility → Private
2. Private化するとGitHub Pagesは停止します（Freeプランのため）
3. `.github/workflows/deploy.yml` を削除するか、無効化する
4. `README.md` と `docs/deployment-policy.md` の公開URLをCloudflareのものへ更新
5. `public/manifest.json` の変更は不要（相対パスのため）

### 5. カスタムドメイン（任意）

Cloudflare Pages → Custom domains から設定します。ドメインをCloudflareで管理していれば
DNSは自動設定されます。独自ドメインにするとPWAの `scope` が安定し、
`*.pages.dev` を共有するより見栄えも良くなります。

## 移行後に残る作業

- `docs/deployment-policy.md` の「現在の構成」と「公開状況」を更新する
- itch.io掲載時は、`npm run build:root` の出力をzipにしてアップロードする
  （itch.ioもルート配信のため `build:root` を使います）

## 元に戻す場合

`vite.config.js` はGitHub Pagesを既定にしてあるため、Cloudflare側のプロジェクトを
削除してリポジトリをPublicへ戻し、`deploy.yml` を復活させれば元の構成に戻ります。
コードの変更は不要です。
