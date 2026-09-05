import { CharImg } from "./common.jsx";
import { ENDING_LINES, OPENING_LINES } from "../game/data.js";

export function OpeningScene({ index, onAdvance, onSkip }) {
  const last = index >= OPENING_LINES.length - 1;
  return (
    <div className="sceneWrap">
      <div className="sceneCard card popIn">
        <div className="sceneProgress" aria-hidden="true">
          {OPENING_LINES.map((line, i) => (
            <span key={line} className={`sceneDot ${i <= index ? "on" : ""}`} />
          ))}
        </div>
        <CharImg mood={last ? "excited" : "normal"} className="sceneChar" />
        <p className="sceneText fadeSlide" key={index}>{OPENING_LINES[index]}</p>
        <button className="primaryBtn pressable" onClick={onAdvance}>
          {last ? "お店をはじめる 🍰" : "つぎへ ▶"}
        </button>
        {!last && (
          <button className="linkBtn" onClick={onSkip}>スキップ</button>
        )}
      </div>
    </div>
  );
}

export function EndingScene({ state, onRestart, onContinue }) {
  return (
    <div className="sceneWrap endingScene">
      <div className="sceneCard card popIn">
        <CharImg mood="happy" className="sceneChar" />
        {ENDING_LINES.map((line, index) => (
          <p key={line} className="sceneText small stagger" style={{ "--i": index }}>{line}</p>
        ))}
        <div className="endingStats">
          {[
            ["最終Lv", state.level],
            ["所持金", `${state.money.toLocaleString()}P`],
            ["累計PT", state.totalPoints.toLocaleString()],
            ["大成功", `${state.greatSuccessCount}回`],
            ["営業日数", `${state.dayNumber}日`],
          ].map(([label, value], index) => (
            <div key={label} className="stagger" style={{ "--i": index + ENDING_LINES.length }}>
              <span>{label}</span><strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="rowGap">
          <button className="primaryBtn pressable" onClick={onRestart}>もういちどあそぶ</button>
          <button className="secondaryBtn pressable" onClick={onContinue}>つづける</button>
        </div>
      </div>
    </div>
  );
}
