import { useEffect, useMemo, useRef } from "react";
import { Bar, Stars } from "./common.jsx";
import { MATERIAL_ICONS, RECIPES } from "../game/data.js";

/**
 * Recipe list. During service the recipes customers are actually waiting for
 * float to the top and carry an order badge, so the player never has to hold
 * the order list in their head while switching screens.
 */
export default function RecipeView({ state, canMake, onCraft, focusRecipe, onlyMakeable, onToggleFilter }) {
  const cardRefs = useRef({});

  const demand = useMemo(() => {
    const counts = {};
    for (const customer of state.customerQueue) {
      if (customer.status === "waiting") counts[customer.order] = (counts[customer.order] ?? 0) + 1;
    }
    return counts;
  }, [state.customerQueue]);

  const ordered = useMemo(() => {
    const list = RECIPES.map((recipe) => ({
      recipe,
      locked: state.level < recipe.level,
      ready: state.level >= recipe.level && canMake(recipe),
      wanted: demand[recipe.name] ?? 0,
    }));
    return list.sort((a, b) => {
      if (a.wanted !== b.wanted) return b.wanted - a.wanted;
      if (a.locked !== b.locked) return a.locked ? 1 : -1;
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      return a.recipe.level - b.recipe.level;
    });
  }, [state.level, canMake, demand]);

  const visible = onlyMakeable ? ordered.filter((entry) => entry.ready) : ordered;

  useEffect(() => {
    if (!focusRecipe) return;
    const node = cardRefs.current[focusRecipe];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.classList.add("recipeCard--flash");
    const timer = setTimeout(() => node.classList.remove("recipeCard--flash"), 1200);
    return () => clearTimeout(timer);
  }, [focusRecipe]);

  return (
    <div className="tabView">
      <div className="tabHeader">
        <div>
          <h2>レシピ</h2>
          <p>{Object.keys(demand).length > 0 ? "注文中のレシピを上に表示中" : "不足している素材は赤く表示されます"}</p>
        </div>
        <button
          className={`filterChip pressable ${onlyMakeable ? "active" : ""}`}
          onClick={onToggleFilter}
          aria-pressed={onlyMakeable}
        >
          作れるものだけ
        </button>
      </div>

      <div className="recipeList">
        {visible.map(({ recipe, locked, ready, wanted }, index) => (
          <article
            key={recipe.name}
            ref={(node) => { cardRefs.current[recipe.name] = node; }}
            className={`recipeCard card stagger ${locked ? "locked" : ""} ${!locked && !ready ? "missing" : ""} ${wanted > 0 ? "wanted" : ""}`}
            style={{ "--i": index }}
          >
            {wanted > 0 && <span className="orderFlag">注文中 ×{wanted}</span>}
            {locked && <span className="lockRibbon">🔒 Lv{recipe.level}</span>}

            <span className="rIcon">{recipe.icon}</span>
            <div className="rInfo">
              <div className="rName">{recipe.name}</div>
              <Stars rating={state.recipeRatings[recipe.name] ?? 0} />
              <div className="rMeta">
                <span className="tag">Lv{recipe.level}</span>
                <span className="tag gold">+{recipe.price}P</span>
                <span className="tag pink">+{recipe.exp}EXP</span>
              </div>
              <div className="ingList">
                {Object.entries(recipe.ingredients).map(([key, need]) => {
                  const have = state.materials[key] ?? 0;
                  return (
                    <span key={key} className={`ingChip ${have < need ? "lack" : ""}`}>
                      {MATERIAL_ICONS[key]} {have}/{need}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              className={`makeBtn pressable ${ready ? "makeBtn--ok" : ""}`}
              onClick={() => onCraft(recipe)}
              disabled={locked}
            >
              {locked ? `Lv${recipe.level}` : ready ? "つくる" : "素材不足"}
            </button>
          </article>
        ))}

        {visible.length === 0 && (
          <p className="panelEmpty">
            いま作れるレシピがありません。食材を補充するか、フィルターを解除してください。
          </p>
        )}
      </div>

      {state.dayPhase === "open" && (
        <div className="recipeFoot">
          <span>本日の売上</span>
          <Bar value={state.todaySales} max={state.todaySalesGoal} tone="gold" />
          <strong>{state.todaySales.toLocaleString()}P</strong>
        </div>
      )}
    </div>
  );
}
