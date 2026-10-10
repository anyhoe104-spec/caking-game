import { useId } from 'react';

/** Original vector foreground, independent from the existing painted backdrop. */
export default function AtelierScenery() {
  const id = useId();
  return <svg className="atelierScenery" viewBox="0 0 400 306" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-wood`} x2="0" y2="1"><stop stopColor="#c49566"/><stop offset=".2" stopColor="#eed2a4"/><stop offset=".3" stopColor="#a16d48"/><stop offset="1" stopColor="#65452f"/></linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#f0fffc" stopOpacity=".4"/><stop offset=".48" stopColor="#c4e7e1" stopOpacity=".08"/><stop offset=".5" stopColor="#fff" stopOpacity=".45"/><stop offset=".55" stopColor="#fff" stopOpacity=".05"/></linearGradient>
      <linearGradient id={`${id}-cloth`} x2="0" y2="1"><stop stopColor="#fff4db"/><stop offset="1" stopColor="#d9bc8e"/></linearGradient>
    </defs>
    <path d="M0 0h400v9H0zM0 0h9v306H0zM391 0h9v306h-9z" fill={`url(#${id}-wood)`}/>
    <g className="atelierBunting" stroke="#6f543e" strokeWidth="1.2">
      <path d="M10 77Q190 114 390 65" fill="none"/>
      {[30, 76, 122, 168, 214, 260, 306, 352].map((x, i) => <path key={x} d={`M${x} ${84 + Math.sin(i / 2) * 11}l24 2-13 23z`} fill={i % 2 ? '#ead8aa' : '#a77578'}/>)}
    </g>
    <g className="atelierHerbs" fill="#688268" stroke="#49624d" strokeWidth="1">
      <path d="M370 8v58m0-42q-26-18-18 3l18 12q23-28 21-6l-21 21q-25-20-16-2l16 15q20-17 16-1l-16 10"/>
      <path d="M356 76h28l-5 18h-19z" fill="#bb8163" stroke="#775139"/>
    </g>
    <path d="M0 261h400v45H0z" fill={`url(#${id}-wood)`}/>
    <path d="M4 276h392M4 294h392" stroke="#ecc38e" opacity=".22"/>
    <path d="M16 251h120l10 20H7z" fill={`url(#${id}-cloth)`}/>
    <path d="M17 255h114M14 260h121M11 266h128" stroke="#ab7780" opacity=".5" strokeDasharray="3 3"/>
    <path d="M15 251v-75q0-12 12-12h88q12 0 12 12v75z" fill={`url(#${id}-glass)`} stroke="#d5b781" strokeWidth="2"/>
    <path d="M20 171l102 0M22 244h98" stroke="#fff5db" opacity=".7"/>
    <g transform="translate(347 242)">
      <ellipse cy="18" rx="27" ry="5" fill="#382e22" opacity=".3"/>
      <path d="M-18-13h36l-4 30h-28z" fill="#e7d5ac" stroke="#977858"/>
      <path d="M-9-10l-8-29M0-10l3-35M9-10l14-32" stroke="#9c7551" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="-18" cy="-43" rx="6" ry="10" fill="#ba936b" transform="rotate(-20 -18 -43)"/>
      <path d="M1-42q-12-25 2-24 13 1 2 24m-2-23v23" fill="none" stroke="#b8c6bf" strokeWidth="2"/>
    </g>
  </svg>;
}
