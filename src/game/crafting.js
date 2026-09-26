import { fulfillOrder } from "./customers.js";
import { applyMissionProgress } from "./missions.js";
import { getStaffEffects } from "./shop.js";
import { updateRecipeRating } from "./engagement.js";
import { applyExperience, calcPoints, ENDING_LEVEL, ENDING_MONEY } from "./logic.js";

// One transaction supplies both saved progress and the completion receipt.
export function completeCraft(state, recipe, result) {
  if (state.gamePhase !== "playing" || state.dayPhase === "report" || state.level < recipe.level || !["success", "great", "fail"].includes(result) ||
      !Object.entries(recipe.ingredients).every(([key, need]) => state.materials[key] >= need)) return null;
  const open = state.dayPhase === "open";
  const materials = { ...state.materials };
  for (const [key, need] of Object.entries(recipe.ingredients)) materials[key] -= result === "fail" ? Math.max(1, Math.floor(need * .5)) : need;
  const baseMoney = result === "great" ? Math.floor(recipe.price * 1.5) : result === "success" ? recipe.price : 0;
  const exp = result === "great" ? Math.floor(recipe.exp * 1.5) : result === "success" ? recipe.exp : Math.max(1, Math.floor(recipe.exp * .2));
  const experience = applyExperience(state.exp, state.level, exp);
  const order = open ? fulfillOrder(state.customerQueue, recipe.name, result) : { queue: state.customerQueue, customer: null, moneyBonus: 0, fulfilled: false };
  const effects = getStaffEffects(state.staff);
  const earned = Math.floor((baseMoney + order.moneyBonus) * effects.salesMultiplier);
  const todaySales = state.todaySales + (open ? earned : 0);
  let next = {
    ...state, materials, money: state.money + earned, level: experience.level, exp: experience.exp,
    totalPoints: state.totalPoints + Math.floor(calcPoints(result, recipe, order.customer) * effects.pointsMultiplier),
    craftCount: state.craftCount + 1,
    successCount: state.successCount + Number(result === "success"),
    greatSuccessCount: state.greatSuccessCount + Number(result === "great"),
    failCount: state.failCount + Number(result === "fail"), levelUpCount: state.levelUpCount + experience.levelUps,
    todaySales, customerQueue: order.queue,
    recipeRatings: updateRecipeRating(state.recipeRatings, recipe.name, result),
    lastEvent: { type: result, recipe: recipe.name },
    dailyStats: { ...state.dailyStats,
      filledOrders: state.dailyStats.filledOrders + Number(order.fulfilled),
      satisfiedCustomers: state.dailyStats.satisfiedCustomers + Number(order.fulfilled),
      greatCount: state.dailyStats.greatCount + Number(open && result === "great"),
    },
  };
  // Preparation is practice; today's missions begin when the shop opens.
  if (open) {
    next = applyMissionProgress(next, "craft_recipe");
    if (order.fulfilled) next = applyMissionProgress(next, "satisfy_customers");
    if (order.fulfilled && result === "great") next = applyMissionProgress(next, "special_orders");
    next = applyMissionProgress(next, "reach_sales", todaySales, true);
  }
  if (next.level >= ENDING_LEVEL && next.money >= ENDING_MONEY && !next.endingReached) next = { ...next, gamePhase: "ending", endingReached: true };
  return { state: next, receipt: { type: result, levelUps: experience.levelUps, level: experience.level, fulfilled: order.fulfilled,
    recipe: recipe.name, icon: recipe.icon, money: earned, exp, stars: { great: 3, success: 2, fail: 1 }[result], customer: order.customer?.name ?? null } };
}
