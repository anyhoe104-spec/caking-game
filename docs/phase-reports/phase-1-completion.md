# Phase 1 完了レポート — GitHub Pages / PWA修復

- 完了日: 2026-07-21
- 対象: GitHub Pages サブパス `/caking-game/`

## 実施内容

- `index.html` のfavicon、manifest、Apple touch iconを `%BASE_URL%` 基準へ変更した。
- Service Worker登録URLとscopeを `import.meta.env.BASE_URL` 基準へ変更した。
- BGM、SE、キャラクター画像URLをViteのbase URL基準へ変更した。
- Service Worker activate時に旧 `caking-shell-*` キャッシュを削除するようにした。

## 検証結果

| 検証 | 結果 |
|---|---|
| `npm run build` | 成功 |
| `git diff --check` | エラーなし |
| `/caking-game/` | HTTP 200 |
| `/caking-game/manifest.json` | HTTP 200 / application/json |
| `/caking-game/sw.js` | HTTP 200 / text/javascript |
| `/caking-game/icons/icon-192.svg` | HTTP 200 / image/svg+xml |
| 生成物のドメイン直下参照検索 | 該当なし |

## 完了条件判定

- `/caking-game/` 配下の公開アセット参照: 達成
- Service Workerのサブパス登録: 達成
- 旧キャッシュ削除: 達成
- 本番ビルド: 達成
- PWAインストール・完全オフライン再起動: 公開後の手動確認項目

ローカル本番配信におけるPhase 1の完了条件を達成した。

## 制約

アプリ内ブラウザの初期化競合により、ブラウザUIを使ったインストール操作は実施できなかった。HTTP応答と生成物の静的検査で代替した。公開後に実端末またはChrome DevToolsで最終確認する。
