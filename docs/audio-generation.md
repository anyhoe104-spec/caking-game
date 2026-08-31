# CAKING 音源の生成と差し替え

更新日: 2026-08-31

CAKINGのBGM・効果音・ボイスは、すべて `scripts/generate_audio.py` によるコード合成で生成しています。
このドキュメントは、生成方法・再生成手順・将来の高音質音源への差し替え手順をまとめたものです。

## 採用した方式

| 項目 | 内容 |
|---|---|
| 生成方法 | Pythonによる手続き的音響合成（numpy）＋ LAMEによるMP3エンコード |
| BGM | ノートデータから加算合成・Karplus-Strong・FM合成で演奏をレンダリング |
| SE | 同じ音色パレット（ベル・マリンバ・ノイズ）から生成し、BGMと調和させる |
| ボイス | 日本語母音のフォルマント合成による擬似ボイス（いわゆる「アニマリーズ方式」） |
| 権利 | 全面的にCAKINGプロジェクトに帰属。第三者の権利を含まない |
| 費用 | 0円 |
| クレジット表記 | 不要 |
| Content IDリスク | なし |
| 再現性 | 決定論的。同じスクリプトから毎回同じ音が出る |

### なぜこの方式か

`docs/audio-sources.md` で候補に挙げたSuno / AIVA / 効果音ラボなどは、いずれも
**外部アカウントと有料プラン、またはWebからのダウンロード**が前提になります。
コード合成は次の点で今回の要件に合致しました。

- ライセンス記録・クレジット・再配布制限の検討が一切不要になる
- ゲーム本体と一緒にバージョン管理でき、差分が追える
- 音量バランスや長さをコード側で即座に調整できる
- **後から高音質音源へ1対1で差し替えられる**（後述）

音質は生成AIモデルには及びません。したがって本方式は「機能を完成させ、
かつ差し替え可能な状態を作る」ことを目的とした構成です。

## ファイル一覧

すべて `public/sounds/` に配置し、`public/sounds/manifest.json` に長さ・サイズ・用途を記録しています。
manifestはゲーム側からも読み込まれ、BGMのループ点（`loopEnd`）の決定に使われます。

### BGM（5曲・場面別）

| ファイル | 場面 | テンポ / 調 | 長さ |
|---|---|---|---|
| `opening-theme.mp3` | オープニング・タイトル | 90 BPM / C major | 42.7s |
| `menu-bgm.mp3` | 準備中・レシピ・食材・デコレーション・スタッフ | 96 BPM / F major | 20.0s |
| `shop-bgm.mp3` | 営業中（プレイ中） | 112 BPM / C major | 34.3s |
| `report-bgm.mp3` | 日報オーバーレイ | 104 BPM / C major | 18.5s |
| `ending-theme.mp3` | エンディング | 74 BPM / C major | 51.9s |

各曲は最終小節を越えた残響・余韻を先頭へ折り返して合成しているため、継ぎ目なくループします。

### 効果音（15種）

| ファイル | 用途 |
|---|---|
| `tap.mp3` | ボタン・カード全般のタップ |
| `nav.mp3` | ボトムナビ・タブ切り替え |
| `buy.mp3` | 食材購入・デコレーション購入 |
| `coin.mp3` | 日報の売上カウントアップ |
| `equip.mp3` | デコレーション装備 |
| `hire.mp3` | スタッフ雇用 |
| `success.mp3` | ケーキ完成（成功） |
| `great.mp3` | ケーキ完成（大成功） |
| `error.mp3` | 失敗・素材不足・操作不可 |
| `order.mp3` | 注文成立（お客様に提供） |
| `levelup.mp3` | 職人レベルアップ |
| `unlock.mp3` | レシピ解放 |
| `mission.mp3` | ミッション達成 |
| `daystart.mp3` | 営業スタート |
| `dayend.mp3` | 営業終了 |

### ボイス（9種）

| ファイル | 話者 | セリフ | 再生タイミング |
|---|---|---|---|
| `voice-miffy-ready.mp3` | ミフィ | がんばります！ | 営業スタート |
| `voice-miffy-done.mp3` | ミフィ | できました！ | ケーキ成功 |
| `voice-miffy-great.mp3` | ミフィ | だいせいこう！ | ケーキ大成功 |
| `voice-miffy-fail.mp3` | ミフィ | ごめんなさい… | ケーキ失敗 |
| `voice-miffy-order.mp3` | ミフィ | ありがとうございます！ | 注文成立 |
| `voice-miffy-levelup.mp3` | ミフィ | レベルアップ！ | レベルアップ |
| `voice-miru-hello.mp3` | ミル | こんにちは！ | オープニング終了 |
| `voice-miru-cheer.mp3` | ミル | そのちょうし！ | ミッション達成 |
| `voice-miru-report.mp3` | ミル | おつかれさま！ | 営業終了・日報 |

ボイスは日本語のかな列を拍（モーラ）に分解し、各モーラを母音のフォルマント合成で鳴らす方式です。
子音は破裂音・摩擦音・鼻音などの種別ごとにノイズバーストや鼻音区間を付加し、
語頭上昇・語末下降といった日本語のピッチアクセントを再現しています。
言葉として聞き取れる音声ではなく、リズムと抑揚だけを持つキャラクターボイス風の音になります。

## 再生成の手順

```bash
python3 -m pip install numpy lameenc
python3 scripts/generate_audio.py                 # 全ファイル（約20秒）
python3 scripts/generate_audio.py --only great    # 1ファイルだけ
python3 scripts/generate_audio.py --manifest      # manifest.json だけ再生成
```

生成ロジックは `scripts/audio/` にあります。

| ファイル | 役割 |
|---|---|
| `synth.py` | オシレーター、エンベロープ、フィルター、リバーブ、ミックス処理 |
| `music.py` | 小節単位のコード進行とメロディ、ループ生成 |
| `sfx.py` | 効果音15種の定義 |
| `voice.py` | かな→モーラ分解とフォルマント合成 |

曲を調整したい場合は `music.py` の `lead`（メロディ文字列 `"C5:1 E5:0.5"` 形式）と
`chords`（1小節1コード）を編集して再生成してください。

## 高音質音源への差し替え

**ゲーム側のコード変更は不要です。** `public/sounds/` の同名ファイルを差し替え、
`manifest.json` の `seconds` を実際の長さに合わせるだけで反映されます。
BGMは `manifest.json` の `seconds` をループ終端として使うため、この値は必ず更新してください。

### 想定サービスと条件（2026-08時点の調査値・契約前に必ず最新の規約を確認してください）

| 用途 | サービス | 費用の目安 | 商用利用・ゲーム組み込み |
|---|---|---|---|
| BGM | Suno Pro | 約 $10/月 | 有料プラン加入中に生成した曲に商用利用権。ビデオゲーム利用も明記 |
| BGM | AIVA Pro相当 | 有料 | プランによりFull Copyrightが付与される。Standardの商用範囲はSNS中心でゲームには不足 |
| ボイス | ElevenLabs Creator | 約 $22/月 | 有料プランで商用利用可。日本語対応 |
| ボイス | VOICEVOX | 無料 | 商用可。キャラクターごとのクレジット表記が必須 |
| SE | 効果音ラボ | 無料 | 商用無料・クレジット不要。アプリ操作音としての組み込みを明示的に許諾 |

いずれも本セッションのネットワークからは到達できないため、生成はご自身のアカウントで実施してください。

### 生成プロンプト

そのまま貼り付けて使える文面です。すべてインストゥルメンタル・ボーカルなしを前提にしています。

**opening-theme.mp3**
```
cute pastry shop opening theme, seaside port town, glockenspiel melody,
pizzicato strings, warm acoustic guitar, soft pad, storybook, instrumental,
no vocals, seamless loop, 90 BPM, C major, 45 seconds
```

**menu-bgm.mp3**
```
cozy bakery menu screen, calm and unobtrusive, acoustic guitar arpeggio,
soft marimba, light shaker, relaxed, instrumental, no vocals, seamless loop,
96 BPM, F major, 30 seconds
```

**shop-bgm.mp3**
```
cheerful bakery management gameplay loop, bouncy marimba melody, acoustic guitar,
light drums and shaker, busy but relaxing, instrumental, no vocals, seamless loop,
112 BPM, C major, 40 seconds
```

**report-bgm.mp3**
```
end of day results screen, satisfied and gentle, marimba and soft bass,
short calm loop, instrumental, no vocals, seamless loop, 104 BPM, C major, 20 seconds
```

**ending-theme.mp3**
```
heartwarming achievement ending, electric piano and warm strings, seaside sunset,
uplifting and emotional, instrumental, no vocals, 74 BPM, C major, 55 seconds
```

**効果音**（1〜2秒、モノラル可、末尾の無音は詰める）
```
great.mp3    : bright success fanfare, sparkling bells, cheerful, 1.5 seconds
unlock.mp3   : recipe unlock, golden chime, magical sparkle, 1.5 seconds
order.mp3    : shop counter bell, customer served, bright ding, 1 second
mission.mp3  : objective complete, short bright chime with sparkle, 1 second
daystart.mp3 : shop door bell opening for business, bright, 1.3 seconds
dayend.mp3   : closing time, warm low bell, 1.6 seconds
levelup.mp3  : level up fanfare, ascending bells, celebratory, 1.8 seconds
```

**ボイス**（各ファイルのセリフは上記の表を参照）

ElevenLabsの場合は、ミフィとミルで別々の音声を選び、全ファイルで同じ音声を使ってください。
参考設定: Stability 0.4 / Similarity 0.75 / Style 0.35。

VOICEVOXの場合は、話者を固定したうえで生成し、**採用したキャラクター名のクレジット表記を
`README.md` と設定画面（`src/components/SettingsModal.jsx` の「音源について」）に追加**してください。
現在は「クレジット表記は不要」と記載しているため、この文言の更新が必須になります。

### 差し替え後のチェックリスト

1. ファイル名・拡張子（`.mp3`）が一致しているか
2. `manifest.json` の `seconds` を実測値に更新したか（BGMのループ点に直結）
3. BGMが継ぎ目なくループするか（先頭と末尾が同じ小節線でつながっているか）
4. 音量が揃っているか。ばらつく場合は `src/game/audioSettings.js` の既定音量ではなく、
   音源側で正規化してください
5. `docs/audio-licenses.md` に出典・プラン・クレジット要否を追記したか
6. `npm test` が通るか（`manifest.json` と宣言済みキーの整合をテストしています）
