import { useEffect, useRef, useState } from 'react';
import { Icon, Bruco } from './Icon.jsx';
import { API, fmt, pantallaCompleta, puedePantallaCompleta, tomarPestanaInicial, usePerfil } from './comun.js';
import { instalar, useInstalable } from './pwa.js';
import { IMG_FONDO, MODOS } from './datos.js';
import Lobby from './Lobby.jsx';
import { Historial, Ayuda } from './Paginas.jsx';
import Armeria from './Armeria.jsx';
import Operadores from './Operadores.jsx';
import Pase from './Pase.jsx';
import Mercado from './Mercado.jsx';
import { AjustesModal } from './Ajustes.jsx';

const TABS = [
  { id: 'jugar', t: 'JUGAR' }, { id: 'armeria', t: 'ARMERÍA / GUNSMITH' }, { id: 'operadores', t: 'OPERADORES' }, { id: 'pase', t: 'PASE DE BATALLA' },
  { id: 'historial', t: 'BARRACAS / HISTORIAL' }, { id: 'tienda', t: 'TIENDA' }, { id: 'ayuda', t: 'AYUDA' },
];

function Reloj() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <>{t.toISOString().slice(11, 19)}</>;
}

function Cabecera({ f, tab, irA }) {
  const p = usePerfil();
  const [ajustes, setAjustes] = useState(false);
  return (
    <header className="shrink-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="w-full px-gutter flex flex-col gap-space-xs pt-space-xs pb-space-sm short:pb-space-xs">
        <div className="flex items-center justify-between w-full gap-space-md short:hidden">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md whitespace-nowrap">
              <Icon n="radar" className="text-base text-primary" />
              <span className="hidden sm:inline">43°21'N 70°24'W</span>
              <span className="text-outline hidden sm:inline">|</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm">SEC: FARO ROCOSO</span>
            </div>
            <div className="hidden lg:flex items-center gap-space-sm bg-surface-container-low px-space-sm py-0.5 rounded">
              <span className="text-secondary font-label-sm text-label-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>ZULU: <Reloj />
              </span>
            </div>
          </div>
          {/* Brújula decorativa */}
          <div className="relative flex-1 max-w-2xl mx-space-xl hidden xl:flex flex-col items-center">
            <div className="w-full flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant px-space-md mb-0.5">
              <span>270 W</span><span>300</span><span>330</span><span className="text-primary font-bold">000 N</span><span className="text-secondary font-bold">045 NE</span><span>090 E</span><span>135 SE</span><span>180 S</span>
            </div>
            <div className="relative w-full h-3 bg-surface-container-high/60 rounded flex items-center justify-between px-space-xs overflow-hidden">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-primary z-20"></div>
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 border-solid border-t-primary border-t-[5px] border-x-transparent border-x-[4px] border-b-0 z-20"></div>
              <div className="w-full flex items-center justify-between opacity-70">
                <span className="h-1.5 w-px bg-outline"></span><span className="h-1 w-px bg-outline-variant"></span><span className="h-2 w-px bg-outline"></span><span className="h-1 w-px bg-outline-variant"></span>
                <span className="h-2.5 w-0.5 bg-primary"></span><span className="h-1 w-px bg-outline-variant"></span><span className="h-2 w-px bg-secondary"></span><span className="h-1 w-px bg-outline-variant"></span>
                <span className="h-2 w-px bg-outline"></span><span className="h-1 w-px bg-outline-variant"></span><span className="h-2.5 w-0.5 bg-outline"></span><span className="h-1 w-px bg-outline-variant"></span><span className="h-2 w-px bg-outline"></span>
              </div>
              <div className="absolute left-[48%] top-0.5 w-1.5 h-1.5 bg-primary-container rotate-45 z-10"></div>
              <div className="absolute left-[62%] top-0.5 w-1.5 h-1.5 bg-secondary-container rotate-45 z-10"></div>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="hidden sm:flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
              <span className="bg-surface-container-high px-space-xs py-0.5 rounded text-secondary font-medium">{f.red.activo ? 'ONLINE' : 'MODO SOLO'}</span>
              <span className="bg-surface-container-high px-space-xs py-0.5 rounded text-tertiary">FPS {f.fps}</span>
              <span className="hidden lg:inline bg-surface-container-high px-space-xs py-0.5 rounded text-secondary">{f.red.activo ? `SALA ${f.red.codigo}` : 'SIN CONEXIÓN NECESARIA'}</span>
            </div>
            <div className="flex items-center gap-space-sm pl-space-sm">
              <div className="flex items-center gap-1.5 bg-surface-container px-space-sm py-1 rounded whitespace-nowrap">
                <span className="text-primary font-label-md text-label-md">{fmt(p.creditos)} CP</span>
                <span className="text-outline">|</span>
                <span className="text-secondary font-label-md text-label-md">{fmt(p.fichas)} FICHAS</span>
              </div>
              <button onClick={() => { API.click(); setAjustes(true); }} aria-label="Ajustes" title="Ajustes: vista y música" className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary"><Icon n="settings" className="text-[18px]" /></button>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icon n="person" className="text-on-primary text-[18px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between w-full gap-space-sm">
          <nav className="flex items-center gap-space-xs scroll-x min-w-0" aria-label="Secciones">
            {TABS.map(x => (
              <button key={x.id} onClick={() => { API.click(); irA(x.id); }} aria-current={tab === x.id ? 'page' : undefined}
                className={`px-space-sm lg:px-space-md py-1.5 transition-all tracking-wider uppercase whitespace-nowrap font-label-lg text-label-lg lg:font-headline-md lg:text-headline-md ${tab === x.id
                  ? 'bg-primary-container text-on-primary-container rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
                {x.t}
              </button>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-space-sm bg-surface-container-high px-space-md py-1 rounded shrink-0">
            <Icon n="military_tech" className="text-primary text-base" />
            <div className="flex flex-col text-right">
              <span className="font-label-lg text-label-lg text-primary leading-none">NIVEL {f.nivel} / 100</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider leading-none mt-0.5">{f.rango}</span>
            </div>
          </div>
        </div>
      </div>
      {ajustes && <AjustesModal f={f} cerrar={() => setAjustes(false)} />}
    </header>
  );
}

function Pie({ f }) {
  const instalable = useInstalable();
  const key = (k, t, fn) => {
    const cont = <><span className="bg-surface-container-highest px-space-xs py-0.5 rounded text-primary font-bold">{k}</span><span className="hidden sm:inline">{t}</span></>;
    return fn
      ? <button onClick={fn} className="flex items-center gap-1.5 hover:text-on-surface transition-colors">{cont}</button>
      : <div className="flex items-center gap-1.5">{cont}</div>;
  };
  const chip = 'flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors whitespace-nowrap';
  return (
    <footer className="shrink-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="min-h-14 short:min-h-10 w-full px-gutter py-space-xs flex items-center justify-between gap-space-md font-label-md text-label-md text-on-surface-variant">
        <div className="hidden tactil:hidden xl:flex items-center gap-space-md">
          {key('ESC', 'ATRÁS / MENÚ')}{key('F1', 'INVITAR AMIGOS', () => { if (!f.red.activo) API.crearSala(); })}{key('R', 'CAMBIAR MODO')}{key('ENTER', 'DESPLEGAR')}
        </div>
        <div className="flex items-center gap-space-sm ml-auto scroll-x">
          {instalable && <button onClick={instalar} className={chip}><Icon n="download" className="text-base text-primary" /><span>INSTALAR APP</span></button>}
          {puedePantallaCompleta() && <button onClick={pantallaCompleta} className={chip}><Icon n="fullscreen" className="text-base text-tertiary" /><span className="hidden sm:inline">PANTALLA COMPLETA</span></button>}
          <button onClick={API.toggleSonido} className={chip}><Icon n={f.mute ? 'volume_off' : 'volume_up'} className="text-base text-secondary" /><span>SONIDO: {f.mute ? 'NO' : 'SÍ'}</span></button>
          <div className={chip + ' cursor-default'}><Icon n="public" className="text-base text-tertiary" /><span>{f.red.activo ? `RED: SALA ${f.red.codigo}` : 'RED: SOLO'}</span></div>
        </div>
      </div>
    </footer>
  );
}

export default function Menu({ f }) {
  const [tab, setTab] = useState(tomarPestanaInicial);
  const [modo, setModo] = useState(f.red.activo && f.red.salaModo ? f.red.salaModo : 'campania');
  const refModo = useRef(modo); refModo.current = modo;
  const refF = useRef(f); refF.current = f;

  // Atajos del teclado (sólo cuando no estás escribiendo ni tenés un botón enfocado)
  useEffect(() => {
    const al = e => {
      const a = document.activeElement;
      if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
      if (e.key === 'Escape') { setTab('jugar'); return; }
      if (e.key === 'F1') { e.preventDefault(); if (!refF.current.red.activo) API.crearSala(); setModo(m => (MODOS.find(o => o.id === m).online ? m : 'coop')); return; }
      if (a && a !== document.body) return;
      if (e.key === 'r' || e.key === 'R') { const i = MODOS.findIndex(o => o.id === refModo.current); setModo(MODOS[(i + 1) % MODOS.length].id); API.click(); }
      if (e.key === 'Enter') document.getElementById('boton-desplegar')?.click();
    };
    addEventListener('keydown', al);
    return () => removeEventListener('keydown', al);
  }, []);

  // Si el anfitrión cambia el modo de la sala, lo vemos acá
  useEffect(() => { if (f.red.cliente && f.red.salaModo) setModo(f.red.salaModo); }, [f.red.cliente, f.red.salaModo]);

  return (
    <div className="absolute inset-0 flex flex-col bg-background text-on-surface anim-entrar pointer-events-auto">
      <Cabecera f={f} tab={tab} irA={setTab} />
      <main className="flex-1 min-h-0 relative bg-background scroll-y">
        {/* Capas de atmósfera: foto del faro, haz de luz giratorio y grilla táctica */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen scale-105 filter blur-[1px]" style={{ backgroundImage: `url('${IMG_FONDO}')` }}></div>
          <div className="absolute -top-40 -left-20 w-[140vw] h-96 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent -rotate-12 blur-3xl animate-pulse pointer-events-none mix-blend-color-dodge"></div>
          <div className="absolute -bottom-20 right-0 w-[50vw] h-[512px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,193,116,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        </div>
        <div className="relative z-10 w-full px-gutter md:px-gutter-desktop py-space-md short:py-space-xs flex flex-col justify-between min-h-full">
          {tab === 'jugar' && <Lobby f={f} modo={modo} setModo={setModo} irA={setTab} />}
          {tab === 'armeria' && <Armeria f={f} irA={setTab} />}
          {tab === 'operadores' && <Operadores f={f} irA={setTab} />}
          {tab === 'pase' && <Pase f={f} />}
          {tab === 'historial' && <Historial f={f} />}
          {tab === 'tienda' && <Mercado f={f} />}
          {tab === 'ayuda' && <Ayuda />}
          <div className="w-full flex flex-wrap items-center justify-between gap-space-sm pt-space-md text-on-surface-variant font-label-sm text-label-sm">
            <div className="flex items-center gap-space-md flex-wrap">
              <span className="flex items-center gap-1.5 text-primary text-label-md"><Bruco className="w-5 h-5" />PROPIEDAD INTELECTUAL: BRUCO</span>
              <span className="hidden sm:inline">VERSIÓN 2.0 // MOTOR: CANVAS 2D + REACT</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-on-surface">TODOS LOS SISTEMAS OPERACIONALES</span>
            </div>
          </div>
        </div>
      </main>
      <Pie f={f} />
    </div>
  );
}
