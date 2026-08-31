import { useEffect, useRef, useState } from "react";
import { MIFFY_FALLBACK, MIFFY_IMG } from "../game/assets.js";

export function CharImg({ mood = "normal", className = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`charFallback ${className}`}>{MIFFY_FALLBACK[mood] ?? "🐱"}</span>;
  return (
    <img
      src={MIFFY_IMG[mood]}
      alt="ミフィ"
      className={`charImg ${className}`}
      data-mood={mood}
      onError={() => setFailed(true)}
    />
  );
}

export function Stars({ rating = 0, size = "sm" }) {
  return (
    <div className={`stars stars--${size}`} aria-label={`評価 ${rating} / 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= rating ? "star on" : "star"} aria-hidden="true">★</span>
      ))}
      {rating >= 3 && <span className="bestBadge">BEST!</span>}
    </div>
  );
}

/** Width-animated bar. `tone` picks the gradient; `pulse` marks a filled bar. */
export function Bar({ value, max, tone = "pink", className = "" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`bar bar--${tone} ${pct >= 100 ? "bar--full" : ""} ${className}`}>
      <div className="barFill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Number that pops and briefly tints whenever it changes — used for the coin
 * and point counters so earnings are visible without reading the digits.
 */
export function LiveNumber({ value, className = "" }) {
  const [bumped, setBumped] = useState(false);
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current === value) return;
    const rising = value > previous.current;
    previous.current = value;
    if (!rising) return;
    setBumped(true);
    const timer = setTimeout(() => setBumped(false), 520);
    return () => clearTimeout(timer);
  }, [value]);
  return <span className={`liveNum ${bumped ? "liveNum--bump" : ""} ${className}`}>{value.toLocaleString()}</span>;
}

export function Modal({ title, onClose, children, footer, wide = false, labelledBy }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={() => onClose?.()}>
      <div
        className={`modalCard card ${wide ? "modalCard--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="modalHead">
            <h2 id={labelledBy} className="modalTitle">{title}</h2>
            {onClose && (
              <button className="iconBtn modalClose" onClick={onClose} aria-label="閉じる">✕</button>
            )}
          </div>
        )}
        <div className="modalBody">{children}</div>
        {footer && <div className="modalFoot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.tone ?? "info"}`} role="status" key={toast.id}>
      {toast.text}
    </div>
  );
}

/** Slim, always-visible guidance strip from ミル. */
export function HintStrip({ icon, name, message }) {
  return (
    <div className="hintStrip" role="status">
      <img src={icon} alt="" className="hintAvatar" />
      <span className="hintName">{name}</span>
      <span className="hintMsg">{message}</span>
    </div>
  );
}
