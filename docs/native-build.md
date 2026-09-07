# Android / iOS 開発ビルド

Capacitor 8.5.1で既存Reactゲームを同梱する構成。`android/` と `ios/` は生成済みで、カスタムアイコン・起動画面を含む。**署名ビルド・実機起動・課金は未検証**。ブラウザ版のセーブを自動的にネイティブ版へ移す機能はない。

## 共通手順

Node.js 22以上を使用する。依存関係はlockfileに固定。

```sh
npm ci
npm run native:sync
```

このコマンドはルートパス用Webビルドを作り、両プラットフォームにコピーする。通常の `npm run build` はGitHub Pages向けのため、その出力を直接ネイティブにコピーしない。生成したWeb資産や署名情報はGitに含めない。

ネイティブではService Workerを登録しない。同梱資産を直接使い、アプリ更新時の旧Webキャッシュとの混在を防ぐ。Web/PWAでは引き続きService Workerを使用する。

仮アプリ識別子は `io.github.anyhoe104spec.caking`。ストア登録前に所有者が確定する。変更時は `capacitor.config.json`、Android namespace/applicationId/Javaパッケージ、XcodeのBundle Identifierを同時に更新する。現時点ではストア上に商品やアプリを登録していない。

## Android

```sh
npm run native:android
```

Android Studioで `android/` を開く。現行生成プロジェクトはcompile/target SDK 36、min SDK 24。必要なSDKと対応するJDKをAndroid Studio側で準備し、エミュレータまたは端末でRunする。リリースはAndroid Studioの署名付きBundle生成から行う。keystoreやパスワードはコミットしない。

## iOS

macOSのXcodeで以下を実行する。

```sh
npm run native:ios
```

`ios/App/App.xcodeproj` はSwift Package Manager構成。Signing & Capabilitiesで開発チームを設定し、依存パッケージを解決して実行する。iPhoneは縦画面、iPadは複数方向に対応。Archiveと配布はApple開発者アカウント側で行う。

## アイコン・起動画面

原本は `public/icons/icon-512.svg`。フォントに依存しないコードネイティブのケーキ図形。

```sh
npm run assets:icons
npm run native:sync
```

192/512pxのPWAアイコン、180pxのapple-touch-icon、Android各密度、iOSアイコン、両OS起動画面を再生成できる。

## 実機で残る確認

- 営業開始→注文→製造→日報→次の日→エンディングを通す。
- 電話・ロック・アプリ切替で一時停止し、再開まで時間が減らない。製造中断でも材料・報酬は一度だけ。
- 完全終了と再起動、機内モード、音声の復帰、ノッチ/ホームインジケータ、Android戻る操作を確認する。
- 実課金は未接続。有料パーツは試着のみ。購入検証・復元・返金反映ができるまで課金ボタンを有効化しない。

## 今回の検証範囲

Linuxで両プロジェクトの生成、Webビルド、`cap sync`まで実行。XcodeとAndroid SDKはこの環境にない。Javaは17のため、ネイティブコンパイル成功・APK/AAB/IPA生成・実機60fpsは主張しない。

一次資料: [Capacitor導入](https://capacitorjs.com/docs/getting-started)、[開発環境](https://capacitorjs.com/docs/getting-started/environment-setup)。生成コードと固定したバージョンを優先して確認する。
