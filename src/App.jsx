import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STORAGE_KEY = "caking-save-v3";
const REGEN_MS = 5000;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const ENDING_LEVEL = 10;
const ENDING_MONEY = 100_000;
const BUSINESS_DURATION = 180; // 3分

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
const BASE_MATS = { egg:5, cream:5, strawberry:5, flour:5, sugar:5, milk:5, butter:5 };
const MAT_LABEL = { egg:"卵", cream:"生クリーム", strawberry:"いちご", flour:"小麦粉", sugar:"砂糖", milk:"牛乳", butter:"バター" };
const MAT_ICON  = { egg:"🥚", cream:"🍦", strawberry:"🍓", flour:"🌾", sugar:"✨", milk:"🥛", butter:"🧈" };
const MAT_KIDS  = { egg:"たまご", cream:"くりーむ", strawberry:"いちご", flour:"こむぎこ", sugar:"さとう", milk:"ぎゅうにゅう", butter:"ばたー" };
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

const CUSTOMER_POOL = [
  { id:"sakura", name:"さくらさん",    emoji:"🌸", pref:["ショートケーキ","イチゴタルト"],    hearts:2, tl:120 },
  { id:"hiroto", name:"ひろとくん",    emoji:"👦", pref:["チョコケーキ","プリン"],            hearts:1, tl:90  },
  { id:"madame", name:"マダム・ローズ", emoji:"🌹", pref:["王様のケーキ","ミルフィーユ"],       hearts:3, tl:150 },
  { id:"gramps", name:"おじいちゃん",  emoji:"👴", pref:["プリン","ショートケーキ"],           hearts:1, tl:180 },
  { id:"michiru",name:"みちるちゃん",  emoji:"🎀", pref:["デコレーションケーキ","ショートケーキ"],hearts:2,tl:110 },
  { id:"kai",    name:"かいちゃん",    emoji:"👶", pref:["プリン","ショートケーキ"],            hearts:1, tl:100 },
  { id:"chef",   name:"シェフ田中",    emoji:"👨‍🍳", pref:["王様のケーキ","デコレーションケーキ"],  hearts:3, tl:120 },
  { id:"yui",    name:"ゆいさん",      emoji:"💼", pref:["ミルフィーユ","フルーツパイ"],         hearts:2, tl:100 },
  { id:"travel", name:"謎の旅人",      emoji:"🧙", pref:["王様のケーキ","フルーツパイ"],         hearts:3, tl:90  },
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
// Mission system
// ─────────────────────────────────────────────
const MISSION_DEFS = [
  {
    id: "satisfy",
    type: "satisfy_customers",
    icon: "❤️",
    desc: (n) => `お客さまを${n}人満足させよう`,
    target: (lv) => Math.max(3, 3 + Math.floor(lv * 1.5)),
    reward: () => ({ pts: 100 }),
  },
  {
    id: "sales",
    type: "reach_sales",
    icon: "🪙",
    desc: (n) => `売上を${n.toLocaleString()}P達成しよう`,
    target: (lv) => 3000 + lv * 2000,
    reward: (t) => ({ money: Math.floor(t * 0.05) }),
  },
  {
    id: "special",
    type: "special_orders",
    icon: "⭐",
    desc: (n) => `大成功を${n}回達成しよう`,
    target: (lv) => Math.max(1, Math.floor(lv / 3)),
    reward: () => ({ pts: 200 }),
  },
];

function genMissions(level) {
  return MISSION_DEFS.map((d) => {
    const t = d.target(level);
    return { id: d.id, type: d.type, icon: d.icon, description: d.desc(t), target: t, current: 0, reward: d.reward(t), completed: false };
  });
}

function advanceMission(missions, type, amount = 1) {
  return missions.map((m) => {
    if (m.type !== type || m.completed) return m;
    const next = Math.min(m.target, m.current + amount);
    return { ...m, current: next, completed: next >= m.target };
  });
}

// ─────────────────────────────────────────────
// Customer system
// ─────────────────────────────────────────────
let _uid = 0;
function genCustomers(level) {
  const count = Math.min(8, 3 + Math.floor(level / 2));
  const unlocked = RECIPES.filter((r) => r.lv <= level).map((r) => r.name);
  const pool = CUSTOMER_POOL.filter((c) => c.pref.some((p) => unlocked.includes(p)));
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return picked.map((c) => ({
    uid: `c${++_uid}`,
    ...c,
    order: c.pref.find((p) => unlocked.includes(p)) ?? unlocked[0],
    timeRemaining: c.tl,
    status: "waiting",
  }));
}

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

// ─────────────────────────────────────────────
// Storage / migration
// ─────────────────────────────────────────────
const capByLv = (lv) => LV_CAP[Math.min(10, Math.max(1, lv))] ?? 30;

function defaultSave() {
  return {
    _v: 3,
    gamePhase: "opening",
    dayPhase: "prep",
    dayNumber: 1,
    money: 1000,
    level: 1,
    exp: 0,
    materials: { ...BASE_MATS },
    craftCount: 0,
    successCount: 0,
    greatSuccessCount: 0,
    failCount: 0,
    buyCount: 0,
    levelUpCount: 0,
    totalPoints: 0,
    todaySales: 0,
    todaySalesGoal: 8000,
    businessTimer: 0,
    customerQueue: [],
    missions: [],
    recipeRatings: {},
    soundOn: true,
    bgmOn: true,
    endingReached: false,
    openingIndex: 0,
  };
}

function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw) return defaultSave();
    if (raw._v === 3) {
      // ensure materials keys
      return {
        ...defaultSave(),
        ...raw,
        materials: Object.fromEntries(
          Object.keys(BASE_MATS).map((k) => [k, Math.max(0, Math.floor(Number(raw.materials?.[k] ?? BASE_MATS[k])))])
        ),
        dayPhase: "prep",
        businessTimer: 0,
        customerQueue: raw.customerQueue ?? [],
        missions: raw.missions ?? [],
        recipeRatings: raw.recipeRatings ?? {},
      };
    }
    // migrate v2 → v3
    return {
      ...defaultSave(),
      gamePhase: raw.gamePhase ?? "playing",
      money: raw.money ?? 1000,
      level: raw.level ?? 1,
      exp: raw.exp ?? 0,
      materials: Object.fromEntries(
        Object.keys(BASE_MATS).map((k) => [k, Math.max(0, Math.floor(Number(raw.materials?.[k] ?? BASE_MATS[k])))])
      ),
      craftCount: raw.craftCount ?? 0,
      successCount: raw.successCount ?? 0,
      greatSuccessCount: raw.greatSuccessCount ?? 0,
      failCount: raw.failCount ?? 0,
      buyCount: raw.buyCount ?? 0,
      levelUpCount: raw.levelUpCount ?? 0,
      totalPoints: Math.floor((raw.successCount ?? 0) * 20 + (raw.greatSuccessCount ?? 0) * 30),
      soundOn: raw.soundOn ?? true,
      bgmOn: raw.bgmOn ?? true,
      endingReached: raw.endingReached ?? false,
      openingIndex: raw.openingIndex ?? 0,
    };
  } catch {
    return defaultSave();
  }
}

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
      <span className="cEmoji">{c.emoji}</span>
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
  const bootRef = useRef(null);
  if (!bootRef.current) bootRef.current = loadSave();

  const [state, setState] = useState(bootRef.current);
  const [activeTab, setActiveTab] = useState(null); // null = home
  const [toast, setToast] = useState("");
  const [effect, setEffect] = useState("");
  const [miffyMood, setMiffyMood] = useState("normal");
  const [lastResult, setLastResult] = useState(null);
  const [lastRecipe, setLastRecipe] = useState("");
  const [showReport, setShowReport] = useState(false);
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
    const m = Math.floor(state.businessTimer / 60);
    const s = state.businessTimer % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  })();

  // ── Persistence ──
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
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

  // ── Ending check ──
  useEffect(() => {
    if (state.gamePhase === "playing" && state.level >= ENDING_LEVEL && state.money >= ENDING_MONEY && !state.endingReached) {
      setState((s) => ({ ...s, gamePhase: "ending", endingReached: true }));
    }
  }, [state.level, state.money, state.gamePhase, state.endingReached]);

  // ── Business timer ──
  useEffect(() => {
    if (state.dayPhase !== "open") return;
    const id = setInterval(() => {
      setState((s) => {
        if (s.dayPhase !== "open") return s;
        // countdown customers
        const queue = s.customerQueue.map((c) => {
          if (c.status !== "waiting") return c;
          const rem = c.timeRemaining - 1;
          return rem <= 0 ? { ...c, timeRemaining: 0, status: "expired" } : { ...c, timeRemaining: rem };
        });
        const timer = s.businessTimer - 1;
        if (timer <= 0) return { ...s, dayPhase: "report", businessTimer: 0, customerQueue: queue };
        return { ...s, businessTimer: timer, customerQueue: queue };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.dayPhase]);

  // Show report when phase becomes "report"
  useEffect(() => {
    if (state.dayPhase === "report") setShowReport(true);
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
    const queue = genCustomers(state.level);
    const missions = state.missions.length > 0
      ? state.missions.map((m) => ({ ...m, current: 0, completed: false }))
      : genMissions(state.level);
    setState((s) => ({
      ...s,
      dayPhase: "open",
      businessTimer: BUSINESS_DURATION,
      todaySales: 0,
      customerQueue: queue,
      missions,
    }));
    setMood("excited");
    setActiveTab(null); // home view
  }, [sfx, state.level, state.missions, setMood]);

  const goNextDay = useCallback(() => {
    const done = state.missions.filter((m) => m.completed);
    const bonusPts = done.reduce((s, m) => s + (m.reward?.pts ?? 0), 0);
    const bonusMoney = done.reduce((s, m) => s + (m.reward?.money ?? 0), 0);
    setState((s) => ({
      ...s,
      dayPhase: "prep",
      dayNumber: s.dayNumber + 1,
      todaySalesGoal: 8000 + s.level * 2000,
      totalPoints: s.totalPoints + bonusPts,
      money: s.money + bonusMoney,
      missions: genMissions(s.level),
      customerQueue: [],
      businessTimer: 0,
    }));
    setShowReport(false);
    setLastResult(null);
    setMiffyMood("normal");
  }, [state.missions]);

  const craft = useCallback((recipe) => {
    if (state.level < recipe.lv) { sfx("error"); showToast(`Lv${recipe.lv}で解放されます`); return; }
    if (!canMake(recipe)) { sfx("error"); showToast("素材が足りません！"); setMood("sad"); return; }

    const pFail  = Math.max(0.03, 0.15 - (state.level - 1) * 0.012);
    const pGreat = Math.min(0.30, 0.10 + (state.level - 1) * 0.022);
    const roll = Math.random();
    const result = roll < pFail ? "fail" : roll < pFail + pGreat ? "great" : "success";

    // consume materials
    const mats = { ...state.materials };
    Object.entries(recipe.ing).forEach(([k, n]) => {
      mats[k] = Math.max(0, mats[k] - (result === "fail" ? Math.max(1, Math.floor(n * 0.5)) : n));
    });

    // gains
    let money = 0, exp = 0, pts = 0;
    if (result === "success") { money = recipe.price;                     exp = recipe.exp;                     pts = recipe.exp; }
    if (result === "great")   { money = Math.floor(recipe.price * 1.5);   exp = Math.floor(recipe.exp * 1.5);   pts = Math.floor(recipe.exp * 2); }
    if (result === "fail")    { money = 0;                                 exp = Math.max(1, Math.floor(recipe.exp * 0.2)); pts = 1; }

    // level up
    let nextExp = state.exp + exp, lv = state.level, lvUps = 0;
    while (nextExp >= lv * 50 && lv < 99) { nextExp -= lv * 50; lv++; lvUps++; }

    // customer matching
    let queue = [...state.customerQueue];
    let cBonus = { money: 0, pts: 0 };
    if (state.dayPhase === "open" && result !== "fail") {
      const idx = queue.findIndex((c) => c.status === "waiting" && c.order === recipe.name);
      if (idx !== -1) {
        const c = queue[idx];
        const ns = result === "great" ? "special" : "fulfilled";
        queue[idx] = { ...c, status: ns };
        cBonus = { money: c.hearts * (ns === "special" ? 200 : 100), pts: c.hearts * (ns === "special" ? 20 : 10) };
      }
    }

    // missions
    let missions = [...state.missions];
    if (state.dayPhase === "open") {
      if (result !== "fail") missions = advanceMission(missions, "satisfy_customers");
      if (result === "great") missions = advanceMission(missions, "special_orders");
    }

    // today sales
    const newSales = state.todaySales + money + cBonus.money;
    if (state.dayPhase === "open") {
      missions = missions.map((m) =>
        m.type === "reach_sales" && !m.completed
          ? { ...m, current: Math.min(m.target, newSales), completed: newSales >= m.target }
          : m
      );
    }

    // recipe rating
    const ratings = { ...state.recipeRatings };
    if (result === "great") ratings[recipe.name] = Math.min(3, (ratings[recipe.name] ?? 0) + 1);

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

    setState((s) => ({
      ...s,
      materials: mats,
      money: s.money + money + cBonus.money,
      exp: nextExp,
      level: lv,
      totalPoints: s.totalPoints + pts + cBonus.pts,
      craftCount: s.craftCount + 1,
      successCount: s.successCount + (result === "success" ? 1 : 0),
      greatSuccessCount: s.greatSuccessCount + (result === "great" ? 1 : 0),
      failCount: s.failCount + (result === "fail" ? 1 : 0),
      levelUpCount: s.levelUpCount + lvUps,
      todaySales: newSales,
      customerQueue: queue,
      missions,
      recipeRatings: ratings,
    }));
  }, [state, sfx, showToast, triggerEffect, canMake, setMood]);

  const buyMat = useCallback((key) => {
    if (state.money < BUY_COST) { sfx("error"); showToast("コインが足りません！"); return; }
    if ((state.materials[key] ?? 0) >= matMax) { sfx("error"); showToast("もういっぱい！"); return; }
    sfx("buy");
    setState((s) => ({
      ...s,
      money: s.money - BUY_COST,
      buyCount: s.buyCount + 1,
      materials: { ...s.materials, [key]: Math.min(matMax, s.materials[key] + BUY_AMOUNT) },
    }));
    showToast(`${MAT_LABEL[key]} +${BUY_AMOUNT}`);
  }, [state, sfx, showToast, matMax]);

  const reset = useCallback(() => {
    if (!window.confirm("はじめからにしますか？")) return;
    localStorage.removeItem(STORAGE_KEY);
    const d = defaultSave();
    bootRef.current = d;
    setState(d);
    setActiveTab(null);
    setShowReport(false);
    setLastResult(null);
    setMiffyMood("normal");
  }, []);

  const nav = useCallback((tab) => {
    sfx("tap");
    setActiveTab((prev) => (prev === tab ? null : tab));
  }, [sfx]);

  const miffyMsg = getMiffyMsg(state, lastResult, lastRecipe);

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
                setState((s) => ({ ...s, gamePhase: "playing", missions: genMissions(s.level) }));
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

          {/* DECO TAB (placeholder) */}
          {activeTab === "deco" && (
            <div className="tabView">
              <div className="tabHeader"><h2>デコレーション</h2></div>
              <div className="placeholder card">
                <div className="phIcon">🎂</div>
                <p>お店をデコレーションする機能は</p>
                <p>もうすぐ追加されます！</p>
                <p className="phSub">レベル5で解放予定</p>
              </div>
            </div>
          )}

          {/* STAFF TAB (placeholder) */}
          {activeTab === "staff" && (
            <div className="tabView">
              <div className="tabHeader"><h2>スタッフ</h2></div>
              <div className="placeholder card">
                <div className="phIcon">👤</div>
                <p>スタッフを雇用する機能は</p>
                <p>もうすぐ追加されます！</p>
                <p className="phSub">レベル3で解放予定</p>
              </div>
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
      {showReport && <DailyReport state={state} onNext={goNextDay} />}
    </div>
  );
}
