import anchors from "../game/pixelAnchors.json";
import { pixelImg, recipeKey } from "../game/assets.js";

// Pixel art sprites from public/images/pixel/ (built by scripts/process_game_art.py --pixel).
// Sheets are frames side by side; positions inside a scene are given in dots and turned into
// percentages, so a scene scales with its container and stays crisp (image-rendering: pixelated).

/** One sprite sheet: animated through its frames, or held on one frame. */
export function PixelSprite({ src, frames = 1, frame, seconds, className = "", style }) {
  const held = frame !== undefined || frames === 1;
  const position = held && frames > 1 ? `${(frame / (frames - 1)) * 100}% 0` : "0 0";
  return <div
    className={`pixelSprite ${held ? "" : "pixelSprite--animated"} ${className}`}
    aria-hidden="true"
    style={{
      backgroundImage: `url(${src})`,
      backgroundSize: `${frames * 100}% 100%`,
      backgroundPosition: position,
      ...(held ? {} : { animationDuration: `${seconds ?? frames * 0.6}s`, animationTimingFunction: `steps(${frames}, jump-none)` }),
      ...style,
    }}
  />;
}

const place = (x, y, w, h, sceneW, sceneH) => ({
  position: "absolute", left: `${(x / sceneW) * 100}%`, top: `${(y / sceneH) * 100}%`,
  width: `${(w / sceneW) * 100}%`, height: `${(h / sceneH) * 100}%`,
});

/** A standing character from the chibi sheets (48x64 dots, two idle frames). */
export function Chibi({ name, className = "" }) {
  return <PixelSprite src={pixelImg(`chibi/${name}`)} frames={2} seconds={1.3} className={`pixelChibi ${className}`} />;
}

const TOP_ORDER = ["berry", "mint", "pearl", "crown"];
const BAND_FRAME = { ribbon: 1, chocolate: 2 };

/** A crafting step: Mify at the work table, and for later steps the cake on a side table. */
export function PixelCraft({ kind, recipe, cakeStyle }) {
  const W = anchors.sceneWidth, H = 96;
  const spot = anchors.craft[kind];
  const cake = recipeKey(recipe);
  const top = anchors.cakes[cake];
  const left = spot ? spot.cakeX - 16 : 0, cakeTop = spot ? spot.cakeBottom - 32 : 0;
  const topFrame = TOP_ORDER.indexOf(cakeStyle?.top ?? "berry");
  return <div className={`pixelScene craftStation craftStation--${kind}`} aria-hidden="true" style={{ aspectRatio: `${W} / ${H}` }}>
    <PixelSprite src={pixelImg(`craft/${kind}`)} frames={4} seconds={0.8} style={place(0, 0, 128, H, W, H)} />
    {spot && <>
      <img className="pixelImage" src={pixelImg(`craft/side-table-${kind}`)} alt="" style={place(spot.tableX, spot.tableY, spot.tableW, spot.tableH, W, H)} />
      <PixelSprite src={pixelImg(`cakes/${cake}`)} frames={3} frame={0} className="pixelCake" style={place(left, cakeTop, 32, 32, W, H)} />
      {BAND_FRAME[cakeStyle?.band] && <PixelSprite src={pixelImg(`cakes/${cake}`)} frames={3} frame={BAND_FRAME[cakeStyle.band]} style={place(left, cakeTop, 32, 32, W, H)} />}
      {topFrame >= 0 && <PixelSprite src={pixelImg("cakes/tops")} frames={4} frame={topFrame} style={place(left + top.x - 10, cakeTop + top.top - 12, 20, 15, W, H)} />}
    </>}
  </div>;
}
