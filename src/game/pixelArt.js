import anchors from "./pixelAnchors.json";
import { pixelImg } from "./assets.js";

const CRAFT_KINDS = ["whisk", "oven", "layer", "decorate", "glaze", "roll", "fold", "steam", "cool"];
const CHIBI = ["mify", "cerise", "noix", "fig", "sage", "olive", "toma", "beurre", "peche", "mint", "melissa", "aprico", "cardamom"];

/**
 * Fetch every sprite once, soon after start-up (about 300KB in all). A crafting step lasts
 * under a second, and a sheet fetched only when its step begins can miss it entirely.
 */
export function preloadPixelArt() {
  const paths = [
    ...CRAFT_KINDS.map(kind => `craft/${kind}`),
    ...Object.keys(anchors.craft).map(kind => `craft/side-table-${kind}`),
    ...Object.keys(anchors.cakes).map(cake => `cakes/${cake}`), "cakes/tops",
    ...CHIBI.map(name => `chibi/${name}`),
  ];
  return paths.map(path => { const image = new Image(); image.src = pixelImg(path); return image; });
}
