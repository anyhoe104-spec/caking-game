import SavePanel from "./SavePanel.jsx";
import { useState } from "react";
import { Modal } from "./common.jsx";
import { channelGain, normalizeAudio } from "../game/audioSettings.js";

const CHANNELS = [
  { key: "bgm", label: "BGM", icon: "🎵", hint: "場面ごとの音楽" },
  { key: "se", label: "効果音", icon: "🔔", hint: "操作音・完成音" },
  { key: "voice", label: "ボイス", icon: "💬", hint: "ミフィ・ミルの掛け声" },
];

export default function SettingsModal({ audio, onToggleMute, onVolume, onToggleMotion, onReset, onClose, onPreview, state, saveStatus, onRestore, onRetry, returnFocusRef }) {
  const settings = normalizeAudio(audio);
  const [confirming, setConfirming] = useState(false);

  return (
    <Modal title="設定" onClose={onClose} labelledBy="settingsTitle" returnFocusRef={returnFocusRef}>
      <section className="settingsSection">
        <div className="settingsRow settingsRow--master">
          <div>
            <div className="settingsLabel">サウンド</div>
            <p className="settingsHint">オフにするとすべての音が止まります</p>
          </div>
          <button
            className={`switch ${settings.masterMuted ? "" : "switch--on"}`}
            role="switch"
            aria-checked={!settings.masterMuted}
            aria-label="サウンド"
            onClick={() => onToggleMute("master")}
          >
            <span className="switchKnob" />
          </button>
        </div>

        {CHANNELS.map(({ key, label, icon, hint }) => {
          const muted = settings[`${key}Muted`] || settings.masterMuted;
          const volume = settings[`${key}Volume`];
          return (
            <div className={`settingsRow ${settings.masterMuted ? "settingsRow--disabled" : ""}`} key={key}>
              <div className="settingsMeta">
                <button
                  className={`muteBtn ${muted ? "muteBtn--off" : ""}`}
                  onClick={() => onToggleMute(key)}
                  disabled={settings.masterMuted}
                  aria-label={`${label}を${muted ? "オン" : "ミュート"}にする`}
                  aria-pressed={!muted}
                >
                  {muted ? "🔇" : icon}
                </button>
                <div>
                  <div className="settingsLabel">{label}</div>
                  <p className="settingsHint">{hint}</p>
                </div>
              </div>
              <div className="settingsControl">
                <input
                  className="slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(volume * 100)}
                  disabled={settings.masterMuted}
                  aria-label={`${label}の音量`}
                  onChange={(event) => onVolume(key, Number(event.target.value) / 100)}
                  onPointerUp={() => onPreview?.(key)}
                  onKeyUp={() => onPreview?.(key)}
                />
                <span className="sliderVal">{muted ? "OFF" : `${Math.round(channelGain(settings, key) * 100)}`}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="settingsSection">
        <div className="settingsRow">
          <div>
            <div className="settingsLabel">アニメーションを減らす</div>
            <p className="settingsHint">動きを最小限にします（端末の設定も反映されます）</p>
          </div>
          <button
            className={`switch ${settings.reducedMotion ? "switch--on" : ""}`}
            role="switch"
            aria-checked={settings.reducedMotion}
            aria-label="アニメーションを減らす"
            onClick={onToggleMotion}
          >
            <span className="switchKnob" />
          </button>
        </div>
      </section>

      <section className="settingsSection">
        <div className="settingsLabel">音源について</div>
        <p className="settingsHint">
          BGM・効果音・ボイスはすべてCAKINGのために自動生成したオリジナル音源です。
          第三者の権利を含まないため、クレジット表記は不要です。
        </p>
      </section>

      <section className="settingsSection">
        <details className="gameGuide">
          <summary>ミルの工房ガイド</summary>
          <ol>
            <li><strong>準備：</strong>食材を補充して、レシピの材料を確認。準備中にも練習できます。</li>
            <li><strong>営業：</strong>3分間のお店を開きましょう。お客さまの注文を押すとレシピへ移動します。</li>
            <li><strong>製造：</strong>材料を使ってケーキを製造。成功すると売上になり、注文に応えると追加ボーナス！</li>
            <li><strong>成長：</strong>経験値でレベルを上げ、新しいレシピを解放。3つ星を集めてレシピ帳を完成させましょう。</li>
            <li><strong>お店づくり：</strong>ゲーム内Pでおめかしや家具を購入し、スタッフを仲間に。特別パーツは現在試着のみです。</li>
          </ol>
          <p>目標はLv10・所持金100,000P。達成後も続けて遊べます。</p>
          <p>食材はプレイ中に5秒ごとに回復します。一時停止・設定中・画面を離れた間は、営業と回復が止まります。</p>
        </details>
      </section>
      <SavePanel state={state} saveStatus={saveStatus} onRestore={onRestore} onRetry={onRetry} />
      <section className="settingsSection settingsSection--danger">
        {confirming ? (
          <div className="confirmBox">
            <p className="confirmText">セーブデータを消して最初からやり直します。よろしいですか？</p>
            <div className="rowGap">
              <button className="dangerBtn pressable" onClick={onReset}>削除してはじめから</button>
              <button className="secondaryBtn pressable" onClick={() => setConfirming(false)}>やめる</button>
            </div>
          </div>
        ) : (
          <button className="dangerBtn pressable" onClick={() => setConfirming(true)}>はじめから</button>
        )}
      </section>
    </Modal>
  );
}
