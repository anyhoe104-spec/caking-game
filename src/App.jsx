import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { loadSave as loadStoredSave, saveGame, defaultSave as createDefaultSave, STORAGE_KEY as SAVE_KEY } from "./game/storage.js";
import { startBusiness as openBusiness, tickBusiness, nextDay as advanceDay, formatTimer } from "./game/business.js";
import { generateCustomerQueue, fulfillOrder } from "./game/customers.js";
import { generateMissions, applyMissionProgress } from "./game/missions.js";
import { rollCraftResult, applyExperience, calcPoints } from "./game/logic.js";
import { DECORATIONS, STAFF, buyDecoration, equipDecoration, hireStaff, getStaffEffects } from "./game/shop.js";
import { updateRecipeRating, getMiruMessage } from "./game/engagement.js";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const REGEN_MS = 5000;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const ENDING_LEVEL = 10;
const ENDING_MONEY = 100_000;

const B = import.meta.env.BASE_URL; // "/caking-game/" in prod, "/" in dev

const SOUNDS = {
  tap:     `${B}sounds/tap.mp3`,
  buy:     `${B}sounds/buy.mp3`,
  success: `${B}sounds/success.mp3`,
  great:   `${B}sounds/great.mp3`,
  error:   `${B}sounds/error.mp3`,
  levelup: `${B}sounds/levelup.mp3`,
  unlock:  `${B}sounds/unlock.mp3`,
};
const BGMS = {
  opening: `${B}sounds/opening-theme.mp3`,
  playing: `${B}sounds/shop-bgm.mp3`,
  ending:  `${B}sounds/ending-theme.mp3`,
};
const MIFFY_IMG = {
  normal:  `${B}images/characters/miffy-normal.png`,
  happy:   `${B}images/characters/miffy-happy.png`,
  sad:     `${B}images/characters/miffy-sad.png`,
  excited: `${B}images/characters/miffy-excited.png`,
  working: `${B}images/characters/miffy-working.png`,
};

// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────
const MAT_LABEL = { egg:"卵", cream:"生クリーム", strawberry:"いちご", flour:"小麦粉", sugar:"砂糖", milk:"牛乳", butter:"バター" };
const MAT_ICON  = { egg:"🥚", cream:"🍦", strawberry:"🍓", flour:"🌾", sugar:"✨", milk:"🥛", butter:"🧈" };
const LV_CAP    = {1:10,2:12,3:14,4:16,5:18,6:20,7:22,8:24,9:27,10:30};

const RECIPES = [
  { name:"ショートケーキ",     lv:1,  price:700,  exp:22,  icon:"🍰", ing:{ egg:3, cream:3, strawberry:3, flour:2, sugar:2 } },
  { name:"プリン",             lv:2,  price:450,  exp:14,  icon:"🍮", ing:{ egg:2, milk:3, sugar:2 } },
  { name:"イチゴタルト",       lv:3,  price:1000, exp:36,  icon:"🥧", ing:{ egg:5, sugar:5, strawberry:2, flour:3, butter:3 } },
  { name:"チョコケーキ",       lv:4,  price:1200, exp:42,  icon:"🎂", ing:{ egg:3, flour:3, sugar:3, milk:2, butter:2 } },
  { name:"ミルフィーユ",       lv:5,  price:1500, exp:60,  icon:"🥐", ing:{ flour:5, butter:5, cream:4, sugar:3, strawberry:2 } },
  { name:"フルーツパイ",       lv:6,  price:1800, exp:70,  icon:"🥧", ing:{ flour:5, butter:4, strawberry:4, sugar:4, cream:2 } },
  { name:"デコレーションケーキ", lv:10, price:3000, exp:125, icon:"🎂", ing:{ egg:6, cream:6, strawberry:6, flour:4, sugar:4, butter:2 } },
  { name:"王様のケーキ",       lv:10, price:3600, exp:150, icon:"👑", ing:{ egg:6, cream:6, strawberry:5, flour:5, sugar:5, butter:4 } },
];


const OPENING_LINES = [
  "ここは、海風のかおる小さな港町。",
  "猫耳の女の子ミフィは、ご主人様から古いケーキ店を任されました。",
  "「ミフィ、このお店をきみに任せる。町のみんなを笑顔にするケーキを作っておくれ」",
  "「はい、ご主人様！ ミフィ、がんばります！」",
  "失敗したり、大成功したりしながら、少しずつお店を大きくしていきます。",
  "目標は、職人レベル10、所持金100,000P。町いちばんの繁盛店を目指しましょう！",
];
const ENDING_LINES = [
  "港町の小さなケーキ店は、毎日お客さんでいっぱいのお店になりました。",
  "ミフィのケーキを食べた人たちは、みんな笑顔になりました。",
  "「よくがんばったね、ミフィ。このお店は、もう立派な繁盛店だ」",
  "「ありがとうございます、ご主人様！ ミフィ、もっともっとおいしいケーキを作ります！」",
  "CAKING！ 繁盛店達成！",
];

// ─────────────────────────────────────────────
// Miffy messages (as employee)
// ─────────────────────────────────────────────
const IDLE_MSGS = [
  "今日もよろしくお願いします！",
  "いつでも準備OKです！",
  "頑張って作ります！",
];

function getMiffyMsg(state, lastResult, lastRecipe) {
  if (lastResult === "great") return `大成功でした！ありがとうございます！✨`;
  if (lastResult === "fail")  return "すみません、失敗しました…次は頑張ります！";
  if (lastResult === "success" && lastRecipe) return `${lastRecipe}、完成しました！`;
  const low = Object.entries(state.materials).filter(([,v]) => v < 2);
  if (low.length > 0) return `${MAT_LABEL[low[0][0]]}の在庫が少ないです！補充をお願いします`;
  if (state.dayPhase === "prep" && state.dayNumber === 1) return "はじめまして！ミフィです。よろしくお願いします！";
  if (state.dayPhase === "prep") return `準備ができました。${state.dayNumber}日目も頑張ります！`;
  return IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)];
}

const capByLv = (lv) => LV_CAP[Math.min(10, Math.max(1, lv))] ?? 30;

// ─────────────────────────────────────────────
// Audio
// ─────────────────────────────────────────────
function playAudio(path, enabled, volume = 0.28, loop = false) {
  if (!enabled) return null;
  try {
    const a = new Audio(path);
    a.volume = volume;
    a.loop = loop;
    a.play().catch(() => {});
    return a;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function CharImg({ mood = "normal", className = "" }) {
  const [err, setErr] = useState(false);
  const fallback = { normal:"🐱", happy:"😸", sad:"🙀", excited:"😻", working:"🐱" }[mood] ?? "🐱";
  if (err) return <span className={`charFallback ${className}`}>{fallback}</span>;
  return <img src={MIFFY_IMG[mood]} alt="ミフィ" className={`charImg ${className}`} onError={() => setErr(true)} loading="lazy" />;
}

function Stars({ rating = 0 }) {
  return (
    <div className="stars">
      {[1,2,3].map((i) => (
        <span key={i} className={i <= rating ? "star on" : "star"}> ★</span>
      ))}
      {rating >= 3 && <span className="bestBadge">BEST!</span>}
    </div>
  );
}

function MissionRow({ m }) {
  const pct = Math.min(100, (m.current / m.target) * 100);
  return (
    <div className={`missionRow ${m.completed ? "done" : ""}`}>
      <div className="missionHead">
        <span>{m.icon}</span>
        <span className="missionDesc">{m.description}</span>
        {m.completed && <span className="missionCheck">✓</span>}
      </div>
      <div className="missionBar">
        <div className="missionFill" style={{ width: `${pct}%` }} />
        <span className="missionCount">{m.current}/{m.target}</span>
      </div>
    </div>
  );
}

function OrderRow({ c }) {
  const recipe = RECIPES.find((r) => r.name === c.order);
  const timePct = c.status === "waiting" ? Math.min(100, (c.timeRemaining / c.tl) * 100) : 0;
  const urgent = c.status === "waiting" && c.timeRemaining < 30;
  const statusIcon = { fulfilled:"✅", special:"⭐", expired:"❌", waiting:"" }[c.status];
  return (
    <div className={`orderRow ${c.status}`}>
      <span className="cEmoji">{c.avatarPath ? <img src={`${B}${c.avatarPath}`} alt="" className="customerAvatar" /> : c.emoji}</span>
      <div className="orderInfo">
        <div className="cName">{c.name}</div>
        <div className="cOrder">{recipe?.icon ?? "🍰"} {c.order}</div>
        {c.status === "waiting" && (
          <div className={`orderBar ${urgent ? "urgent" : ""}`}>
            <div className="orderFill" style={{ width: `${timePct}%` }} />
          </div>
        )}
      </div>
      <div className="orderRight">
        <span className="hearts">{"♡".repeat(c.hearts)}</span>
        {statusIcon && <span className="statusIcon">{statusIcon}</span>}
      </div>
    </div>
  );
}

function DailyReport({ state, onNext }) {
  const filled = state.customerQueue.filter((c) => c.status === "fulfilled" || c.status === "special").length;
  const special = state.customerQueue.filter((c) => c.status === "special").length;
  const done = state.missions.filter((m) => m.completed);
  const bonusPts = done.reduce((s,m) => s + (m.reward?.pts ?? 0), 0);
  const bonusMoney = done.reduce((s,m) => s + (m.reward?.money ?? 0), 0);
  return (
    <div className="overlay">
      <div className="reportCard card">
        <h2 className="reportTitle">📊 Day {state.dayNumber} 営業終了！</h2>
        <div className="reportSection">
          <div className="reportRow"><span>本日の売上</span><strong className={state.todaySales >= state.todaySalesGoal ? "green" : ""}>{state.todaySales.toLocaleString()} / {state.todaySalesGoal.toLocaleString()}P</strong></div>
          <div className="reportRow"><span>対応注文</span><strong>{filled}件</strong></div>
          <div className="reportRow"><span>大成功達成</span><strong>{special}回</strong></div>
        </div>
        <h3 className="subTitle">ミッション</h3>
        {state.missions.map((m) => (
          <div key={m.id} className={`reportMission ${m.completed ? "green" : ""}`}>
            <span>{m.icon} {m.description}</span>
            <strong>{m.completed ? "✅ 達成！" : `${m.current}/${m.target}`}</strong>
          </div>
        ))}
        {(bonusPts > 0 || bonusMoney > 0) && (
          <>
            <h3 className="subTitle">報酬</h3>
            <div className="rewardRow">
              {bonusPts > 0 && <span className="rewardChip">⭐ +{bonusPts}PT</span>}
              {bonusMoney > 0 && <span className="rewardChip">🪙 +{bonusMoney}P</span>}
            </div>
          </>
        )}
        <button className="primaryBtn reportNext" onClick={onNext}>次の日へ ➡</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(() => loadStoredSave());
  const [activeTab, setActiveTab] = useState(null); // null = home
  const [toast, setToast] = useState("");
  const [effect, setEffect] = useState("");
  const [miffyMood, setMiffyMood] = useState("normal");
  const [lastResult, setLastResult] = useState(null);
  const [lastRecipe, setLastRecipe] = useState("");
  const bgmRef = useRef(null);

  // ── Derived ──
  const matMax = capByLv(state.level);
  const expToNext = state.level * 50;
  const canMake = useCallback(
    (r) => Object.entries(r.ing).every(([k, n]) => (state.materials[k] ?? 0) >= n),
    [state.materials]
  );
  const recommended = (() => {
    const unlocked = RECIPES.filter((r) => r.lv <= state.level);
    const makeable = unlocked.filter((r) => canMake(r));
    return makeable.length > 0
      ? makeable.reduce((b, r) => (r.price > b.price ? r : b))
      : unlocked[unlocked.length - 1] ?? RECIPES[0];
  })();
  const timerDisp = (() => {
    return formatTimer(state.businessTimer);
  })();

  // ── Persistence ──
  useEffect(() => {
    try { saveGame(state); } catch { /* storage may be unavailable */ }
  }, [state]);

  // ── Material regen ──
  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => ({
        ...s,
        materials: Object.fromEntries(
          Object.entries(s.materials).map(([k, v]) => [k, Math.min(capByLv(s.level), v + 1)])
        ),
      }));
    }, REGEN_MS);
    return () => clearInterval(t);
  }, []);

  // ── BGM ──
  useEffect(() => {
    bgmRef.current?.pause();
    bgmRef.current = null;
    const key = state.gamePhase === "ending" ? "ending" : state.gamePhase === "opening" ? "opening" : "playing";
    if (state.bgmOn) bgmRef.current = playAudio(BGMS[key], true, 0.2, true);
  }, [state.gamePhase, state.bgmOn]);

  // ── Business timer ──
  useEffect(() => {
    if (state.dayPhase !== "open") return;
    const id = setInterval(() => {
      setState((s) => tickBusiness(s));
    }, 1000);
    return () => clearInterval(id);
  }, [state.dayPhase]);

  // ── Helpers ──
  const sfx = useCallback((key) => playAudio(SOUNDS[key], state.soundOn), [state.soundOn]);
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }, []);
  const triggerEffect = useCallback((name) => {
    setEffect(name);
    setTimeout(() => setEffect(""), 800);
  }, []);
  const setMood = useCallback((mood, delay = 2000) => {
    setMiffyMood(mood);
    setTimeout(() => setMiffyMood("normal"), delay);
  }, []);

  // ── Actions ──
  const startBusiness = useCallback(() => {
    sfx("tap");
    const queue = generateCustomerQueue(state.level, state.dayNumber);
    const missions = state.missions.length > 0
      ? state.missions
      : generateMissions(state.level, state.dayNumber);
    setState((s) => openBusiness({ ...s, missions }, queue));
    setMood("excited");
    setActiveTab(null); // home view
  }, [sfx, state.level, state.dayNumber, state.missions, setMood]);

  const goNextDay = useCallback(() => {
    setState((s) => advanceDay(s, generateMissions(s.level, s.dayNumber + 1)));
    setLastResult(null);
    setMiffyMood("normal");
  }, []);

  const craft = useCallback((recipe) => {
    if (state.level < recipe.lv) { sfx("error"); showToast(`Lv${recipe.lv}で解放されます`); return; }
    if (!canMake(recipe)) { sfx("error"); showToast("素材が足りません！"); setMood("sad"); return; }

    const result = rollCraftResult(state.level, Math.random());

    // consume materials
    const mats = { ...state.materials };
    Object.entries(recipe.ing).forEach(([k, n]) => {
      mats[k] = Math.max(0, mats[k] - (result === "fail" ? Math.max(1, Math.floor(n * 0.5)) : n));
    });

    // gains
    let money = 0, exp = 0;
    if (result === "success") { money = recipe.price; exp = recipe.exp; }
    if (result === "great")   { money = Math.floor(recipe.price * 1.5); exp = Math.floor(recipe.exp * 1.5); }
    if (result === "fail")    { exp = Math.max(1, Math.floor(recipe.exp * 0.2)); }

    // level up
    const experience = applyExperience(state.exp, state.level, exp);
    const { exp: nextExp, level: lv, levelUps: lvUps } = experience;

    // customer matching
    const orderResult = state.dayPhase === "open"
      ? fulfillOrder(state.customerQueue, recipe.name, result)
      : { queue: state.customerQueue, customer: null, moneyBonus: 0 };
    const queue = orderResult.queue;
    const cBonus = { money: orderResult.moneyBonus, pts: orderResult.customer ? calcPoints(result, { exp: 0 }, orderResult.customer) : 0 };

    // today sales
    const newSales = state.todaySales + money + cBonus.money;
    const ratings = updateRecipeRating(state.recipeRatings, recipe.name, result);

    // SE & FX
    if (result === "great") { sfx("great"); triggerEffect("sparkle"); setMood("happy"); }
    else if (result === "success") { sfx("success"); setMood("working"); }
    else { sfx("error"); triggerEffect("smoke"); setMood("sad"); }
    if (lvUps > 0) { sfx("levelup"); triggerEffect("levelup"); }

    setLastResult(result);
    setLastRecipe(recipe.name);
    const earnedTotal = money + cBonus.money;
    showToast(
      result === "great"   ? `⭐ 大成功！ +${earnedTotal}P` :
      result === "success" ? `✅ できた！ +${earnedTotal}P` :
      "😿 失敗…でも経験になったよ！"
    );

    setState((s) => {
      const staffEffects = getStaffEffects(s.staff ?? []);
      let next = {
      ...s,
      materials: mats,
      money: s.money + Math.floor((money + cBonus.money) * staffEffects.salesMultiplier),
      exp: nextExp,
      level: lv,
      totalPoints: s.totalPoints + Math.floor((calcPoints(result, recipe) + cBonus.pts) * staffEffects.pointsMultiplier),
      craftCount: s.craftCount + 1,
      successCount: s.successCount + (result === "success" ? 1 : 0),
      greatSuccessCount: s.greatSuccessCount + (result === "great" ? 1 : 0),
      failCount: s.failCount + (result === "fail" ? 1 : 0),
      levelUpCount: s.levelUpCount + lvUps,
      todaySales: newSales,
      customerQueue: queue,
      recipeRatings: ratings,
      lastEvent: { type: result, recipe: recipe.name },
      };
      next = applyMissionProgress(next, "craft_recipe");
      if (state.dayPhase === "open" && orderResult.fulfilled) next = applyMissionProgress(next, "satisfy_customers");
      if (state.dayPhase === "open" && result === "great") next = applyMissionProgress(next, "special_orders");
      if (state.dayPhase === "open") next = applyMissionProgress(next, "reach_sales", newSales, true);
      if (next.level >= ENDING_LEVEL && next.money >= ENDING_MONEY && !next.endingReached) {
        next = { ...next, gamePhase: "ending", endingReached: true };
      }
      return next;
    });
  }, [state, sfx, showToast, triggerEffect, canMake, setMood]);

  const buyMat = useCallback((key) => {
    if (state.money < BUY_COST) { sfx("error"); showToast("コインが足りません！"); return; }
    if ((state.materials[key] ?? 0) >= matMax) { sfx("error"); showToast("もういっぱい！"); return; }
    sfx("buy");
    setState((s) => applyMissionProgress({
      ...s,
      money: s.money - BUY_COST,
      buyCount: s.buyCount + 1,
      materials: { ...s.materials, [key]: Math.min(matMax, s.materials[key] + BUY_AMOUNT) },
    }, "buy_materials"));
    showToast(`${MAT_LABEL[key]} +${BUY_AMOUNT}`);
  }, [state, sfx, showToast, matMax]);

  const purchaseDecoration = useCallback((decoration) => {
    setState((s) => buyDecoration(s, decoration));
  }, []);

  const selectDecoration = useCallback((id) => {
    setState((s) => equipDecoration(s, id));
  }, []);

  const recruitStaff = useCallback((member) => {
    setState((s) => hireStaff(s, member));
  }, []);

  const reset = useCallback(() => {
    if (!window.confirm("はじめからにしますか？")) return;
    localStorage.removeItem(SAVE_KEY);
    const d = createDefaultSave();
    setState(d);
    setActiveTab(null);
    setLastResult(null);
    setMiffyMood("normal");
  }, []);

  const nav = useCallback((tab) => {
    sfx("tap");
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, [sfx]);

  const miffyMsg = getMiffyMsg(state, lastResult, lastRecipe);
  const miruMsg = getMiruMessage(state);

  // ── OPENING SCENE ──
  if (state.gamePhase === "opening") {
    return (
      <div className="sceneWrap">
        <div className="sceneCard card">
          <CharImg mood="normal" className="sceneChar" />
          <p className="sceneText">{OPENING_LINES[state.openingIndex]}</p>
          <button
            className="primaryBtn"
            onClick={() => {
              sfx("tap");
              if (state.openingIndex < OPENING_LINES.length - 1) {
                setState((s) => ({ ...s, openingIndex: s.openingIndex + 1 }));
              } else {
                setState((s) => ({ ...s, gamePhase: "playing", missions: generateMissions(s.level, s.dayNumber) }));
              }
            }}
          >
            {state.openingIndex < OPENING_LINES.length - 1 ? "つぎへ ▶" : "お店をはじめる 🍰"}
          </button>
        </div>
      </div>
    );
  }

  // ── ENDING SCENE ──
  if (state.gamePhase === "ending") {
    return (
      <div className="sceneWrap endingScene">
        <div className="sceneCard card">
          <CharImg mood="happy" className="sceneChar" />
          {ENDING_LINES.map((l) => <p key={l} className="sceneText small">{l}</p>)}
          <div className="endingStats">
            <div>最終Lv：{state.level}</div>
            <div>所持金：{state.money.toLocaleString()}P</div>
            <div>累計PT：{state.totalPoints.toLocaleString()}</div>
            <div>大成功：{state.greatSuccessCount}回</div>
          </div>
          <div className="rowGap">
            <button className="primaryBtn" onClick={reset}>もういちどあそぶ</button>
            <button className="secondaryBtn" onClick={() => setState((s) => ({ ...s, gamePhase: "playing" }))}>つづける</button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN GAME ──
  return (
    <div className={`phoneStage ${effect ? `fx-${effect}` : ""}`}>
      <div className="appShell">

        {/* ── Header ── */}
        <header className="appHeader">
          <button className="brandBtn" onClick={() => { sfx("tap"); setActiveTab(null); }}>
            CAKING!
          </button>
          <div className="headerStats">
            <div className="statChip">
              <span>🪙</span>
              <span className="statVal">{state.money.toLocaleString()}</span>
            </div>
            <div className="statChip">
              <span>⭐</span>
              <span className="statVal">{state.totalPoints.toLocaleString()}<span className="statSub"> Lv{state.level}</span></span>
            </div>
            {state.dayPhase === "open" && (
              <div className={`statChip timerChip ${state.businessTimer < 30 ? "timerUrgent" : ""}`}>
                <span>⏰</span>
                <span className="statVal">{timerDisp}</span>
              </div>
            )}
          </div>
          <div className="headerBtns">
            <button className="iconBtn" onClick={() => setState((s) => ({ ...s, soundOn: !s.soundOn }))}>{state.soundOn ? "🔊" : "🔇"}</button>
            <button className="iconBtn" onClick={() => setState((s) => ({ ...s, bgmOn: !s.bgmOn }))}>{state.bgmOn ? "🎵" : "🔕"}</button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="mainContent">

          {/* HOME VIEW */}
          {activeTab === null && (
            <div className="homeView">

              {/* ミフィパネル */}
              <div className="miffyPanel">
                <CharImg mood={miffyMood} className="miffyChar" />
                <div className="miffyBubble">
                  <div className="miffyName">ミフィ</div>
                  <div className="miffyMsg">{miffyMsg}</div>
                </div>
              </div>

              <div className="miruPanel card">
                <img src={`${B}images/characters/miru-${state.lastEvent?.type === "great" ? "happy" : state.lastEvent?.type === "fail" ? "thinking" : "normal"}.png`} alt="案内役のミル" className="miruAvatar" />
                <div><strong>ミル</strong><p>{miruMsg}</p></div>
              </div>

              {/* おすすめレシピ */}
              <div className="recoCrd card">
                <div className="recoTop">
                  <span className="recoIcon">{recommended.icon}</span>
                  <div>
                    <div className="recoName">{recommended.name}</div>
                    <Stars rating={state.recipeRatings[recommended.name] ?? 0} />
                    <div className="recoMeta">+{recommended.price}P / +{recommended.exp}EXP</div>
                  </div>
                </div>
                <div className="expRow">
                  <span className="expLabel">EXP {state.exp}/{expToNext}</span>
                  <div className="expBar"><div className="expFill" style={{ width: `${Math.min(100,(state.exp/expToNext)*100)}%` }} /></div>
                </div>
              </div>

              {/* 本日の売上（営業中のみ） */}
              {state.dayPhase === "open" && (
                <div className="salesPanel card">
                  <span className="salesLabel">本日の売上</span>
                  <span className="salesVal">🪙 {state.todaySales.toLocaleString()}</span>
                  <span className="salesGoal">目標：{state.todaySalesGoal.toLocaleString()}P</span>
                  <div className="salesBar">
                    <div className="salesFill" style={{ width: `${Math.min(100,(state.todaySales/state.todaySalesGoal)*100)}%` }} />
                  </div>
                </div>
              )}

              {/* 今日の目標 */}
              <div className="panelCard card">
                <div className="panelTitle">今日の目標</div>
                {state.missions.length > 0
                  ? state.missions.map((m) => <MissionRow key={m.id} m={m} />)
                  : <p className="panelEmpty">営業スタートでミッションが始まります</p>
                }
              </div>

              {/* 本日のオーダー */}
              <div className="panelCard card">
                <div className="panelTitle">本日のオーダー</div>
                {state.customerQueue.length > 0
                  ? state.customerQueue.map((c) => <OrderRow key={c.uid} c={c} />)
                  : <p className="panelEmpty">営業スタートでお客様が来ます</p>
                }
              </div>

            </div>
          )}

          {/* RECIPE TAB */}
          {activeTab === "recipe" && (
            <div className="tabView">
              <div className="tabHeader"><h2>レシピ</h2><p>不足素材は赤く表示</p></div>
              <div className="recipeList">
                {RECIPES.map((r) => {
                  const locked = state.level < r.lv;
                  const ok = !locked && canMake(r);
                  return (
                    <article key={r.name} className={`recipeCard ${locked ? "locked" : ""} ${!locked && !ok ? "missing" : ""}`}>
                      <span className="rIcon">{r.icon}</span>
                      <div className="rInfo">
                        <div className="rName">{r.name}</div>
                        <Stars rating={state.recipeRatings[r.name] ?? 0} />
                        <div className="rMeta">
                          <span className="tag">Lv{r.lv}</span>
                          <span className="tag gold">+{r.price}P</span>
                          <span className="tag pink">+{r.exp}EXP</span>
                        </div>
                        <div className="ingList">
                          {Object.entries(r.ing).map(([k, n]) => {
                            const have = state.materials[k] ?? 0;
                            return (
                              <span key={k} className={`ingChip ${have < n ? "lack" : ""}`}>
                                {MAT_ICON[k]} {have}/{n}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        className={`makeBtn ${ok ? "makeBtn--ok" : ""}`}
                        onClick={() => { sfx("tap"); craft(r); }}
                        disabled={locked}
                      >
                        {locked ? `Lv${r.lv}で解放` : ok ? "つくる" : "素材不足"}
                      </button>
                      {locked && <div className="lockBadge">🔒 Lv{r.lv}</div>}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* MATERIAL TAB */}
          {activeTab === "material" && (
            <div className="tabView">
              <div className="tabHeader"><h2>食材</h2><p>5秒ごと回復 / 上限 {matMax}</p></div>
              <div className="matGrid">
                {Object.entries(state.materials).map(([k, v]) => (
                  <div key={k} className={`matCard ${v >= matMax ? "full" : ""}`}>
                    <span className="mIcon">{MAT_ICON[k]}</span>
                    <div className="mName">{MAT_LABEL[k]}</div>
                    <div className="mStock"><span className={v >= matMax ? "maxVal" : ""}>{v}</span>/{matMax}</div>
                    <button className="buyBtn" onClick={() => buyMat(k)}>
                      +{BUY_AMOUNT}<br /><span className="buyCost">{BUY_COST}P</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHOP TAB */}
          {activeTab === "shop" && (
            <div className="tabView">
              <div className="tabHeader"><h2>ショップ</h2></div>
              <div className="card shopCard">
                {[
                  ["レベル",   `Lv${state.level}`],
                  ["所持金",   `${state.money.toLocaleString()}P`],
                  ["累計PT",   `${state.totalPoints.toLocaleString()}pt`],
                  ["営業日数", `${state.dayNumber}日目`],
                  ["作成数",   `${state.craftCount}個`],
                  ["大成功",   `${state.greatSuccessCount}回`],
                  ["失敗",     `${state.failCount}回`],
                ].map(([l, v]) => (
                  <div key={l} className="shopRow"><span>{l}</span><strong>{v}</strong></div>
                ))}
              </div>
              <div className="centerRow">
                <button className="dangerBtn" onClick={reset}>はじめから</button>
              </div>
            </div>
          )}

          {/* DECO TAB */}
          {activeTab === "deco" && (
            <div className="tabView">
              <div className="tabHeader"><h2>デコレーション</h2></div>
              <div className="upgradeGrid">{DECORATIONS.map((item) => {
                const owned = (state.decorations ?? []).includes(item.id);
                const equipped = state.equippedDecoration === item.id;
                return <article className="upgradeCard card" key={item.id}><span>{item.icon}</span><strong>{item.name}</strong><small>{item.price.toLocaleString()}P</small><button className="buyBtn" disabled={equipped || (!owned && state.money < item.price)} onClick={() => owned ? selectDecoration(item.id) : purchaseDecoration(item)}>{equipped ? "装備中" : owned ? "装備する" : "購入"}</button></article>;
              })}</div>
            </div>
          )}

          {/* STAFF TAB */}
          {activeTab === "staff" && (
            <div className="tabView">
              <div className="tabHeader"><h2>スタッフ</h2></div>
              <div className="upgradeGrid">{STAFF.map((member) => {
                const hired = (state.staff ?? []).includes(member.id);
                return <article className="upgradeCard card" key={member.id}><span>👤</span><strong>{member.name}</strong><small>{member.effect}</small><small>{member.price.toLocaleString()}P</small><button className="buyBtn" disabled={hired || state.money < member.price} onClick={() => recruitStaff(member)}>{hired ? "雇用済み" : "雇用する"}</button></article>;
              })}</div>
            </div>
          )}

        </main>
      </div>

      {/* ── Bottom Navigation ── */}
      <nav className="bottomNav">
        {[
          { id:"shop",     label:"ショップ",       icon:"🏪" },
          { id:"recipe",   label:"レシピ",         icon:"📖" },
          { id:"deco",     label:"デコレーション",  icon:"🎀" },
          { id:"material", label:"食材",           icon:"🍓" },
          { id:"staff",    label:"スタッフ",        icon:"👤" },
        ].map(({ id, label, icon }) => (
          <button key={id} className={`navItem ${activeTab === id ? "active" : ""}`} onClick={() => nav(id)}>
            <span className="navIcon">{icon}</span>
            <span className="navLabel">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Start Button (prep phase only) ── */}
      {state.dayPhase === "prep" && (
        <button className="startBtn" onClick={startBusiness}>
          🍰 営業スタート！
        </button>
      )}

      {/* ── Toast ── */}
      {toast && <div className="toast" role="status">{toast}</div>}

      {/* ── Daily Report ── */}
      {state.dayPhase === "report" && <DailyReport state={state} onNext={goNextDay} />}
    </div>
  );
}
