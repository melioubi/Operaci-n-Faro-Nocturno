import { ICONOS } from './iconos.js';

// Ícono Material Symbols Outlined (SVG incluido en el juego: anda sin internet)
export function Icon({ n, className = '', ...resto }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true" {...resto}>
      <svg viewBox="0 -960 960 960" fill="currentColor" width="100%" height="100%" focusable="false"><path d={ICONOS[n] || ''} /></svg>
    </span>
  );
}

// Firma del autor: carita con lentes de sol
export function Bruco({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Bruco con lentes de sol">
      <circle cx="16" cy="16" r="14" fill="#ffcc33" stroke="#e0a020" strokeWidth="1.5" />
      <path d="M4.5 12.5h23v2H4.5z" fill="#111" />
      <rect x="5" y="12" width="10" height="7.5" rx="2.6" fill="#111" />
      <rect x="17" y="12" width="10" height="7.5" rx="2.6" fill="#111" />
      <path d="M7.5 14.2l3-1.2M19.5 14.2l3-1.2" stroke="#6b7a99" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 23c2 2.6 11 2.6 13 0" fill="none" stroke="#7a3b10" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
