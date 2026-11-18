import { Icon } from './Icon.jsx';
import { API, fmt, usePerfil } from './comun.js';
import { AYUDA } from './datos.js';

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

// ---------- HISTORIAL ----------
export function Historial({ f }) {
  const pf = usePerfil(), s = pf.stats, p = f.perfil.partida;
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
        {dato('military_tech', 'text-tertiary', 'EXPERIENCIA', `${fmt(f.xp)} XP`, `Nivel ${f.nivel} de 100 · ${f.rango}`)}
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
