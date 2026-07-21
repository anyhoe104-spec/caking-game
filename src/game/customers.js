import { RECIPES } from "./data.js";

export const CUSTOMERS = [
  ["さくらさん", "customer-sakura", ["ショートケーキ", "イチゴタルト"], 2, 120],
  ["ひろとくん", "customer-hiroto", ["チョコケーキ", "プリン"], 1, 90],
  ["マダム・ローズ", "customer-madame-rose", ["王様のケーキ", "ミルフィーユ"], 3, 150],
  ["おじいちゃん", "customer-grandpa", ["プリン"], 1, 180],
  ["みちるさん", "customer-michiru", ["フルーツパイ", "イチゴタルト"], 2, 110],
  ["カイくん", "customer-kai", ["チョコケーキ", "ショートケーキ"], 2, 100],
  ["シェフ", "customer-chef", ["デコレーションケーキ", "王様のケーキ"], 3, 90],
  ["ゆいちゃん", "customer-yui", ["プリン", "ショートケーキ"], 1, 140],
  ["ふたご・アオ", "customer-twins-a", ["ミルフィーユ", "フルーツパイ"], 2, 120],
  ["ふたご・モモ", "customer-twins-b", ["イチゴタルト", "チョコケーキ"], 2, 120],
  ["ハナさん", "customer-hana", ["デコレーションケーキ", "ショートケーキ"], 3, 130],
  ["旅人さん", "customer-traveler", ["王様のケーキ", "フルーツパイ"], 3, 100],
].map(([name, avatar, preferredRecipes, hearts, timeLimit]) => ({ name, avatar, preferredRecipes, hearts, timeLimit }));

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
    return { ...customer, id: `day-${dayNumber}-${index}`, avatarPath: `images/characters/${customer.avatar}.png`, orderRecipe, timeRemaining: customer.timeLimit, status: "waiting", arrivedAt: index };
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
