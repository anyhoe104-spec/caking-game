// Static asset paths. BASE_URL is "/caking-game/" in production and "/" in dev.

export const BASE = import.meta.env.BASE_URL;

export const MIFFY_IMG = {
  normal: `${BASE}images/characters/miffy-normal.png`,
  happy: `${BASE}images/characters/miffy-happy.png`,
  sad: `${BASE}images/characters/miffy-sad.png`,
  excited: `${BASE}images/characters/miffy-excited.png`,
  working: `${BASE}images/characters/miffy-working.png`,
};

export const MIFFY_FALLBACK = { normal: "🐱", happy: "😸", sad: "🙀", excited: "😻", working: "🐱" };

export const miruImg = (mood = "normal") => `${BASE}images/characters/miru-${mood}.png`;

export const customerImg = (avatarPath) => `${BASE}${avatarPath}`;
