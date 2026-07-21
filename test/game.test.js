import test from "node:test";
import assert from "node:assert/strict";
import { applyExperience, calcPoints, rollCraftResult } from "../src/game/logic.js";
import { defaultSave, migrateSave } from "../src/game/storage.js";
import { BUSINESS_DURATION, formatTimer, nextDay, startBusiness, tickBusiness } from "../src/game/business.js";
import { fulfillOrder, generateCustomerQueue } from "../src/game/customers.js";
import { applyMissionProgress, generateMissions } from "../src/game/missions.js";
import { getMiruMessage, updateRecipeRating } from "../src/game/engagement.js";
import { buyDecoration, DECORATIONS, equipDecoration, getStaffEffects, hireStaff, STAFF } from "../src/game/shop.js";

test("v2 save migrates to v3 without losing progress", () => {
  const migrated = migrateSave({ money: 4321, level: 4, materials: { egg: 8 }, craftCount: 12 });
  assert.equal(migrated.version, 3);
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
