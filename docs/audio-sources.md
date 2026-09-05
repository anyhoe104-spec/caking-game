# CAKING BGM・SE候補一覧

- 調査日: 2026-07-21
- 方針: ゲームへの組み込み、GitHub Pages配信、将来の商用化を想定する。

> **2026-09-05 追記 — 本書は「候補調査」の記録です。**
> 実際に採用したのは、ここに挙げた外部サービスではなく **コードによる音響合成**（自作オリジナル音源）です。
> 生成方法・ファイル一覧・高音質音源への差し替え手順は [`docs/audio-generation.md`](audio-generation.md)、
> ライセンス台帳は [`docs/audio-licenses.md`](audio-licenses.md) を参照してください。
> 本書のサービス比較と生成キーワードは、将来Suno / ElevenLabs等へ差し替える際の判断材料として維持します。

## 推奨構成

| 用途 | 第一候補 | 理由 |
|---|---|---|
| BGM 3曲 | DOVA-SYNDROME または魔王魂 | ゲーム・Webアプリ利用が明記され、日本語規約を確認しやすい |
| great / unlock SE | 効果音ラボ | アプリの操作音としての組み込みが明示的に許可されている |
| 完全オリジナルBGM | Suno有料プラン | 有料期間中に生成した曲へ商用利用権が付与される |
| 著作権の譲渡を重視 | AIVA Pro相当 | プランによりFull Copyrightが付与される。Standardの商用範囲はSNS中心なのでゲームには不十分 |

## 素材サイト

### DOVA-SYNDROME

- URL: https://dova-s.jp/
- 公式ライセンス: https://dova-s.jp/contents/license
- 商用・非商用、個人・法人の制作物で背景音楽として利用可能。
- 有償・無償のゲーム、アプリ、Webサービスでの利用が明記されている。
- クレジットは原則不要だが、作曲者が個別条件を設けている場合はそちらが優先される。
- ダウンロード時に曲名、作者、URL、取得日、個別条件を保存する。

### 魔王魂

- URL: https://maou.audio/
- 公式規約: https://maou.audio/rule/
- 個人・商用を問わずゲームなどへ無料利用可能で、加工も可能。
- 著作権は放棄されていない。可能な限り `音楽：魔王魂` と表記する。
- 素材単体の再配布、ストリーミング配信、著作管理団体への登録などは禁止。
- CAKINGではクレジット画面とREADMEに表記する。

### 効果音ラボ

- URL: https://soundeffect-lab.info/
- 公式規約: https://soundeffect-lab.info/agreement/
- 商用利用無料、報告・リンク・クレジット不要。
- アプリの操作音として組み込む利用は、音源がファイルとして含まれていても再配布に該当しないと明記されている。
- 効果音そのものを聴かせるアプリ、素材配布、直リンク、Content ID登録は禁止。
- `great.mp3` と `unlock.mp3` の第一候補。

### Mixkit

- URL: https://mixkit.co/
- 公式ライセンス: https://mixkit.co/license/
- Stock MusicとSound EffectsにはFree Licenseが用意され、商用・非商用プロジェクトに利用できる。
- 素材単体での再配布・再販売は禁止。
- 採用時は各ダウンロードページのitem typeとライセンスを保存する。

### Pixabay

- URL: https://pixabay.com/music/
- 公式ライセンス概要: https://pixabay.com/service/license-summary/
- 原則として無料利用、改変、クレジットなしの利用が可能。
- 素材単体での配布は禁止。第三者の権利やContent ID申立てについては利用者側の確認が必要。
- 採用時は曲名、作者、素材URL、ライセンス、ダウンロード証跡を保存する。
- Content IDリスクを考慮し、CAKINGではDOVA-SYNDROME・魔王魂より優先度を下げる。

## 音楽生成サービス

### Suno

- URL: https://suno.com/
- 公式規約: https://suno.com/terms/
- 公式ヘルプ: https://help.suno.com/en/articles/9601665
- Pro/Premier加入中に生成した曲には商用利用権が付与され、ビデオゲーム利用も明記されている。
- Basic/free生成曲は非商用用途のみ。後から課金しても、無料期間中の曲が自動的に商用化されるとは扱わない。
- AI生成物の著作権保護が保証されるわけではない。

### AIVA

- URL: https://www.aiva.ai/
- 公式EULA: https://www.aiva.ai/legal/1
- Freeは非商用。StandardのLimited Commercial LicenseはYouTube、Twitch、TikTok、Instagram中心。
- ゲーム組み込みではFull Copyrightが付与されるPro相当、または個別契約を選ぶ。
- 契約主体が企業条件に該当する場合はEnterprise契約を確認する。

## CAKING用の検索・生成キーワード

### opening-theme.mp3

`cute pastry shop opening, port town, pizzicato strings, glockenspiel, warm acoustic, instrumental, 90 BPM`

### shop-bgm.mp3

`cozy bakery management game loop, acoustic guitar, marimba, light percussion, cheerful, seamless loop, instrumental, 105 BPM`

### ending-theme.mp3

`heartwarming achievement ending, piano and strings, seaside sunset, uplifting, instrumental, 75 BPM`

### great.mp3

`bright success fanfare, sparkling bells, short, cheerful, 1 second`

### unlock.mp3

`recipe unlock, golden chime, magical sparkle, short, 1 second`

## 採用時に保存する情報

`docs/audio-licenses.md` を作り、各ファイルについて次を記録する。

- ゲーム内ファイル名
- 原曲・素材名
- 作者または生成アカウント
- 素材ページURL
- 利用規約URL
- ダウンロード・生成日
- 利用プラン
- クレジット要否と表記
- 加工内容
- ライセンス証明の保存先
