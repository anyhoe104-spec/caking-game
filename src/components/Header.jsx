import { LiveNumber } from "./common.jsx";
import { BUSINESS_DURATION, formatTimer } from "../game/business.js";

/**
 * Compact status bar. During service the timer becomes a ring so the remaining
 * time reads at a glance instead of requiring the player to parse digits.
 */
export default function Header({ state, expToNext, muted, onHome, onSettings }) {
  const open = state.dayPhase === "open";
  const urgent = open && state.businessTimer < 30;
  const timerPct = open ? Math.max(0, Math.min(1, state.businessTimer / BUSINESS_DURATION)) : 0;

  return (
    <header className="appHeader">
      <button className="brandBtn pressable" onClick={onHome} aria-label="営業ホームへ">
        CAKING<span className="brandMark">!</span>
      </button>

      <div className="headerStats">
        <div className="statChip" title="所持金">
          <span aria-hidden="true">🪙</span>
          <LiveNumber value={state.money} className="statVal" />
        </div>
        <div className="statChip" title={`職人レベル ${state.level} / EXP ${state.exp}/${expToNext}`}>
          <span className="lvBadge" style={{ "--lv-pct": `${Math.min(100, (state.exp / expToNext) * 100)}%` }}>
            Lv{state.level}
          </span>
          <LiveNumber value={state.totalPoints} className="statVal statVal--pt" />
          <span className="statSub">pt</span>
        </div>
        {open && (
          <div
            className={`statChip timerChip ${urgent ? "timerUrgent" : ""}`}
            style={{ "--timer-pct": `${timerPct * 100}%` }}
            title="営業終了までの残り時間"
          >
            <span className="timerRing" aria-hidden="true" />
            <span className="statVal">{formatTimer(state.businessTimer)}</span>
          </div>
        )}
      </div>

      <button
        className="iconBtn pressable"
        onClick={onSettings}
        aria-label="設定を開く"
        title="設定（音量・ミュート・データ）"
      >
        {muted ? "🔇" : "⚙️"}
      </button>
    </header>
  );
}
