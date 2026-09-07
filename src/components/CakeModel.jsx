import { getCraftPresentation } from "../game/craftPresentation.js";
export default function CakeModel({ style = {}, className = "", recipe = "ショートケーキ" }) {
  const shape = getCraftPresentation(recipe).shape;
  const top = style.top ?? "berry";
  return <svg viewBox="0 0 240 200" className={`cakeModel ${className}`} role="img" aria-label={`${recipe}のおめかしプレビュー`} data-shape={shape}>
    <ellipse cx="120" cy="171" rx="95" ry="17" fill="#76503e" opacity=".14"/>
    <ellipse cx="120" cy="160" rx="98" ry="22" fill="#f8f0dc" stroke="#c9af86" strokeWidth="2"/>
    {shape === "pudding" ? <>
      <path d="M78 80L60 145c0 28 120 28 120 0l-18-65" fill="#efd086" stroke="#b69157" strokeWidth="2"/>
      <ellipse cx="120" cy="80" rx="42" ry="16" fill="#9b532e"/>
      <path d="M80 82q16 14 23 13v16q0 8 6 4V98q32 5 50-15" fill="#9b532e"/>
    </> : shape === "layers" ? <>
      {[130,103,76].map(y=><g key={y}><path d={`M45 ${y}l75-17 75 17v14l-75 17-75-17z`} fill="#d6a066" stroke="#a16d3d" strokeWidth="2"/><path d={`M46 ${y+14}l74 16 74-16v9l-74 17-74-17z`} fill="#fff1c9"/></g>)}
    </> : shape === "tart" || shape === "pie" ? <>
      <path d="M37 104l10 41q74 31 146 0l10-41" fill="#d8a265" stroke="#ad7648" strokeWidth="3"/>
      <ellipse cx="120" cy="105" rx="83" ry="29" fill={shape === 'pie' ? '#bf7472' : '#fff0c8'} stroke="#e1b478" strokeWidth="9"/>
      {shape === 'pie' && [75,100,125,150,175].map(x=><path key={x} d={`M${x-16} 91l30 27`} stroke="#efc98f" strokeWidth="8"/>)}
    </> : <g className={`cakeBase cakeBase--${shape}`}>
    <path d="M42 82v65c0 31 156 31 156 0V82" fill="#f4d9a4" stroke="#ba946b" strokeWidth="2"/>
    <path d="M43 113q77 34 154 0v13q-77 34-154 0" fill="#c56a75"/>
    <path d="M43 125q77 34 154 0v9q-77 34-154 0" fill="#fff5df"/>
    <ellipse cx="120" cy="82" rx="78" ry="25" fill="#fff9ed" stroke="#d9b995" strokeWidth="2"/>
    <path d="M42 83q10 12 14 20 7 12 13-2 5-9 13 8 6 14 13 0 6-10 15 5 7 11 14-2 6-11 14-1 7 9 13-7 6-10 15-2 8 5 13-8 8-8 19-11" fill="#fff9ed"/>
      {shape === 'royal' && <g transform="translate(48 3) scale(.6)"><path d="M42 82v65c0 31 156 31 156 0V82" fill="#f6e9cf" stroke="#ba946b" strokeWidth="2"/><ellipse cx="120" cy="82" rx="78" ry="25" fill="#fff9ed" stroke="#d9b995" strokeWidth="2"/></g>}
    </g>}
    {style.band && <path d="M43 141q77 32 154 0v9q-77 32-154 0" fill={style.band === "chocolate" ? "#694633" : "#d88296"}/>}
    <g transform={shape === "royal" ? "translate(36 -9) scale(.7)" : shape === "tart" || shape === "pie" ? "translate(0 22)" : shape === "pudding" ? "translate(36 15) scale(.7)" : undefined}>
    {top === "berry" && [75,120,162].map((x,i) => <g key={x} transform={`translate(${x} ${66 + (i%2)*10})`}><path d="M-10 0q-6-22 10-19 17-1 10 19L0 10z" fill="#c94c5d"/><path d="M-12-17L0-12l12-6-10-3-2-5-3 6z" fill="#628357"/><path d="M-4-9v3m8-2v3M0 1v2" stroke="#fce3a7" strokeWidth="2"/></g>)}
    {top === "mint" && <g fill="#649b75"><ellipse cx="108" cy="66" rx="22" ry="10" transform="rotate(28 108 66)"/><ellipse cx="136" cy="60" rx="22" ry="10" transform="rotate(-34 136 60)"/><path d="M119 80V57" stroke="#456849" strokeWidth="3"/></g>}
    {top === "pearl" && [65,85,108,133,156,177].map((x,i)=><circle key={x} cx={x} cy={73+Math.sin(i)*9} r="7" fill="#fff5d4" stroke="#cfb36f" strokeWidth="2"/>)}
    {top === "crown" && <path d="M92 77l-7-36 22 14 13-29 14 29 22-14-8 36z" fill="#e6bd64" stroke="#9e7435" strokeWidth="3"/>}
    </g>
  </svg>;
}
