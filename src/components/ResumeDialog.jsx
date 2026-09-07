import { useEffect, useRef } from "react";
import MiniCharacter from "./MiniCharacter.jsx";

export default function ResumeDialog({ state, onResume }) {
  const button = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  const seconds = Math.max(0, Math.floor(state.businessTimer));
  return <div className="resumeOverlay" role="dialog" aria-modal="true" aria-labelledby="resume-title">
    <section className="resumeCard">
      <span className="eyebrow">A LITTLE TEA BREAK</span>
      <MiniCharacter action="idle" />
      <h2 id="resume-title">工房で、ひと休み。</h2>
      <p>お店の時間を止めています。<br />準備ができたら、続きを楽しみましょう。</p>
      <dl><div><dt>営業日</dt><dd>{state.dayNumber}日目</dd></div><div><dt>{state.dayPhase === "open" ? "残り時間" : "お店の状態"}</dt><dd>{state.dayPhase === "open" ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : state.dayPhase === "report" ? "営業終了" : "開店準備"}</dd></div></dl>
      <button className="primaryBtn" ref={button} onClick={onResume}>工房を再開する</button>
    </section>
  </div>;
}
