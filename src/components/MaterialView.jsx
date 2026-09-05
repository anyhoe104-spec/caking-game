import { Bar } from "./common.jsx";
import { MATERIAL_ICONS, MATERIAL_LABELS } from "../game/data.js";

export default function MaterialView({ state, matMax, buyAmount, buyCost, regenSeconds, onBuy }) {
  const lowest = Object.entries(state.materials).reduce(
    (best, entry) => (entry[1] < best[1] ? entry : best),
    ["", Infinity],
  );

  return (
    <div className="tabView">
      <div className="tabHeader">
        <div>
          <h2>食材</h2>
          <p>{regenSeconds}秒ごとに自動回復 / 上限 {matMax}</p>
        </div>
        <span className="headerNote">🪙 {state.money.toLocaleString()}P</span>
      </div>

      <div className="matGrid">
        {Object.entries(state.materials).map(([key, count], index) => {
          const full = count >= matMax;
          const poor = state.money < buyCost;
          return (
            <div
              key={key}
              className={`matCard card stagger ${full ? "full" : ""} ${count < 2 ? "matCard--low" : ""} ${key === lowest[0] ? "matCard--lowest" : ""}`}
              style={{ "--i": index }}
            >
              <span className="mIcon" aria-hidden="true">{MATERIAL_ICONS[key]}</span>
              <div className="mName">{MATERIAL_LABELS[key]}</div>
              <div className="mStock"><span className={full ? "maxVal" : ""}>{count}</span> / {matMax}</div>
              <Bar value={count} max={matMax} tone={full ? "gold" : count < 2 ? "red" : "green"} className="matBar" />
              <button
                className="buyBtn pressable"
                onClick={() => onBuy(key)}
                disabled={full}
                aria-label={`${MATERIAL_LABELS[key]}を${buyAmount}個買う（${buyCost}P）`}
              >
                {full ? "いっぱい" : <>+{buyAmount}<span className={`buyCost ${poor ? "buyCost--poor" : ""}`}>{buyCost}P</span></>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
