import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, aviso, fmt, usePerfil } from './comun.js';
import { CONFIG, EVO_FASES, EVO_UMBRALES, ITEMS, NIVEL_MAX, RANGOS, rangoDe, recompensasPase, xpParaSubir, xpTotal } from '../progreso/catalogo.js';
import { activarPremium, estadoPase, nivelPerfil, pendientesPase, reclamarPase, reclamarTodo } from '../progreso/perfil.js';

// Cómo se muestra una recompensa
export function describir(r) {
  if (r.tipo === 'creditos') return { icono: 'toll', color: 'text-primary', titulo: `${fmt(r.cantidad)} CRÉDITOS`, sub: 'MONEDA' };
  if (r.tipo === 'fichas') return { icono: 'diamond', color: 'text-tertiary', titulo: `${fmt(r.cantidad)} FICHAS`, sub: 'PREMIUM' };
  const it = ITEMS[r.id];
  if (it.tipo === 'skin') return { icono: 'star', color: 'text-primary', titulo: it.n, sub: 'ASPECTO EVOLUTIVO', evo: it.colores };
  return { icono: it.tipo === 'operador' ? 'person' : it.tipo === 'camo' ? 'style' : 'tune', color: 'text-secondary', titulo: it.n.replace(/"/g, ''), sub: it.tipo === 'operador' ? 'OPERADOR' : it.tipo === 'camo' ? 'CAMUFLAJE' : 'ACCESORIO' };
}

const SECTORES = NIVEL_MAX / 5;
const nivelesDe = s => [1, 2, 3, 4, 5].map(i => s * 5 + i);              // s = 0..19
const nombreSector = s => `A${String(s + 1).padStart(2, '0')}`;
// Posición de cada sector en el mapa (camino en zigzag)
const posSector = s => { const fila = Math.floor(s / 5), col = s % 5, x = fila % 2 ? 700 - col * 150 : 100 + col * 150; return { x: x + Math.sin(s * 1.7) * 16, y: 66 + fila * 104 + Math.cos(s * 2.3) * 12 }; };

function Tarjeta({ n, pista }) {
  const lista = recompensasPase(n)[pista === 'libre' ? 'libre' : 'prem'];
  const est = estadoPase(n, pista), prem = pista === 'prem';
  const clic = () => { if (est === 'reclamable' && reclamarPase(n, pista)) { API.click(); aviso(`Reclamaste: ${lista.map(r => describir(r).titulo).join(' + ')}`); } };
  return (
    <button onClick={clic} disabled={est !== 'reclamable'} aria-label={`Nivel ${n} ${prem ? 'premium' : 'gratis'}: ${est}`}
      className={`w-full rounded p-space-xs flex items-center gap-space-xs text-left transition-all min-h-[3.2rem] ${est === 'reclamable' ? 'bg-primary/15 ring-1 ring-primary shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse' : est === 'reclamado' ? 'bg-secondary/10' : prem ? 'bg-tertiary/5' : 'bg-surface-container'}`}>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {lista.map((r, i) => {
          const d = describir(r);
          return (
            <div key={i} className="flex items-center gap-1.5 leading-tight">
              <Icon n={d.icono} className={`${d.color} text-lg shrink-0`} />
              <div className="min-w-0"><div className="font-label-sm text-label-sm text-on-surface uppercase truncate">{d.titulo}</div>
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase">{d.sub}</div>
                {d.evo && <div className="flex gap-0.5 mt-0.5">{d.evo.map((c, k) => <span key={k} title={`Fase ${EVO_FASES[k]}: ${EVO_UMBRALES[k]} bajas`} className="w-3 h-1.5 rounded-sm" style={{ background: c }}></span>)}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <Icon n={est === 'reclamable' ? 'redeem' : est === 'reclamado' ? 'check_circle' : 'lock'} className={`text-xl shrink-0 ${est === 'reclamable' ? 'text-primary' : est === 'reclamado' ? 'text-secondary' : 'text-outline'}`} />
    </button>
  );
}

export default function Pase() {
  const p = usePerfil(), nv = nivelPerfil(), pend = pendientesPase(), premium = p.pase.premium;
  const sectorActual = Math.min(SECTORES - 1, Math.floor((Math.max(1, nv) - 1) / 5));
  const [sel, setSel] = useState(sectorActual);
  const sig = nv < NIVEL_MAX ? xpParaSubir(nv) : 0, hecho = p.xp - xpTotal(nv), pct = nv >= NIVEL_MAX ? 100 : Math.round(100 * hecho / sig);
  const comprarPremium = () => { const r = activarPremium(); API.click(); aviso(r.msg); };
  const niveles = nivelesDe(sel);
  const estadoSector = s => { const ns = nivelesDe(s); return nv >= ns[4] ? 'hecho' : nv >= ns[0] ? 'actual' : 'bloqueado'; };
  const pendDe = s => nivelesDe(s).reduce((c, n) => c + (['libre', 'prem'].filter(pp => estadoPase(n, pp) === 'reclamable').length), 0);
  const premiosEspeciales = s => nivelesDe(s).some(n => ['libre', 'prem'].some(pp => recompensasPase(n)[pp === 'libre' ? 'libre' : 'prem'].some(r => r.tipo === 'item' && ['operador', 'skin'].includes(ITEMS[r.id].tipo))));
  const reclamarSector = () => { let c = 0; for (const n of niveles) for (const pp of ['libre', 'prem']) if (reclamarPase(n, pp)) c++; API.click(); aviso(c ? `Reclamaste ${c} recompensas del sector` : 'No hay nada para reclamar en este sector'); };

  const pts = Array.from({ length: SECTORES }, (_, s) => posSector(s));
  const camino = pts.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(0)},${q.y.toFixed(0)}`).join(' ');
  const hechos = pts.slice(0, Math.min(SECTORES, sectorActual + 1)).map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(0)},${q.y.toFixed(0)}`).join(' ');

  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <div className="flex items-center justify-between pb-space-xs gap-space-sm">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-tertiary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">PASE DE BATALLA // MAPA DE SECTORES</h2></div>
        <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">TEMPORADA {CONFIG.TEMPORADA} // {CONFIG.NOMBRE_TEMPORADA}</span>
      </div>

      <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-lg p-space-md flex flex-wrap items-center justify-between gap-space-md shadow-xl">
        <div><div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">TU NIVEL</div>
          <div className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-primary leading-none">{nv}<span className="text-on-surface-variant text-headline-md font-headline-md"> / {NIVEL_MAX}</span></div>
          <div className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">{rangoDe(nv)}</div></div>
        <div className="flex-1 min-w-[12rem] max-w-xl">
          <div className="flex items-center justify-between font-label-sm text-label-sm"><span className="text-on-surface-variant">{nv >= NIVEL_MAX ? 'NIVEL MÁXIMO' : `HACIA EL NIVEL ${nv + 1}`}</span><span className="text-primary font-bold">{nv >= NIVEL_MAX ? '' : `${fmt(hecho)} / ${fmt(sig)} XP`}</span></div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1"><div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(255,193,116,0.5)] transition-all duration-500" style={{ width: pct + '%' }}></div></div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{CONFIG.COBRAR ? 'El premium se activa con fichas.' : 'Por ahora el premium se prueba gratis con las fichas de regalo de la TIENDA.'}</div>
        </div>
        <div className="flex flex-col gap-space-xs items-stretch">
          <button onClick={() => { const c = reclamarTodo(); API.click(); aviso(c ? `Reclamaste ${c} recompensas` : 'No hay recompensas para reclamar'); }} disabled={!pend}
            className="px-space-lg py-2 bg-primary hover:bg-primary-fixed disabled:opacity-50 text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(245,158,11,0.35)]"><Icon n="redeem" className="text-xl" />RECLAMAR TODO{pend ? ` (${pend})` : ''}</button>
          {premium
            ? <div className="px-space-md py-1.5 bg-secondary/10 text-secondary rounded font-label-md text-label-md text-center flex items-center justify-center gap-1.5"><Icon n="workspace_premium" className="text-base" />PASE PREMIUM ACTIVO</div>
            : <button onClick={comprarPremium} className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5"><Icon n="workspace_premium" className="text-base text-tertiary" />PREMIUM · {CONFIG.PRECIO_PASE} FICHAS</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-gutter items-start">
        {/* ---------- Mapa de sectores ---------- */}
        <div className="relative rounded-lg overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}fondos/sector.jpg')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-surface-container-lowest/50"></div>
          <svg viewBox="0 0 800 460" className="relative w-full h-auto" role="group" aria-label="Mapa de sectores del pase de batalla">
            <path d={camino} fill="none" stroke="rgba(180,170,150,0.45)" strokeWidth="3" strokeDasharray="6 8" />
            <path d={hechos} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.7))' }} />
            {pts.map((q, s) => {
              const e = estadoSector(s), act = sel === s, pe = pendDe(s), esp = premiosEspeciales(s);
              const col = e === 'hecho' ? '#4ae176' : e === 'actual' ? '#f59e0b' : '#6b7078';
              return (
                <g key={s} transform={`translate(${q.x.toFixed(0)},${q.y.toFixed(0)})`} onClick={() => { API.click(); setSel(s); }} style={{ cursor: 'pointer' }} role="button" tabIndex={0}
                  onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSel(s); } }} aria-label={`Sector ${nombreSector(s)}, ${e}`}>
                  {act && <circle r="34" fill="none" stroke="#ffc174" strokeWidth="2" strokeDasharray="4 4" />}
                  {pe > 0 && <circle r="30" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.7"><animate attributeName="r" values="26;36;26" dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" /></circle>}
                  <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="#0e1218" fillOpacity="0.92" stroke={col} strokeWidth={act ? 3 : 2} />
                  <text y="-3" textAnchor="middle" fill={col} fontSize="15" fontWeight="700" fontFamily="Rajdhani, sans-serif">{nombreSector(s)}</text>
                  <text y="12" textAnchor="middle" fill="#c8c4bc" fontSize="9" fontFamily="Chivo Mono, monospace">{e === 'hecho' ? 'LISTO' : e === 'actual' ? `NV ${nv}` : 'BLOQ.'}</text>
                  {esp && <text x="19" y="-16" fontSize="14" fill="#ffc174">★</text>}
                  {pe > 0 && <g transform="translate(-19,-18)"><circle r="8" fill="#f59e0b" /><text y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a1100">{pe}</text></g>}
                </g>
              );
            })}
          </svg>
          <div className="relative flex flex-wrap items-center gap-space-md px-space-md pb-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>COMPLETADO</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span>EN CURSO</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-outline"></span>BLOQUEADO</span>
            <span className="flex items-center gap-1 text-primary">★ OPERADOR O ASPECTO EVOLUTIVO</span>
          </div>
        </div>

        {/* ---------- Detalle del sector ---------- */}
        <aside className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm" aria-label={`Detalle del sector ${nombreSector(sel)}`}>
          <div className="flex items-start justify-between gap-space-sm">
            <div><div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">SECTOR</div>
              <div className="font-headline-lg-mobile text-headline-lg-mobile text-primary leading-none">{nombreSector(sel)} <span className="text-on-surface-variant text-headline-md font-headline-md">· NIVELES {niveles[0]}–{niveles[4]}</span></div>
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase mt-1">{RANGOS[Math.floor((niveles[0] - 1) / 10)]}</div></div>
            <span className={`font-label-sm text-label-sm px-space-xs py-0.5 rounded font-bold ${estadoSector(sel) === 'hecho' ? 'bg-secondary/15 text-secondary' : estadoSector(sel) === 'actual' ? 'bg-primary/15 text-primary' : 'bg-surface-container-highest text-outline'}`}>{estadoSector(sel) === 'hecho' ? 'COMPLETADO' : estadoSector(sel) === 'actual' ? 'EN CURSO' : 'BLOQUEADO'}</span>
          </div>
          <div className="grid grid-cols-[2.2rem_1fr_1fr] gap-space-xs items-center font-label-sm text-label-sm text-on-surface-variant uppercase"><span></span><span>GRATIS</span><span className="text-tertiary">PREMIUM{!premium && ' 🔒'}</span></div>
          <div className="flex flex-col gap-space-xs">
            {niveles.map(n => (
              <div key={n} className="grid grid-cols-[2.2rem_1fr_1fr] gap-space-xs items-stretch">
                <div className={`rounded flex items-center justify-center font-headline-md text-headline-md ${n === nv ? 'bg-primary-container text-on-primary-container' : n < nv ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>{n}</div>
                <Tarjeta n={n} pista="libre" />
                <Tarjeta n={n} pista="prem" />
              </div>
            ))}
          </div>
          <button onClick={reclamarSector} disabled={!pendDe(sel)} className="px-space-md py-2 bg-primary hover:bg-primary-fixed disabled:opacity-50 text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-2"><Icon n="redeem" className="text-xl" />RECLAMAR SECTOR</button>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Los ASPECTOS EVOLUTIVOS (★) crecen con tus bajas: {EVO_UMBRALES.map((u, i) => `${EVO_FASES[i]}=${u}`).join(' · ')}. Equipalos en la ARMERÍA.</p>
        </aside>
      </div>
    </div>
  );
}
