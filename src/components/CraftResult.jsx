import { useEffect, useRef, useState } from "react";
import { Stars } from "./common.jsx";
import MiniCharacter from "./MiniCharacter.jsx";
import CakeModel from "./CakeModel.jsx";
import { recipeImg } from "../game/assets.js";
const COPY = {
  great: {title:"とびきりの、できあがり。", note:"大成功！ 工房じゅうに甘い香り。"},
  success: {title:"焼きたて、できました！", note:"今日のひと皿を、心をこめて。"},
  fail: {title:"もう一度、挑戦しよう。", note:"失敗も、おいしさへの一歩。"},
};
function Production({ result, reduced, onFinish, onReveal, cakeStyle }) {
  const [step,setStep] = useState(reduced ? 3 : 0);
  useEffect(()=> {
    if(reduced) return;
    const timers=[setTimeout(()=>setStep(current=>Math.max(current,1)),750),setTimeout(()=>setStep(current=>Math.max(current,2)),1500),setTimeout(()=>setStep(3),2400)];
    return ()=>timers.forEach(clearTimeout);
  },[reduced]);
  const done = reduced || step === 3;
  const revealed = useRef(false);
  const focus = useRef(null);
  useEffect(() => { focus.current?.focus(); }, [done]);
  useEffect(() => {
    if (done && !revealed.current) { revealed.current = true; onReveal(); }
  }, [done, onReveal]);
  const copy=COPY[result.type] ?? COPY.success;
  return <div className={`craftResult productionOverlay craftResult--${result.type}`} role="dialog" aria-modal="true" aria-label={`${result.recipe}の製造`}>
    <div className={`craftCard productionCard productionStep--${done ? 3 : step}`}>
      <span className="eyebrow">{done ? "BAKED WITH LOVE" : "IN THE ATELIER"}</span>
      <div className="productionScene" aria-hidden="true">
        {done ? <><img className="finishedRecipe" src={recipeImg(result.recipe)} alt=""/>{cakeStyle?.top !== "berry" || cakeStyle?.band ? <div className="finishStyle"><CakeModel style={cakeStyle}/></div> : null}</> : <><MiniCharacter action="work"/><div className="mixingBowl">{step === 0 ? <><i/><i/><i/></> : step === 1 ? <div className="ovenGlow"/> : <CakeModel style={cakeStyle}/>}</div><span className="productionSteam">∿ ∿ ∿</span></>}
      </div>
      <div className="craftTitle" role="status">{done ? copy.title : ["ふんわり、混ぜる。","じっくり、火を入れる。","仕上げに、ひと工夫。"][step]}</div>
      <div className="craftName">{result.recipe}</div>
      {!done ? <><div className="productionSteps">{["仕込み","加熱","仕上げ"].map((s,i)=><span key={s} className={i<=step ? "active" : ""}>{s}</span>)}</div><button ref={focus} className="linkBtn" onClick={()=>setStep(3)}>演出をスキップ</button></> : <><Stars rating={result.stars} size="lg"/><div className="craftGains">{result.money>0 && <span className="craftGain craftGain--money">+{result.money.toLocaleString()}P</span>}<span className="craftGain craftGain--exp">+{result.exp}EXP</span></div>{result.customer && <p className="craftServed">{result.customer}に提供しました</p>}<p className="craftNote">{copy.note}</p><button ref={focus} className="primaryBtn" onClick={onFinish}>工房にもどる</button></>}
    </div>
  </div>;
}
export default function CraftResult({ result, reduced, onFinish, onReveal, cakeStyle }) {
  return result ? <Production key={result.id} result={result} reduced={reduced} onFinish={onFinish} onReveal={onReveal} cakeStyle={cakeStyle}/> : null;
}
