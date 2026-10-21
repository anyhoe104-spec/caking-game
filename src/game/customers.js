import { RECIPES } from "./data.js";

// Names follow docs/world/characters.md (2026-10-18): humans after foods, beastfolk
// after spices and herbs, called by name alone. `key` names the pixel art files.
export const CUSTOMERS = [
  ["スリーズ", "cerise", ["ショートケーキ", "イチゴタルト"], 2, 120],
  ["ノワ", "noix", ["チョコケーキ", "プリン"], 1, 90],
  ["マダム・フィグ", "fig", ["王様のケーキ", "ミルフィーユ"], 3, 150],
  ["セージ", "sage", ["プリン"], 1, 180],
  ["オリーヴ", "olive", ["フルーツパイ", "イチゴタルト"], 2, 110],
  ["トマ", "toma", ["チョコケーキ", "ショートケーキ"], 2, 100],
  ["シェフ・ブール", "beurre", ["デコレーションケーキ", "王様のケーキ"], 3, 90],
  ["ペッシュ", "peche", ["プリン", "ショートケーキ"], 1, 140],
  ["ミント", "mint", ["ミルフィーユ", "フルーツパイ"], 2, 120],
  ["メリッサ", "melissa", ["イチゴタルト", "チョコケーキ"], 2, 120],
  ["アプリコ", "aprico", ["デコレーションケーキ", "ショートケーキ"], 3, 130],
  ["カルダモン", "cardamom", ["王様のケーキ", "フルーツパイ"], 3, 100],
].map(([name, key, preferredRecipes, hearts, timeLimit]) => ({ name, key, preferredRecipes, hearts, timeLimit }));

export const customerIconPath = key => `images/pixel/customers/${key}.png`;

// Saves from before the renaming keep the old portrait path on queued customers.
const LEGACY_AVATARS = { sakura: "cerise", hiroto: "noix", "madame-rose": "fig", grandpa: "sage", michiru: "olive", kai: "toma",
  chef: "beurre", yui: "peche", "twins-a": "mint", "twins-b": "melissa", hana: "aprico", traveler: "cardamom" };

/** The customer a saved queue entry stands for, from its key or its pre-renaming portrait. */
export function customerFor(entry) {
  const key = entry?.key ?? LEGACY_AVATARS[/^images\/characters\/customer-([a-z-]+)\.png$/.exec(entry?.avatarPath ?? "")?.[1]];
  return CUSTOMERS.find(customer => customer.key === key) ?? null;
}

const seededSort = (items, seed) => [...items].sort((a, b) => {
  const score = (value) => [...value].reduce((sum, char) => sum + char.charCodeAt(0), seed);
  return (score(a.name) % 97) - (score(b.name) % 97);
});

export function generateCustomerQueue(level, dayNumber = 1) {
  const unlocked = RECIPES.filter((recipe) => recipe.level <= level).map((recipe) => recipe.name);
  const eligible = CUSTOMERS.filter((customer) => customer.preferredRecipes.some((recipe) => unlocked.includes(recipe)));
  const count = Math.min(8, 3 + Math.floor(level / 2));
  return seededSort(eligible, dayNumber + level).slice(0, count).map((customer, index) => {
    const orderRecipe = customer.preferredRecipes.find((recipe) => unlocked.includes(recipe)) || unlocked[0];
    const id = `day-${dayNumber}-${index}`;
    return { ...customer, id, uid: id, avatarPath: customerIconPath(customer.key), orderRecipe, order: orderRecipe, tl: customer.timeLimit, timeRemaining: customer.timeLimit, status: "waiting", arrivedAt: index };
  });
}

export function fulfillOrder(queue, recipeName, result) {
  const matchIndex = queue.findIndex((customer) => customer.status === "waiting" && customer.orderRecipe === recipeName);
  if (matchIndex < 0 || result === "fail") return { queue, customer: null, moneyBonus: 0, fulfilled: false };
  const customer = queue[matchIndex];
  const status = result === "great" ? "special" : "fulfilled";
  const nextQueue = queue.map((entry, index) => index === matchIndex ? { ...entry, status, timeRemaining: Math.max(0, entry.timeRemaining) } : entry);
  return { queue: nextQueue, customer, moneyBonus: customer.hearts * (status === "special" ? 200 : 100), fulfilled: true };
}
