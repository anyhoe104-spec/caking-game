import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./animations.css";
import "./atelier.css";
import ResumeDialog from "./components/ResumeDialog.jsx";
import CakeAtelier from "./components/CakeAtelier.jsx";
import { buyCakePart, equipCakePart, resetCakeParts } from "./game/cakeParts.js";

import { loadSaveWithStatus, saveGame, defaultSave as createDefaultSave, STORAGE_KEY as SAVE_KEY, LEGACY_STORAGE_KEYS, BACKUP_KEY } from "./game/storage.js";
import { startBusiness as openBusiness, tickBusiness, nextDay as advanceDay } from "./game/business.js";
import { generateCustomerQueue } from "./game/customers.js";
import { generateMissions, applyMissionProgress } from "./game/missions.js";
import { rollCraftResult, capByLevel } from "./game/logic.js";
import { DECORATIONS, buyDecoration, equipDecoration, hireStaff, getStaffEffects } from "./game/shop.js";
import { getMiruMessage } from "./game/engagement.js";
import { MATERIAL_LABELS, OPENING_LINES, RECIPES } from "./game/data.js";
import { miruImg } from "./game/assets.js";
import { audioBus as bus } from "./game/audio.js";
import { BGM_KEYS, resolveScene } from "./game/audioAssets.js";
import { isFullyMuted, normalizeAudio, setVolume, toggleMute } from "./game/audioSettings.js";

import { completeCraft } from "./game/crafting.js";
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


export default function App() {
  const [initialSave] = useState(loadSaveWithStatus);
  const [state, setState] = useState(initialSave.state);
  const [saveStatus, setSaveStatus] = useState(initialSave.status);
  const [saveNotice, setSaveNotice] = useState(initialSave.status === "recovered" || initialSave.status === "damaged" ? initialSave.status : null);
  const [paused, setPaused] = useState(() => state.gamePhase === "playing" && state.dayPhase === "open");
  const [activeTab, setActiveTab] = useState(null);
  const [homeTabPick, setHomeTabPick] = useState(null); // { phase, tab } — cleared when the phase turns over
  const [toast, setToast] = useState(null);
  const [effect, setEffect] = useState("");
  const [craftResult, setCraftResult] = useState(null);
  const craftLocked = useRef(false);
  const finishCraft = useCallback(() => { craftLocked.current = false; setCraftResult(null); }, []);
  const [miffyMood, setMiffyMood] = useState("normal");
  const [lastResult, setLastResult] = useState(null);
  const [lastRecipe, setLastRecipe] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpener = useRef(null);
  const openSettings = () => { settingsOpener.current = document.activeElement; setSettingsOpen(true); };
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
    // Report the result of an external storage write; this effect depends only on game state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { saveGame(state); setSaveStatus("saved"); } catch { setSaveStatus("unavailable"); }
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
  useEffect(() => {
    const unlock = () => bus.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const onVisibility = () => {
      document.documentElement.classList.toggle("pageHidden", document.hidden);
      if (document.hidden) {
        setPaused(true);
        cancelVoice();
        bus.suspend();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
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

  useEffect(() => {
    document.documentElement.classList.toggle("gamePaused", paused);
    if (paused) bus.suspend(); else if (!document.hidden) bus.resume();
    return () => document.documentElement.classList.remove("gamePaused");
  }, [paused]);

  // ── Material regen (respects リコ's hiring bonus) ────────────
  useEffect(() => {
    if (paused || settingsOpen) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
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
  }, [paused, settingsOpen]);

  // ── Business timer ─────────────────────────────────────────
  useEffect(() => {
    if (state.dayPhase !== "open" || paused || settingsOpen) return;
    const timer = setInterval(() => {
      if (!document.hidden) setState((current) => tickBusiness(current));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.dayPhase, paused, settingsOpen]);

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
    if (craftLocked.current || state.dayPhase === "report") return;
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
    const transaction = completeCraft(state, recipe, result);
    if (!transaction) return;
    craftLocked.current = true;
    setLastResult(result);
    setLastRecipe(recipe.name);
    setCraftResult({ ...transaction.receipt, id: Date.now() });
    setState(transaction.state);
  }, [state, sfx, showToast, canMake, setMood]);

  const revealCraft = useCallback(() => {
    if (!craftResult) return;
    const { type: result, levelUps, level, fulfilled } = craftResult;
    if (result === "great") { sfx("great"); triggerEffect("sparkle"); setMood("happy"); }
    else if (result === "success") { sfx("success"); setMood("working"); }
    else { sfx("error"); triggerEffect("smoke"); setMood("sad"); }
    if (fulfilled) sfx("order");
    if (levelUps > 0) { sfx("levelup"); triggerEffect("levelup"); showToast(`🎉 Lv${level} になりました！`, "gold"); }
    if (levelUps > 0) voice("voice-miffy-levelup", 700);
    else if (fulfilled) voice("voice-miffy-order", 380);
    else if (result === "great") voice("voice-miffy-great", 300);
    else if (result === "success") voice("voice-miffy-done", 300);
    else voice("voice-miffy-fail", 300);
  }, [craftResult, sfx, triggerEffect, setMood, showToast, voice]);

  const buyMat = useCallback((key) => {
    if (state.money < BUY_COST) { sfx("error"); showToast("コインが足りません！", "warn"); return; }
    if ((state.materials[key] ?? 0) >= matMax) { sfx("error"); showToast("もういっぱいです！", "warn"); return; }
    sfx("buy");
    setState((current) => {
      if (current.money < BUY_COST || current.materials[key] >= capByLevel(current.level)) return current;
      const next = {
        ...current,
        money: current.money - BUY_COST,
        buyCount: current.buyCount + 1,
        materials: { ...current.materials, [key]: Math.min(capByLevel(current.level), current.materials[key] + BUY_AMOUNT) },
      };
      return current.dayPhase === "open" ? applyMissionProgress(next, "buy_materials") : next;
    });
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
    for (const key of [SAVE_KEY, BACKUP_KEY, ...LEGACY_STORAGE_KEYS]) {
      try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
    }
    const fresh = createDefaultSave();
    finishCraft();
    setPaused(false);
    cancelVoice();
    knownRecipes.current = null;
    completedMissions.current = null;
    setState({ ...fresh, audio });
    setActiveTab(null);
    setSettingsOpen(false);
    setLastResult(null);
    setMiffyMood("normal");
  }, [audio, cancelVoice, finishCraft]);

  const restoreSave = useCallback((restored) => {
    // Write before replacing live state. A quota failure must not erase this session.
    saveGame(restored);
    cancelVoice();
    finishCraft();
    knownRecipes.current = null;
    completedMissions.current = null;
    previousPhase.current = restored.dayPhase;
    setState(restored);
    setSaveStatus("saved");
    setSaveNotice(null);
    setSettingsOpen(false);
    setPaused(restored.gamePhase === "playing" && restored.dayPhase === "open");
    setActiveTab(null);
    setHomeTabPick(null);
    setLastResult(null);
    setLastRecipe("");
    setMiffyMood("normal");
    setEffect("");
    setToast(null);
  }, [cancelVoice, finishCraft]);

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
      setPaused(false);
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

  if (state.gamePhase === "ending" && !craftResult) {
    return (
      <EndingScene
        state={state}
        onRestart={reset}
        onContinue={() => { setPaused(false); sfx("tap"); setState((current) => ({ ...current, gamePhase: "playing" })); }}
      />
    );
  }

  return (
    <>
    <div className={`phoneStage ${effect ? `fx-${effect}` : ""}`} inert={paused}>
      <div className="appShell" inert={!!craftResult || settingsOpen}>
        <Header
          state={state}
          expToNext={expToNext}
          muted={isFullyMuted(audio)}
          onHome={() => { sfx("nav"); setActiveTab(null); }}
          onSettings={() => { sfx("tap"); openSettings(); }}
        />

        <div className="sessionControls"><span>営業中も、ひと休みできます</span><button onClick={() => { cancelVoice(); setPaused(true); }}>一時停止</button></div>
        {(saveStatus === "unavailable" || saveNotice) && <div className="saveWarning" role="alert">
          <span>{saveStatus === "unavailable" ? "進行を端末に保存できません。設定からバックアップを保管してください。" : saveNotice === "recovered" ? "保存データを控えから復旧しました。直前の操作が戻っている場合があります。" : "保存データを読み取れませんでした。保管したバックアップは設定から復元できます。"}</span>
          <button onClick={openSettings}>設定を開く</button>
          {saveStatus !== "unavailable" && <button onClick={() => setSaveNotice(null)}>確認しました</button>}
        </div>}
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
            <>
            <CakeAtelier state={state} onReset={slot => { sfx("equip"); setState(current => resetCakeParts(current,slot)); }} onBuy={id => { sfx("buy"); setState(current => buyCakePart(current,id)); }} onEquip={id => { sfx("equip"); setState(current => equipCakePart(current,id)); }}/>
            <UpgradeView
              kind="deco"
              state={state}
              onBuyDecoration={purchaseDecoration}
              onEquipDecoration={selectDecoration}
            />
            </>
          )}

          {activeTab === "staff" && (
            <UpgradeView kind="staff" state={state} onHire={recruitStaff} />
          )}
        </main>
      </div>

      <nav className="bottomNav" aria-label="メインメニュー" inert={!!craftResult || settingsOpen}>
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

      {state.dayPhase === "prep" && !craftResult && !settingsOpen && (
        <button className="startBtn pressable" onClick={startBusiness}>
          🍰 営業スタート！
        </button>
      )}

      <Toast toast={toast} />
      <CraftResult paused={paused} result={craftResult} onReveal={revealCraft} reduced={reduceMotion} onFinish={finishCraft} cakeStyle={state.cakeStyle} />

      {state.dayPhase === "report" && !craftResult && (
        <DailyReport
          state={state}
          animate={!reduceMotion}
          onNext={goNextDay}
          onCoinTick={() => sfx("coin")}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          returnFocusRef={settingsOpener}
          state={state}
          saveStatus={saveStatus}
          onRestore={restoreSave}
          onRetry={() => { try { saveGame(state); setSaveStatus("saved"); } catch { setSaveStatus("unavailable"); } }}
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
    {paused && <ResumeDialog state={state} onResume={() => { bus.unlock(); setPaused(false); }} />}
    </>
  );
}
