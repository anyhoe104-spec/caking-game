import MiniCharacter from "./MiniCharacter.jsx";
import CakeModel from "./CakeModel.jsx";
import { BASE } from "../game/assets.js";
export default function ShopDiorama({ state, onRecipe, onOrder }) {
  const open = state.dayPhase === "open";
  const guests = state.customerQueue.filter(c=> c.status === "waiting").slice(0,2);
  return <section className={`shopDiorama shopDiorama--${state.equippedDecoration ?? "classic"}`} aria-label="港町のケーキ工房">
    <img className="shopBackdrop" src={`${BASE}images/backgrounds/bg-shop.png`} alt="木のカウンターと海を望む小さな洋菓子店"/>
    <div className="shopSun" aria-hidden="true"/>
    <div className="shopPlaque"><span>ATELIER CAKING</span><strong>海風と、焼きたて。</strong></div>
    <span className={`shopOpen ${open ? "isOpen" : ""}`}>{open ? "OPEN" : "準備中"} · DAY {state.dayNumber}</span>
    <div className="shopDust" aria-hidden="true"><i/><i/><i/></div>
    <button className="shopChef" onClick={onRecipe} aria-label="ミフィとケーキをつくる"><span className="miniSpeech">{open ? "焼きたて、どうぞ！" : "なにを作ろう？"}</span><MiniCharacter action={open ? "work" : "walk"}/></button>
    <button className="shopCake" onClick={onRecipe} aria-label="工房で製造する"><CakeModel style={state.cakeStyle}/><span>工房へ ›</span></button>
    {guests.map((guest,i)=><button key={guest.uid} className={`shopGuest shopGuest--${i}`} onClick={()=>onOrder(guest.order)} aria-label={`${guest.name}の注文 ${guest.order}をつくる`}><span className="miniSpeech">{guest.order}</span><MiniCharacter variant={i ? "rose" : "guest"} action="walk"/></button>)}
    {state.equippedDecoration === "harbor-lamp" && <div className="shopLantern" aria-label="港町のランプ">✦</div>}
    {state.equippedDecoration === "rose-table" && <div className="shopFlowers" aria-label="ローズテーブルの花">❀ ❀ ❀</div>}
    {state.equippedDecoration === "royal-case" && <div className="shopRoyal" aria-label="王室のショーケース">ROYAL PATISSERIE</div>}
    <div className="shopCaption">ミフィやお客様をタップして、工房へ</div>
  </section>;
}
