export const DECORATIONS = [
  { id: "rose-table", name: "ローズのテーブル", price: 1200, icon: "🌹" },
  { id: "harbor-lamp", name: "港町ランプ", price: 2200, icon: "🏮" },
  { id: "royal-case", name: "ロイヤルショーケース", price: 5000, icon: "👑" },
];

export const STAFF = [
  // The ids predate the current cast and stay as they are so saved hires carry over.
  // Names and roles follow docs/world/characters.md (the merchant house's staff).
  { id: "baker", name: "商会メイドのアニス", portrait: "anis", price: 3000, effect: "獲得ポイント +10%", note: "明るい接客で、お客様の満足度が上がります", pointsMultiplier: 1.1 },
  { id: "buyer", name: "侍従長のクミン", portrait: "cumin", price: 4000, effect: "素材の自然回復 +1", note: "商会の貯蔵庫を切り盛りし、素材をこまめに補います", regenBonus: 1 },
  { id: "seller", name: "経理のシナモン", portrait: "cinnamon", price: 6000, effect: "売上 +10%", note: "帳簿に強く、値付けと売り方を整えます", salesMultiplier: 1.1 },
];

export function buyDecoration(state, decoration) {
  if (state.decorations.includes(decoration.id) || state.money < decoration.price) return state;
  return { ...state, money: state.money - decoration.price, decorations: [...state.decorations, decoration.id] };
}
export function equipDecoration(state, id) { return state.decorations.includes(id) ? { ...state, equippedDecoration: id } : state; }
export function hireStaff(state, member) { return state.staff.includes(member.id) || state.money < member.price ? state : { ...state, money: state.money - member.price, staff: [...state.staff, member.id] }; }
export function getStaffEffects(staffIds) {
  return STAFF.filter((member) => staffIds.includes(member.id)).reduce((effects, member) => ({ regenBonus: effects.regenBonus + (member.regenBonus || 0), pointsMultiplier: effects.pointsMultiplier * (member.pointsMultiplier || 1), salesMultiplier: effects.salesMultiplier * (member.salesMultiplier || 1) }), { regenBonus: 0, pointsMultiplier: 1, salesMultiplier: 1 });
}
