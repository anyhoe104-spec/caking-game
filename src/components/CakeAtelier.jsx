import { useState } from "react";
import { RECIPES } from "../game/data.js";
import { CAKE_PARTS } from "../game/cakeParts.js";
import CakeModel from "./CakeModel.jsx";
export default function CakeAtelier({ state, onBuy, onEquip }) {
  const [recipe, setRecipe] = useState(RECIPES[0].name);
  const [preview, setPreview] = useState(null);
  const part = CAKE_PARTS.find(p => p.id === preview);
  const style = { ...state.cakeStyle, ...(part ? { [part.category]: part.id } : {}) };
  return <section className="cakeAtelier card">
    <div className="atelierHeading"><span className="eyebrow">CAKE DRESSING</span><h2>ケーキのおめかし</h2><p>ひとつの飾りで、あなたらしい一皿に。</p></div>
    <label className="cakeRecipeChoice">ケーキの種類<select value={recipe} onChange={event=>setRecipe(event.target.value)}>{RECIPES.map(r=><option key={r.name} value={r.name}>{r.name}</option>)}</select></label>
    <div className="cakePreview"><CakeModel style={style} recipe={recipe}/><span>{part ? `${part.name}を試着中` : "いまのおめかし"}</span></div>
    {part && <button className="linkBtn" onClick={()=>setPreview(null)}>試着をやめる</button>}
    <div className="partsGrid">{CAKE_PARTS.map(p=> {
      const owned = state.ownedCakeParts?.includes(p.id);
      const equipped = state.cakeStyle?.[p.category] === p.id;
      return <article key={p.id} className={`partCard ${preview === p.id ? "selected" : ""}`}>
        <button className="partPreview" onClick={()=>setPreview(p.id)} aria-pressed={preview === p.id} aria-label={`${p.name}を試着`}><span style={{background:p.color}}/>{p.name}</button>
        <p>{p.note}</p>
        <small>{p.premium ? "特別コレクション・準備中" : owned ? "所持済み" : `${p.price.toLocaleString()}P`}</small>
        <button className="buyBtn" disabled={p.premium || equipped || (!owned && state.money < p.price)} onClick={()=> { if(owned) {onEquip(p.id);setPreview(null);} else onBuy(p.id);}}>{p.premium ? "試着のみ" : equipped ? "装備中" : owned ? "飾る" : "Pで購入"}</button>
      </article>;
    })}</div>
    <p className="atelierNote">特別コレクションは見た目のみの追加パーツです。現在は試着でき、実際の決済は発生しません。</p>
  </section>;
}
