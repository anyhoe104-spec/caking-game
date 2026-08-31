import { Stars } from "./common.jsx";

const COPY = {
  great: { title: "大成功！", note: "とびきりの出来ばえ！", tone: "great" },
  success: { title: "できました！", note: "きれいに焼き上がりました", tone: "success" },
  fail: { title: "失敗…", note: "素材は半分だけ残りました", tone: "fail" },
};

/**
 * Result card shown for ~1.4s after every bake. Replaces the old text-only
 * toast so the outcome, the earnings and the served customer land together.
 */
export default function CraftResult({ result }) {
  if (!result) return null;
  const copy = COPY[result.type] ?? COPY.success;

  return (
    <div className={`craftResult craftResult--${copy.tone}`} key={result.id} role="status">
      <div className="craftCard">
        <span className="craftIcon">{result.icon}</span>
        <div className="craftTitle">{copy.title}</div>
        <div className="craftName">{result.recipe}</div>
        <Stars rating={result.stars} size="lg" />
        <div className="craftGains">
          {result.money > 0 && <span className="craftGain craftGain--money">🪙 +{result.money.toLocaleString()}</span>}
          {result.exp > 0 && <span className="craftGain craftGain--exp">✨ +{result.exp}EXP</span>}
        </div>
        {result.customer && <div className="craftServed">🧾 {result.customer}に提供しました</div>}
        <p className="craftNote">{copy.note}</p>
      </div>
    </div>
  );
}
