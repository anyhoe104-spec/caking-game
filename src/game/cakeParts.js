export const CAKE_PARTS = [
  { id: "berry", name: "摘みたていちご", category: "top", price: 0, color: "#c84e5c", note: "工房の定番。甘酸っぱい赤い宝石。" },
  { id: "mint", name: "小さなハーブ園", category: "top", price: 600, color: "#649b75", note: "緑の葉を添えて、さわやかな仕上がり。" },
  { id: "ribbon", name: "いちご色のリボン", category: "band", price: 1200, color: "#d88296", note: "箱を開けたときの、ときめきを。" },
  { id: "chocolate", name: "ショコラの帯", category: "band", price: 1800, color: "#694633", note: "ビターな色で、少し大人の装い。" },
  { id: "pearl", name: "月あかりの真珠", category: "top", premium: true, productId: "caking.moonlight.v1", color: "#cfb36f", note: "月夜をイメージした砂糖の真珠。" },
  { id: "crown", name: "港町の小さな王冠", category: "top", premium: true, productId: "caking.harborcrown.v1", color: "#cc9a45", note: "記念日のケーキを特別にする王冠。" },
];
export const defaultCakeStyle = () => ({ top: "berry", band: null });
export function normalizeCakeParts(raw = {}) {
  const ids = Array.isArray(raw.ownedCakeParts) ? raw.ownedCakeParts : [];
  // Browser saves can never grant paid ownership. Native receipt verification is a separate future boundary.
  const ownedCakeParts = [...new Set(["berry", ...ids.filter(id => CAKE_PARTS.some(p => p.id === id && !p.premium))])];
  const cakeStyle = defaultCakeStyle();
  for (const slot of ["top", "band"]) {
    const id = raw.cakeStyle?.[slot];
    if (ownedCakeParts.includes(id) && CAKE_PARTS.some(p => p.id === id && p.category === slot)) cakeStyle[slot] = id;
  }
  return { ownedCakeParts, cakeStyle };
}
export function buyCakePart(state, id) {
  const part = CAKE_PARTS.find(p => p.id === id);
  const current = normalizeCakeParts(state);
  if (!part || part.premium || current.ownedCakeParts.includes(id) || state.money < part.price) return state;
  return { ...state, ...current, money: state.money - part.price, ownedCakeParts: [...current.ownedCakeParts, id] };
}
export function equipCakePart(state, id) {
  const current = normalizeCakeParts(state);
  const part = CAKE_PARTS.find(p => p.id === id);
  if (!part || !current.ownedCakeParts.includes(id)) return state;
  return { ...state, ...current, cakeStyle: { ...current.cakeStyle, [part.category]: id } };
}
