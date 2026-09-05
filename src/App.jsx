import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./animations.css";

import { loadSave as loadStoredSave, saveGame, defaultSave as createDefaultSave, STORAGE_KEY as SAVE_KEY, LEGACY_STORAGE_KEYS } from "./game/storage.js";
import { startBusiness as openBusiness, tickBusiness, nextDay as advanceDay } from "./game/business.js";
import { generateCustomerQueue, fulfillOrder } from "./game/customers.js";
import { generateMissions, applyMissionProgress } from "./game/missions.js";
import { rollCraftResult, applyExperience, calcPoints, capByLevel, ENDING_LEVEL, ENDING_MONEY } from "./game/logic.js";
import { DECORATIONS, buyDecoration, equipDecoration, hireStaff, getStaffEffects } from "./game/shop.js";
import { updateRecipeRating, getMiruMessage } from "./game/engagement.js";
import { MATERIAL_LABELS, OPENING_LINES, RECIPES } from "./game/data.js";
import { miruImg } from "./game/assets.js";
import { audioBus as bus } from "./game/audio.js";
import { BGM_KEYS, resolveScene } from "./game/audioAssets.js";
import { isFullyMuted, normalizeAudio, setVolume, toggleMute } from "./game/audioSettings.js";

import { HintStrip, Toast } from "./components/common.jsx";
import Header from "./components/Header.jsx";
import HomeView from "./components/HomeView.jsx";
import RecipeView from "./components/RecipeView.jsx";
import MaterialView from "./components/MaterialView.jsx";
import UpgradeView from "./components/UpgradeView.jsx";
import DailyReport from "./components/DailyReport.jsx";
import CraftResult from "./components/CraftResult.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import { EndingScene, OpeningScene } from "./components/Scenes.jsx";

const REGEN_MS = 5000;
const REGEN_SECONDS = REGEN_MS / 1000;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const CRAFT_RESULT_MS = 1500;

const NAV_ITEMS = [
  { id: "business", label: "営業", icon: "🏪" },
  { id: "recipe", label: "レシピ", icon: "📖" },
  { id: "deco", label: "デコレーション", icon: "🎀" },
  { id: "material", label: "食材", icon: "🍓" },
  { id: "staff", label: "スタッフ", icon: "👤" },
];

const IDLE_MSGS = [
  "今日もよろしくお願いします！",
  "いつでも準備OKです！",
  "頑張って作ります！",
];

function getMiffyMsg(state, lastResult, lastRecipe) {
  if (lastResult === "great") return "大成功でした！ありがとうございます！✨";
  if (lastResult === "fail") return "すみません、失敗しました…次は頑張ります！";
  if (lastResult === "success" && lastRecipe) return `${lastRecipe}、完成しました！`;
  const low = Object.entries(state.materials).filter(([, count]) => count < 2);
  if (low.length > 0) return `${MATERIAL_LABELS[low[0][0]]}の在庫が少ないです！補充をお願いします`;
  if (state.dayPhase === "prep" && state.dayNumber === 1) return "はじめまして！ミフィです。よろしくお願いします！";
  if (state.dayPhase === "prep") return `準備ができました。${state.dayNumber}日目も頑張ります！`;
  return IDLE_MSGS[Math.floor(Math.random() * IDLE_MSGS.length)];
}

const STARS_FOR = { great: 3, success: 2, fail: 1 };

export default function App() {
  const [state, setState] = useState(loadStoredSave);
  const [activeTab, setActiveTab] = useState(null);
  const [homeTabPick, setHomeTabPick] = useState(null); // { phase, tab } — cleared when the phase turns over
  const [toast, setToast] = useState(null);
  const [effect, setEffect] = useState("");
  const [craftResult, setCraftResult] = useState(null);
  const [miffyMood, setMiffyMood] = useState("normal");
  const [lastResult, setLastResult] = useState(null);
  const [lastRecipe, setLastRecipe] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusRecipe, setFocusRecipe] = useState(null);
  const [onlyMakeable, setOnlyMakeable] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  const audio = useMemo(() => normalizeAudio(state.audio), [state.audio]);
  const reduceMotion = audio.reducedMotion || systemReducedMotion;

  // Derived rather than stored: opening the shop should always land on the
  // order list, and closing it should fall back to the day's goals.
  const homeTab = homeTabPick?.phase === state.dayPhase
    ? homeTabPick.tab
    : (state.dayPhase === "open" ? "orders" : "missions");

  // ── Derived ────────────────────────────────────────────────
  const matMax = capByLevel(state.level);
  const expToNext = state.level * 50;

  const canMake = useCallback(
    (recipe) => Object.entries(recipe.ingredients).every(([key, need]) => (state.materials[key] ?? 0) >= need),
    [state.materials],
  );

  const recommended = useMemo(() => {
    const unlocked = RECIPES.filter((recipe) => recipe.level <= state.level);
    const makeable = unlocked.filter((recipe) => canMake(recipe));
    return makeable.length > 0
      ? makeable.reduce((best, recipe) => (recipe.price > best.price ? recipe : best))
      : unlocked[unlocked.length - 1] ?? RECIPES[0];
  }, [state.level, canMake]);

  // ── Feedback helpers ───────────────────────────────────────
  const sfx = useCallback((key) => bus.play(key, "se"), []);

  // Voice lines are queued behind a short delay so the sound effect lands first.
  // The timer is held so a phase change, a reset or an unmount cannot let a line
  // meant for the previous screen fire over the new one. Only one is ever
  // pending: queuing a new line supersedes the last.
  const voiceTimer = useRef(null);

  const cancelVoice = useCallback(() => {
    if (voiceTimer.current !== null) {
      clearTimeout(voiceTimer.current);
      voiceTimer.current = null;
    }
  }, []);

  const voice = useCallback((key, delay = 220) => {
    cancelVoice();
    voiceTimer.current = setTimeout(() => {
      voiceTimer.current = null;
      bus.playVoice(key);
    }, delay);
  }, [cancelVoice]);

  const showToast = useCallback((text, tone = "info") => {
    setToast({ id: Date.now() + Math.random(), text, tone });
  }, []);

  const triggerEffect = useCallback((name) => setEffect(name), []);

  const setMood = useCallback((mood) => setMiffyMood(mood), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!effect) return;
    const timer = setTimeout(() => setEffect(""), 900);
    return () => clearTimeout(timer);
  }, [effect]);

  useEffect(() => {
    if (!craftResult) return;
    const timer = setTimeout(() => setCraftResult(null), CRAFT_RESULT_MS);
    return () => clearTimeout(timer);
  }, [craftResult]);

  useEffect(() => {
    if (miffyMood === "normal") return;
    const timer = setTimeout(() => setMiffyMood("normal"), 2400);
    return () => clearTimeout(timer);
  }, [miffyMood]);

  useEffect(() => {
    if (!focusRecipe) return;
    const timer = setTimeout(() => setFocusRecipe(null), 1400);
    return () => clearTimeout(timer);
  }, [focusRecipe]);

  // ── Persistence ────────────────────────────────────────────
  useEffect(() => {
    try { saveGame(state); } catch { /* storage may be unavailable */ }
  }, [state]);

  // ── Motion preference ──────────────────────────────────────
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReducedMotion(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduceMotion", reduceMotion);
  }, [reduceMotion]);

  // ── Audio wiring ───────────────────────────────────────────
  // Audio is attempted immediately rather than waiting for a tap. An installed
  // PWA is normally allowed to start on its own, and the previous gesture-only
  // approach meant a relaunch stayed silent until the player happened to touch
  // something. When policy does refuse, these retries cover it:
  //
  //   - every pointer or key event, until the context is actually running
  //   - the context's own statechange, for when the browser relents unprompted
  //   - two short timers, for launches where the decision settles after load
  //
  // Only the gesture path is guaranteed; the rest widen the cases where music
  // starts on its own. bus.unlock() is idempotent and cheap to call repeatedly.
  useEffect(() => {
    const kick = () => bus.unlock();
    kick();

    const pointerOpts = { passive: true };
    window.addEventListener("pointerdown", kick, pointerOpts);
    window.addEventListener("touchstart", kick, pointerOpts);
    window.addEventListener("keydown", kick);
    bus.onStateChange(kick);

    const timers = [setTimeout(kick, 400), setTimeout(kick, 1500)];
    const onVisibility = () => (document.hidden ? bus.suspend() : bus.unlock());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointerdown", kick, pointerOpts);
      window.removeEventListener("touchstart", kick, pointerOpts);
      window.removeEventListener("keydown", kick);
      bus.onStateChange(null);
      timers.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelVoice();
    };
  }, [cancelVoice]);

  useEffect(() => { bus.configure(audio); }, [audio]);

  const scene = resolveScene(state);
  useEffect(() => { bus.playBgm(scene); }, [scene]);

  // Warm the service loop while the player is still reading the prep screen.
  useEffect(() => {
    if (state.dayPhase !== "prep") return;
    const timer = setTimeout(() => bus.prefetch([BGM_KEYS.shop, "great", "order", "levelup"]), 2500);
    return () => clearTimeout(timer);
  }, [state.dayPhase]);

  // ── Material regen (respects リコ's hiring bonus) ────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setState((current) => {
        const cap = capByLevel(current.level);
        const gain = 1 + getStaffEffects(current.staff ?? []).regenBonus;
        const entries = Object.entries(current.materials);
        if (entries.every(([, count]) => count >= cap)) return current; // nothing to do, skip the save
        return {
          ...current,
          materials: Object.fromEntries(entries.map(([key, count]) => [key, Math.min(cap, count + gain)])),
        };
      });
    }, REGEN_MS);
    return () => clearInterval(timer);
  }, []);

  // ── Business timer ─────────────────────────────────────────
  useEffect(() => {
    if (state.dayPhase !== "open") return;
    const timer = setInterval(() => setState((current) => tickBusiness(current)), 1000);
    return () => clearInterval(timer);
  }, [state.dayPhase]);

  // ── Day phase cues ─────────────────────────────────────────
  const previousPhase = useRef(state.dayPhase);
  useEffect(() => {
    if (previousPhase.current === state.dayPhase) return;
    cancelVoice();
    if (previousPhase.current === "open" && state.dayPhase === "report") {
      sfx("dayend");
      voice("voice-miru-report", 620);
    }
    previousPhase.current = state.dayPhase;
  }, [state.dayPhase, sfx, voice, cancelVoice]);

  // ── Recipe unlock cue ──────────────────────────────────────
  // Session-scoped on purpose: after a reload the current unlocks are adopted
  // silently, so returning players are not greeted by a burst of fanfares.
  const knownRecipes = useRef(null);
  useEffect(() => {
    const unlocked = RECIPES.filter((recipe) => recipe.level <= state.level).map((recipe) => recipe.name);
    const before = knownRecipes.current;
    knownRecipes.current = unlocked;
    if (before === null) return;
    const fresh = unlocked.filter((name) => !before.includes(name));
    if (fresh.length === 0) return;
    sfx("unlock");
    triggerEffect("unlock");
    showToast(`🔓 新レシピ「${fresh[0]}」解放！`, "gold");
  }, [state.level, sfx, showToast, triggerEffect]);

  // ── Mission completion cue ─────────────────────────────────
  const completedMissions = useRef(null);
  useEffect(() => {
    const done = state.missions.filter((mission) => mission.completed).map((mission) => mission.id);
    const before = completedMissions.current;
    completedMissions.current = done;
    if (before === null) return; // first pass after load
    const fresh = done.filter((id) => !before.includes(id));
    if (fresh.length === 0) return;
    const mission = state.missions.find((entry) => entry.id === fresh[0]);
    sfx("mission");
    showToast(`🎯 ミッション達成！ ${mission?.description ?? ""}`, "gold");
    voice("voice-miru-cheer", 420);
  }, [state.missions, sfx, showToast, voice]);

  // ── Actions ────────────────────────────────────────────────
  const startBusiness = useCallback(() => {
    sfx("daystart");
    voice("voice-miffy-ready", 420);
    const queue = generateCustomerQueue(state.level, state.dayNumber);
    const missions = state.missions.length > 0 ? state.missions : generateMissions(state.level, state.dayNumber);
    setState((current) => openBusiness({ ...current, missions }, queue));
    setMood("excited");
    setActiveTab(null);
  }, [sfx, voice, state.level, state.dayNumber, state.missions, setMood]);

  const goNextDay = useCallback(() => {
    sfx("tap");
    setState((current) => advanceDay(current, generateMissions(current.level, current.dayNumber + 1)));
    setLastResult(null);
    setMiffyMood("normal");
  }, [sfx]);

  const craft = useCallback((recipe) => {
    if (state.level < recipe.level) {
      sfx("error");
      showToast(`Lv${recipe.level}で解放されます`, "warn");
      return;
    }
    if (!canMake(recipe)) {
      sfx("error");
      showToast("素材が足りません！", "warn");
      setMood("sad");
      setState((current) => ({ ...current, lastEvent: { type: "shortage" } }));
      return;
    }

    const result = rollCraftResult(state.level, Math.random());

    const materials = { ...state.materials };
    Object.entries(recipe.ingredients).forEach(([key, need]) => {
      materials[key] = Math.max(0, materials[key] - (result === "fail" ? Math.max(1, Math.floor(need * 0.5)) : need));
    });

    let money = 0;
    let exp = 0;
    if (result === "success") { money = recipe.price; exp = recipe.exp; }
    if (result === "great") { money = Math.floor(recipe.price * 1.5); exp = Math.floor(recipe.exp * 1.5); }
    if (result === "fail") { exp = Math.max(1, Math.floor(recipe.exp * 0.2)); }

    const { exp: nextExp, level, levelUps } = applyExperience(state.exp, state.level, exp);

    const orderResult = state.dayPhase === "open"
      ? fulfillOrder(state.customerQueue, recipe.name, result)
      : { queue: state.customerQueue, customer: null, moneyBonus: 0, fulfilled: false };
    const customerBonus = {
      money: orderResult.moneyBonus,
      points: orderResult.customer ? calcPoints(result, { exp: 0 }, orderResult.customer) : 0,
    };

    const newSales = state.todaySales + money + customerBonus.money;
    const ratings = updateRecipeRating(state.recipeRatings, recipe.name, result);
    const earned = money + customerBonus.money;

    // ── Feedback ──
    if (result === "great") { sfx("great"); triggerEffect("sparkle"); setMood("happy"); }
    else if (result === "success") { sfx("success"); setMood("working"); }
    else { sfx("error"); triggerEffect("smoke"); setMood("sad"); }
    if (orderResult.fulfilled) sfx("order");
    if (levelUps > 0) { sfx("levelup"); triggerEffect("levelup"); }

    if (levelUps > 0) voice("voice-miffy-levelup", 700);
    else if (orderResult.fulfilled) voice("voice-miffy-order", 380);
    else if (result === "great") voice("voice-miffy-great", 300);
    else if (result === "success") voice("voice-miffy-done", 300);
    else voice("voice-miffy-fail", 300);

    setLastResult(result);
    setLastRecipe(recipe.name);
    setCraftResult({
      id: Date.now(),
      type: result,
      recipe: recipe.name,
      icon: recipe.icon,
      money: earned,
      exp,
      stars: STARS_FOR[result],
      customer: orderResult.customer?.name ?? null,
    });
    if (levelUps > 0) showToast(`🎉 Lv${level} になりました！`, "gold");

    setState((current) => {
      const staffEffects = getStaffEffects(current.staff ?? []);
      let next = {
        ...current,
        materials,
        money: current.money + Math.floor(earned * staffEffects.salesMultiplier),
        exp: nextExp,
        level,
        totalPoints: current.totalPoints
          + Math.floor((calcPoints(result, recipe) + customerBonus.points) * staffEffects.pointsMultiplier),
        craftCount: current.craftCount + 1,
        successCount: current.successCount + (result === "success" ? 1 : 0),
        greatSuccessCount: current.greatSuccessCount + (result === "great" ? 1 : 0),
        failCount: current.failCount + (result === "fail" ? 1 : 0),
        levelUpCount: current.levelUpCount + levelUps,
        todaySales: newSales,
        customerQueue: orderResult.queue,
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
  }, [state, sfx, voice, showToast, triggerEffect, canMake, setMood]);

  const buyMat = useCallback((key) => {
    if (state.money < BUY_COST) { sfx("error"); showToast("コインが足りません！", "warn"); return; }
    if ((state.materials[key] ?? 0) >= matMax) { sfx("error"); showToast("もういっぱいです！", "warn"); return; }
    sfx("buy");
    setState((current) => applyMissionProgress({
      ...current,
      money: current.money - BUY_COST,
      buyCount: current.buyCount + 1,
      materials: { ...current.materials, [key]: Math.min(matMax, current.materials[key] + BUY_AMOUNT) },
    }, "buy_materials"));
    showToast(`${MATERIAL_LABELS[key]} +${BUY_AMOUNT}`, "ok");
  }, [state.money, state.materials, sfx, showToast, matMax]);

  const purchaseDecoration = useCallback((decoration) => {
    if (state.money < decoration.price) { sfx("error"); showToast("コインが足りません！", "warn"); return; }
    sfx("buy");
    showToast(`${decoration.name} を購入しました`, "ok");
    setState((current) => buyDecoration(current, decoration));
  }, [state.money, sfx, showToast]);

  const selectDecoration = useCallback((id) => {
    sfx("equip");
    triggerEffect("sparkle");
    showToast(`${DECORATIONS.find((item) => item.id === id)?.name} を飾りました`, "ok");
    setState((current) => equipDecoration(current, id));
  }, [sfx, showToast, triggerEffect]);

  const recruitStaff = useCallback((member) => {
    if (state.money < member.price) { sfx("error"); showToast("コインが足りません！", "warn"); return; }
    sfx("hire");
    showToast(`${member.name} が仲間になりました！`, "gold");
    setState((current) => hireStaff(current, member));
  }, [state.money, sfx, showToast]);

  const reset = useCallback(() => {
    for (const key of [SAVE_KEY, ...LEGACY_STORAGE_KEYS]) {
      try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
    }
    const fresh = createDefaultSave();
    cancelVoice();
    knownRecipes.current = null;
    completedMissions.current = null;
    setState({ ...fresh, audio });
    setActiveTab(null);
    setSettingsOpen(false);
    setLastResult(null);
    setMiffyMood("normal");
  }, [audio, cancelVoice]);

  const nav = useCallback((tab) => {
    sfx("nav");
    setActiveTab(tab === "business" ? null : tab);
  }, [sfx]);

  const pickOrder = useCallback((recipeName) => {
    sfx("tap");
    setActiveTab("recipe");
    setFocusRecipe(recipeName);
  }, [sfx]);

  const craftFromList = useCallback((recipe) => {
    sfx("tap");
    craft(recipe);
  }, [sfx, craft]);

  // ── Audio settings ─────────────────────────────────────────
  const updateAudio = useCallback((next) => {
    setState((current) => ({ ...current, audio: next }));
  }, []);

  const onToggleMute = useCallback((channel) => {
    updateAudio(toggleMute(audio, channel));
  }, [audio, updateAudio]);

  const onVolume = useCallback((channel, value) => {
    updateAudio(setVolume(audio, channel, value));
  }, [audio, updateAudio]);

  const onToggleMotion = useCallback(() => {
    updateAudio({ ...audio, reducedMotion: !audio.reducedMotion });
  }, [audio, updateAudio]);

  const previewChannel = useCallback((channel) => {
    if (channel === "se") sfx("tap");
    if (channel === "voice") bus.playVoice("voice-miru-hello");
  }, [sfx]);

  // ── Scenes ─────────────────────────────────────────────────
  const miffyMsg = getMiffyMsg(state, lastResult, lastRecipe);
  const miruMsg = getMiruMessage(state);
  const miruMood = state.lastEvent?.type === "great" ? "happy" : state.lastEvent?.type === "fail" ? "thinking" : "normal";

  if (state.gamePhase === "opening") {
    const finish = () => {
      sfx("tap");
      voice("voice-miru-hello", 260);
      setState((current) => ({
        ...current,
        gamePhase: "playing",
        openingIndex: 0,
        missions: generateMissions(current.level, current.dayNumber),
      }));
    };
    return (
      <OpeningScene
        index={Math.min(state.openingIndex, OPENING_LINES.length - 1)}
        onAdvance={() => {
          if (state.openingIndex < OPENING_LINES.length - 1) {
            sfx("tap");
            setState((current) => ({ ...current, openingIndex: current.openingIndex + 1 }));
          } else {
            finish();
          }
        }}
        onSkip={finish}
      />
    );
  }

  if (state.gamePhase === "ending") {
    return (
      <EndingScene
        state={state}
        onRestart={reset}
        onContinue={() => { sfx("tap"); setState((current) => ({ ...current, gamePhase: "playing" })); }}
      />
    );
  }

  return (
    <div className={`phoneStage ${effect ? `fx-${effect}` : ""}`}>
      <div className="appShell">
        <Header
          state={state}
          expToNext={expToNext}
          muted={isFullyMuted(audio)}
          onHome={() => { sfx("nav"); setActiveTab(null); }}
          onSettings={() => { sfx("tap"); setSettingsOpen(true); }}
        />

        <HintStrip icon={miruImg(miruMood)} name="ミル" message={miruMsg} />

        <main className="mainContent viewSwap" key={activeTab ?? "home"}>
          {activeTab === null && (
            <HomeView
              state={state}
              homeTab={homeTab}
              onHomeTab={(tab) => { sfx("tap"); setHomeTabPick({ phase: state.dayPhase, tab }); }}
              miffyMood={miffyMood}
              miffyMsg={miffyMsg}
              recommended={recommended}
              expToNext={expToNext}
              onPickOrder={pickOrder}
              onOpenRecipe={() => nav("recipe")}
            />
          )}

          {activeTab === "recipe" && (
            <RecipeView
              state={state}
              canMake={canMake}
              onCraft={craftFromList}
              focusRecipe={focusRecipe}
              onlyMakeable={onlyMakeable}
              onToggleFilter={() => { sfx("tap"); setOnlyMakeable((value) => !value); }}
            />
          )}

          {activeTab === "material" && (
            <MaterialView
              state={state}
              matMax={matMax}
              buyAmount={BUY_AMOUNT}
              buyCost={BUY_COST}
              regenSeconds={REGEN_SECONDS}
              onBuy={buyMat}
            />
          )}

          {activeTab === "deco" && (
            <UpgradeView
              kind="deco"
              state={state}
              onBuyDecoration={purchaseDecoration}
              onEquipDecoration={selectDecoration}
            />
          )}

          {activeTab === "staff" && (
            <UpgradeView kind="staff" state={state} onHire={recruitStaff} />
          )}
        </main>
      </div>

      <nav className="bottomNav" aria-label="メインメニュー">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const active = id === "business" ? activeTab === null : activeTab === id;
          return (
            <button
              key={id}
              className={`navItem ${active ? "active" : ""}`}
              onClick={() => nav(id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="navIcon" aria-hidden="true">{icon}</span>
              <span className="navLabel">{label}</span>
            </button>
          );
        })}
      </nav>

      {state.dayPhase === "prep" && (
        <button className="startBtn pressable" onClick={startBusiness}>
          🍰 営業スタート！
        </button>
      )}

      <Toast toast={toast} />
      <CraftResult result={craftResult} />

      {state.dayPhase === "report" && (
        <DailyReport
          state={state}
          animate={!reduceMotion}
          onNext={goNextDay}
          onCoinTick={() => sfx("coin")}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          audio={audio}
          onToggleMute={onToggleMute}
          onVolume={onVolume}
          onToggleMotion={onToggleMotion}
          onPreview={previewChannel}
          onReset={reset}
          onClose={() => { sfx("tap"); setSettingsOpen(false); }}
        />
      )}
    </div>
  );
}
