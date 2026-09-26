import { useEffect, useRef, useState } from "react";
import { Stars } from "./common.jsx";
import MiniCharacter from "./MiniCharacter.jsx";
import CraftStage from "./CraftStage.jsx";
import { getCraftPresentation } from "../game/craftPresentation.js";
import CakeModel from "./CakeModel.jsx";
import { recipeImg } from "../game/assets.js";
const COPY = {
  great: {title:"とびきりの、できあがり。", note:"大成功！ 工房じゅうに甘い香り。"},
  success: {title:"できあがり！", note:"今日のひと皿を、心をこめて。"},
  fail: {title:"もう一度、挑戦しよう。", note:"失敗も、おいしさへの一歩。"},
};
function Production({ result, reduced, paused, onFinish, onReveal, cakeStyle }) {
  const presentation = getCraftPresentation(result.recipe);
  const [step,setStep] = useState(reduced ? 3 : 0);
  useEffect(()=> {
    if(reduced || paused) return;
    const timers=[setTimeout(()=>setStep(current=>Math.max(current,1)),750),setTimeout(()=>setStep(current=>Math.max(current,2)),1500),setTimeout(()=>setStep(3),2400)];
    return ()=>timers.forEach(clearTimeout);
  },[reduced, paused]);
  const done = reduced || step === 3;
  const revealed = useRef(false);
  const focus = useRef(null);
  useEffect(() => { if (!paused) focus.current?.focus(); }, [done, paused]);
  useEffect(() => {
    if (done && !paused && !revealed.current) { revealed.current = true; onReveal(); }
  }, [done, paused, onReveal]);
  const copy=COPY[result.type] ?? COPY.success;
  return <div className={`craftResult productionOverlay craftResult--${result.type}`} role="dialog" aria-modal="true" aria-label={`${result.recipe}の製造`}>
    <div className={`craftCard productionCard productionStep--${done ? 3 : step}`}>
      <span className="eyebrow">{done ? "BAKED WITH LOVE" : "IN THE ATELIER"}</span>
      <div className="productionScene" aria-hidden="true">
        {done ? (cakeStyle?.top !== "berry" || cakeStyle?.band
          ? <CakeModel className="finishedRecipe" recipe={result.recipe} style={cakeStyle}/>
          : <img className="finishedRecipe" src={recipeImg(result.recipe)} alt=""/>)
          : <><MiniCharacter action="work"/><CraftStage kind={presentation.steps[step].kind} recipe={result.recipe} cakeStyle={cakeStyle}/></>}

      </div>
      <div className="craftTitle" role="status">{done ? copy.title : presentation.steps[step].title}</div>
      {!done && <p className="craftTip">{presentation.steps[step].tip}</p>}
      <div className="craftName">{result.recipe}</div>
      {!done ? <><div className="productionSteps">{presentation.steps.map(({label:s},i)=><span key={s} className={i<=step ? "active" : ""}>{s}</span>)}</div><button ref={focus} className="linkBtn" onClick={()=>setStep(3)}>演出をスキップ</button></> : <><Stars rating={result.stars} size="lg"/><div className="craftGains">{result.money>0 && <span className="craftGain craftGain--money">+{result.money.toLocaleString()}P</span>}<span className="craftGain craftGain--exp">+{result.exp}EXP</span></div>{result.customer && <p className="craftServed">{result.customer}に提供しました</p>}<p className="craftNote">{copy.note}</p><button ref={focus} className="primaryBtn" onClick={onFinish}>工房にもどる</button></>}
    </div>
  </div>;
}
export default function CraftResult({ result, reduced, paused, onFinish, onReveal, cakeStyle }) {
  return result ? <Production key={result.id} result={result} reduced={reduced} paused={paused} onFinish={onFinish} onReveal={onReveal} cakeStyle={cakeStyle}/> : null;
}
