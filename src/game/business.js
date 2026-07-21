export const BUSINESS_DURATION = 300;

export function startBusiness(state, customerQueue = state.customerQueue) {
  if (state.dayPhase !== "prep") return state;
  return { ...state, dayPhase: "open", businessTimer: BUSINESS_DURATION, todaySales: 0, customerQueue, dailyStats: { filledOrders: 0, satisfiedCustomers: 0, greatCount: 0 }, missions: state.missions.map((mission) => ({ ...mission, current: 0, completed: false })) };
}

export function tickBusiness(state) {
  if (state.dayPhase !== "open") return state;
  if (state.businessTimer <= 1) return { ...state, businessTimer: 0, dayPhase: "report" };
  return { ...state, businessTimer: state.businessTimer - 1, customerQueue: state.customerQueue.map((customer) => customer.status === "waiting" ? { ...customer, timeRemaining: Math.max(0, customer.timeRemaining - 1), status: customer.timeRemaining <= 1 ? "expired" : "waiting" } : customer) };
}

export function nextDay(state, missions = []) {
  if (state.dayPhase !== "report") return state;
  const dayNumber = state.dayNumber + 1;
  return { ...state, dayPhase: "prep", dayNumber, businessTimer: BUSINESS_DURATION, todaySales: 0, todaySalesGoal: 5000 + state.level * 3000, customerQueue: [], missions, dailyStats: { filledOrders: 0, satisfiedCustomers: 0, greatCount: 0 } };
}

export function formatTimer(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
