import { Bar } from "./common.jsx";
import { useCountUp } from "../hooks/useCountUp.js";

export default function DailyReport({ state, animate, onNext, onCoinTick }) {
  const served = state.customerQueue.filter((c) => c.status === "fulfilled" || c.status === "special");
  const special = state.customerQueue.filter((c) => c.status === "special").length;
  const cleared = state.missions.filter((m) => m.completed);
  const bonusPts = cleared.reduce((sum, m) => sum + (m.reward?.points ?? 0), 0);
  const bonusMoney = cleared.reduce((sum, m) => sum + (m.reward?.money ?? 0), 0);
  const goalMet = state.todaySales >= state.todaySalesGoal;

  const sales = useCountUp(state.todaySales, { enabled: animate, duration: 1100, onTick: onCoinTick });

  return (
    <div className="overlay">
      <div className="reportCard card popIn" role="dialog" aria-modal="true" aria-labelledby="reportTitle">
        <h2 id="reportTitle" className="reportTitle">📊 Day {state.dayNumber} 営業終了！</h2>

        <div className={`reportHero ${goalMet ? "reportHero--met" : ""}`}>
          <span className="reportHeroLabel">本日の売上</span>
          <span className="reportHeroVal">🪙 {sales.toLocaleString()}</span>
          <Bar value={sales} max={state.todaySalesGoal} tone={goalMet ? "gold" : "green"} />
          <span className="reportHeroGoal">
            目標 {state.todaySalesGoal.toLocaleString()}P {goalMet && <strong className="green">達成！</strong>}
          </span>
        </div>

        <div className="reportSection">
          <div className="reportRow"><span>対応した注文</span><strong>{served.length}件</strong></div>
          <div className="reportRow"><span>大成功</span><strong>{special}回</strong></div>
          <div className="reportRow"><span>作ったケーキ</span><strong>{state.craftCount}個（累計）</strong></div>
        </div>

        <h3 className="subTitle">ミッション</h3>
        {state.missions.map((mission, index) => (
          <div
            key={mission.id}
            className={`reportMission stagger ${mission.completed ? "green" : ""}`}
            style={{ "--i": index }}
          >
            <span>{mission.icon ?? "🎯"} {mission.description}</span>
            <strong>{mission.completed ? "✅ 達成！" : `${mission.current.toLocaleString()}/${mission.target.toLocaleString()}`}</strong>
          </div>
        ))}

        {(bonusPts > 0 || bonusMoney > 0) && (
          <>
            <h3 className="subTitle">報酬</h3>
            <div className="rewardRow">
              {bonusPts > 0 && <span className="rewardChip popIn">⭐ +{bonusPts}PT</span>}
              {bonusMoney > 0 && <span className="rewardChip popIn">🪙 +{bonusMoney.toLocaleString()}P</span>}
            </div>
          </>
        )}

        <button className="primaryBtn reportNext pressable" onClick={onNext}>次の日へ ➡</button>
      </div>
    </div>
  );
}
