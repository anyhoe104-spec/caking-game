import { useEffect, useRef, useState } from "react";
import "./App.css";
import { ENDING_LINES, MATERIAL_KIDS_NAME, MATERIAL_LABELS, OPENING_LINES, RECIPES } from "./game/data.js";
import { applyExperience, calcPoints, capByLevel, ENDING_LEVEL, ENDING_MONEY, rollCraftResult } from "./game/logic.js";
import { defaultSave, loadSave, saveGame } from "./game/storage.js";
import { formatTimer, nextDay, startBusiness, tickBusiness } from "./game/business.js";
import { fulfillOrder, generateCustomerQueue } from "./game/customers.js";
import { applyMissionProgress, generateMissions } from "./game/missions.js";
import { getMiruMessage, updateRecipeRating } from "./game/engagement.js";
import { buyDecoration, DECORATIONS, equipDecoration, getStaffEffects, hireStaff, STAFF } from "./game/shop.js";

const REGEN_INTERVAL_MS = 5000;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const SOUNDS = { tap: assetUrl("sounds/tap.mp3"), buy: assetUrl("sounds/buy.mp3"), success: assetUrl("sounds/success.mp3"), great: assetUrl("sounds/great.mp3"), error: assetUrl("sounds/error.mp3"), levelup: assetUrl("sounds/levelup.mp3"), unlock: assetUrl("sounds/unlock.mp3") };
const BGMS = { opening: assetUrl("sounds/opening-theme.mp3"), playing: assetUrl("sounds/shop-bgm.mp3"), ending: assetUrl("sounds/ending-theme.mp3") };
const MIFI_IMAGES = Object.fromEntries(["normal", "happy", "sad", "excited", "working"].map((mood) => [mood, assetUrl(`images/characters/miffy-${mood}.png`)]));
const MIRU_IMAGES = Object.fromEntries(["normal", "happy", "thinking"].map((mood) => [mood, assetUrl(`images/characters/miru-${mood}.png`)]));
const RECIPE_IMAGES = { "ショートケーキ": "shortcake.png", "プリン": "pudding.png", "イチゴタルト": "tart.png", "チョコケーキ": "choco-cake.png", "ミルフィーユ": "millefeuille.png", "フルーツパイ": "fruit-pie.png", "デコレーションケーキ": "decoration-cake.png", "王様のケーキ": "royal-cake.png" };

function playAudio(path, enabled, volume = 0.28, loop = false) { if (!enabled) return null; try { const a = new Audio(path); a.volume = volume; a.loop = loop; a.play().catch(() => {}); return a; } catch { return null; } }

export default function App() {
  const [state, setState] = useState(loadSave); const [activeTab, setActiveTab] = useState("shop"); const [toast, setToast] = useState(""); const [effect, setEffect] = useState("");
  const bgmRef = useRef(null);

  const materialMax = capByLevel(state.level); const expToNext = state.level * 50;
  const canMake = (r) => Object.entries(r.ingredients).every(([k, n]) => (state.materials[k] ?? 0) >= n);

  useEffect(() => { saveGame(state); }, [state]);
  useEffect(() => { const t = setInterval(() => setState((s) => { const effects = getStaffEffects(s.staff); return { ...s, materials: Object.fromEntries(Object.entries(s.materials).map(([k, v]) => [k, Math.min(capByLevel(s.level), v + 1 + effects.regenBonus)])) }; }), REGEN_INTERVAL_MS); return () => clearInterval(t); }, []);
  useEffect(() => { if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current = null; } if (state.bgmOn) bgmRef.current = playAudio(BGMS[state.gamePhase], true, 0.2, true); }, [state.gamePhase, state.bgmOn]);
  useEffect(() => { if (state.dayPhase !== "open") return undefined; const timer = setInterval(() => setState(tickBusiness), 1000); return () => clearInterval(timer); }, [state.dayPhase]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 1800); };
  const sfx = (key) => playAudio(SOUNDS[key], state.soundOn);

  const craft = (r) => {
    if (state.level < r.level) return showToast(`Lv${r.level}で解放`), sfx("error");
    if (!canMake(r)) { setState((s) => ({ ...s, lastEvent: { type: "shortage", material: "素材" } })); return showToast("ざいりょうをかおう！"), sfx("error"); }
    const result = rollCraftResult(state.level, crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
    const nextMat = { ...state.materials }; Object.entries(r.ingredients).forEach(([k, n]) => { const use = result === "fail" ? Math.max(1, Math.floor(n * 0.5)) : n; nextMat[k] = Math.max(0, nextMat[k] - use); });
    let gainMoney = 0, gainExp = 0, msg = "できた！"; if (result === "success") { gainMoney = r.price; gainExp = r.exp; sfx("success"); }
    if (result === "great") { gainMoney = Math.floor(r.price * 1.5); gainExp = Math.floor(r.exp * 1.5); msg = "大成功！"; sfx("great"); setEffect("sparkle"); }
    if (result === "fail") { gainExp = Math.max(1, Math.floor(r.exp * 0.2)); msg = "しっぱい…でも少し上手になったよ！"; sfx("error"); setEffect("smoke"); }
    const progress = applyExperience(state.exp, state.level, gainExp);
    const nextExp = progress.exp; const lv = progress.level; const levelUps = progress.levelUps;
    if (levelUps > 0) { sfx("levelup"); setEffect("levelup"); }
    setState((s) => {
      const order = s.dayPhase === "open" ? fulfillOrder(s.customerQueue, r.name, result) : { queue: s.customerQueue, customer: null, moneyBonus: 0, fulfilled: false };
      const staffEffects = getStaffEffects(s.staff);
      const salesGain = Math.floor((gainMoney + order.moneyBonus) * staffEffects.salesMultiplier);
      const money = s.money + salesGain;
      const ending = lv >= ENDING_LEVEL && money >= ENDING_MONEY;
      const isOpen = s.dayPhase === "open";
      let next = { ...s, materials: nextMat, customerQueue: order.queue, money, exp: nextExp, level: lv, totalPoints: s.totalPoints + Math.floor(calcPoints(result, r, order.customer) * staffEffects.pointsMultiplier), recipeRatings: updateRecipeRating(s.recipeRatings, r.name, result), lastEvent: { type: result, recipe: r.name }, todaySales: s.todaySales + (isOpen ? salesGain : 0), dailyStats: { ...s.dailyStats, filledOrders: s.dailyStats.filledOrders + (order.fulfilled ? 1 : 0), satisfiedCustomers: s.dailyStats.satisfiedCustomers + (order.fulfilled ? 1 : 0), greatCount: s.dailyStats.greatCount + (isOpen && result === "great" ? 1 : 0) }, gamePhase: ending ? "ending" : s.gamePhase, endingReached: ending || s.endingReached, craftCount: s.craftCount + 1, successCount: s.successCount + (result === "success"), greatSuccessCount: s.greatSuccessCount + (result === "great"), failCount: s.failCount + (result === "fail"), levelUpCount: s.levelUpCount + levelUps };
      if (isOpen) {
        next = applyMissionProgress(next, "craft_recipe");
        if (order.fulfilled) next = applyMissionProgress(next, "satisfy_customers");
        if (order.fulfilled && result === "great") next = applyMissionProgress(next, "special_orders");
        next = applyMissionProgress(next, "reach_sales", next.todaySales, true);
      }
      return next;
    });
    showToast(msg);
  };

  const buy = (k) => {
    if (state.money < BUY_COST) return sfx("error"), showToast("おかねがたりないよ！");
    if (state.materials[k] >= materialMax) return sfx("error"), showToast("もういっぱい！");
    sfx("buy"); setState((s) => applyMissionProgress({ ...s, money: s.money - BUY_COST, buyCount: s.buyCount + 1, materials: { ...s.materials, [k]: Math.min(materialMax, s.materials[k] + BUY_AMOUNT) } }, "buy_materials"));
  };

  const reset = () => { const d = defaultSave(); setState(d); setActiveTab("shop"); };
  const beginBusiness = () => setState((s) => startBusiness({ ...s, missions: generateMissions(s.level, s.dayNumber) }, generateCustomerQueue(s.level, s.dayNumber)));
  const advanceDay = () => setState((s) => { const next = nextDay(s); return { ...next, missions: generateMissions(next.level, next.dayNumber) }; });
  const shopDecoration = (decoration) => setState((s) => s.decorations.includes(decoration.id) ? equipDecoration(s, decoration.id) : buyDecoration(s, decoration));
  const recruit = (member) => setState((s) => hireStaff(s, member));
  const miffy = (mood) => <img src={MIFI_IMAGES[mood]} onError={(e)=>{e.currentTarget.style.display='none';}} alt="miffy" className="miffy" />;
  const miffyMood = state.lastEvent?.type === "great" ? "excited" : state.lastEvent?.type === "fail" ? "sad" : state.dayPhase === "open" ? "working" : "normal";
  const miruMood = state.lastEvent?.type === "great" ? "happy" : state.lastEvent?.type === "shortage" || state.dayPhase === "open" ? "thinking" : "normal";

  if (state.gamePhase === "opening") return <div className="sceneWrap"><div className="card">{miffy("normal")}<p>{OPENING_LINES[state.openingIndex]}</p><div className="row"><button className="primaryButton" onClick={()=>{sfx("tap"); if (state.openingIndex < OPENING_LINES.length - 1) setState((s)=>({ ...s, openingIndex: s.openingIndex + 1 })); else setState((s)=>({ ...s, gamePhase: "playing" }));}}>{state.openingIndex < OPENING_LINES.length - 1 ? "つぎへ" : "お店をはじめる"}</button></div></div></div>;

  const tabs = [{ id: "shop", icon: "🏪", label: "ショップ" }, { id: "recipe", icon: "📖", label: "レシピ" }, { id: "deco", icon: "🎂", label: "デコ" }, { id: "material", icon: "🍓", label: "食材" }, { id: "staff", icon: "👤", label: "スタッフ" }];

  return <div className={`phoneStage ${effect ? `fx-${effect}` : ""}`}><div className="appShell"><header className="appHeader"><div className="brandCompact">CAKING！</div><div className="headerStats"><span className="statChip">🪙 {state.money.toLocaleString()}</span><span className="statChip">⭐ {state.totalPoints.toLocaleString()}pt <small>Lv{state.level}</small></span>{state.dayPhase === "open" && <span className={`statChip timerChip ${state.businessTimer <= 30 ? "urgent" : ""}`}>⏰ {formatTimer(state.businessTimer)}</span>}</div><div className="row"><button className="soundToggle" onClick={()=>setState((s)=>({...s,soundOn:!s.soundOn}))}>{state.soundOn?"SE ON":"SE OFF"}</button><button className="soundToggle" onClick={()=>setState((s)=>({...s,bgmOn:!s.bgmOn}))}>{state.bgmOn?"BGM ON":"BGM OFF"}</button></div></header>
  <main className="mainGrid">
    <aside className="sidePanel missionPanel"><h2>今日の目標</h2>{state.missions.length ? state.missions.map((mission)=><div className="missionRow" key={mission.id}><span>{mission.completed ? "✅" : "⬜"} {mission.description}</span><strong>{mission.current}/{mission.target}</strong></div>) : <p className="emptyNote">営業を始めると目標が表示されます。</p>}</aside>
    <section className={`mainView tab-${activeTab}`}>
      {activeTab==="shop" && <section className="screen"><div className="card heroCard">{miffy(miffyMood)}<div><h1>港町のケーキ店</h1><p>目標: Lv10 & 100,000コイン</p><p>EXP {state.exp}/{expToNext}</p></div></div><div className="card"><h2>これまでの記録</h2><p>作成 {state.craftCount} / 成功 {state.successCount} / 大成功 {state.greatSuccessCount} / 失敗 {state.failCount}</p><button className="resetFromStart" onClick={reset}>はじめから</button></div></section>}
      {activeTab==="material" && <section className="screen cardGrid">{Object.entries(state.materials).map(([k,v])=><div className="materialCard" key={k}><img className="itemImage" src={assetUrl(`images/ingredients/${k}.png`)} alt="" onError={(event)=>{event.currentTarget.style.display="none"}}/><b>{MATERIAL_LABELS[k]}</b><span>在庫 {v} / {materialMax}</span><button className="buyButton" onClick={()=>buy(k)}>🪙{BUY_COST}で +{BUY_AMOUNT}</button></div>)}</section>}
      {activeTab==="recipe" && <section className="screen cardGrid">{RECIPES.map((r)=>{const rating=state.recipeRatings[r.name]||0;const image=RECIPE_IMAGES[r.name];return <div className="recipeCard" key={r.name}>{image&&<img className="recipeImage" src={assetUrl(`images/recipes/${image}`)} alt={r.name} onError={(event)=>{event.currentTarget.style.display="none"}}/>}<b>{r.name} <small>Lv{r.level}</small> {rating===3&&<em className="bestBadge">BEST!</em>}</b><div className="starRating" aria-label={`${rating}つ星`}>{"★".repeat(rating)}{"☆".repeat(3-rating)}</div><p className="recipeReward">🪙{r.price.toLocaleString()} / ⭐{r.exp}</p><div className="ingredientsText">{Object.entries(r.ingredients).map(([k,n])=><span key={k}>{MATERIAL_KIDS_NAME[k]} {state.materials[k]}/{n}</span>)}</div><button className="makeButton" onClick={()=>craft(r)}>{state.level<r.level?`Lv${r.level}で解放`:"つくる"}</button></div>})}</section>}
      {activeTab==="deco" && <section className="screen cardGrid">{DECORATIONS.map((decoration)=>{const owned=state.decorations.includes(decoration.id);const equipped=state.equippedDecoration===decoration.id;return <div className="card shopItem" key={decoration.id}><span className="shopIcon">{decoration.icon}</span><h2>{decoration.name}</h2><p>🪙 {decoration.price.toLocaleString()}</p><button className="buyButton" disabled={equipped} onClick={()=>shopDecoration(decoration)}>{equipped?"装備中":owned?"装備する":"購入する"}</button></div>})}</section>}
      {activeTab==="staff" && <section className="screen cardGrid">{STAFF.map((member)=>{const hired=state.staff.includes(member.id);return <div className="card shopItem" key={member.id}><span className="shopIcon">👤</span><h2>{member.name}</h2><p>{member.effect}</p><p>🪙 {member.price.toLocaleString()}</p><button className="buyButton" disabled={hired} onClick={()=>recruit(member)}>{hired?"雇用済み":"雇う"}</button></div>})}</section>}
    </section>
    <aside className="sidePanel orderPanel"><h2>本日のオーダー</h2>{state.customerQueue.length ? state.customerQueue.map((customer)=><div className={`orderRow status-${customer.status}`} key={customer.id}><img className="customerAvatar" src={assetUrl(customer.avatarPath)} alt=""/><strong>{customer.name} {"♥".repeat(customer.hearts)}</strong><span>{customer.orderRecipe}</span><small>{customer.status === "waiting" ? `あと${customer.timeRemaining}秒` : customer.status === "special" ? "大満足！" : customer.status === "fulfilled" ? "お渡し済み" : "時間切れ"}</small></div>) : <p className="emptyNote">営業前です。準備を整えましょう。</p>}</aside>
  </main><div className="miruPanel"><img className="miruAvatar" src={MIRU_IMAGES[miruMood]} alt="ミル"/><div><strong>AI助手 ミル</strong><p>{getMiruMessage(state)}</p></div></div><div className="salesPanel"><span>Day {state.dayNumber}・本日の売上</span><strong>🪙 {state.todaySales.toLocaleString()}</strong><span>目標 {state.todaySalesGoal.toLocaleString()}</span></div>{state.dayPhase === "prep" && <button className="startButton" onClick={beginBusiness}>営業スタート！</button>}</div>
  <nav className="bottomNav">{tabs.map((tab)=><button key={tab.id} className={activeTab===tab.id?"navItem active":"navItem"} onClick={()=>setActiveTab(tab.id)}><span>{tab.icon}</span><span>{tab.label}</span></button>)}</nav>
  {toast && <div className="toast">{toast}</div>}
  {state.dayPhase === "report" && <div className="reportOverlay"><div className="reportCard"><h2>📊 今日の営業結果</h2><p>Day {state.dayNumber}</p><div className="reportGrid"><span>売上</span><strong>{state.todaySales.toLocaleString()}コイン</strong><span>対応注文</span><strong>{state.dailyStats.filledOrders}件</strong><span>満足客</span><strong>{state.dailyStats.satisfiedCustomers}名</strong><span>大成功</span><strong>{state.dailyStats.greatCount}回</strong></div><h3>ミッション</h3>{state.missions.map((mission)=><p key={mission.id}>{mission.completed ? "✅" : "⬜"} {mission.description}</p>)}<button className="primaryButton" onClick={advanceDay}>次の日へ ➡</button></div></div>}
  {state.gamePhase === "ending" && <div className="endingOverlay"><div className="card">{miffy("happy")} {ENDING_LINES.map((l)=><p key={l}>{l}</p>)}<p>最終レベル: {state.level}</p><p>最終所持金: {state.money.toLocaleString()}P</p><p>作ったケーキ数: {state.craftCount}</p><p>成功回数: {state.successCount}</p><p>大成功回数: {state.greatSuccessCount}</p><p>失敗回数: {state.failCount}</p><p>素材購入回数: {state.buyCount}</p><div className="row"><button className="primaryButton" onClick={reset}>もういちどあそぶ</button><button className="secondaryButton" onClick={()=>setState((s)=>({...s,gamePhase:"playing"}))}>つづけてあそぶ</button></div></div></div>}
  </div>;
}
