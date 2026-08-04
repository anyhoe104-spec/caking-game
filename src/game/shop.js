export const DECORATIONS = [
  { id: "rose-table", name: "ローズのテーブル", price: 1200, icon: "🌹" },
  { id: "harbor-lamp", name: "港町ランプ", price: 2200, icon: "🏮" },
  { id: "royal-case", name: "ロイヤルショーケース", price: 5000, icon: "👑" },
];

export const STAFF = [
  { id: "baker", name: "見習いパティシエ", price: 3000, effect: "獲得ポイント +10%", pointsMultiplier: 1.1 },
  { id: "buyer", name: "仕入れ上手のリコ", price: 4000, effect: "素材の自然回復 +1", regenBonus: 1 },
  { id: "seller", name: "販売名人ソラ", price: 6000, effect: "売上 +10%", salesMultiplier: 1.1 },
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
