import { DECORATIONS, STAFF } from "../game/shop.js";

const DECO_NOTE = {
  "rose-table": "客席の雰囲気が華やかになります",
  "harbor-lamp": "港町らしい灯りでお店を照らします",
  "royal-case": "王室御用達のような高級ショーケース",
};

/** Shared layout for the decoration and staff screens. */
export default function UpgradeView({ kind, state, onBuyDecoration, onEquipDecoration, onHire }) {
  const deco = kind === "deco";
  const items = deco ? DECORATIONS : STAFF;

  return (
    <div className="tabView">
      <div className="tabHeader">
        <div>
          <h2>{deco ? "デコレーション" : "スタッフ"}</h2>
          <p>{deco ? "購入して装備するとお店の見た目が変わります" : "雇用すると営業効果が永続的に上がります"}</p>
        </div>
        <span className="headerNote">🪙 {state.money.toLocaleString()}P</span>
      </div>

      <div className="upgradeGrid">
        {items.map((item, index) => {
          const owned = deco
            ? (state.decorations ?? []).includes(item.id)
            : (state.staff ?? []).includes(item.id);
          const equipped = deco && state.equippedDecoration === item.id;
          const affordable = state.money >= item.price;
          const action = deco
            ? (owned ? () => onEquipDecoration(item.id) : () => onBuyDecoration(item))
            : () => onHire(item);

          return (
            <article
              key={item.id}
              className={`upgradeCard card stagger ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}`}
              style={{ "--i": index }}
            >
              <span className="upIcon" aria-hidden="true">{deco ? item.icon : "👤"}</span>
              <strong className="upName">{item.name}</strong>
              <p className="upEffect">{deco ? DECO_NOTE[item.id] ?? "お店の装飾" : item.effect}</p>
              <span className={`upPrice ${!owned && !affordable ? "upPrice--poor" : ""}`}>
                {owned ? (equipped ? "装備中" : "購入済み") : `${item.price.toLocaleString()}P`}
              </span>
              <button
                className={`buyBtn pressable ${owned && !equipped ? "buyBtn--equip" : ""}`}
                disabled={equipped || (deco ? !owned && !affordable : owned || !affordable)}
                onClick={action}
              >
                {equipped ? "装備中" : owned ? (deco ? "装備する" : "雇用済み") : deco ? "購入" : "雇用する"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
