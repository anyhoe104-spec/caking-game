import { Bar, CharImg, Stars } from "./common.jsx";
import { customerImg } from "../game/assets.js";
import { RECIPES } from "../game/data.js";
import { DECORATIONS } from "../game/shop.js";

const HOME_TABS = [
  { id: "orders", label: "オーダー", icon: "🧾" },
  { id: "missions", label: "目標", icon: "🎯" },
  { id: "status", label: "ステータス", icon: "📊" },
];

const STATUS_ICON = { fulfilled: "✅", special: "⭐", expired: "❌", waiting: "" };

function MissionRow({ mission, index }) {
  return (
    <div className={`missionRow stagger ${mission.completed ? "done" : ""}`} style={{ "--i": index }}>
      <div className="missionHead">
        <span aria-hidden="true">{mission.icon ?? "🎯"}</span>
        <span className="missionDesc">{mission.description}</span>
        {mission.completed && <span className="missionCheck">✓</span>}
      </div>
      <div className="missionBar">
        <Bar value={mission.current} max={mission.target} tone={mission.completed ? "green" : "pink"} />
        <span className="missionCount">{mission.current.toLocaleString()}/{mission.target.toLocaleString()}</span>
      </div>
    </div>
  );
}

function OrderRow({ customer, index, onPick }) {
  const recipe = RECIPES.find((entry) => entry.name === customer.order);
  const waiting = customer.status === "waiting";
  const urgent = waiting && customer.timeRemaining < 30;
  return (
    <button
      type="button"
      className={`orderRow stagger orderRow--${customer.status} ${urgent ? "orderRow--urgent" : ""}`}
      style={{ "--i": index }}
      onClick={() => waiting && onPick?.(customer.order)}
      disabled={!waiting}
    >
      <span className="cEmoji">
        {customer.avatarPath
          ? <img src={customerImg(customer.avatarPath)} alt="" className="customerAvatar" />
          : (customer.emoji ?? "🙂")}
      </span>
      <div className="orderInfo">
        <div className="cName">{customer.name}</div>
        <div className="cOrder">{recipe?.icon ?? "🍰"} {customer.order}</div>
        {waiting && (
          <Bar value={customer.timeRemaining} max={customer.tl} tone={urgent ? "red" : "green"} className="orderBar" />
        )}
      </div>
      <div className="orderRight">
        <span className="hearts">{"♡".repeat(customer.hearts)}</span>
        {STATUS_ICON[customer.status] && <span className="statusIcon">{STATUS_ICON[customer.status]}</span>}
        {waiting && <span className="orderGo">つくる ›</span>}
      </div>
    </button>
  );
}

export default function HomeView({
  state,
  homeTab,
  onHomeTab,
  miffyMood,
  miffyMsg,
  recommended,
  expToNext,
  onPickOrder,
  onOpenRecipe,
}) {
  const open = state.dayPhase === "open";
  const waitingCount = state.customerQueue.filter((c) => c.status === "waiting").length;
  const servedCount = state.customerQueue.filter((c) => c.status === "fulfilled" || c.status === "special").length;
  const doneMissions = state.missions.filter((m) => m.completed).length;
  const equipped = DECORATIONS.find((item) => item.id === state.equippedDecoration);

  return (
    <div className="homeView">
      {/* Character panel — always visible, never scrolled past. */}
      <div className="miffyPanel">
        <CharImg mood={miffyMood} className="miffyChar" />
        <div className="miffyBubble">
          <div className="miffyName">
            ミフィ
            {equipped && <span className="decoBadge" title={`装備中：${equipped.name}`}>{equipped.icon}</span>}
          </div>
          <div className="miffyMsg">{miffyMsg}</div>
        </div>
      </div>

      {/* Service heads-up display, or the pre-service recommendation. */}
      {open ? (
        <div className="hud card">
          <div className="hudTop">
            <span className="hudLabel">本日の売上</span>
            <span className="hudVal">🪙 {state.todaySales.toLocaleString()}</span>
            <span className="hudGoal">/ {state.todaySalesGoal.toLocaleString()}P</span>
          </div>
          <Bar value={state.todaySales} max={state.todaySalesGoal} tone="gold" />
          <div className="hudChips">
            <span className="hudChip">待ち {waitingCount}</span>
            <span className="hudChip hudChip--ok">提供 {servedCount}</span>
            <span className="hudChip">目標 {doneMissions}/{state.missions.length}</span>
          </div>
        </div>
      ) : (
        <button className="recoCrd card pressable" onClick={onOpenRecipe}>
          <div className="recoTop">
            <span className="recoIcon">{recommended.icon}</span>
            <div className="recoBody">
              <div className="recoTag">おすすめレシピ</div>
              <div className="recoName">{recommended.name}</div>
              <Stars rating={state.recipeRatings[recommended.name] ?? 0} />
              <div className="recoMeta">+{recommended.price}P / +{recommended.exp}EXP</div>
            </div>
            <span className="recoGo">›</span>
          </div>
          <div className="expRow">
            <span className="expLabel">EXP {state.exp}/{expToNext}</span>
            <Bar value={state.exp} max={expToNext} tone="pink" />
          </div>
        </button>
      )}

      {/* One tap to any of the three information panels — no long scroll. */}
      <div className="homeTabs" role="tablist" aria-label="営業情報">
        {HOME_TABS.map(({ id, label, icon }) => {
          const badge = id === "orders" && open && waitingCount > 0 ? waitingCount : null;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={homeTab === id}
              className={`homeTab pressable ${homeTab === id ? "active" : ""}`}
              onClick={() => onHomeTab(id)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
              {badge !== null && <span className="tabBadge">{badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="panelCard card viewSwap" key={homeTab}>
        {homeTab === "orders" && (
          state.customerQueue.length > 0
            ? state.customerQueue.map((customer, index) => (
                <OrderRow key={customer.uid} customer={customer} index={index} onPick={onPickOrder} />
              ))
            : <p className="panelEmpty">営業スタートでお客様が来ます</p>
        )}

        {homeTab === "missions" && (
          state.missions.length > 0
            ? state.missions.map((mission, index) => <MissionRow key={mission.id} mission={mission} index={index} />)
            : <p className="panelEmpty">営業スタートでミッションが始まります</p>
        )}

        {homeTab === "status" && (
          <div className="statusGrid">
            {[
              ["レベル", `Lv${state.level}`],
              ["所持金", `${state.money.toLocaleString()}P`],
              ["累計PT", `${state.totalPoints.toLocaleString()}pt`],
              ["営業日数", `${state.dayNumber}日目`],
              ["作成数", `${state.craftCount}個`],
              ["大成功", `${state.greatSuccessCount}回`],
              ["失敗", `${state.failCount}回`],
              ["スタッフ", `${(state.staff ?? []).length}人`],
            ].map(([label, value], index) => (
              <div key={label} className="statusItem stagger" style={{ "--i": index }}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
