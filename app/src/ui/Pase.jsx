import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { API, aviso, fmt, usePerfil } from './comun.js';
import { CONFIG, ITEMS, NIVEL_MAX, RANGOS, rangoDe, recompensasPase, xpParaSubir, xpTotal } from '../progreso/catalogo.js';
import { activarPremium, estadoPase, nivelPerfil, pendientesPase, reclamarPase, reclamarTodo } from '../progreso/perfil.js';

// Cómo se muestra una recompensa
export function describir(r) {
  if (r.tipo === 'creditos') return { icono: 'toll', color: 'text-primary', titulo: `${fmt(r.cantidad)} CRÉDITOS`, sub: 'MONEDA' };
  if (r.tipo === 'fichas') return { icono: 'diamond', color: 'text-tertiary', titulo: `${fmt(r.cantidad)} FICHAS`, sub: 'PREMIUM' };
  const it = ITEMS[r.id];
  return { icono: it.tipo === 'operador' ? 'person' : it.tipo === 'camo' ? 'style' : 'tune', color: 'text-secondary', titulo: it.n.replace(/"/g, ''), sub: it.tipo === 'operador' ? 'OPERADOR' : it.tipo === 'camo' ? 'CAMUFLAJE' : 'ACCESORIO' };
}

function Tarjeta({ n, pista }) {
  const lista = recompensasPase(n)[pista === 'libre' ? 'libre' : 'prem'];
  const est = estadoPase(n, pista), prem = pista === 'prem';
  const clic = () => { if (est === 'reclamable' && reclamarPase(n, pista)) { API.click(); aviso(`Reclamaste: ${lista.map(r => describir(r).titulo).join(' + ')}`); } };
  return (
    <button onClick={clic} disabled={est !== 'reclamable'} aria-label={`Nivel ${n} ${prem ? 'premium' : 'gratis'}: ${est}`}
      className={`w-full rounded p-space-sm flex flex-col items-center gap-1 text-center transition-all min-h-[5.5rem] justify-center ${est === 'reclamable' ? 'bg-primary/15 ring-1 ring-primary shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse' : est === 'reclamado' ? 'bg-surface-container' : 'bg-surface-container-low opacity-70'} ${prem ? 'border-t border-primary/30' : ''}`}>
      {lista.map((r, i) => { const d = describir(r); return (
        <div key={i} className="flex flex-col items-center leading-tight"><Icon n={d.icono} className={`${d.color} text-xl`} /><span className="font-label-sm text-label-sm text-on-surface uppercase">{d.titulo}</span><span className="font-label-sm text-label-sm text-on-surface-variant text-[8px]">{d.sub}</span></div>
      ); })}
      <span className={`font-label-sm text-label-sm font-bold flex items-center gap-1 ${est === 'reclamable' ? 'text-primary' : est === 'reclamado' ? 'text-secondary' : 'text-outline'}`}>
        <Icon n={est === 'reclamable' ? 'redeem' : est === 'reclamado' ? 'check_circle' : 'lock'} className="text-sm" />{est === 'reclamable' ? 'RECLAMAR' : est === 'reclamado' ? 'LISTO' : 'BLOQUEADO'}
      </span>
    </button>
  );
}

export default function Pase({ f }) {
  const p = usePerfil(), nv = nivelPerfil(), pend = pendientesPase();
  const pista = useRef(null);
  useEffect(() => { if (pista.current) pista.current.scrollLeft = Math.max(0, (nv - 2) * 124); }, []);   // arranca centrado en tu nivel
  const sig = nv < NIVEL_MAX ? xpParaSubir(nv) : 0, hecho = p.xp - xpTotal(nv), pct = nv >= NIVEL_MAX ? 100 : Math.round(100 * hecho / sig);
  const premium = p.pase.premium;
  const comprarPremium = () => { const r = activarPremium(); API.click(); aviso(r.msg); };

  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <div className="flex items-center justify-between pb-space-xs gap-space-sm">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-tertiary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">PASE DE BATALLA</h2></div>
        <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">TEMPORADA {CONFIG.TEMPORADA} // {CONFIG.NOMBRE_TEMPORADA}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 bg-surface-container-lowest/85 backdrop-blur-md rounded-lg p-space-md flex flex-col gap-space-sm shadow-xl">
          <div className="flex items-center justify-between gap-space-sm flex-wrap">
            <div><div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">TU NIVEL</div>
              <div className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-primary leading-none">{nv}<span className="text-on-surface-variant text-headline-md font-headline-md"> / {NIVEL_MAX}</span></div>
              <div className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">{rangoDe(nv)}</div></div>
            <div className="flex flex-col gap-space-xs items-stretch">
              <button onClick={() => { const c = reclamarTodo(); API.click(); aviso(c ? `Reclamaste ${c} recompensas` : 'No hay recompensas para reclamar'); }} disabled={!pend}
                className="px-space-lg py-2 bg-primary hover:bg-primary-fixed disabled:opacity-50 text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(245,158,11,0.3)]"><Icon n="redeem" className="text-xl" />RECLAMAR TODO{pend ? ` (${pend})` : ''}</button>
              {premium
                ? <div className="px-space-md py-1.5 bg-secondary/10 text-secondary rounded font-label-md text-label-md text-center flex items-center justify-center gap-1.5"><Icon n="workspace_premium" className="text-base" />PASE PREMIUM ACTIVO</div>
                : <button onClick={comprarPremium} className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5"><Icon n="workspace_premium" className="text-base text-tertiary" />ACTIVAR PREMIUM · <Icon n="diamond" className="text-sm text-tertiary" />{CONFIG.PRECIO_PASE}</button>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between font-label-sm text-label-sm"><span className="text-on-surface-variant">{nv >= NIVEL_MAX ? 'NIVEL MÁXIMO' : `HACIA EL NIVEL ${nv + 1}`}</span><span className="text-primary font-bold">{nv >= NIVEL_MAX ? 'COMPLETADO' : `${fmt(hecho)} / ${fmt(sig)} XP`}</span></div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-1"><div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(255,193,116,0.5)] transition-all duration-500" style={{ width: pct + '%' }}></div></div>
          </div>
        </div>
        <div className="lg:col-span-4 bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">CÓMO FUNCIONA</span>
          <ul className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-1">
            <li className="flex gap-2"><span className="text-primary">▸</span>Cada nivel desbloquea una recompensa en la pista GRATIS.</li>
            <li className="flex gap-2"><span className="text-primary">▸</span>La pista PREMIUM suma más y mejores premios.</li>
            <li className="flex gap-2"><span className="text-primary">▸</span>{CONFIG.COBRAR ? 'El premium se activa con fichas.' : 'Por ahora el premium se prueba gratis con las fichas de regalo de la TIENDA.'}</li>
          </ul>
        </div>
      </div>

      {/* Pista de 100 niveles */}
      <div className="flex gap-space-sm">
        <div className="shrink-0 w-14 flex flex-col gap-space-xs pt-[2.6rem] text-right font-label-sm text-label-sm text-on-surface-variant uppercase">
          <div className="min-h-[5.5rem] flex items-center justify-end">GRATIS</div><div className="min-h-[5.5rem] flex items-center justify-end text-tertiary">PREMIUM</div>
        </div>
        <div ref={pista} className="scroll-x flex-1 pb-space-sm">
          <div className="flex gap-space-xs w-max">
            {Array.from({ length: NIVEL_MAX }, (_, i) => i + 1).map(n => (
              <div key={n} className="w-28 flex flex-col gap-space-xs">
                <div className={`h-9 rounded flex items-center justify-center font-headline-md text-headline-md ${n === nv ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(245,158,11,0.4)]' : n < nv ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>{n}</div>
                <Tarjeta n={n} pista="libre" />
                <div className="relative"><Tarjeta n={n} pista="prem" />{!premium && <span className="absolute top-1 right-1 text-tertiary"><Icon n="workspace_premium" className="text-sm" /></span>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="font-label-sm text-label-sm text-on-surface-variant">Rangos: {RANGOS.map((r, i) => `${i * 10 + 1}-${i * 10 + 10} ${r}`).join(' · ')}</div>
    </div>
  );
}
