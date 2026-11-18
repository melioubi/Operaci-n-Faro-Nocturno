import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, setPestanaInicial, usePerfil } from './comun.js';
import { EVO_FASES, EVO_UMBRALES, SKINS, evoNivel, ARMAS_BASE, NOMBRE_MOD, SLOTS, accesoriosDe, barrasArma, modsDe, slotsDe, statsArma, textoFuente, ITEMS, OPERADOR_POR_ID } from '../progreso/catalogo.js';
import { bajasSkin, equiparSkin, skinActiva, accesoriosEquipados, equiparAccesorio, opActivo, restablecerArma, tiene } from '../progreso/perfil.js';
import { IMG_FUSIL } from './datos.js';

// ---------- Dibujos de las armas (planos) ----------
const trazo = { fill: '#14181d', stroke: '#ffc174', strokeWidth: 2, strokeLinejoin: 'round' };
function ArmaArte({ arma }) {
  return (
    <svg viewBox="0 0 800 300" className="w-full h-full" role="img" aria-label="Plano del arma">
      <g transform="translate(800,0) scale(-1,1)" {...trazo}>
        {arma === 0 && <>
          <rect x="250" y="96" width="330" height="60" rx="8" /><rect x="570" y="110" width="50" height="28" rx="3" />
          <path d="M280 156 L392 156 L360 262 L286 262 Z" /><path d="M392 156 L392 190 Q400 200 410 190 L410 156" fill="none" />
          <rect x="262" y="252" width="104" height="12" rx="2" /><rect x="540" y="86" width="22" height="10" /><rect x="272" y="86" width="22" height="10" />
          <path d="M300 112 H520" stroke="#ffc174" strokeOpacity=".35" fill="none" />
        </>}
        {arma === 1 && <>
          <polygon points="290,118 190,130 168,172 190,206 290,172" /><rect x="290" y="108" width="142" height="46" rx="5" /><rect x="420" y="114" width="150" height="34" rx="4" />
          <rect x="570" y="126" width="190" height="12" /><rect x="752" y="120" width="28" height="24" rx="2" /><rect x="332" y="86" width="104" height="18" rx="4" /><circle cx="350" cy="95" r="6" fill="none" />
          <polygon points="340,154 374,154 364,218 330,218" /><polygon points="400,152 448,152 462,236 414,240" /><path d="M430 150 L430 176 Q438 184 448 176" fill="none" />
          <path d="M320 128 H420" stroke="#ffc174" strokeOpacity=".35" fill="none" />
        </>}
        {arma === 2 && <>
          <polygon points="272,120 132,136 100,198 142,216 272,172" /><rect x="272" y="108" width="92" height="50" rx="5" /><rect x="364" y="118" width="400" height="16" />
          <rect x="364" y="140" width="340" height="12" /><rect x="476" y="134" width="112" height="28" rx="6" /><rect x="756" y="112" width="24" height="32" rx="2" />
          <polygon points="300,158 334,158 324,212 292,212" /><path d="M334 158 L334 190 Q342 198 352 190 L352 158" fill="none" />
        </>}
      </g>
    </svg>
  );
}
// Dónde va cada accesorio sobre el dibujo (en % del cuadro). El fusil, con la foto, usa las de la foto.
const PUNTOS = {
  0: { boca: [8, 44], laser: [30, 60], optica: [58, 26], municion: [64, 82] },
  1: { boca: [5, 44], laser: [34, 40], optica: [53, 27], acople: [42, 56], municion: [53, 72], culata: [86, 52] },
  2: { boca: [4, 44], laser: [36, 56], optica: [58, 30], acople: [48, 58], municion: [34, 48], culata: [88, 52] },
};
const PUNTOS_FOTO = { boca: [7, 45], laser: [30, 25], optica: [54, 18], acople: [38, 62], municion: [52, 72], culata: [78, 42] };
const META = [
  { titulo: 'PISTOLA "SOMBRA"', rol: 'ARMA SECUNDARIA', proyecto: 'MUNICIÓN INFINITA' },
  { titulo: 'M4A1 NOCTURNO', rol: 'ARMA PRINCIPAL', proyecto: 'FUSIL DE LA ESCUADRA' },
  { titulo: 'ESCOPETA "FARO"', rol: 'ARMA DE CORTA DISTANCIA', proyecto: 'ESPECIALISTA EN COMBATE CERCANO' },
];
const BARRAS = [['dano', 'DAÑO'], ['alcance', 'ALCANCE'], ['precision', 'PRECISIÓN'], ['cadencia', 'CADENCIA'], ['movilidad', 'MOVILIDAD'], ['retroceso', 'CONTROL RETROCESO']];
const textoMod = (k, v) => (k === 'sil' ? 'Silenciado' : k === 'perd' ? `${v > 0 ? '+' : ''}${v} perdigones` : k === 'carg' ? `${v > 0 ? '+' : ''}${v}% capacidad` : `${v > 0 ? '+' : ''}${v}${k === 'ret' ? '' : '%'} ${NOMBRE_MOD[k] || k}`);
// ¿Una mejora es buena o mala? (más ventaja = verde)
const esBueno = (k, v) => (k === 'rec' ? v > 0 : v > 0);

function Callout({ punto, slot, acc, onClick, izq }) {
  const [x, y] = punto;
  if (!acc) {
    return (
      <button onClick={onClick} className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-surface-container/60 px-space-xs py-0.5 rounded backdrop-blur opacity-60 hover:opacity-100 transition-opacity" style={{ left: x + '%', top: y + '%' }}>
        <Icon n="add" className="text-sm text-outline" /><span className="font-label-sm text-label-sm text-on-surface-variant uppercase whitespace-nowrap">[{slot.corto} // VACÍO]</span>
      </button>
    );
  }
  const efecto = Object.entries(acc.mods).find(([k, v]) => k !== 'sil' && esBueno(k, v));
  return (
    <button onClick={onClick} className="absolute z-30 group -translate-x-1/2 -translate-y-full text-left" style={{ left: x + '%', top: y + '%' }}>
      <div className="flex flex-col items-center">
        <div className="bg-surface-container-lowest/90 px-space-sm py-1 rounded shadow-lg backdrop-blur-md mb-1.5 transition-all group-hover:bg-primary-container group-hover:text-on-primary-container text-center">
          <span className="block font-label-sm text-label-sm tracking-widest text-primary group-hover:text-on-primary-container font-bold uppercase">[{slot.corto}]</span>
          <span className="block font-label-md text-label-md text-on-surface group-hover:text-on-primary-container font-bold uppercase whitespace-nowrap">{acc.n}</span>
          {efecto && <span className="block font-label-sm text-label-sm text-secondary group-hover:text-on-primary-container uppercase">{textoMod(efecto[0], efecto[1])}</span>}
        </div>
        <div className="w-px h-4 bg-primary/60"></div>
        <div className="relative w-4 h-4 flex items-center justify-center"><span className="absolute w-4 h-4 rounded-full bg-primary/20 animate-ping"></span><span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#f59e0b]"></span></div>
      </div>
    </button>
  );
}


// ---------- Aspectos evolutivos (crecen con tus bajas) ----------
function Aspectos({ arma, irA }) {
  usePerfil();
  const lista = SKINS.filter(s => s.arma === arma), activa = skinActiva(arma);
  if (!lista.length) return null;
  return (
    <div className="relative z-20 bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs">
      <div className="flex items-center gap-2"><Icon n="star" className="text-primary text-lg" /><span className="font-label-md text-label-md text-primary tracking-widest uppercase font-bold">ASPECTOS EVOLUTIVOS · {ARMAS_BASE[arma].nombre}</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-xs">
        <button onClick={() => { API.click(); equiparSkin(arma, null); }} aria-pressed={!activa} className={`rounded p-space-sm text-left ${!activa ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container hover:bg-surface-container-high'}`}>
          <div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">ESTÁNDAR</div><div className="font-label-sm text-label-sm text-on-surface-variant">Sin aspecto</div></button>
        {lista.map(s => {
          const ok = tiene(s.id), b = bajasSkin(s.id), ev = evoNivel(b), sig = EVO_UMBRALES[ev];
          return (
            <button key={s.id} onClick={() => { if (!ok) { irA(s.fuente.tipo === 'tienda' ? 'tienda' : 'pase'); return; } API.click(); equiparSkin(arma, s.id); }} aria-pressed={activa === s.id}
              className={`rounded p-space-sm text-left flex flex-col gap-1 ${activa === s.id ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container hover:bg-surface-container-high'} ${ok ? '' : 'opacity-60'}`}>
              <div className="flex gap-0.5">{s.colores.map((c, k) => <span key={k} className={`flex-1 h-2.5 rounded-sm ${ok && k >= ev ? 'opacity-25' : ''}`} style={{ background: c }}></span>)}</div>
              <div className="font-label-lg text-label-lg text-on-surface uppercase font-bold leading-tight">{s.n}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">{ok ? `Fase ${EVO_FASES[ev - 1]} · ${b} bajas${sig ? ` · próxima: ${sig}` : ' · ¡MÁXIMA!'}` : textoFuente(s.fuente)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Armeria({ f, irA }) {
  const p = usePerfil();
  const [arma, setArma] = useState(1);
  const slots = slotsDe(arma);
  const [slotSel, setSlotSel] = useState('boca');
  const [foto, setFoto] = useState(true);
  const eq = accesoriosEquipados(arma);
  const base = ARMAS_BASE[arma], real = statsArma(arma, eq, opActivo());
  const barras = barrasArma(arma, eq), m = modsDe(arma, eq);
  const meta = META[arma], op = OPERADOR_POR_ID(opActivo());
  const bajas = p.maestria[arma] || 0, nivelM = Math.min(55, Math.floor(bajas / 25) + 1), progM = (bajas % 25) / 25;
  const usados = slots.filter(s => eq[s.id]).length;
  const slotActivo = slots.some(s => s.id === slotSel) ? slotSel : slots[0].id;
  const usaFoto = arma === 1 && foto;
  const puntos = usaFoto ? PUNTOS_FOTO : PUNTOS[arma];

  const probar = () => { setPestanaInicial('armeria'); API.audio(); API.jugarTiro(); };
  // Atajos: Q y E cambian de accesorio seleccionado, ESPACIO prueba en el campo de tiro
  useEffect(() => {
    const al = e => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      const i = slots.findIndex(s => s.id === slotActivo);
      if (e.key === 'q' || e.key === 'Q') setSlotSel(slots[(i + slots.length - 1) % slots.length].id);
      if (e.key === 'e' || e.key === 'E') setSlotSel(slots[(i + 1) % slots.length].id);
      if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); probar(); }
    };
    addEventListener('keydown', al); return () => removeEventListener('keydown', al);
  });

  // Ventajas y desventajas (según los accesorios equipados)
  const ventajas = [], desventajas = [];
  for (const k of Object.keys(m)) { if (!m[k]) continue; (esBueno(k, m[k]) ? ventajas : desventajas).push(textoMod(k, m[k])); }
  const opciones = accesoriosDe(arma, slotActivo);
  const slotDef = slots.find(s => s.id === slotActivo);

  return (
    <div className="flex flex-col gap-space-md anim-entrar relative">
      <div className="absolute inset-0 pointer-events-none opacity-20 -z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="rejilla" width="40" height="40" patternUnits="userSpaceOnUse"><path className="text-outline-variant" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" /><circle className="fill-primary" cx="20" cy="20" r="0.75" opacity="0.3" /></pattern></defs><rect fill="url(#rejilla)" width="100%" height="100%" /></svg>
      </div>

      {/* Selector de arma */}
      <div className="relative z-20 flex items-center gap-space-xs flex-wrap">
        {ARMAS_BASE.map((a, i) => (
          <button key={a.nombre} onClick={() => { API.click(); setArma(i); setFoto(true); }} aria-pressed={arma === i}
            className={`px-space-md py-1.5 rounded font-headline-md text-headline-md uppercase tracking-wider transition-all ${arma === i ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(245,158,11,0.35)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
            <span className="text-primary font-label-md mr-2">{i + 1}</span>{a.nombre}
          </button>
        ))}
      </div>
      <Aspectos arma={arma} irA={irA} />

      {/* Fila superior: ficha y telemetría */}
      <div className="relative z-20 grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        <div className="xl:col-span-4 flex flex-col gap-space-sm bg-surface-container-lowest/80 backdrop-blur-md p-space-md rounded-lg shadow-xl">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-primary tracking-widest uppercase flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span><span>CLASE // {base.clase}</span><span className="text-outline">/</span><span className="text-on-surface-variant">{meta.rol}</span>
            </div>
            <span className="bg-surface-container-high px-space-xs py-0.5 rounded text-tertiary font-label-sm text-label-sm whitespace-nowrap">CAL. {base.calibre}</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface tracking-wider leading-none uppercase">{meta.titulo}</h1>
            <div className="flex items-center gap-space-sm mt-1 flex-wrap">
              <span className="bg-primary-container px-space-sm py-0.5 rounded font-label-md text-label-md text-on-primary-container tracking-wider font-bold">PROYECTO: {meta.proyecto}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">OPERADOR: {op.n}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-space-xs bg-surface-container-low p-space-sm rounded">
            <div className="flex items-center justify-between font-label-sm text-label-sm"><span className="text-on-surface-variant tracking-wider uppercase">MAESTRÍA DE ARMA</span><span className="text-primary font-bold">NIVEL {nivelM} / 55{nivelM >= 55 ? ' (MÁXIMO)' : ''}</span></div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded overflow-hidden"><div className="h-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)]" style={{ width: (nivelM >= 55 ? 100 : progM * 100) + '%' }}></div></div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary pt-0.5"><span className="flex items-center gap-1"><Icon n="verified" className="text-[13px]" />BAJAS CON ESTA ARMA</span><span className="text-on-surface-variant font-mono">{bajas}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-space-xs">
            {[['CADENCIA', arma === 0 ? 'SEMI' : `${Math.round(60 / real.cadencia)} DPM`, ''], ['MODO DISPARO', base.modo, ''], ['VEL. BOQUILLA', `${Math.round(real.vel * 2)} M/S`, 'text-secondary']].map(([r, v, c]) => (
              <div key={r} className="bg-surface-container px-space-xs py-1.5 rounded flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant">{r}</span><span className={`font-label-md text-label-md font-bold ${c || 'text-on-surface'}`}>{v}</span></div>
            ))}
            {[['CARGADOR', real.cargador], ['RECARGA', real.recarga.toFixed(2) + ' S'], ['DAÑO / TIRO', Math.round(real.dmg * real.perdigones)]].map(([r, v]) => (
              <div key={r} className="bg-surface-container px-space-xs py-1.5 rounded flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant">{r}</span><span className="font-label-md text-label-md text-on-surface font-bold">{v}</span></div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-primary/10 px-space-md py-1.5 rounded">
            <div className="flex items-center gap-space-xs"><Icon n="tune" className="text-primary text-base" /><span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider">ACCESORIOS: {usados} / {slots.length}</span></div>
            {usados === slots.length && <span className="font-label-sm text-label-sm text-primary font-bold bg-primary/20 px-space-xs py-0.5 rounded tracking-widest">CAPACIDAD MÁXIMA</span>}
          </div>
        </div>

        <div className="hidden xl:flex xl:col-span-4 flex-col items-center justify-start pointer-events-none">
          <div className="flex items-center gap-space-md text-on-surface-variant/40 font-label-sm text-label-sm tracking-widest"><span>// CAMPO BALÍSTICO SEC-09</span><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span><span>ESTABILIZACIÓN GYRO: 0.00°</span></div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-space-sm bg-surface-container-lowest/85 backdrop-blur-md p-space-md rounded-lg shadow-xl">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-md text-label-md text-primary tracking-widest uppercase flex items-center gap-1.5 font-bold"><Icon n="query_stats" className="text-base" />TELEMETRÍA BALÍSTICA</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-0.5 rounded">MODIFICADORES ACTIVOS</span>
          </div>
          <div className="flex flex-col gap-2 font-label-sm text-label-sm">
            {BARRAS.map(([k, n]) => {
              const b = barras[k], d = Math.round(b.d), pos = d > 0, valor = Math.round(b.v);
              const fondo = Math.max(0, valor - (pos ? d : 0)), extra = Math.abs(d);
              return (
                <div key={k} className="flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-on-surface"><span>{n}</span>
                    <div className="flex items-center gap-1 font-bold"><span>{valor}</span>{d !== 0 && <span className={`text-[10px] ${pos ? 'text-secondary' : 'text-error'}`}>({pos ? '+' : ''}{d})</span>}</div></div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded overflow-hidden flex">
                    <div className="h-full bg-on-surface transition-all" style={{ width: (pos ? fondo : valor) + '%' }}></div>
                    {d !== 0 && <div className={`h-full transition-all ${pos ? 'bg-secondary' : 'bg-error'}`} style={{ width: Math.min(100 - (pos ? fondo : valor), extra) + '%' }}></div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-space-xs mt-1 pt-1 bg-surface-container-high/60 p-space-xs rounded">
            <div className="flex flex-col gap-1"><span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider flex items-center gap-1"><Icon n="add_circle" className="text-[13px]" />VENTAJAS</span>
              <ul className="font-body-sm text-body-sm text-on-surface flex flex-col gap-0.5">{ventajas.length ? ventajas.map(t => <li key={t} className="flex gap-1"><span className="text-secondary font-bold">+</span>{t}</li>) : <li className="text-on-surface-variant">Sin accesorios</li>}</ul></div>
            <div className="flex flex-col gap-1"><span className="font-label-sm text-label-sm text-error font-bold uppercase tracking-wider flex items-center gap-1"><Icon n="remove" className="text-[13px]" />DESVENTAJAS</span>
              <ul className="font-body-sm text-body-sm text-on-surface flex flex-col gap-0.5">{desventajas.length ? desventajas.map(t => <li key={t} className="flex gap-1"><span className="text-error font-bold">-</span>{t}</li>) : <li className="text-on-surface-variant">Ninguna</li>}</ul></div>
          </div>
        </div>
      </div>

      {/* Banco de trabajo */}
      <div className="relative z-10 w-full flex items-center justify-center min-h-[300px] lg:min-h-[380px]">
        <div className="relative w-full max-w-5xl aspect-[16/8] max-h-[440px] flex items-center justify-center">
          {arma === 1 && foto && <img alt="M4A1 con accesorios" src={IMG_FUSIL} onError={() => setFoto(false)} referrerPolicy="no-referrer" className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] select-none pointer-events-none [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_55%,transparent_100%)]" />}
          {!(arma === 1 && foto) && <div className="w-[88%] h-[88%] drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] pointer-events-none"><ArmaArte arma={arma} /></div>}
          {slots.map(s => <Callout key={s.id} slot={s} punto={puntos[s.id] || [50, 50]} acc={eq[s.id] ? ITEMS[eq[s.id]] : null} onClick={() => setSlotSel(s.id)} />)}
        </div>
      </div>

      {/* Montaje de accesorios */}
      <div className="relative z-20 flex flex-col gap-space-sm bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-lg shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-space-sm">
          <div className="flex items-center gap-space-xs"><span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">MONTAJE DE ACCESORIOS</span><span className="text-outline">/</span><span className="font-label-sm text-label-sm text-on-surface-variant">SELECCIONÁ UN SLOT PARA PERSONALIZAR</span></div>
          <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm"><span>DESPLAZAR</span><span className="bg-surface-container px-1 rounded text-primary">Q</span><span className="bg-surface-container px-1 rounded text-primary">E</span></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-xs">
          {slots.map(s => {
            const a = eq[s.id] ? ITEMS[eq[s.id]] : null, sel = s.id === slotActivo;
            return (
              <button key={s.id} onClick={() => { API.click(); setSlotSel(s.id); }} aria-pressed={sel}
                className={`p-space-xs rounded flex flex-col justify-between text-left shadow-md relative transition-all min-h-[4.2rem] ${a ? 'bg-surface-container-high hover:bg-surface-bright' : 'bg-surface-container-low hover:bg-surface-container opacity-80'} ${sel ? 'ring-1 ring-primary' : ''}`}>
                {a && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_#f59e0b]"></div>}
                <div className="flex flex-col"><span className={`font-label-sm text-label-sm uppercase font-bold ${a ? 'text-primary' : 'text-on-surface-variant'}`}>{s.corto}</span><span className={`font-label-md text-label-md truncate ${a ? 'text-on-surface' : 'text-on-surface-variant'}`}>{a ? a.n : 'De serie'}</span></div>
                <div className={`mt-2 flex items-center justify-between font-label-sm text-label-sm ${a ? 'text-secondary' : 'text-on-surface-variant'}`}>{a ? <span className="bg-secondary/10 px-1 py-0.5 rounded font-bold">EQUIPADO</span> : <span>POR DEFECTO</span>}<Icon n={a ? 'lock_open' : 'add'} className="text-sm" /></div>
              </button>
            );
          })}
        </div>

        {/* Opciones del slot elegido */}
        <div className="flex flex-col gap-1.5 pt-space-xs">
          <div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">OPCIONES PARA {slotDef.n}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-xs">
            <button onClick={() => { API.click(); equiparAccesorio(arma, slotActivo, null); }} disabled={!eq[slotActivo]}
              className="text-left bg-surface-container-low hover:bg-surface-container disabled:opacity-40 rounded p-space-sm font-label-md text-label-md text-on-surface-variant flex items-center gap-2"><Icon n="close" className="text-base" />SIN ACCESORIO (DE SERIE)</button>
            {opciones.map(a => {
              const mio = tiene(a.id), puesto = eq[slotActivo] === a.id;
              return (
                <button key={a.id} disabled={!mio} onClick={() => { API.click(); equiparAccesorio(arma, slotActivo, puesto ? null : a.id); }}
                  className={`text-left rounded p-space-sm flex flex-col gap-1 transition-colors ${puesto ? 'bg-surface-container-high ring-1 ring-primary' : mio ? 'bg-surface-container hover:bg-surface-container-high' : 'bg-surface-container-lowest/60 opacity-70 cursor-not-allowed'}`}>
                  <div className="flex items-center justify-between gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface uppercase font-bold truncate">{a.n}</span>
                    <span className={`font-label-sm text-label-sm font-bold whitespace-nowrap flex items-center gap-1 ${puesto ? 'text-primary' : mio ? 'text-secondary' : 'text-outline'}`}><Icon n={puesto ? 'check_circle' : mio ? 'lock_open' : 'lock'} className="text-sm" />{puesto ? 'EQUIPADO' : mio ? 'DISPONIBLE' : 'BLOQUEADO'}</span></div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(a.mods).map(([k, v]) => <span key={k} className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${esBueno(k, v) ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>{textoMod(k, v)}</span>)}
                  </div>
                  {!mio && <span className="font-label-sm text-label-sm text-on-surface-variant">Se consigue: {textoFuente(a.fuente)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-1 font-label-md text-label-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            <button onClick={probar} className="flex items-center gap-2 bg-primary text-on-primary px-space-md py-1.5 rounded font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:bg-primary-fixed transition-colors">
              <span className="bg-on-primary text-primary px-1.5 py-0.5 rounded font-mono text-[10px] hidden sm:inline">ESPACIO</span><span>PROBAR EN CAMPO DE TIRO</span>
            </button>
            <button onClick={() => { API.click(); restablecerArma(arma); }} className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-bright text-on-surface px-space-sm py-1.5 rounded transition-colors"><Icon n="restart_alt" className="text-base text-tertiary" /><span>QUITAR TODOS LOS ACCESORIOS</span></button>
          </div>
          <div className="hidden xl:flex items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span><span>LOS CAMBIOS SE GUARDAN SOLOS</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
