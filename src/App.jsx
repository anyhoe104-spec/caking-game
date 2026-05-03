import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const MATERIAL_LABELS = {
  egg: "卵",
  cream: "生クリーム",
  strawberry: "いちご",
  flour: "小麦粉",
  sugar: "砂糖",
  milk: "牛乳",
  butter: "バター",
};

const MATERIAL_ICONS = {
  egg: "🥚",
  cream: "🍦",
  strawberry: "🍓",
  flour: "🌾",
  sugar: "✨",
  milk: "🥛",
  butter: "🧈",
};

const RECIPES = [
  {
    name: "ショートケーキ",
    level: 1,
    price: 600,
    exp: 20,
    ingredients: { egg: 3, cream: 3, strawberry: 3, flour: 2, sugar: 2 },
  },
  {
    name: "プリン",
    level: 2,
    price: 300,
    exp: 10,
    ingredients: { egg: 2, milk: 3, sugar: 2 },
  },
  {
    name: "イチゴタルト",
    level: 3,
    price: 900,
    exp: 35,
    ingredients: { egg: 5, sugar: 5, strawberry: 2, flour: 3, butter: 3 },
  },
  {
    name: "ミルフィーユ",
    level: 5,
    price: 1200,
    exp: 60,
    ingredients: { flour: 5, butter: 5, cream: 4, sugar: 3, strawberry: 2 },
  },
  {
    name: "デコレーションケーキ",
    level: 10,
    price: 2200,
    exp: 120,
    ingredients: { egg: 6, cream: 6, strawberry: 6, flour: 4, sugar: 4, butter: 2 },
  },
];

const MATERIAL_MAX = 10;
const BUY_AMOUNT = 3;
const BUY_COST = 200;
const REGEN_INTERVAL_MS = 5000;

const STORAGE_KEY = "caking-save-v1";

const BASE_MATERIALS = {
  egg: 5,
  cream: 5,
  strawberry: 5,
  flour: 5,
  sugar: 5,
  milk: 5,
  butter: 5,
};

function clampMaterialRecord(raw) {
  const out = { ...BASE_MATERIALS };
  if (!raw || typeof raw !== "object") return out;
  for (const key of Object.keys(BASE_MATERIALS)) {
    const n = Number(raw[key]);
    out[key] = Number.isFinite(n)
      ? Math.min(MATERIAL_MAX, Math.max(0, Math.floor(n)))
      : BASE_MATERIALS[key];
  }
  return out;
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const money = Number(data.money);
    const level = Number(data.level);
    const exp = Number(data.exp);
    return {
      money: Number.isFinite(money) ? Math.max(0, Math.floor(money)) : 1000,
      level: Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1,
      exp: Number.isFinite(exp) ? Math.max(0, Math.floor(exp)) : 0,
      materials: clampMaterialRecord(data.materials),
      craftCount: Number.isFinite(Number(data.craftCount))
        ? Math.max(0, Math.floor(Number(data.craftCount)))
        : 0,
      buyCount: Number.isFinite(Number(data.buyCount))
        ? Math.max(0, Math.floor(Number(data.buyCount)))
        : 0,
      levelUpCount: Number.isFinite(Number(data.levelUpCount))
        ? Math.max(0, Math.floor(Number(data.levelUpCount)))
        : 0,
      soundOn: typeof data.soundOn === "boolean" ? data.soundOn : true,
    };
  } catch {
    return null;
  }
}

function getDefaultSave() {
  return {
    money: 1000,
    level: 1,
    exp: 0,
    materials: { ...BASE_MATERIALS },
    craftCount: 0,
    buyCount: 0,
    levelUpCount: 0,
    soundOn: true,
  };
}

const RECIPE_ICONS = {
  ショートケーキ: "🍰",
  プリン: "🍮",
  イチゴタルト: "🥧",
  ミルフィーユ: "🥐",
  デコレーションケーキ: "🎂",
};

/** 通知用（子ども向けひらがな） */
const MATERIAL_KIDS_NAME = {
  egg: "たまご",
  cream: "くりーむ",
  strawberry: "いちご",
  flour: "こむぎこ",
  sugar: "さとう",
  milk: "ぎゅうにゅう",
  butter: "ばたー",
};

const MATERIAL_IMAGES = {
  egg: "/images/ingredients/egg.png",
  cream: "/images/ingredients/cream.png",
  strawberry: "/images/ingredients/strawberry.png",
  flour: "/images/ingredients/flour.png",
  sugar: "/images/ingredients/sugar.png",
  milk: "/images/ingredients/milk.png",
  butter: "/images/ingredients/butter.png",
};

const RECIPE_IMAGES = {
  ショートケーキ: "/images/recipes/shortcake.png",
  プリン: "/images/recipes/pudding.png",
  イチゴタルト: "/images/recipes/tart.png",
  ミルフィーユ: "/images/recipes/millefeuille.png",
  デコレーションケーキ: "/images/recipes/decoration-cake.png",
};

const SOUND_VOLUME = 0.28;

const SOUNDS = {
  tap: "/sounds/tap.mp3",
  buy: "/sounds/buy.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  levelup: "/sounds/levelup.mp3",
};

function playSfx(key, enabled) {
  if (!enabled) return;
  try {
    const audio = new Audio(SOUNDS[key]);
    audio.volume = SOUND_VOLUME;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* missing file or unsupported: ignore */
  }
}

function MaterialCardVisual({ materialKey }) {
  const [failed, setFailed] = useState(false);
  const src = MATERIAL_IMAGES[materialKey];
  const icon = MATERIAL_ICONS[materialKey] ?? "🍬";
  if (!src || failed) {
    return (
      <div className="cardVisual materialCardVisual cardVisual--fallback" aria-hidden>
        <span className="cardVisualEmoji materialCardVisualEmoji">{icon}</span>
      </div>
    );
  }
  return (
    <div className="cardVisual materialCardVisual">
      <img
        src={src}
        alt={MATERIAL_LABELS[materialKey] ?? materialKey}
        className="cardVisualImg"
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function RecipeCardVisual({ recipeName, compact = false }) {
  const [failed, setFailed] = useState(false);
  const src = RECIPE_IMAGES[recipeName];
  const icon = RECIPE_ICONS[recipeName] ?? "🍽️";
  const cls = ["cardVisual", "recipeCardVisual", compact ? "recipeCardVisual--compact" : ""]
    .filter(Boolean)
    .join(" ");
  if (!src || failed) {
    return (
      <div className={`${cls} cardVisual--fallback`} aria-hidden>
        <span className="cardVisualEmoji recipeCardVisualEmoji">{icon}</span>
      </div>
    );
  }
  return (
    <div className={cls}>
      <img
        src={src}
        alt={recipeName}
        className="cardVisualImg"
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function IngredientMiniVisual({ materialKey }) {
  const [failed, setFailed] = useState(false);
  const src = MATERIAL_IMAGES[materialKey];
  const icon = MATERIAL_ICONS[materialKey] ?? "🍬";
  if (!src || failed) {
    return (
      <span className="ingredientMiniFallback" aria-hidden>
        {icon}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="ingredientMiniImg"
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function App() {
  const bootRef = useRef(null);
  if (bootRef.current === null) {
    bootRef.current = loadPersisted() ?? getDefaultSave();
  }
  const boot = bootRef.current;

  const [money, setMoney] = useState(boot.money);
  const [level, setLevel] = useState(boot.level);
  const [exp, setExp] = useState(boot.exp);
  const [activeTab, setActiveTab] = useState("home");
  const [soundOn, setSoundOn] = useState(boot.soundOn);
  const [materials, setMaterials] = useState(boot.materials);
  const [craftCount, setCraftCount] = useState(boot.craftCount);
  const [buyCount, setBuyCount] = useState(boot.buyCount);
  const [levelUpCount, setLevelUpCount] = useState(boot.levelUpCount);
  const [craftedPulse, setCraftedPulse] = useState(null);
  const [boughtPulse, setBoughtPulse] = useState(null);
  const [plusPopKey, setPlusPopKey] = useState(null);
  const [moneyPop, setMoneyPop] = useState(false);
  const [expPop, setExpPop] = useState(false);
  const [toast, setToast] = useState(null);
  const [levelUpFx, setLevelUpFx] = useState(false);

  const canMake = (recipe) => {
    return Object.entries(recipe.ingredients).every(
      ([key, value]) => (materials[key] ?? 0) >= value
    );
  };

  const showToast = (message, hint = "", actionTab = "", kind = "default") => {
    setToast({ message, hint, actionTab, kind });
  };

  const goTab = (tab) => {
    playSfx("tap", soundOn);
    setActiveTab(tab);
  };

  const makeItem = (recipe) => {
    if (level < recipe.level) {
      playSfx("error", soundOn);
      showToast(`Lv${recipe.level} で ひらくよ！`, "もうすこしで つくれる！", "", "error");
      return;
    }
    if (!canMake(recipe)) {
      playSfx("error", soundOn);
      const missing = getMissing(recipe);
      const lackName = MATERIAL_KIDS_NAME[missing[0]] ?? "ざいりょう";
      showToast(`${lackName}がたりないよ！`, "ざいりょうをかってね！", "material", "error");
      return;
    }

    const newMaterials = { ...materials };
    Object.entries(recipe.ingredients).forEach(([key, value]) => {
      newMaterials[key] -= value;
    });

    setMaterials(newMaterials);
    setMoney(money + recipe.price);
    setMoneyPop(true);
    setExpPop(true);
    setCraftCount((c) => c + 1);
    const nextExp = exp + recipe.exp;

    if (nextExp > level * 50) {
      playSfx("levelup", soundOn);
      setLevel(level + 1);
      setExp(0);
      setLevelUpCount((c) => c + 1);
      setCraftedPulse(recipe.name);
      setLevelUpFx(true);
      showToast("レベルアップ！", "新しいレシピがふえたよ！", "", "levelup");
      return;
    }

    playSfx("success", soundOn);
    setExp(nextExp);
    setCraftedPulse(recipe.name);
    showToast("できた！", `${recipe.name}をつくったよ！`, "", "success");
  };

  const expToNext = level * 50;
  const expRatio = Math.max(0, Math.min(1, expToNext === 0 ? 0 : exp / expToNext));
  const expRemaining = Math.max(0, expToNext - exp);

  const inventoryList = useMemo(() => {
    const entries = Object.entries(materials);
    entries.sort(([a], [b]) => a.localeCompare(b, "en"));
    return entries;
  }, [materials]);

  const efficiencyOf = (recipe) => {
    const total = Object.values(recipe.ingredients).reduce((sum, n) => sum + n, 0);
    return total <= 0 ? 0 : recipe.price / total;
  };

  const getMissing = (recipe) => {
    const missing = [];
    for (const [key, need] of Object.entries(recipe.ingredients)) {
      const have = materials[key] ?? 0;
      if (have < need) missing.push(key);
    }
    return missing;
  };

  const buyMaterial = (key) => {
    const have = materials[key] ?? 0;
    if (money < BUY_COST) {
      playSfx("error", soundOn);
      showToast("おかねがたりないよ！", "ケーキをつくっておかねをふやそう", "", "error");
      return;
    }
    if (have >= MATERIAL_MAX) {
      playSfx("error", soundOn);
      showToast("もういっぱい！", "べつのざいりょうをみてみよう", "", "error");
      return;
    }

    playSfx("buy", soundOn);
    setBuyCount((c) => c + 1);
    setMoney(money - BUY_COST);
    setMaterials({
      ...materials,
      [key]: Math.min(MATERIAL_MAX, have + BUY_AMOUNT),
    });
    setBoughtPulse(key);
    setPlusPopKey(key);
    showToast(`${MATERIAL_LABELS[key] ?? key} +3`, "やったね！", "", "buy");
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setMaterials((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const have = next[key] ?? 0;
          if (have < MATERIAL_MAX) next[key] = have + 1;
        }
        return next;
      });
    }, REGEN_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!craftedPulse) return;
    const t = window.setTimeout(() => setCraftedPulse(null), 260);
    return () => window.clearTimeout(t);
  }, [craftedPulse]);

  useEffect(() => {
    if (!boughtPulse) return;
    const t = window.setTimeout(() => setBoughtPulse(null), 260);
    return () => window.clearTimeout(t);
  }, [boughtPulse]);

  useEffect(() => {
    if (!plusPopKey) return;
    const t = window.setTimeout(() => setPlusPopKey(null), 500);
    return () => window.clearTimeout(t);
  }, [plusPopKey]);

  useEffect(() => {
    if (!moneyPop) return;
    const t = window.setTimeout(() => setMoneyPop(false), 420);
    return () => window.clearTimeout(t);
  }, [moneyPop]);

  useEffect(() => {
    if (!expPop) return;
    const t = window.setTimeout(() => setExpPop(false), 520);
    return () => window.clearTimeout(t);
  }, [expPop]);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.kind === "levelup" ? 2400 : toast.kind === "success" ? 2000 : 1800;
    const t = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!levelUpFx) return;
    const t = window.setTimeout(() => setLevelUpFx(false), 700);
    return () => window.clearTimeout(t);
  }, [levelUpFx]);

  useEffect(() => {
    const payload = {
      money,
      level,
      exp,
      materials,
      craftCount,
      buyCount,
      levelUpCount,
      soundOn,
      v: 1,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota or private mode */
    }
  }, [money, level, exp, materials, craftCount, buyCount, levelUpCount, soundOn]);

  const resetFromStart = () => {
    if (!window.confirm("はじめから にしますか？")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const d = getDefaultSave();
    bootRef.current = d;
    setMoney(d.money);
    setLevel(d.level);
    setExp(d.exp);
    setMaterials(d.materials);
    setSoundOn(d.soundOn);
    setCraftCount(d.craftCount);
    setBuyCount(d.buyCount);
    setLevelUpCount(d.levelUpCount);
    setToast(null);
  };

  const recipeWithEfficiency = useMemo(() => {
    return RECIPES.map((r) => ({ ...r, efficiency: efficiencyOf(r) }));
  }, [materials]);

  const recommendedRecipe = useMemo(() => {
    const unlocked = recipeWithEfficiency.filter((r) => level >= r.level);
    if (unlocked.length === 0) return recipeWithEfficiency[0];
    const makeable = unlocked.filter((r) => canMake(r));
    if (makeable.length > 0) {
      return [...makeable].sort((a, b) => b.efficiency - a.efficiency)[0];
    }
    return [...unlocked].sort((a, b) => a.level - b.level)[0];
  }, [level, materials, recipeWithEfficiency]);

  const customerCount = 12 + level * 3;
  const reputation = Math.min(100, 40 + level * 5);

  return (
    <div className={`phoneStage ${levelUpFx ? "isLevelUp" : ""}`}>
      <div className="appShell">
        <header className="appHeader">
          <div className="appHeaderBrand">
            <div className="brandCompact">CAKING！</div>
            <div className="brandSub">Sweet Shop Simulator</div>
          </div>
          <button
            type="button"
            className="soundToggle"
            aria-pressed={soundOn}
            onClick={() => {
              setSoundOn((prev) => {
                const next = !prev;
                if (next) playSfx("tap", true);
                return next;
              });
            }}
          >
            {soundOn ? "🔊 音ON" : "🔇 音OFF"}
          </button>
        </header>

        <main className={`tabContent tab-${activeTab}`} key={activeTab}>
          {activeTab === "home" ? (
            <section className="screen">
              <div className="homeHero card">
                <div className="brandRibbon">Atelier Sweets</div>
                <div className="brandTitle">CAKING！</div>
                <div className="brandSubLarge">手づくりスイーツ店舗経営ゲーム</div>

                <div className="homeStats">
                  <div className="hudItem hudMoney">
                    <div className="hudLabel">資金</div>
                    <div className={`hudValue ${moneyPop ? "isPop" : ""}`}>{money.toLocaleString()}P</div>
                  </div>
                  <div className="hudItem hudLevel">
                    <div className="hudLabel">Lv</div>
                    <div className="hudValue">{level}</div>
                  </div>
                </div>

                <div className="hudItem hudExp">
                  <div className="hudLabel">
                    EXP <span className="hudTiny">{exp}/{expToNext}</span>
                  </div>
                  <div className="expBar" aria-label="experience bar">
                    <div className={`expFill ${expPop ? "isPop" : ""}`} style={{ width: `${expRatio * 100}%` }} />
                  </div>
                  <div className="expNote">次Lvまであと <strong>{expRemaining}</strong> EXP</div>
                </div>
              </div>

              <div className="card recommendCard">
                <div className="sectionTitle">今日のおすすめレシピ</div>
                <RecipeCardVisual recipeName={recommendedRecipe.name} compact />
                <div className="recommendMain">
                  <div>
                    <div className="recommendName">{recommendedRecipe.name}</div>
                    <div className="recommendMeta">
                      +{recommendedRecipe.price}P / +{recommendedRecipe.exp}EXP / 効率{" "}
                      {efficiencyOf(recommendedRecipe).toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="homeActions">
                  <button className="primaryButton" onClick={() => goTab("recipe")}>
                    ケーキをつくる
                  </button>
                  <button className="secondaryButton" onClick={() => goTab("material")}>
                    ざいりょう
                  </button>
                </div>

                <p className="pwaHint">
                  タブレットのホーム画面に追加すると、アプリみたいに遊べます
                </p>
              </div>
            </section>
          ) : null}

          {activeTab === "material" ? (
            <section className="screen">
              <div className="screenHeader">
                <h2>素材</h2>
                <p>5秒ごとに ぜんぶ +1 回復 / 上限{MATERIAL_MAX}</p>
              </div>

              <div className="materialsGrid">
                {inventoryList.map(([key, value]) => (
                  <div
                    key={key}
                    className={[
                      "materialCard",
                      value >= MATERIAL_MAX ? "isFull" : "",
                      boughtPulse === key ? "isPulse" : "",
                    ].join(" ")}
                  >
                    <MaterialCardVisual materialKey={key} />
                    {plusPopKey === key ? <div className="plusPop">+3</div> : null}
                    <div className="materialTop">
                      <div className="materialLabelWrap materialLabelWrap--textOnly">
                        <div>
                          <div className="materialName">{MATERIAL_LABELS[key] ?? key}</div>
                          <div className="materialKey">{key}</div>
                        </div>
                      </div>
                      <div className="materialStockWrap">
                        <div className="materialStockLabel">{value >= MATERIAL_MAX ? "MAX" : "在庫"}</div>
                        <div className="materialCount">{value}</div>
                      </div>
                    </div>

                    <button
                      className="buyButton"
                      onClick={() => buyMaterial(key)}
                      title={`+${BUY_AMOUNT}（${BUY_COST}P）`}
                    >
                      <span className="buySpark" aria-hidden="true">+ </span>
                      購入 +{BUY_AMOUNT}
                      <span className="buyCost">{BUY_COST}P</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "recipe" ? (
            <section className="screen">
              <div className="screenHeader">
                <h2>レシピ</h2>
                <p>不足素材は赤表示 / 作れるときだけ作成可能</p>
              </div>

              <div className="recipesGrid">
                {RECIPES.map((r) => {
                  const locked = level < r.level;
                  const makeable = !locked && canMake(r);
                  const missing = locked ? [] : getMissing(r);
                  const efficiency = efficiencyOf(r);

                  return (
                    <article
                      key={r.name}
                      className={[
                        "recipeCard",
                        locked ? "isLocked" : "",
                        !locked && !makeable ? "isMissing" : "",
                        craftedPulse === r.name ? "isCrafted" : "",
                      ].join(" ")}
                    >
                      <RecipeCardVisual recipeName={r.name} />
                      <div className="recipeHeader">
                        <div className="recipeTitleBlock">
                          <div className="recipeNameRow recipeNameRow--textOnly">
                            <div className="recipeName">{r.name}</div>
                          </div>
                          <div className="recipeMeta">
                            <span className="tag">Lv{r.level}</span>
                            <span className="tag tagMoney">+{r.price}P</span>
                            <span className="tag tagExp">+{r.exp}EXP</span>
                            <span className="tag tagEff">効率 {efficiency.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="recipeSectionTitle">必要素材</div>
                      <div className="ingredients">
                        {Object.entries(r.ingredients).map(([k, need]) => {
                          const have = materials[k] ?? 0;
                          const lack = have < need;
                          const highlight = missing.includes(k);
                          return (
                            <div
                              key={k}
                              className={[
                                "ingredient",
                                lack ? "isLack" : "",
                                highlight ? "isHighlight" : "",
                              ].join(" ")}
                            >
                              <div className="ingredientMain">
                                <span className="ingredientMiniWrap" aria-hidden="true">
                                  <IngredientMiniVisual materialKey={k} />
                                </span>
                                <div className="ingredientName">{MATERIAL_LABELS[k] ?? k}</div>
                              </div>
                              <div className="ingredientCount">
                                <span className="have">{have}</span>
                                <span className="slash">/</span>
                                <span className="need">{need}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        className="makeButton large"
                        onClick={() => makeItem(r)}
                      >
                        {locked ? `Lv${r.level}で解放` : makeable ? "作る" : "素材不足"}
                      </button>

                      {locked ? (
                        <div className="lockOverlay" aria-hidden="true">
                          <div className="lockBadge">Lv{r.level}で解放</div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeTab === "shop" ? (
            <section className="screen">
              <div className="screenHeader">
                <h2>お店</h2>
                <p>ショップ機能は今後追加予定</p>
              </div>

              <p className="pwaHint pwaHint--shop">
                タブレットのホーム画面に追加すると、アプリみたいに遊べます
              </p>

              <div className="card shopCard shopTestCard">
                <div className="shopTestTitle">テスト記録（かいごしゃよう）</div>
                <div className="shopRow">
                  <span>ケーキをつくった回数</span>
                  <strong>{craftCount}</strong>
                </div>
                <div className="shopRow">
                  <span>ざいりょうを買った回数</span>
                  <strong>{buyCount}</strong>
                </div>
                <div className="shopRow">
                  <span>レベルアップ回数</span>
                  <strong>{levelUpCount}</strong>
                </div>
                <div className="shopRow">
                  <span>いまのレベル</span>
                  <strong>{level}</strong>
                </div>
                <div className="shopRow">
                  <span>いまの資金</span>
                  <strong>{money.toLocaleString()}P</strong>
                </div>
              </div>

              <div className="card shopCard">
                <div className="shopRow">
                  <span>店舗Lv</span>
                  <strong>{level}</strong>
                </div>
                <div className="shopRow">
                  <span>評判</span>
                  <strong>{reputation}</strong>
                </div>
                <div className="shopRow">
                  <span>来客数</span>
                  <strong>{customerCount}人</strong>
                </div>
                <div className="shopPlaceholder">設備強化（準備中）</div>
                <div className="shopPlaceholder">ランキング（準備中）</div>
              </div>

              <div className="resetFromStartWrap">
                <button type="button" className="resetFromStart" onClick={resetFromStart}>
                  はじめから
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <nav className="bottomNav" aria-label="bottom navigation">
        <button
          className={activeTab === "home" ? "navItem active" : "navItem"}
          onClick={() => goTab("home")}
        >
          <span>🏠</span>
          <span>ホーム</span>
        </button>
        <button
          className={activeTab === "material" ? "navItem active" : "navItem"}
          onClick={() => goTab("material")}
        >
          <span>🧺</span>
          <span>素材</span>
        </button>
        <button
          className={activeTab === "recipe" ? "navItem active" : "navItem"}
          onClick={() => goTab("recipe")}
        >
          <span>🍰</span>
          <span>レシピ</span>
        </button>
        <button
          className={activeTab === "shop" ? "navItem active" : "navItem"}
          onClick={() => goTab("shop")}
        >
          <span>🏪</span>
          <span>お店</span>
        </button>
      </nav>

      {toast ? (
        <div
          className={`toast toast--${toast.kind || "default"}`}
          role="status"
          aria-live="polite"
        >
          <div className="toastMain">{toast.message}</div>
          {toast.hint ? <div className="toastHint">{toast.hint}</div> : null}
          {toast.actionTab ? (
            <button type="button" className="toastAction" onClick={() => goTab(toast.actionTab)}>
              ざいりょうへ
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}