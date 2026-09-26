import test from "node:test";
import assert from "node:assert/strict";
import { BACKUP_KEY, STORAGE_KEY, createBackup, defaultSave, loadSave, loadSaveWithStatus, migrateSave, parseBackup, saveGame } from "../src/game/storage.js";
import { generateMissions, applyMissionProgress } from "../src/game/missions.js";
import { generateCustomerQueue, fulfillOrder } from "../src/game/customers.js";
const memory = () => { const values = new Map(); return { values, getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }; };

test("a damaged current save recovers the last valid write and cannot replace the recovery copy", () => {
  const storage = memory();
  saveGame({ ...defaultSave(), money: 1234 }, storage);
  saveGame({ ...defaultSave(), money: 5678 }, storage);
  storage.setItem(STORAGE_KEY, "{broken");
  const recovered = loadSaveWithStatus(storage);
  assert.equal(recovered.status, "recovered");
  assert.equal(recovered.state.money, 1234);
  saveGame(recovered.state, storage);
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).money, 1234);
  assert.equal(loadSave(storage).money, 1234);
});

test("damaged candidates do not prevent legacy recovery; total corruption and denied storage are distinguishable", () => {
  const storage = memory();
  storage.setItem(STORAGE_KEY, "[]");
  storage.setItem(BACKUP_KEY, "null");
  assert.equal(loadSaveWithStatus(storage).status, "damaged");
  storage.setItem("caking-save-v3", JSON.stringify({ money: 8888, level: 4, soundOn: false }));
  assert.equal(loadSave(storage).money, 8888);
  assert.equal(loadSave(storage).audio.seMuted, true);
  assert.equal(loadSaveWithStatus({ getItem() { throw new Error("denied"); } }).status, "unavailable");
});

test("backup round-trip preserves playable orders, earned mission rewards and cake ownership", () => {
  let state = { ...defaultSave(), gamePhase: "playing", dayPhase: "open", money: 5000, customerQueue: generateCustomerQueue(1), missions: generateMissions(1, 1), ownedCakeParts: ["berry", "mint", "ribbon"], cakeStyle: { top: "mint", band: "ribbon" } };
  state = applyMissionProgress(state, "satisfy_customers", 100);
  const restored = parseBackup(createBackup(state));
  assert.equal(restored.money, state.money);
  assert.deepEqual(restored.cakeStyle, state.cakeStyle);
  assert.deepEqual(restored.ownedCakeParts, state.ownedCakeParts);
  assert.equal(applyMissionProgress(restored, "satisfy_customers", 100).totalPoints, state.totalPoints);
  assert.equal(fulfillOrder(restored.customerQueue, "ショートケーキ", "success").fulfilled, true);
});

test("wrong, future and malformed backups fail before restoration", () => {
  for (const source of ["", "null", "[]", "{}", "x".repeat(200001), JSON.stringify({ format: "CAKING-backup", version: 9, save: defaultSave() }), JSON.stringify({ format: "CAKING-backup", version: 1, save: { ...defaultSave(), money: "x" } })]) assert.throws(() => parseBackup(source));
});

test("malformed rows and untrusted scalar fields cannot break game rendering or grant premium parts", () => {
  const state = migrateSave({ ...defaultSave(), gamePhase: {}, dayPhase: "bad", businessTimer: Infinity, openingIndex: 500, customerQueue: [null, 4, { id: "bad", order: "unknown", hearts: 1e10 }], missions: [null, "x"], recipeRatings: { "プリン": 999 }, ownedCakeParts: ["berry", "crown"], cakeStyle: { top: "crown" } });
  assert.equal(state.gamePhase, "opening");
  assert.equal(state.dayPhase, "prep");
  assert.equal(state.businessTimer, 180);
  assert.deepEqual(state.customerQueue, []);
  assert.deepEqual(state.missions, []);
  assert.equal(state.recipeRatings["プリン"], 3);
  assert.equal(state.cakeStyle.top, "berry");
});

test("quota failures are observable and preserve the primary save", () => {
  const storage = memory();
  saveGame({ ...defaultSave(), money: 321 }, storage);
  storage.setItem = () => { throw new Error("quota"); };
  assert.throws(() => saveGame({ ...defaultSave(), money: 999 }, storage), /quota/);
  assert.equal(loadSave(storage).money, 321);
});
