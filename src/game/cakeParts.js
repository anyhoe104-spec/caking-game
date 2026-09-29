import { RECIPES } from "./data.js";

export const CAKE_PARTS = [
  { id: "berry", name: "摘みたていちご", category: "top", price: 0, color: "#c84e5c", note: "工房の定番。甘酸っぱい赤い宝石。" },
  { id: "mint", name: "小さなハーブ園", category: "top", price: 600, color: "#649b75", note: "緑の葉を添えて、さわやかな仕上がり。" },
  { id: "ribbon", name: "いちご色のリボン", category: "band", price: 1200, color: "#d88296", note: "箱を開けたときの、ときめきを。" },
  { id: "chocolate", name: "ショコラの帯", category: "band", price: 1800, color: "#694633", note: "ビターな色で、少し大人の装い。" },
  { id: "pearl", name: "月あかりの真珠", category: "top", premium: true, productId: "caking.moonlight.v1", color: "#cfb36f", note: "月夜をイメージした砂糖の真珠。" },
  { id: "crown", name: "港町の小さな王冠", category: "top", premium: true, productId: "caking.harborcrown.v1", color: "#cc9a45", note: "記念日のケーキを特別にする王冠。" },
];
export const defaultCakeStyle = () => ({ top: "berry", band: null });

// Each recipe keeps its own decoration. Ownership stays shared: a part bought
// once can be worn by every cake.
const recipeNames = RECIPES.map(recipe => recipe.name);
const isRecipe = name => typeof name === "string" && recipeNames.includes(name);

function normalizeStyle(style, ownedCakeParts, fallback) {
  const result = { ...fallback };
  for (const slot of ["top", "band"]) {
    const id = style?.[slot];
    if (ownedCakeParts.includes(id) && CAKE_PARTS.some(p => p.id === id && p.category === slot)) result[slot] = id;
  }
  return result;
}

export function normalizeCakeParts(raw = {}) {
  const ids = Array.isArray(raw.ownedCakeParts) ? raw.ownedCakeParts : [];
  // Browser saves can never grant paid ownership. Native receipt verification is a separate future boundary.
  const ownedCakeParts = [...new Set(["berry", ...ids.filter(id => CAKE_PARTS.some(p => p.id === id && !p.premium))])];
  // Saves before per-recipe styles held one `cakeStyle` for every cake. It
  // becomes the starting look of each recipe, so nothing changes on screen.
  const legacy = normalizeStyle(raw.cakeStyle, ownedCakeParts, defaultCakeStyle());
  const stored = raw.cakeStyles !== null && typeof raw.cakeStyles === "object" ? raw.cakeStyles : {};
  const cakeStyles = Object.fromEntries(recipeNames.map(name => [name,
    Object.hasOwn(stored, name) ? normalizeStyle(stored[name], ownedCakeParts, defaultCakeStyle()) : { ...legacy }]));
  const lastCraftedRecipe = isRecipe(raw.lastCraftedRecipe) ? raw.lastCraftedRecipe : null;
  return { ownedCakeParts, cakeStyles, lastCraftedRecipe };
}

export const cakeStyleFor = (state, recipe) => state.cakeStyles?.[recipe] ?? defaultCakeStyle();

/** The shop window shows the cake made most recently, or the first recipe before any. */
export const storefrontCakeStyle = state => cakeStyleFor(state, state.lastCraftedRecipe ?? recipeNames[0]);

export function buyCakePart(state, id) {
  const part = CAKE_PARTS.find(p => p.id === id);
  const current = normalizeCakeParts(state);
  if (!part || part.premium || current.ownedCakeParts.includes(id) || state.money < part.price) return state;
  return { ...state, ...current, money: state.money - part.price, ownedCakeParts: [...current.ownedCakeParts, id] };
}
export function equipCakePart(state, id, recipe) {
  const current = normalizeCakeParts(state);
  const part = CAKE_PARTS.find(p => p.id === id);
  if (!part || !isRecipe(recipe) || !current.ownedCakeParts.includes(id)) return state;
  const cakeStyles = { ...current.cakeStyles, [recipe]: { ...current.cakeStyles[recipe], [part.category]: id } };
  return { ...state, ...current, cakeStyles };
}

/** Reset appearance only. Paid/earned inventory and currency are never refunded. */
export function resetCakeParts(state, slot = "all", recipe) {
  if (!["all", "top", "band"].includes(slot) || !isRecipe(recipe)) return state;
  const current = normalizeCakeParts(state);
  const defaults = defaultCakeStyle();
  const style = slot === "all" ? defaults : { ...current.cakeStyles[recipe], [slot]: defaults[slot] };
  return { ...state, ...current, cakeStyles: { ...current.cakeStyles, [recipe]: style } };
}
