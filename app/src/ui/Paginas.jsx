import { useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';
import { API, DATOS, fmt } from './comun.js';
import { AYUDA } from './datos.js';
import { NombreEditable } from './Lobby.jsx';

function Titulo({ texto, chip, color = 'bg-primary' }) {
  return (
    <div className="flex items-center justify-between pb-space-sm gap-space-sm">
      <div className="flex items-center gap-2"><span className={`w-1.5 h-3.5 ${color}`}></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">{texto}</h2></div>
      {chip && <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">{chip}</span>}
    </div>
  );
}
const Barra = ({ rotulo, valor, texto, color = 'bg-primary' }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between font-label-sm text-label-sm"><span className="text-on-surface-variant">{rotulo}</span><span className="text-on-surface font-bold">{texto}</span></div>
    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: Math.max(3, Math.min(100, valor * 100)) + '%' }}></div></div>
  </div>
);

// ---------- ARMERÍA ----------
export function Armeria({ f }) {
  const nv = f.nivel;
  const mejoras = [
    [{ nv: 1, t: 'Munición infinita' }, { nv: 5, t: '+1 granada al empezar' }],
    [{ nv: 4, t: '+15% de daño' }, { nv: 1, t: 'Tienda: +20% de daño (hasta 2 veces)' }],
    [{ nv: 8, t: '+2 perdigones' }, { nv: 1, t: 'Tienda: +2 perdigones (hasta 2 veces)' }],
  ];
  const iconos = ['crisis_alert', 'military_tech', 'local_fire_department'];
  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <Titulo texto="ARMERÍA / GUNSMITH" chip={`NIVEL ${nv}`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {DATOS.ARMAS.map((a, i) => {
          const dps = a.dmg * a.perdigones / a.cadencia;
          return (
            <div key={a.nombre} className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm"><div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center"><Icon n={iconos[i]} className="text-primary" /></div>
                  <div><div className="font-headline-md text-headline-md text-on-surface uppercase">{a.nombre}</div><div className="font-label-sm text-label-sm text-on-surface-variant">TECLA {i + 1}</div></div></div>
                {i === 0 && <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-space-xs py-0.5 rounded">∞ BALAS</span>}
              </div>
              <Barra rotulo="DAÑO POR SEGUNDO" valor={dps / 200} texto={Math.round(dps)} />
              <Barra rotulo="CADENCIA" valor={(1 / a.cadencia) / 12} texto={`${(1 / a.cadencia).toFixed(1)}/s`} color="bg-tertiary" />
              <Barra rotulo="CARGADOR" valor={a.cargador / 30} texto={a.cargador} color="bg-secondary" />
              <Barra rotulo="PRECISIÓN" valor={1 - a.disp} texto={`${Math.round((1 - a.disp) * 100)}%`} color="bg-primary-container" />
              <div className="flex flex-col gap-1 pt-space-xs">
                <div className="font-label-sm text-label-sm text-primary tracking-widest uppercase">MEJORAS</div>
                {mejoras[i].map(m => {
                  const ok = nv >= m.nv;
                  return <div key={m.t} className={`flex items-center justify-between rounded px-space-sm py-1 font-label-sm text-label-sm ${ok ? 'bg-surface-container text-on-surface' : 'bg-surface-container-lowest/60 text-outline'}`}>
                    <span>{m.t}</span><span className={`flex items-center gap-1 ${ok ? 'text-secondary' : ''}`}><Icon n={ok ? 'check_circle' : 'lock'} className="text-sm" />{m.nv > 1 ? `NV ${m.nv}` : 'LISTO'}</span></div>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="bg-surface-container-low rounded-lg p-space-md flex items-start gap-space-sm"><Icon n="explosion" className="text-primary text-2xl" />
          <div><div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">GRANADAS (G)</div><p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Daño en área. Empezás con 3 y podés llevar hasta 5. Las recargás en las cajas de munición, la tienda y soltándolas los enemigos.</p></div></div>
        <div className="bg-surface-container-low rounded-lg p-space-md flex items-start gap-space-sm"><Icon n="drone" className="text-tertiary text-2xl" />
          <div><div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">RACHAS DE BAJAS</div><p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">3 bajas seguidas: DRON (Z) que te sigue y dispara. 6 bajas: ATAQUE AÉREO (X) donde apuntás. 10 bajas: TORRETA (C) automática.</p></div></div>
      </div>
    </div>
  );
}

// ---------- OPERADORES ----------
function Preview({ camo, bloqueado }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) API.previewSoldado(ref.current, camo, 1); }, [camo]);
  return <canvas ref={ref} width={96} height={96} className={`w-24 h-24 ${bloqueado ? 'opacity-30 grayscale' : ''}`} aria-hidden="true" />;
}
export function Operadores({ f }) {
  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <Titulo texto="OPERADORES" chip="CAMUFLAJES" color="bg-secondary" />
      <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">TU NOMBRE DE OPERADOR (SE VE EN LAS SALAS)</span>
        <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase"><NombreEditable nombre={f.perfil.nombre} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
        {DATOS.CAMOS.map((c, i) => {
          const ok = f.nivel >= c.nivel, sel = f.perfil.camo === i;
          return (
            <button key={c.n} disabled={!ok} onClick={() => { API.click(); API.setCamo(i); }} aria-pressed={sel}
              className={`relative rounded-lg p-space-md flex flex-col items-center gap-space-sm transition-all ${sel ? 'bg-surface-container-high ring-1 ring-primary shadow-[0_0_16px_rgba(245,158,11,0.25)]' : 'bg-surface-container-low hover:bg-surface-container'} ${ok ? '' : 'cursor-not-allowed'}`}>
              <Preview camo={i} bloqueado={!ok} />
              <div className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider">{c.n}</div>
              <div className={`font-label-sm text-label-sm flex items-center gap-1 ${sel ? 'text-primary' : ok ? 'text-secondary' : 'text-outline'}`}>
                <Icon n={sel ? 'check_circle' : ok ? 'style' : 'lock'} className="text-sm" />{sel ? 'EQUIPADO' : ok ? 'DESBLOQUEADO' : `NIVEL ${c.nivel}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- NIVELES ----------
export function Niveles({ f }) {
  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <Titulo texto="PASE DE NIVELES" chip={`${fmt(f.xp)} XP TOTAL`} color="bg-tertiary" />
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: DATOS.NIVEL_MAX }, (_, k) => k + 1).map(n => {
          const hecho = f.nivel > n, actual = f.nivel === n;
          const pct = actual && f.xpSig ? Math.round(100 * (f.xp - f.xpIni) / (f.xpSig - f.xpIni)) : hecho ? 100 : 0;
          return (
            <div key={n} className={`flex items-center gap-space-md p-space-sm rounded ${actual ? 'bg-surface-container-high ring-1 ring-primary' : hecho ? 'bg-surface-container' : 'bg-surface-container-low opacity-70'}`}>
              <div className={`w-11 h-11 rounded flex items-center justify-center font-headline-md text-headline-md shrink-0 ${actual ? 'bg-primary-container text-on-primary-container' : hecho ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-highest text-outline'}`}>{n}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface uppercase">{DATOS.RANGOS[n - 1]}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">{fmt(DATOS.xpTotal(n))} XP</span></div>
                <div className="font-label-sm text-label-sm text-primary uppercase truncate">{n === 1 ? 'Inicio: pistola, fusil y escopeta' : DATOS.PREMIOS[n]}</div>
                {(actual || hecho) && <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1.5"><div className={`h-full rounded-full ${hecho ? 'bg-secondary' : 'bg-primary'}`} style={{ width: pct + '%' }}></div></div>}
              </div>
              <Icon n={hecho ? 'check_circle' : actual ? 'star' : 'lock'} className={`text-xl ${hecho ? 'text-secondary' : actual ? 'text-primary' : 'text-outline'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- HISTORIAL ----------
export function Historial({ f }) {
  const s = f.perfil.stats, p = f.perfil.partida;
  const dato = (icono, color, rotulo, valor, sub) => (
    <div className="bg-surface-container-low rounded-lg p-space-md flex items-center gap-space-md">
      <div className="w-12 h-12 rounded bg-surface-container-high flex items-center justify-center shrink-0"><Icon n={icono} className={`${color} text-2xl`} /></div>
      <div><div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">{rotulo}</div>
        <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface leading-none mt-0.5">{valor}</div>{sub && <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{sub}</div>}</div>
    </div>
  );
  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <Titulo texto="BARRACAS / HISTORIAL" chip="ESTE DISPOSITIVO" color="bg-secondary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {dato('trophy', 'text-primary', 'RÉCORD DE CAMPAÑA', fmt(f.perfil.record), 'puntos')}
        {dato('local_fire_department', 'text-error', 'RÉCORD SUPERVIVENCIA', f.perfil.recordSup, 'oleadas superadas')}
        {dato('skull', 'text-tertiary', 'BAJAS TOTALES', fmt(s.bajas), 'enemigos y rivales')}
        {dato('sports_esports', 'text-secondary', 'PARTIDAS JUGADAS', fmt(s.partidas))}
        {dato('flag', 'text-primary', 'MISIONES CUMPLIDAS', fmt(s.victorias), 'extracciones en helicóptero')}
        {dato('military_tech', 'text-tertiary', 'EXPERIENCIA', `${fmt(f.xp)} XP`, `Nivel ${f.nivel} · ${f.rango}`)}
      </div>
      <div className="bg-surface-container-low rounded-lg p-space-md flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm"><Icon n="history" className="text-primary text-2xl" />
          <div><div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">PARTIDA GUARDADA</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">{p ? `Campaña: zona ${p.zona} de 4 · ${fmt(p.pts)} puntos` : 'Todavía no hay una campaña en curso. El avance se guarda solo al entrar a cada zona.'}</div></div></div>
        {p && <button onClick={() => { API.audio(); API.continuar(); }} className="px-space-lg py-2 bg-primary hover:bg-primary-fixed text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase">CONTINUAR</button>}
      </div>
    </div>
  );
}

// ---------- AYUDA ----------
export function AyudaContenido({ columnas = 'lg:grid-cols-2' }) {
  return (
    <div className={`grid grid-cols-1 ${columnas} gap-gutter`}>
      {AYUDA.map(sec => (
        <section key={sec.t} className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm"><div className="w-9 h-9 rounded bg-primary/20 flex items-center justify-center"><Icon n={sec.i} className="text-primary text-xl" /></div>
            <h3 className="font-headline-md text-headline-md text-on-surface uppercase tracking-wider">{sec.t}</h3></div>
          {sec.nota && <p className="font-label-md text-label-md text-primary">{sec.nota}</p>}
          {sec.filas && <ul className="flex flex-col gap-1.5">{sec.filas.map(l => <li key={l} className="flex gap-2 font-body-md text-body-md text-on-surface-variant"><span className="text-primary">▸</span><span>{l}</span></li>)}</ul>}
          {sec.teclas && <div className="flex flex-col gap-1">{sec.teclas.map(([k, d]) => (
            <div key={k} className="flex items-center justify-between gap-space-sm bg-surface-container rounded px-space-sm py-1">
              <span className="bg-surface-container-highest px-space-xs py-0.5 rounded text-primary font-label-md text-label-md font-bold whitespace-nowrap">{k}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-right">{d}</span></div>))}</div>}
        </section>
      ))}
    </div>
  );
}
export function Ayuda() {
  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <Titulo texto="CÓMO JUGAR" chip="MANUAL DEL OPERADOR" color="bg-tertiary" />
      <AyudaContenido />
    </div>
  );
}
