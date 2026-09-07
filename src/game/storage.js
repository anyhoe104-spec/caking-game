import { defaultCakeStyle, normalizeCakeParts } from "./cakeParts.js";
import { BASE_MATERIALS, RECIPES, OPENING_LINES } from "./data.js";
import { DEFAULT_AUDIO, normalizeAudio } from "./audioSettings.js";

export const STORAGE_KEY = "caking-save-v4";
export const LEGACY_STORAGE_KEYS = ["caking-save-v3", "caking-save-v2"];
export const LEGACY_STORAGE_KEY = LEGACY_STORAGE_KEYS[1];

export const SAVE_VERSION = 4;
export const BACKUP_KEY = "caking-save-recovery-v4";
export const MAX_BACKUP_LENGTH = 200000;

export const defaultSave = () => ({
  version: SAVE_VERSION,
  gamePhase: "opening",
  money: 1000,
  level: 1,
  exp: 0,
  materials: { ...BASE_MATERIALS },
  craftCount: 0,
  successCount: 0,
  greatSuccessCount: 0,
  failCount: 0,
  buyCount: 0,
  levelUpCount: 0,
  audio: { ...DEFAULT_AUDIO },
  endingReached: false,
  openingIndex: 0,
  dayPhase: "prep",
  dayNumber: 1,
  businessTimer: 180,
  todaySales: 0,
  todaySalesGoal: 8000,
  totalPoints: 0,
  missions: [],
  customerQueue: [],
  recipeRatings: {},
  lastEvent: null,
  dailyStats: { filledOrders: 0, satisfiedCustomers: 0, greatCount: 0 },
  decorations: [],
  equippedDecoration: null,
  staff: [],
  ownedCakeParts: ["berry"],
  cakeStyle: defaultCakeStyle(),
});

const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const safeCount = (value, fallback = 0, max = 1e9) => Math.min(max, Math.max(0, Math.floor(typeof value === "number" && Number.isFinite(value) ? value : fallback)));
const rows = value => Array.isArray(value) ? value.filter(record).slice(0, 100) : [];
const ids = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === "string" && id.length < 100))].slice(0, 100) : [];
const text = value => typeof value === "string" ? value.slice(0, 300) : "";
const recipeNames = new Set(RECIPES.map(recipe => recipe.name));

export function migrateSave(raw) {
  const base = defaultSave();
  if (!record(raw)) return base;
  const state = { ...base, ...normalizeCakeParts(raw), audio: normalizeAudio(raw.audio, raw) };
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === "number") state[key] = safeCount(raw[key], value);
  }
  state.version = SAVE_VERSION;
  state.level = Math.max(1, Math.min(99, state.level));
  state.dayNumber = Math.max(1, state.dayNumber);
  state.businessTimer = Math.min(180, state.businessTimer);
  state.openingIndex = Math.min(OPENING_LINES.length - 1, state.openingIndex);
  state.gamePhase = ["opening", "playing", "ending"].includes(raw.gamePhase) ? raw.gamePhase : base.gamePhase;
  state.dayPhase = ["prep", "open", "report"].includes(raw.dayPhase) ? raw.dayPhase : base.dayPhase;
  state.endingReached = raw.endingReached === true;
  state.materials = Object.fromEntries(Object.keys(BASE_MATERIALS).map(key => [key, safeCount(raw.materials?.[key], base.materials[key])]));
  state.recipeRatings = Object.fromEntries(RECIPES.map(recipe => [recipe.name, safeCount(raw.recipeRatings?.[recipe.name], 0, 3)]).filter(([, rating]) => rating > 0));
  state.dailyStats = Object.fromEntries(Object.keys(base.dailyStats).map(key => [key, safeCount(raw.dailyStats?.[key])]));
  state.missions = rows(raw.missions).filter(m => typeof m.type === "string" && typeof m.id === "string").map(m => ({
    id: text(m.id), type: text(m.type), description: text(m.description),
    current: safeCount(m.current), target: Math.max(1, safeCount(m.target, 1)),
    completed: m.completed === true, rewarded: m.rewarded === true,
    reward: { money: safeCount(m.reward?.money), points: safeCount(m.reward?.points),
      materials: Object.fromEntries(Object.keys(BASE_MATERIALS).map(key => [key, safeCount(m.reward?.materials?.[key])]).filter(([, count]) => count > 0)) },
  }));
  state.customerQueue = rows(raw.customerQueue).filter(c => recipeNames.has(c.orderRecipe ?? c.order) && typeof c.id === "string").map(c => ({
    id: text(c.id), uid: text(c.uid || c.id), name: text(c.name),
    avatarPath: typeof c.avatarPath === "string" && /^images\/characters\/[a-z-]+\.png$/.test(c.avatarPath) ? c.avatarPath : null,
    orderRecipe: c.orderRecipe ?? c.order, order: c.orderRecipe ?? c.order,
    hearts: safeCount(c.hearts, 1, 3), tl: safeCount(c.tl, 120, 180),
    timeRemaining: safeCount(c.timeRemaining, 0, 180),
    status: ["waiting", "fulfilled", "special", "expired"].includes(c.status) ? c.status : "expired",
    arrivedAt: safeCount(c.arrivedAt),
  }));
  state.decorations = ids(raw.decorations);
  state.staff = ids(raw.staff);
  state.equippedDecoration = state.decorations.includes(raw.equippedDecoration) ? raw.equippedDecoration : null;
  state.lastEvent = record(raw.lastEvent) ? { type: text(raw.lastEvent.type), material: text(raw.lastEvent.material) } : null;
  return state;
}

function parseStored(stored) {
  const raw = JSON.parse(stored);
  if (!record(raw) || ![2, 3, 4, undefined].includes(raw.version) || !Number.isFinite(raw.money)) throw new Error("invalid save");
  return migrateSave(raw);
}

// Resolve localStorage inside the try: privacy settings may make the getter throw.
export function loadSaveWithStatus(storage) {
  try {
    storage ??= globalThis.localStorage;
    let damaged = false;
    for (const key of [STORAGE_KEY, BACKUP_KEY, ...LEGACY_STORAGE_KEYS]) {
      const stored = storage?.getItem(key);
      if (!stored) continue;
      try { return { state: parseStored(stored), status: damaged ? "recovered" : "saved" }; }
      catch { damaged = true; }
    }
    return { state: defaultSave(), status: damaged ? "damaged" : "saved" };
  } catch {
    return { state: defaultSave(), status: "unavailable" };
  }
}

export function loadSave(storage) { return loadSaveWithStatus(storage).state; }

export function saveGame(state, storage) {
  storage ??= globalThis.localStorage;
  if (!storage) throw new Error("保存先を利用できません");
  const { soundOn, bgmOn, ...rest } = state;
  void soundOn; void bgmOn;
  const next = JSON.stringify({ ...rest, version: SAVE_VERSION });
  const previous = storage.getItem(STORAGE_KEY);
  if (previous === next) return;
  if (previous) {
    let valid = false;
    try { parseStored(previous); valid = true; } catch { /* Keep the good recovery copy. */ }
    if (valid) storage.setItem(BACKUP_KEY, previous);
  }
  storage.setItem(STORAGE_KEY, next);
}

export function createBackup(state, now = new Date()) {
  return JSON.stringify({ format: "CAKING-backup", version: 1, createdAt: now.toISOString(), save: migrateSave(state) }, null, 2);
}

export function parseBackup(source) {
  if (typeof source !== "string" || source.length > MAX_BACKUP_LENGTH) throw new Error("バックアップは200KB以内のテキストを指定してください。");
  let data;
  try { data = JSON.parse(source); } catch { throw new Error("バックアップを読み取れません。全文を貼り付けてください。"); }
  if (!record(data) || data.format !== "CAKING-backup" || data.version !== 1 || !record(data.save)) throw new Error("CAKINGのバックアップではありません。");
  const s = data.save;
  if (s.version !== SAVE_VERSION) throw new Error("このバージョンでは読み込めないバックアップです。");
  if (!["opening", "playing", "ending"].includes(s.gamePhase) || !["prep", "open", "report"].includes(s.dayPhase) ||
      ![s.money, s.level, s.dayNumber].every(n => Number.isSafeInteger(n) && n >= 0) || s.level < 1 || s.dayNumber < 1 || !record(s.materials)) {
    throw new Error("進行データが不正です。別のバックアップを指定してください。");
  }
  return migrateSave(s);
}
