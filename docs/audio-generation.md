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
言葉として聞き取れる音声ではなく、リズムと抑揚だけを持つキャラクターボイス風の音になります。

実装している要素:

| 要素 | 内容 |
|---|---|
| 母音 | 日本語5母音のF1/F2/F3を加算合成で再現（`VOWELS`） |
| 子音 | 破裂音・摩擦音・破擦音・鼻音・弾き音・半母音の6種別ごとにノイズバーストや鼻音区間を付加 |
| フォルマント遷移 | 調音位置ごとのF2ロッカス（`F2_LOCUS`）から母音目標へ約45msでグライド。「か」が「クリック＋あ」ではなく1音節に聞こえる要因 |
| 母音の無声化 | 無声子音の後の /i/ /u/ を、語末または次が無声子音のとき囁き音（フォルマント整形ノイズ）で発音（`devoiced_flags`） |
| ピッチアクセント | 語頭低→第2モーラ高→緩やかな下降。文型により上昇・下降・明るめを選択 |
| 微小変動 | ピッチのジッター、音量のシマー、モーラ長・音量のランダム変動 |
| 声門音源 | リップ放射込みで約 -6dB/oct の傾斜。実測スペクトル傾斜 20.8 dB（自然音声は概ね 20〜35 dB） |

無声化の判定結果（`*` が無声化するモーラ）:

```
がんばります！          ga N ba ri ma su*
できました！            de ki ma shi* ta      <- "deki-ma-sh-ta"
だいせいこう！          da i se i ko u
ごめんなさい…           go me N na sa i
ありがとうございます！   a ri ga to u go za i ma su*
レベルアップ！          re be ru a Q pu*
こんにちは！            ko N ni chi ha        <- ちは無声化しない
そのちょうし！          so no cho u shi*
おつかれさま！          o tsu* ka re sa ma
```

`/h/` は後続子音としての無声化トリガーから除外しています。トリガーに含めると
「こんにちは」の「ち」まで囁き声になってしまうためです。

### ボイス品質の検証方法

母音が意図した位置に合成できているかは、LPC（線形予測）でスペクトル包絡から
フォルマントを実測して確認します。F0が300Hz以上の高い声ではLPCが調波に
ロックして正しく測れないため、検証時のみF0を110Hzに下げてレンダリングします。

```
/a/  目標  850/1350/2900   実測  840/1346/2892   誤差 1.2%/0.3%/0.3%
/i/  目標  320/2750/3400   実測  331/2723/3515   誤差 3.4%/1.0%/3.4%
/u/  目標  360/1250/2650   実測  358/1253/2665   誤差 0.6%/0.2%/0.6%
/e/  目標  520/2350/3050   実測  532/2329/3028   誤差 2.3%/0.9%/0.7%
/o/  目標  520/ 900/2750   実測  547/ 936/2770   誤差 5.2%/4.0%/0.7%
```

フォルマントの帯域幅は教科書的なF1/F2/F3の値より広く取り、F4・F5と広帯域の
下限を加えています。実際の声道はフォルマント間で完全に無音にはならず、
また300Hzを超える高い声では調波間隔が広いため、共振が鋭すぎると
ほとんどの調波が谷に落ちて暗くこもった音になるためです。

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
2026-08-31時点の確認では、`suno.com` / `api.elevenlabs.io` / `soundeffect-lab.info` / `dova-s.jp` / `huggingface.co`
はいずれもプロキシがCONNECTに403を返します。VOICEVOXについては、publicリポジトリのgit読み取り
（`git ls-remote`）は通るものの、モデルと実行バイナリを配布しているGitHub Releasesのアセット取得が
403で遮断されるため、エージェント環境内での実行はできません。

なお無料プランの利用には注意が必要です。Sunoは**有料プラン加入中に生成した曲にのみ**商用利用権が
付与され、後から加入しても無料期間中の曲は非商用のままです。また多くのサービスが「素材単体の再配布」
を禁止しており、本リポジトリはPublicのため音源ファイルが `git clone` で単体取得できる点が
これに該当する可能性があります。無料枠で生成した音源をコミットすることは避けてください。

### 生成プロンプト

Suno想定。**Custom Mode + Instrumental オン**で、以下を Style / Description 欄へ貼り付けます。
歌詞欄は空のままにしてください。Instrumentalをオンにしないと、ほぼ確実にボーカルが入ります。

共通で除外したい要素（Exclude Styles欄がある場合に指定）:

```
vocals, singing, lyrics, voice, choir, spoken word, drum solo, distorted guitar, aggressive
```

**shop-bgm.mp3** — 最初に試すならこれ（営業中に最も長く聞く曲）
```
cheerful bakery management gameplay loop, bouncy marimba melody, warm acoustic guitar,
light kick and snare, shaker, cozy seaside pastry shop, busy but relaxing, looping game
background music, instrumental, 112 BPM, C major
```

**opening-theme.mp3**
```
cute pastry shop opening theme, seaside port town, glockenspiel melody, pizzicato strings,
warm acoustic guitar, soft pad, storybook feeling, gentle and inviting, instrumental,
90 BPM, C major
```

**menu-bgm.mp3** — 長時間流れるので、主張しすぎない曲を選ぶ
```
cozy menu screen background, calm and unobtrusive, acoustic guitar arpeggio, soft marimba,
light shaker, warm and slow, does not demand attention, instrumental, 96 BPM, F major
```

**report-bgm.mp3**
```
end of day results screen, satisfied and gentle, marimba and soft bass, short calm loop,
warm resolution, instrumental, 104 BPM, C major
```

**ending-theme.mp3**
```
heartwarming achievement ending, electric piano and warm strings, seaside sunset,
uplifting and emotional, a small shop that became beloved, instrumental, 74 BPM, C major
```

生成のコツ:

- 1プロンプトにつき複数生成し、**ループの継ぎ目が自然なもの**を選ぶ。イントロが長い曲は
  ループに向かないため避ける
- `menu-bgm` は各画面で長時間流れます。印象的な曲より地味な曲のほうが実用的です
- 尺が長すぎる場合、気に入った16小節だけを切り出して `--bpm` `--bars` で取り込みます

**効果音**（1〜2秒。SE特化のサービスか、Sunoの短尺生成を使う）
```
great.mp3    : bright success fanfare, sparkling bells, cheerful, 1.5 seconds
unlock.mp3   : recipe unlock, golden chime, magical sparkle, 1.5 seconds
order.mp3    : shop counter bell, customer served, bright ding, 1 second
mission.mp3  : objective complete, short bright chime with sparkle, 1 second
daystart.mp3 : shop door bell opening for business, bright, 1.3 seconds
dayend.mp3   : closing time, warm low bell, 1.6 seconds
levelup.mp3  : level up fanfare, ascending bells, celebratory, 1.8 seconds
tap.mp3      : soft UI tap, short wooden click, 0.2 seconds
buy.mp3      : coin purchase, light metallic chime, 0.5 seconds
```

**ボイス** — セリフは「ボイス（9種）」の表を参照

ElevenLabsの場合、ミフィとミルで別々の音声を選び、各キャラは全ファイルで同じ音声を使ってください。
参考設定: Stability 0.4 / Similarity 0.75 / Style 0.35。
ミフィは10代前半の明るい女の子、ミルは小さくて元気な案内役という想定です。

VOICEVOXの場合は話者を固定し、**採用したキャラクター名のクレジット表記を `README.md` と
設定画面（`src/components/SettingsModal.jsx` の「音源について」）へ追加**してください。
現在は「クレジット表記は不要」と表示しているため、この文言の更新が必須です。

### まず1曲だけ試す（推奨手順）

いきなり全曲を作らず、**`shop-bgm` だけ**を差し替えて比較してください。営業中に最も長く聞く曲で、
差が最も分かりやすく、気に入らなければ捨てるコストも最小です。

1. Sunoで `shop-bgm` のプロンプト（後述）を生成する。**Instrumentalをオンにする**
2. mp3をダウンロードする
3. 取り込む。BGMはループ終端の精度が音に出るので、小節数とBPMを指定する

   ```bash
   python3 scripts/import_audio.py ~/Downloads/track.mp3 --as shop-bgm --bpm 112 --bars 16
   ```

4. `npm run dev` で営業を開始し、1ループ以上聞いて継ぎ目とテンポを確認する
5. 気に入らなければ `public/sounds/shop-bgm.mp3.bak` を元の名前に戻し、
   `git checkout public/sounds/manifest.json` で戻す

### 取り込みスクリプト

`scripts/import_audio.py` が、ファイルの配置と `manifest.json` の更新をまとめて行います。
手作業で `seconds` を直し忘れるとBGMのループ点がずれるため、必ずこれを使ってください。

```bash
python3 scripts/import_audio.py <ファイル> --as <キー> [オプション]

  --dry-run                書き込まずに結果だけ表示
  --bpm 112 --bars 16      楽曲上の正確な長さを算出（BGM推奨）
  --seconds 34.286         長さを直接指定
```

- `.mp3` はそのまま配置し、長さをフレームヘッダから実測します
- `.wav` はプロジェクトのビットレートでMP3へ変換します（16bit限定）
- 元ファイルは `<キー>.mp3.bak` として自動退避されます
- サンプルレート違い、長すぎるSE、短すぎるBGMなどは警告が出ます

**BGMでは `--bpm` と `--bars` を使ってください。** MP3のフレーム数から求めた長さには
エンコーダのパディング（最大50ms程度）が含まれます。ゲームはこの `seconds` をループ終端に
使うため、実測値のままだと1ループごとにわずかな間が入ります。
Xing/LAMEヘッダを持つファイルでは自動的に補正しますが、ヘッダがない場合は補正できません
（`scripts/generate_audio.py` が使う `lameenc` はこのヘッダを書きません）。

### 受け入れ基準

| 項目 | 基準 |
|---|---|
| 形式 | MP3、44100 Hz、ステレオ |
| BGMの長さ | 20〜60秒。小節の切れ目で始まり、同じ切れ目で終わること |
| SEの長さ | 2秒以内。`tap` `nav` `coin` は0.3秒以内 |
| ボイスの長さ | 2秒以内 |
| 音量 | 既存音源と揃っていること。設定画面の音量スライダーで補正しない |
| ループ | 1周して戻ったときに拍がずれないこと |

### 差し替え後のチェックリスト

1. ファイル名・拡張子（`.mp3`）が一致しているか
2. `scripts/import_audio.py` で取り込んだか（`manifest.json` の `seconds` が自動更新されます）
3. BGMが継ぎ目なくループするか（先頭と末尾が同じ小節線でつながっているか）
4. 音量が揃っているか。ばらつく場合は `src/game/audioSettings.js` の既定音量ではなく、
   音源側で正規化してください
5. `docs/audio-licenses.md` に出典・プラン・クレジット要否を追記したか
6. `npm test` が通るか（`manifest.json` と宣言済みキーの整合をテストしています）
