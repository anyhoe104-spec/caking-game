export function updateRecipeRating(ratings, recipeName, result) {
  const earned = result === "great" ? 3 : result === "success" ? 2 : 1;
  return { ...ratings, [recipeName]: Math.max(ratings[recipeName] || 0, earned) };
}

export function getMiruMessage(state) {
  if (state.lastEvent?.type === "great") return "すごい！大成功！この調子だよ✨";
  if (state.lastEvent?.type === "fail") return "ドンマイ！次はきっとうまくいくよ♪";
  if (state.lastEvent?.type === "shortage") return `${state.lastEvent.material || "素材"}がたりないよ！かいにいこう♪`;
  const waiting = state.customerQueue.find((customer) => customer.status === "waiting");
  if (state.dayPhase === "open" && waiting) return `${waiting.name}が待ってるよ！${waiting.orderRecipe}を作ろう！`;
  if (state.dayPhase === "report") return "今日もおつかれさま！日報を確認しよう♪";
  return "今日もがんばろう！ミルも応援してるよ✨";
}
