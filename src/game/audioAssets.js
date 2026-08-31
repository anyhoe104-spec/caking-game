// Which file plays for which key, and which BGM belongs to which scene.
// Filenames match scripts/generate_audio.py so regenerated assets drop straight in.

export const BGM_KEYS = {
  opening: "opening-theme",
  menu: "menu-bgm",
  shop: "shop-bgm",
  report: "report-bgm",
  ending: "ending-theme",
};

export const SE_KEYS = [
  "tap",
  "nav",
  "buy",
  "coin",
  "equip",
  "hire",
  "success",
  "great",
  "error",
  "order",
  "levelup",
  "unlock",
  "mission",
  "daystart",
  "dayend",
];

export const VOICE_KEYS = [
  "voice-miffy-ready",
  "voice-miffy-done",
  "voice-miffy-great",
  "voice-miffy-fail",
  "voice-miffy-order",
  "voice-miffy-levelup",
  "voice-miru-hello",
  "voice-miru-cheer",
  "voice-miru-report",
];

/** Preloaded on boot: short, and needed the moment the player touches anything. */
export const EAGER_SE = ["tap", "nav", "error", "success", "buy"];

/**
 * Scene resolution for BGM. `report` wins over the day phase so the daily
 * report gets its own cue, and `open` wins over the active tab so browsing
 * recipes mid-service does not interrupt the shop loop.
 */
export function resolveScene(state) {
  if (state.gamePhase === "opening") return "opening";
  if (state.gamePhase === "ending") return "ending";
  if (state.dayPhase === "report") return "report";
  if (state.dayPhase === "open") return "shop";
  return "menu";
}

export function assetUrl(base, key) {
  return `${base}sounds/${key}.mp3`;
}
