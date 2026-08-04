import { LEVEL_CAP } from "./data.js";

export const ENDING_LEVEL = 10;
export const ENDING_MONEY = 100000;

export const capByLevel = (level) => LEVEL_CAP[Math.min(10, Math.max(1, level))] ?? 30;

export function rollCraftResult(level, randomValue) {
  const pFail = Math.max(0.03, 0.15 - (level - 1) * (0.12 / 9));
  const pGreat = Math.min(0.25, 0.1 + (level - 1) * (0.15 / 9));
  if (randomValue < pFail) return "fail";
  if (randomValue < pFail + pGreat) return "great";
  return "success";
}

export function applyExperience(exp, level, gain) {
  let nextExp = exp + gain;
  let nextLevel = level;
  let levelUps = 0;
  while (nextExp >= nextLevel * 50 && nextLevel < 99) {
    nextExp -= nextLevel * 50;
    nextLevel += 1;
    levelUps += 1;
  }
  return { exp: nextExp, level: nextLevel, levelUps };
}

export function calcPoints(result, recipe, customer = null) {
  let points = result === "great"
    ? Math.floor(recipe.exp * 1.5)
    : result === "fail"
      ? Math.max(1, Math.floor(recipe.exp * 0.1))
      : recipe.exp;
  if (customer && result !== "fail") {
    points += customer.hearts * 10;
    if (result === "great") points += customer.hearts * 10;
  }
  return points;
}
