import test from "node:test";
import assert from "node:assert/strict";
import { completeCraft } from "../src/game/crafting.js";
import { defaultSave, createBackup, parseBackup } from "../src/game/storage.js";
import { RECIPES } from "../src/game/data.js";
import { generateCustomerQueue } from "../src/game/customers.js";
import { generateMissions } from "../src/game/missions.js";
const ready = () => ({ ...defaultSave(), gamePhase: "playing", dayPhase: "open", customerQueue: generateCustomerQueue(1), missions: generateMissions(1, 1) });

test("the receipt, wallet, sales and sales missions agree with seller bonuses", () => {
  const state = { ...ready(), staff: ["seller"] };
  const outcome = completeCraft(state, RECIPES[0], "great");
  assert.equal(outcome.receipt.money, outcome.state.money - state.money);
  assert.equal(outcome.state.todaySales, outcome.receipt.money);
  assert.equal(outcome.state.missions.find(m => m.type === "reach_sales").current, outcome.receipt.money);
  assert.deepEqual(outcome.state.dailyStats, { filledOrders: 1, satisfiedCustomers: 1, greatCount: 1 });
});

test("practice gives progression without consuming today's mission rewards or reporting sales", () => {
  const state = { ...ready(), dayPhase: "prep" };
  const outcome = completeCraft(state, RECIPES[0], "great");
  assert.ok(outcome.state.money > state.money);
  assert.equal(outcome.state.todaySales, 0);
  assert.deepEqual(outcome.state.missions, state.missions);
  assert.deepEqual(outcome.state.dailyStats, state.dailyStats);
});

test("a great cake without a matching customer is not a special order", () => {
  const state = { ...ready(), customerQueue: [] };
  const outcome = completeCraft(state, RECIPES[0], "great");
  assert.equal(outcome.state.missions.find(m => m.type === "special_orders").current, 0);
  assert.equal(outcome.state.dailyStats.greatCount, 1);
});

test("new customer mission targets are reachable within the generated queue at every level", () => {
  for (let level = 1; level <= 99; level++) {
    const available = generateCustomerQueue(level).length;
    for (let day = 1; day <= 5; day++) {
      for (const m of generateMissions(level, day).filter(m => ["satisfy_customers", "special_orders"].includes(m.type))) assert.ok(m.target <= available, `${level}: ${m.type}`);
    }
  }
});

test("failed, locked, unaffordable and closed-day crafts never pay incorrectly", () => {
  const state = ready();
  assert.equal(completeCraft(state, RECIPES[7], "success"), null);
  assert.equal(completeCraft({ ...state, materials: {} }, RECIPES[0], "success"), null);
  assert.equal(completeCraft({ ...state, dayPhase: "report" }, RECIPES[0], "success"), null);
  const failed = completeCraft(state, RECIPES[0], "fail");
  assert.equal(failed.receipt.money, 0);
  assert.equal(failed.state.money, state.money);
  assert.equal(failed.state.customerQueue[0].status, "waiting");
  assert.equal(failed.state.failCount, 1);
});

test("all recipe transactions survive backup and ending is paid and reached once", () => {
  const state = { ...ready(), level: 10, money: 99999, materials: Object.fromEntries(Object.keys(defaultSave().materials).map(k => [k, 30])) };
  for (const recipe of RECIPES) {
    const outcome = completeCraft(state, recipe, "success");
    const restored = parseBackup(createBackup(outcome.state));
    assert.equal(restored.gamePhase, "ending");
    assert.equal(restored.endingReached, true);
    assert.equal(restored.recipeRatings[recipe.name], 2);
    const again = completeCraft({ ...restored, gamePhase: "playing" }, recipe, "success");
    assert.equal(again.state.gamePhase, "playing");
  }
});
