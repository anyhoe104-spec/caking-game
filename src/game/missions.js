const POOL = [
  { type: "satisfy_customers", target: (level) => 5 + level * 2, description: (n) => `お客さまを${n}人満足させよう`, reward: { points: 100 } },
  { type: "reach_sales", target: (level) => 5000 + level * 3000, description: (n) => `売上を${n.toLocaleString()}コイン達成しよう`, reward: { money: 500 } },
  { type: "special_orders", target: (level) => Math.max(1, Math.floor(level / 3)), description: (n) => `スペシャルオーダーを${n}回達成しよう`, reward: { points: 200, materials: { strawberry: 2 } } },
  { type: "craft_recipe", target: (level) => 3 + level, description: (n) => `ケーキを${n}個作ろう`, reward: { points: 120 } },
  { type: "buy_materials", target: (level) => 2 + Math.ceil(level / 2), description: (n) => `素材を${n}回購入しよう`, reward: { money: 300 } },
];

export function generateMissions(level, dayNumber) {
  const offset = (dayNumber - 1) % POOL.length;
  return Array.from({ length: 3 }, (_, index) => POOL[(offset + index) % POOL.length]).map((entry, index) => {
    const target = entry.target(level);
    return { id: `day-${dayNumber}-${index}-${entry.type}`, type: entry.type, description: entry.description(target), current: 0, target, reward: entry.reward, completed: false, rewarded: false };
  });
}

export function applyMissionProgress(state, type, amount = 1, absolute = false) {
  let money = state.money;
  let totalPoints = state.totalPoints;
  let materials = state.materials;
  const missions = state.missions.map((mission) => {
    if (mission.type !== type || mission.completed) return mission;
    const current = Math.min(mission.target, absolute ? amount : mission.current + amount);
    const completed = current >= mission.target;
    if (completed && !mission.rewarded) {
      money += mission.reward.money || 0;
      totalPoints += mission.reward.points || 0;
      if (mission.reward.materials) {
        materials = { ...materials };
        for (const [key, value] of Object.entries(mission.reward.materials)) materials[key] = (materials[key] || 0) + value;
      }
    }
    return { ...mission, current, completed, rewarded: completed || mission.rewarded };
  });
  return { ...state, money, totalPoints, materials, missions };
}
