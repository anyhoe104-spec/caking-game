/** Original, code-native cutout rig. Limbs, face and ears animate independently. */
export default function MiniCharacter({ variant = "miffy", action = "idle", className = "" }) {
  const chef = variant === "miffy";
  const hair = chef ? "#865337" : variant === "rose" ? "#93728e" : "#46546b";
  const dress = chef ? "#e59aa6" : variant === "rose" ? "#ad82a5" : "#8ea99b";
  return <svg className={`miniRig miniRig--${action} ${className}`} viewBox="0 0 120 160" aria-hidden="true">
    <ellipse cx="60" cy="149" rx="30" ry="7" fill="#38251e" opacity=".18" />
    <g className="miniLeg miniLeg--left"><path d="M44 123v19" stroke="#f4ceac" strokeWidth="12" strokeLinecap="round"/><path d="M39 140h16v10H35q-2-8 4-10" fill="#614339"/></g>
    <g className="miniLeg miniLeg--right"><path d="M76 123v19" stroke="#f4ceac" strokeWidth="12" strokeLinecap="round"/><path d="M67 140h16l4 10H67z" fill="#614339"/></g>
    <g className="miniBody">
      <path d="M43 85Q60 78 77 85l17 43q-34 16-68 0z" fill={dress} stroke="#754e43" strokeWidth="2"/>
      {chef && <path d="M47 87h26l8 39q-20 9-41 0z" fill="#fff1d6"/>}
      <g className="miniArm miniArm--left"><path d="M39 91L27 114" stroke={dress} strokeWidth="16" strokeLinecap="round"/><circle cx="26" cy="118" r="7" fill="#f7d7b7"/></g>
      <g className="miniArm miniArm--right"><path d="M80 91l13 21" stroke={dress} strokeWidth="16" strokeLinecap="round"/><circle cx="95" cy="116" r="7" fill="#f7d7b7"/>{action === "work" && <path d="M95 117l-15-35" stroke="#b38d62" strokeWidth="5" strokeLinecap="round"/>}</g>
      <path d="M59 91l-10-6v12l10-4 11 5V85z" fill="#b75a72"/>
    </g>
    <g className="miniHead">
      <path d="M25 69Q12 30 40 21q41-15 57 26l-2 38q-33 17-72-2z" fill={hair} stroke="#604234" strokeWidth="2"/>
      {chef && <g className="miniEars"><path d="M28 41L21 10l28 17M75 25l24-15-6 37" fill={hair} stroke="#604234" strokeWidth="2"/><path d="M29 31l-3-13 15 10M82 29l11-11-3 16" fill="#edb6a7"/></g>}
      <ellipse cx="60" cy="57" rx="33" ry="31" fill="#f9dbb9"/>
      <path d="M27 50q-1-29 28-28 39-6 41 31L77 37l-1 14-17-17-5 16-12-13z" fill={hair}/>
      <g className="miniEyes"><ellipse cx="47" cy="60" rx="5" ry="7" fill="#674330"/><ellipse cx="74" cy="60" rx="5" ry="7" fill="#674330"/><circle cx="48" cy="58" r="2" fill="white"/><circle cx="75" cy="58" r="2" fill="white"/></g>
      <ellipse cx="38" cy="72" rx="7" ry="3" fill="#e79e95" opacity=".6"/><ellipse cx="83" cy="72" rx="7" ry="3" fill="#e79e95" opacity=".6"/>
      <path d="M56 75q5 5 10-1" fill="none" stroke="#a46855" strokeWidth="2" strokeLinecap="round"/>
      {chef && <><path d="M40 22Q24 7 43 5q7-10 18-1 20-9 24 7 3 8-8 13" fill="#fff2d8" stroke="#d1ad8a" strokeWidth="2"/><path d="M40 20l38 1v8H39z" fill="#f5c0bd"/><path d="M94 42l-10-10v19l10-5 10 9V34z" fill="#dd8198"/></>}
    </g>
  </svg>;
}
