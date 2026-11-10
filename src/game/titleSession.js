// The title screen opens each launch of the app (a new tab, a cold start of the installed
// app), not each reload, so a reload mid-day goes straight back to the shop.
const KEY = "caking-title-seen";

export function titleSeen() {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function markTitleSeen() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode: shown again next load */ }
}
