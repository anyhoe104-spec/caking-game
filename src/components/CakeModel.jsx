export default function CakeModel({ style = {}, className = "" }) {
  const top = style.top ?? "berry";
  return <svg viewBox="0 0 240 200" className={`cakeModel ${className}`} role="img" aria-label="選んだパーツで飾ったケーキ">
    <ellipse cx="120" cy="171" rx="95" ry="17" fill="#76503e" opacity=".14"/>
    <ellipse cx="120" cy="160" rx="98" ry="22" fill="#f8f0dc" stroke="#c9af86" strokeWidth="2"/>
    <path d="M42 82v65c0 31 156 31 156 0V82" fill="#f4d9a4" stroke="#ba946b" strokeWidth="2"/>
    <path d="M43 113q77 34 154 0v13q-77 34-154 0" fill="#c56a75"/>
    <path d="M43 125q77 34 154 0v9q-77 34-154 0" fill="#fff5df"/>
    <ellipse cx="120" cy="82" rx="78" ry="25" fill="#fff9ed" stroke="#d9b995" strokeWidth="2"/>
    <path d="M42 83q10 12 14 20 7 12 13-2 5-9 13 8 6 14 13 0 6-10 15 5 7 11 14-2 6-11 14-1 7 9 13-7 6-10 15-2 8 5 13-8 8-8 19-11" fill="#fff9ed"/>
    {style.band && <path d="M43 141q77 32 154 0v9q-77 32-154 0" fill={style.band === "chocolate" ? "#694633" : "#d88296"}/>}
    {top === "berry" && [75,120,162].map((x,i) => <g key={x} transform={`translate(${x} ${66 + (i%2)*10})`}><path d="M-10 0q-6-22 10-19 17-1 10 19L0 10z" fill="#c94c5d"/><path d="M-12-17L0-12l12-6-10-3-2-5-3 6z" fill="#628357"/><path d="M-4-9v3m8-2v3M0 1v2" stroke="#fce3a7" strokeWidth="2"/></g>)}
    {top === "mint" && <g fill="#649b75"><ellipse cx="108" cy="66" rx="22" ry="10" transform="rotate(28 108 66)"/><ellipse cx="136" cy="60" rx="22" ry="10" transform="rotate(-34 136 60)"/><path d="M119 80V57" stroke="#456849" strokeWidth="3"/></g>}
    {top === "pearl" && [65,85,108,133,156,177].map((x,i)=><circle key={x} cx={x} cy={73+Math.sin(i)*9} r="7" fill="#fff5d4" stroke="#cfb36f" strokeWidth="2"/>)}
    {top === "crown" && <path d="M92 77l-7-36 22 14 13-29 14 29 22-14-8 36z" fill="#e6bd64" stroke="#9e7435" strokeWidth="3"/>}
  </svg>;
}
