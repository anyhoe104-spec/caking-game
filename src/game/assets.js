// Static asset paths. BASE_URL is "/caking-game/" in production and "/" in dev.

export const BASE = import.meta.env.BASE_URL;

export const MIFY_IMG = {
  normal: `${BASE}images/characters/mify-normal.png`,
  happy: `${BASE}images/characters/mify-happy.png`,
  sad: `${BASE}images/characters/mify-sad.png`,
  excited: `${BASE}images/characters/mify-excited.png`,
  working: `${BASE}images/characters/mify-working.png`,
};

export const MIFY_FALLBACK = { normal: "🐱", happy: "😸", sad: "🙀", excited: "😻", working: "🐱" };

export const miruImg = (mood = "normal") => `${BASE}images/characters/miru-${mood}.png`;

export const customerImg = (avatarPath) => `${BASE}${avatarPath}`;

// Pixel art built by scripts/process_game_art.py --pixel from art/pixel/.
export const pixelImg = path => `${BASE}images/pixel/${path}.png`;

const RECIPE_FILES = { "ショートケーキ": "shortcake", "プリン": "pudding", "イチゴタルト": "tart", "チョコケーキ": "choco-cake", "ミルフィーユ": "millefeuille", "フルーツパイ": "fruit-pie", "デコレーションケーキ": "decoration-cake", "王様のケーキ": "royal-cake" };
export const staffImg = portrait => `${BASE}images/characters/staff-${portrait}.png`;

export const ingredientImg = key => `${BASE}images/ingredients/${key}.png`;

export const recipeKey = name => RECIPE_FILES[name] ?? "shortcake";
export const recipeImg = name => `${BASE}images/recipes/${RECIPE_FILES[name] ?? "shortcake"}.png`;
