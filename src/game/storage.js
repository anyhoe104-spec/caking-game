import { BASE_MATERIALS } from "./data.js";
import { DEFAULT_AUDIO, normalizeAudio } from "./audioSettings.js";

export const STORAGE_KEY = "caking-save-v4";
export const LEGACY_STORAGE_KEYS = ["caking-save-v3", "caking-save-v2"];
export const LEGACY_STORAGE_KEY = LEGACY_STORAGE_KEYS[1];

export const SAVE_VERSION = 4;

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
});

const safeCount = (value, fallback = 0) => Math.max(0, Math.floor(Number.isFinite(Number(value)) ? Number(value) : fallback));

export function migrateSave(raw) {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    audio: normalizeAudio(raw.audio, raw),
    money: safeCount(raw.money, base.money),
    level: Math.max(1, safeCount(raw.level, base.level)),
    exp: safeCount(raw.exp, base.exp),
    materials: Object.fromEntries(Object.keys(BASE_MATERIALS).map((key) => [key, safeCount(raw.materials?.[key], base.materials[key])])),
    missions: Array.isArray(raw.missions) ? raw.missions : [],
    customerQueue: Array.isArray(raw.customerQueue) ? raw.customerQueue : [],
    recipeRatings: raw.recipeRatings && typeof raw.recipeRatings === "object" ? raw.recipeRatings : {},
    dailyStats: { ...base.dailyStats, ...(raw.dailyStats || {}) },
    decorations: Array.isArray(raw.decorations) ? raw.decorations : [],
    staff: Array.isArray(raw.staff) ? raw.staff : [],
  };
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
      const stored = storage?.getItem(key);
      if (stored) return migrateSave(JSON.parse(stored));
    }
    return defaultSave();
  } catch {
    return defaultSave();
  }
}

export function saveGame(state, storage = globalThis.localStorage) {
  // `soundOn` / `bgmOn` are gone from the model; drop them rather than persist stale copies.
  const { soundOn, bgmOn, ...rest } = state;
  void soundOn;
  void bgmOn;
  storage?.setItem(STORAGE_KEY, JSON.stringify({ ...rest, version: SAVE_VERSION }));
}
