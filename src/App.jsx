import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "caking-save-v2";
const REGEN_INTERVAL_MS = 5000;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const ENDING_LEVEL = 10;
const ENDING_MONEY = 100000;

const BASE_MATERIALS = { egg: 5, cream: 5, strawberry: 5, flour: 5, sugar: 5, milk: 5, butter: 5 };
const MATERIAL_LABELS = { egg: "卵", cream: "生クリーム", strawberry: "いちご", flour: "小麦粉", sugar: "砂糖", milk: "牛乳", butter: "バター" };
const MATERIAL_KIDS_NAME = { egg: "たまご", cream: "くりーむ", strawberry: "いちご", flour: "こむぎこ", sugar: "さとう", milk: "ぎゅうにゅう", butter: "ばたー" };
const LEVEL_CAP = { 1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 22, 8: 24, 9: 27, 10: 30 };
const SOUNDS = { tap: "/sounds/tap.mp3", buy: "/sounds/buy.mp3", success: "/sounds/success.mp3", great: "/sounds/great.mp3", error: "/sounds/error.mp3", levelup: "/sounds/levelup.mp3", unlock: "/sounds/unlock.mp3" };
const BGMS = { opening: "/sounds/opening-theme.mp3", playing: "/sounds/shop-bgm.mp3", ending: "/sounds/ending-theme.mp3" };
const MIFI_IMAGES = { normal: "/images/characters/miffy-normal.png", happy: "/images/characters/miffy-happy.png", sad: "/images/characters/miffy-sad.png" };

const RECIPES = [
  { name: "ショートケーキ", level: 1, price: 700, exp: 22, ingredients: { egg: 3, cream: 3, strawberry: 3, flour: 2, sugar: 2 } },
  { name: "プリン", level: 2, price: 450, exp: 14, ingredients: { egg: 2, milk: 3, sugar: 2 } },
  { name: "イチゴタルト", level: 3, price: 1000, exp: 36, ingredients: { egg: 5, sugar: 5, strawberry: 2, flour: 3, butter: 3 } },
  { name: "チョコケーキ", level: 4, price: 1200, exp: 42, ingredients: { egg: 3, flour: 3, sugar: 3, milk: 2, butter: 2 } },
  { name: "ミルフィーユ", level: 5, price: 1500, exp: 60, ingredients: { flour: 5, butter: 5, cream: 4, sugar: 3, strawberry: 2 } },
  { name: "フルーツパイ", level: 6, price: 1800, exp: 70, ingredients: { flour: 5, butter: 4, strawberry: 4, sugar: 4, cream: 2 } },
  { name: "デコレーションケーキ", level: 10, price: 3000, exp: 125, ingredients: { egg: 6, cream: 6, strawberry: 6, flour: 4, sugar: 4, butter: 2 } },
  { name: "王様のケーキ", level: 10, price: 3600, exp: 150, ingredients: { egg: 6, cream: 6, strawberry: 5, flour: 5, sugar: 5, butter: 4 } },
];

const OPENING_LINES = ["ここは、海風のかおる小さな港町。", "猫耳の女の子ミフィは、ご主人様から古いケーキ店を任されました。", "「ミフィ、このお店をきみに任せる。町のみんなを笑顔にするケーキを作っておくれ」", "「はい、ご主人様！ ミフィ、がんばります！」", "失敗したり、大成功したりしながら、少しずつお店を大きくしていきます。", "目標は、職人レベル10、所持金100,000P。町いちばんの繁盛店を目指しましょう！"];

const ENDING_LINES = ["港町の小さなケーキ店は、毎日お客さんでいっぱいのお店になりました。", "ミフィのケーキを食べた人たちは、みんな笑顔になりました。", "「よくがんばったね、ミフィ。このお店は、もう立派な繁盛店だ」", "「ありがとうございます、ご主人様！ ミフィ、もっともっとおいしいケーキを作ります！」", "CAKING！ 繁盛店達成！"];

const defaultSave = () => ({ gamePhase: "opening", money: 1000, level: 1, exp: 0, materials: { ...BASE_MATERIALS }, craftCount: 0, successCount: 0, greatSuccessCount: 0, failCount: 0, buyCount: 0, levelUpCount: 0, soundOn: true, bgmOn: true, endingReached: false, openingIndex: 0 });
const capByLevel = (level) => LEVEL_CAP[Math.min(10, Math.max(1, level))] ?? 30;

function loadSave() { try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); const d = defaultSave(); return { ...d, ...raw, materials: Object.fromEntries(Object.keys(BASE_MATERIALS).map((k) => [k, Math.max(0, Math.floor(Number(raw?.materials?.[k] ?? d.materials[k])))])) }; } catch { return defaultSave(); } }
function playAudio(path, enabled, volume = 0.28, loop = false) { if (!enabled) return null; try { const a = new Audio(path); a.volume = volume; a.loop = loop; a.play().catch(() => {}); return a; } catch { return null; } }

export default function App() {
  const bootRef = useRef(null); if (!bootRef.current) bootRef.current = loadSave(); const boot = bootRef.current;
  const [state, setState] = useState(boot); const [activeTab, setActiveTab] = useState("home"); const [toast, setToast] = useState(""); const [effect, setEffect] = useState(""); const [endingOpen, setEndingOpen] = useState(false);
  const bgmRef = useRef(null);

  const materialMax = capByLevel(state.level); const expToNext = state.level * 50;
  const canMake = (r) => Object.entries(r.ingredients).every(([k, n]) => (state.materials[k] ?? 0) >= n);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { const t = setInterval(() => setState((s) => ({ ...s, materials: Object.fromEntries(Object.entries(s.materials).map(([k, v]) => [k, Math.min(capByLevel(s.level), v + 1)])) })), REGEN_INTERVAL_MS); return () => clearInterval(t); }, []);
  useEffect(() => { if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current = null; } if (state.bgmOn) bgmRef.current = playAudio(BGMS[state.gamePhase], true, 0.2, true); }, [state.gamePhase, state.bgmOn]);
  useEffect(() => { if (state.gamePhase === "playing" && state.level >= ENDING_LEVEL && state.money >= ENDING_MONEY && !endingOpen) { setState((s) => ({ ...s, gamePhase: "ending", endingReached: true })); setEndingOpen(true); } }, [state.level, state.money, state.gamePhase, endingOpen]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 1800); };
  const sfx = (key) => playAudio(SOUNDS[key], state.soundOn);

  const craft = (r) => {
    if (state.level < r.level) return showToast(`Lv${r.level}で解放`), sfx("error");
    if (!canMake(r)) return showToast("ざいりょうをかおう！"), sfx("error");
    const pFail = Math.max(0.03, 0.15 - (state.level - 1) * (0.12 / 9));
    const pGreat = Math.min(0.25, 0.1 + (state.level - 1) * (0.15 / 9));
    const roll = Math.random();
    let result = "success"; if (roll < pFail) result = "fail"; else if (roll < pFail + pGreat) result = "great";
    const nextMat = { ...state.materials }; Object.entries(r.ingredients).forEach(([k, n]) => { const use = result === "fail" ? Math.max(1, Math.floor(n * 0.5)) : n; nextMat[k] = Math.max(0, nextMat[k] - use); });
    let gainMoney = 0, gainExp = 0, msg = "できた！"; if (result === "success") { gainMoney = r.price; gainExp = r.exp; sfx("success"); }
    if (result === "great") { gainMoney = Math.floor(r.price * 1.5); gainExp = Math.floor(r.exp * 1.5); msg = "大成功！"; sfx("great"); setEffect("sparkle"); }
    if (result === "fail") { gainExp = Math.max(1, Math.floor(r.exp * 0.2)); msg = "しっぱい…でも少し上手になったよ！"; sfx("error"); setEffect("smoke"); }
    let nextExp = state.exp + gainExp; let lv = state.level; let levelUps = 0;
    while (nextExp >= lv * 50 && lv < 99) { nextExp -= lv * 50; lv += 1; levelUps += 1; }
    if (levelUps > 0) { sfx("levelup"); setEffect("levelup"); }
    setState((s) => ({ ...s, materials: nextMat, money: s.money + gainMoney, exp: nextExp, level: lv, craftCount: s.craftCount + 1, successCount: s.successCount + (result === "success"), greatSuccessCount: s.greatSuccessCount + (result === "great"), failCount: s.failCount + (result === "fail"), levelUpCount: s.levelUpCount + levelUps }));
    showToast(msg);
  };

  const buy = (k) => {
    if (state.money < BUY_COST) return sfx("error"), showToast("おかねがたりないよ！");
    if (state.materials[k] >= materialMax) return sfx("error"), showToast("もういっぱい！");
    sfx("buy"); setState((s) => ({ ...s, money: s.money - BUY_COST, buyCount: s.buyCount + 1, materials: { ...s.materials, [k]: Math.min(materialMax, s.materials[k] + BUY_AMOUNT) } }));
  };

  const reset = () => { const d = defaultSave(); setState(d); setActiveTab("home"); setEndingOpen(false); };
  const miffy = (mood) => <img src={MIFI_IMAGES[mood]} onError={(e)=>{e.currentTarget.style.display='none';}} alt="miffy" className="miffy" />;

  if (state.gamePhase === "opening") return <div className="sceneWrap"><div className="card">{miffy("normal")}<p>{OPENING_LINES[state.openingIndex]}</p><div className="row"><button className="primaryButton" onClick={()=>{sfx("tap"); if (state.openingIndex < OPENING_LINES.length - 1) setState((s)=>({ ...s, openingIndex: s.openingIndex + 1 })); else setState((s)=>({ ...s, gamePhase: "playing" }));}}>{state.openingIndex < OPENING_LINES.length - 1 ? "つぎへ" : "お店をはじめる"}</button></div></div></div>;

  return <div className={`phoneStage ${effect ? `fx-${effect}` : ""}`}><div className="appShell"><header className="appHeader"><div><div className="brandCompact">CAKING！</div><div>Lv {state.level} / {state.money.toLocaleString()}P</div></div><div className="row"><button className="soundToggle" onClick={()=>setState((s)=>({...s,soundOn:!s.soundOn}))}>{state.soundOn?"SE ON":"SE OFF"}</button><button className="soundToggle" onClick={()=>setState((s)=>({...s,bgmOn:!s.bgmOn}))}>{state.bgmOn?"BGM ON":"BGM OFF"}</button></div></header>
  <main className="tabContent">
    {activeTab==="home" && <section className="screen card">{miffy("normal")}<p>目標: Lv10 & 100,000P</p><p>EXP {state.exp}/{expToNext}</p></section>}
    {activeTab==="material" && <section className="screen">{Object.entries(state.materials).map(([k,v])=><div className="materialCard" key={k}><b>{MATERIAL_LABELS[k]}</b><span>在庫 {v} / {materialMax}</span><button className="buyButton" onClick={()=>buy(k)}>購入 +{BUY_AMOUNT}</button></div>)}</section>}
    {activeTab==="recipe" && <section className="screen">{RECIPES.map((r)=><div className="recipeCard" key={r.name}><b>{r.name} Lv{r.level}</b><div>{Object.entries(r.ingredients).map(([k,n])=><span key={k}>{MATERIAL_KIDS_NAME[k]} {state.materials[k]}/{n} </span>)}</div><button className="makeButton" onClick={()=>craft(r)}>{state.level<r.level?`Lv${r.level}で解放`:"つくる"}</button></div>)}</section>}
    {activeTab==="shop" && <section className="screen card"><p>作成:{state.craftCount} 成功:{state.successCount} 大成功:{state.greatSuccessCount} 失敗:{state.failCount} 購入:{state.buyCount}</p><button className="resetFromStart" onClick={reset}>はじめから</button></section>}
  </main></div>
  <nav className="bottomNav">{["home","material","recipe","shop"].map((t)=><button key={t} className={activeTab===t?"navItem active":"navItem"} onClick={()=>setActiveTab(t)}>{t}</button>)}</nav>
  {toast && <div className="toast">{toast}</div>}
  {state.gamePhase === "ending" && <div className="endingOverlay"><div className="card">{miffy("happy")} {ENDING_LINES.map((l)=><p key={l}>{l}</p>)}<p>最終レベル: {state.level}</p><p>最終所持金: {state.money.toLocaleString()}P</p><p>作ったケーキ数: {state.craftCount}</p><p>成功回数: {state.successCount}</p><p>大成功回数: {state.greatSuccessCount}</p><p>失敗回数: {state.failCount}</p><p>素材購入回数: {state.buyCount}</p><div className="row"><button className="primaryButton" onClick={reset}>もういちどあそぶ</button><button className="secondaryButton" onClick={()=>setState((s)=>({...s,gamePhase:"playing"}))}>つづけてあそぶ</button></div></div></div>}
  </div>;
}
