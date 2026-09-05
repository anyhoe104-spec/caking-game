import test from "node:test";
import assert from "node:assert/strict";
import { applyExperience, calcPoints, rollCraftResult } from "../src/game/logic.js";
import { readFileSync } from "node:fs";
import { defaultSave, loadSave, migrateSave, saveGame, STORAGE_KEY } from "../src/game/storage.js";
import { channelGain, DEFAULT_AUDIO, isFullyMuted, normalizeAudio, setVolume, toggleMute } from "../src/game/audioSettings.js";
import { BGM_KEYS, resolveScene, SE_KEYS, VOICE_KEYS } from "../src/game/audioAssets.js";
import { BUSINESS_DURATION, formatTimer, nextDay, startBusiness, tickBusiness } from "../src/game/business.js";
import { fulfillOrder, generateCustomerQueue } from "../src/game/customers.js";
import { applyMissionProgress, generateMissions } from "../src/game/missions.js";
import { getMiruMessage, updateRecipeRating } from "../src/game/engagement.js";
import { buyDecoration, DECORATIONS, equipDecoration, getStaffEffects, hireStaff, STAFF } from "../src/game/shop.js";

test("legacy save migrates to v4 without losing progress", () => {
  const migrated = migrateSave({ money: 4321, level: 4, materials: { egg: 8 }, craftCount: 12 });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.money, 4321);
  assert.equal(migrated.level, 4);
  assert.equal(migrated.materials.egg, 8);
  assert.equal(migrated.craftCount, 12);
  assert.equal(migrated.dayPhase, "prep");
});

test("invalid save falls back to safe values", () => {
  const migrated = migrateSave({ money: -5, level: "bad", materials: null });
  assert.equal(migrated.money, 0);
  assert.equal(migrated.level, 1);
  assert.deepEqual(Object.keys(migrated.materials), Object.keys(defaultSave().materials));
});

test("craft result boundaries and experience are deterministic", () => {
  assert.equal(rollCraftResult(1, 0), "fail");
  assert.equal(rollCraftResult(1, 0.2), "great");
  assert.equal(rollCraftResult(1, 0.9), "success");
  assert.deepEqual(applyExperience(45, 1, 10), { exp: 5, level: 2, levelUps: 1 });
});

test("points include customer and great-success bonuses", () => {
  const recipe = { exp: 20 };
  assert.equal(calcPoints("success", recipe, { hearts: 2 }), 40);
  assert.equal(calcPoints("great", recipe, { hearts: 2 }), 70);
  assert.equal(calcPoints("fail", recipe, { hearts: 2 }), 2);
});

test("business loop moves from prep to open to report and next day", () => {
  const opened = startBusiness(defaultSave());
  assert.equal(opened.dayPhase, "open");
  assert.equal(opened.businessTimer, BUSINESS_DURATION);
  const report = tickBusiness({ ...opened, businessTimer: 1 });
  assert.equal(report.dayPhase, "report");
  assert.equal(report.businessTimer, 0);
  const tomorrow = nextDay(report);
  assert.equal(tomorrow.dayPhase, "prep");
  assert.equal(tomorrow.dayNumber, 2);
  assert.equal(formatTimer(65), "01:05");
});

test("customer queue only requests unlocked recipes and fulfills a match", () => {
  const queue = generateCustomerQueue(1, 1);
  assert.ok(queue.length >= 3);
  assert.ok(queue.every((customer) => customer.orderRecipe === "ショートケーキ"));
  const result = fulfillOrder(queue, "ショートケーキ", "great");
  assert.equal(result.fulfilled, true);
  assert.equal(result.queue[0].status, "special");
  assert.ok(result.moneyBonus > 0);
});

test("missions are deterministic and rewards are applied once", () => {
  const missions = generateMissions(1, 1);
  assert.deepEqual(missions, generateMissions(1, 1));
  const craftMission = missions.find((mission) => mission.type === "craft_recipe");
  if (craftMission) {
    const base = { ...defaultSave(), missions: [{ ...craftMission, target: 1 }] };
    const completed = applyMissionProgress(base, "craft_recipe");
    const repeated = applyMissionProgress(completed, "craft_recipe");
    assert.equal(completed.missions[0].completed, true);
    assert.equal(repeated.totalPoints, completed.totalPoints);
  }
});

test("recipe ratings keep the best result and Miru reacts to events", () => {
  let ratings = updateRecipeRating({}, "プリン", "success");
  ratings = updateRecipeRating(ratings, "プリン", "fail");
  assert.equal(ratings["プリン"], 2);
  ratings = updateRecipeRating(ratings, "プリン", "great");
  assert.equal(ratings["プリン"], 3);
  assert.match(getMiruMessage({ ...defaultSave(), lastEvent: { type: "great" } }), /大成功/);
});

test("decorations and staff require funds and apply effects once", () => {
  const rich = { ...defaultSave(), money: 20000 };
  const bought = buyDecoration(rich, DECORATIONS[0]);
  assert.ok(bought.decorations.includes(DECORATIONS[0].id));
  assert.equal(equipDecoration(bought, DECORATIONS[0].id).equippedDecoration, DECORATIONS[0].id);
  const hired = hireStaff(bought, STAFF[1]);
  assert.equal(getStaffEffects(hired.staff).regenBonus, 1);
  assert.deepEqual(hireStaff(hired, STAFF[1]), hired);
});

// ── Audio settings ──────────────────────────────────────────

test("audio settings normalise, clamp and inherit the pre-v4 mute flags", () => {
  const fresh = normalizeAudio(undefined, {});
  assert.deepEqual(fresh, DEFAULT_AUDIO);

  // A v3 save carried a single soundOn flag for both SE and voice.
  const legacy = normalizeAudio(undefined, { soundOn: false, bgmOn: true });
  assert.equal(legacy.seMuted, true);
  assert.equal(legacy.voiceMuted, true);
  assert.equal(legacy.bgmMuted, false);
  assert.equal(normalizeAudio(undefined, { bgmOn: false }).bgmMuted, true);

  // Out-of-range and junk volumes fall back to something audible.
  assert.equal(normalizeAudio({ bgmVolume: 5 }).bgmVolume, 1);
  assert.equal(normalizeAudio({ seVolume: -3 }).seVolume, 0);
  assert.equal(normalizeAudio({ voiceVolume: "loud" }).voiceVolume, DEFAULT_AUDIO.voiceVolume);
});

test("channel gain honours per-channel and master mutes", () => {
  const base = normalizeAudio({ bgmVolume: 0.5, seVolume: 0.4, voiceVolume: 0.3 });
  assert.equal(channelGain(base, "bgm"), 0.5);

  const bgmMuted = toggleMute(base, "bgm");
  assert.equal(channelGain(bgmMuted, "bgm"), 0);
  assert.equal(channelGain(bgmMuted, "se"), 0.4);

  const allMuted = toggleMute(base, "master");
  assert.equal(channelGain(allMuted, "se"), 0);
  assert.equal(isFullyMuted(allMuted), true);
  assert.equal(isFullyMuted(base), false);
});

test("raising a muted channel's slider unmutes it, dragging to zero does not", () => {
  const muted = toggleMute(normalizeAudio({}), "se");
  assert.equal(muted.seMuted, true);

  const raised = setVolume(muted, "se", 0.6);
  assert.equal(raised.seMuted, false);
  assert.equal(channelGain(raised, "se"), 0.6);

  const silenced = setVolume(raised, "se", 0);
  assert.equal(silenced.seMuted, false);
  assert.equal(channelGain(silenced, "se"), 0);
});

test("a save round-trips audio settings and drops the retired flags", () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  const state = { ...defaultSave(), soundOn: false, bgmOn: false, money: 999 };
  saveGame(state, storage);

  const written = JSON.parse(store.get(STORAGE_KEY));
  assert.equal("soundOn" in written, false);
  assert.equal("bgmOn" in written, false);

  const reloaded = loadSave(storage);
  assert.equal(reloaded.money, 999);
  assert.deepEqual(reloaded.audio, DEFAULT_AUDIO);
});

test("a v3 save is picked up when no v4 save exists", () => {
  const store = new Map([["caking-save-v3", JSON.stringify({ money: 5000, level: 6, soundOn: false })]]);
  const loaded = loadSave({ getItem: (key) => store.get(key) ?? null, setItem: () => {} });
  assert.equal(loaded.money, 5000);
  assert.equal(loaded.level, 6);
  assert.equal(loaded.version, 4);
  assert.equal(loaded.audio.seMuted, true);
});

// ── BGM scene routing ───────────────────────────────────────

test("each game situation maps to its own BGM scene", () => {
  const base = defaultSave();
  assert.equal(resolveScene({ ...base, gamePhase: "opening" }), "opening");
  assert.equal(resolveScene({ ...base, gamePhase: "ending" }), "ending");
  assert.equal(resolveScene({ ...base, gamePhase: "playing", dayPhase: "prep" }), "menu");
  assert.equal(resolveScene({ ...base, gamePhase: "playing", dayPhase: "open" }), "shop");
  assert.equal(resolveScene({ ...base, gamePhase: "playing", dayPhase: "report" }), "report");
  // Every scene must resolve to a real file.
  for (const scene of ["opening", "menu", "shop", "report", "ending"]) {
    assert.ok(BGM_KEYS[scene], `missing BGM for ${scene}`);
  }
});

test("every declared audio key has a generated file on disk", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/sounds/manifest.json", import.meta.url), "utf8"));
  const shipped = new Set(manifest.assets.map((asset) => asset.file));
  const expected = [...Object.values(BGM_KEYS), ...SE_KEYS, ...VOICE_KEYS];
  for (const key of expected) {
    assert.ok(shipped.has(`${key}.mp3`), `missing audio asset: ${key}.mp3`);
  }
  assert.equal(shipped.size, expected.length);
});
