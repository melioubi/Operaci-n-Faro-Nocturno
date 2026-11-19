import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, fmt, mmss } from './comun.js';

// HUD táctico del campo de batalla: radar, brújula, killfeed, escuadrón, arma y rachas.
const cuadro = 'bg-black/80 backdrop-blur-md border border-white/10';
const seguro = { top: 'pt-[max(0.5rem,env(safe-area-inset-top))]', izq: 'pl-[max(0.5rem,env(safe-area-inset-left))]', der: 'pr-[max(0.5rem,env(safe-area-inset-right))]', abajo: 'pb-[max(0.5rem,env(safe-area-inset-bottom))]' };
const CARDINALES = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
const dif = (a, b) => ((a - b + 540) % 360) - 180;         // diferencia de ángulos, de -180 a 180
const rumboTxt = r => `${String(r % 360).padStart(3, '0')}`;
const cardinalDe = r => CARDINALES[(Math.round(r / 45) * 45) % 360];

// ---------- Efectos de pantalla ----------
export function Efectos({ nvg }) {
  return (
    <>
      <div className="absolute inset-0 tactical-vignette pointer-events-none"></div>
      <div className="absolute inset-0 scanlines-overlay pointer-events-none opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none"></div>
      {nvg && <div className="absolute inset-0 nvg-grain pointer-events-none"></div>}
    </>
  );
}

// ---------- Arriba a la izquierda: radar y sector ----------
function Radar() {
  const ref = useRef(null);
  useEffect(() => { API.registrarRadar(ref.current); return () => API.registrarRadar(null); }, []);
  return (
    <div className="relative w-36 h-36 short:w-24 short:h-24 md:w-48 md:h-48 rounded-full border-2 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] overflow-hidden bg-slate-950/40">
      <canvas ref={ref} width={240} height={240} className="absolute inset-0 w-full h-full" aria-label="Radar" />
      <div className="radar-sweep-beam absolute inset-0 rounded-full pointer-events-none">
        <div className="w-1/2 h-1/2 ml-auto origin-bottom-left bg-gradient-to-tr from-emerald-500/35 to-transparent rounded-tr-full"></div>
      </div>
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-black font-mono text-emerald-400 bg-black/60 px-1 rounded">N</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black font-mono text-slate-400 short:hidden">S</span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-400 short:hidden">E</span>
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-400 short:hidden">O</span>
    </div>
  );
}
function Sector({ f }) {
  const pico = useRef(1);
  const n = f.info && f.info.n != null ? f.info.n : null;
  if (n === null || f.fase !== 'ola') pico.current = 1; else if (n > pico.current) pico.current = n;
  const prog = n === null ? Math.min(1, f.tiempo / 600) : 1 - n / Math.max(1, pico.current);
  const titulo = f.modo === 'equipos' ? 'SECTOR 02 · BOSQUE' : f.modo === 'tiro' ? 'CAMPO DE TIRO' : `SECTOR 0${f.info ? f.info.titulo.match(/\d/)?.[0] || 4 : 4} · ${f.info ? f.info.titulo.split(': ')[1] || 'FARO' : 'FARO'}`;
  return (
    <div className={`${cuadro} px-2.5 py-1.5 rounded clip-bezel-corner w-36 md:w-48 short:w-24 space-y-1`}>
      <div className="flex items-center justify-between text-[11px] short:text-[9px] font-mono tracking-tighter">
        <span className="text-slate-400 flex items-center gap-1.5 min-w-0 truncate"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span><span className="truncate">{titulo}</span></span>
        <span className="text-tactical-amber font-bold flex items-center gap-1 shrink-0"><Icon n="rainy" className="text-[10px]" />{mmss(Math.floor(f.tiempo))}</span>
      </div>
      <div className="w-full bg-slate-800 h-1 rounded overflow-hidden"><div className="bg-tactical-amber h-full transition-[width] duration-500" style={{ width: Math.round(prog * 100) + '%' }}></div></div>
    </div>
  );
}
function PanelTiro({ f }) {
  const t = f.tiro; if (!t) return null;
  const prec = t.disparos ? Math.round(100 * t.aciertos / t.disparos) : 0, dps = Math.round(t.danio / Math.max(1, t.t));
  const fila = (r, v) => <div className="flex justify-between"><span className="text-slate-400">{r}</span><span className="text-white font-bold">{v}</span></div>;
  return (
    <div className={`${cuadro} px-2.5 py-1.5 rounded w-36 md:w-48 short:w-28 font-mono text-[10px] md:text-[11px] border-l-2 border-l-tactical-amber`}>
      <div className="text-tactical-amber font-bold tracking-widest mb-0.5 flex items-center gap-1"><Icon n="query_stats" className="text-xs" />RENDIMIENTO</div>
      {fila('DISPAROS', t.disparos)}{fila('PRECISIÓN', prec + '%')}{fila('DAÑO TOTAL', fmt(t.danio))}{fila('DPS PROM.', dps)}
    </div>
  );
}

// ---------- Arriba al centro: brújula y misión ----------
function Brujula({ f }) {
  const base = Math.round(f.rumbo / 15) * 15, marcas = [];
  for (let d = -60; d <= 60; d += 15) { const g = (base + d + 360) % 360, off = dif(g, f.rumbo); if (Math.abs(off) <= 62) marcas.push({ g, off }); }
  const objOff = f.obj && f.obj.rumbo != null ? Math.max(-62, Math.min(62, dif(f.obj.rumbo, f.rumbo))) : null;
  const pos = off => `${50 + off * (46 / 62)}%`;
  return (
    <section className="flex flex-col items-center min-w-0 flex-1 max-w-xl mx-2" aria-label="Brújula y misión">
      <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-emerald-400/80 bg-black/60 px-3 py-0.5 rounded-full border border-emerald-500/20 backdrop-blur-sm mb-1.5 short:hidden">
        <span><Icon n="my_location" className="text-[11px] mr-1 text-tactical-amber" />43°21'18"N 70°24'55"W</span><span className="text-slate-600">|</span><span>ALT: 14M</span><span className="text-slate-600">|</span>
        <span><Icon n="air" className="text-[11px] mr-1" />28 KTS NE</span><span className="text-slate-600">|</span><span className="text-tactical-amber"><Icon n="cloud" className="text-[11px] mr-1" />NIEBLA: 78%</span>
      </div>
      <div className="relative w-full h-9 md:h-11 bg-gradient-to-r from-transparent via-black/80 to-transparent border-y border-white/15 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-tactical-amber z-20"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-tactical-amber z-20"></div>
        {marcas.map(m => {
          const card = CARDINALES[m.g], cerca = Math.abs(m.off) < 6;
          return <span key={m.g} className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] md:text-[11px] font-mono font-semibold whitespace-nowrap ${cerca ? 'opacity-0' : card ? 'text-slate-200' : 'text-slate-500'}`} style={{ left: pos(m.off) }}>{card ? `${rumboTxt(m.g)} · ${card}` : rumboTxt(m.g)}</span>;
        })}
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center leading-none">
          <span className="text-tactical-amber font-black text-sm tracking-wider drop-shadow-[0_0_6px_#f59e0b]">{rumboTxt(f.rumbo)} · {cardinalDe(f.rumbo)}</span>
        </div>
        {objOff !== null && (
          <div className="absolute top-0.5 -translate-x-1/2 flex flex-col items-center" style={{ left: pos(objOff) }}>
            <Icon n="navigation" className="text-tactical-amber text-[13px] drop-shadow-[0_0_6px_#f59e0b] rotate-180" />
            <span className="text-[9px] font-mono font-bold text-tactical-amber tracking-widest">[{f.obj.dist}M]</span>
          </div>
        )}
      </div>
      {f.obj && f.obj.texto && (
        <div className="mt-1.5 flex items-center gap-2 bg-gradient-to-r from-transparent via-black/85 to-transparent px-4 py-0.5 border-b border-tactical-amber/40 max-w-full">
          <Icon n="target" className="text-tactical-amber text-xs shrink-0" />
          <span className="font-tactical font-bold text-[11px] md:text-xs uppercase tracking-widest text-tactical-amber drop-shadow-[0_0_4px_#f59e0b] truncate">{f.obj.texto}</span>
          {f.obj.dist != null && <span className="font-mono text-[10px] text-slate-400 bg-white/10 px-1.5 rounded border border-white/20 shrink-0">{f.obj.dist}m</span>}
        </div>
      )}
      {f.info && f.info.sub && <div className={`font-mono text-[10px] mt-0.5 ${f.info.urgente ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>{f.info.sub}{f.info.n != null ? ` // HOSTILES ${f.info.n}` : ''}</div>}
      {f.jefe && (
        <div className={`${cuadro} mt-1 px-3 py-1 w-64 max-w-full rounded`}>
          <div className="font-mono text-[10px] text-red-400 tracking-widest text-center">COMANDANTE ENEMIGO</div>
          <div className="h-1.5 bg-slate-800 rounded overflow-hidden mt-1"><div className="h-full bg-red-500 transition-[width] duration-150" style={{ width: (100 * f.jefe.hp / f.jefe.maxhp) + '%' }}></div></div>
        </div>
      )}
    </section>
  );
}

// ---------- Arriba a la derecha: visión nocturna, killfeed, alertas ----------
function Derecha({ f, nvg, setNvg }) {
  return (
    <section className="flex flex-col items-end gap-1.5 max-w-[15rem] md:max-w-xs">
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <button onClick={() => { API.click(); setNvg(!nvg); }} aria-pressed={nvg} title="Visión nocturna [N]"
          className={`flex items-center gap-2 bg-slate-950/80 hover:bg-emerald-950/60 border text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded font-mono text-[11px] md:text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${nvg ? 'border-emerald-300 bg-emerald-950/90' : 'border-emerald-500/40'}`}>
          <Icon n={nvg ? 'visibility' : 'visibility_off'} className="text-sm" /><span>NVG [N]: <b className={nvg ? 'text-emerald-400' : 'text-white'}>{nvg ? 'ACTIVO' : 'STANDBY'}</b></span>
        </button>
        <button onClick={API.pausar} aria-label="Pausa" className="bg-slate-950/80 border border-white/20 text-white hover:text-tactical-amber rounded w-8 h-8 flex items-center justify-center backdrop-blur-md"><Icon n="pause" className="text-lg" /></button>
      </div>
      <div className="flex flex-col gap-1 w-full items-end short:hidden md:short:flex">
        {f.feed.slice(0, 4).map(k => (
          <div key={k.id} className="flex items-center gap-2 bg-black/70 backdrop-blur-sm border-r-2 border-emerald-500 px-2.5 py-1 rounded text-[10px] md:text-[11px] font-mono anim-entrar" style={{ opacity: Math.min(1, (7 - k.k) * 1.2) }}>
            <span className="text-emerald-400 font-bold truncate max-w-[6rem]">{k.quien}</span>
            <span className="text-slate-400 text-[9px]">[{k.arma}]</span>
            <span className="text-red-400 font-semibold truncate max-w-[6rem]">{k.objetivo}</span>
          </div>
        ))}
        {f.alerta && (
          <div className="flex items-center gap-1.5 bg-tactical-amber/15 border border-tactical-amber/40 px-2 py-0.5 rounded text-[10px] font-mono text-tactical-amber animate-pulse">
            <Icon n="warning" className="text-[11px]" /><span>{f.alerta}</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Abajo a la izquierda: escuadrón ----------
function Escuadron({ f }) {
  const lista = f.escuadron.filter(j => f.modo !== 'equipos' || j.equipo === f.eq.mio);
  const n = lista.length, yo = lista.find(j => j.yo), otros = lista.filter(j => !j.yo).slice(0, 4);
  const pct = j => Math.max(0, Math.min(100, 100 * j.hp / j.maxhp));
  const color = j => (j.muerto ? 'bg-slate-600' : pct(j) > 35 ? 'bg-emerald-400' : 'bg-tactical-amber');
  return (
    <section className="flex flex-col gap-1.5 w-60 short:w-44 md:w-80" aria-label="Escuadrón">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded border-l-2 border-emerald-500 backdrop-blur-md">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400 truncate"><Icon n="groups" className="text-[11px]" />{f.mp ? `ESCUADRÓN (${n})` : 'LOBO SOLITARIO'}</span>
        {f.mp && <span className="text-[10px] text-slate-400 flex items-center gap-1 short:hidden"><Icon n="mic" className="text-emerald-400 text-[11px] animate-pulse" />CANAL ACTIVO</span>}
      </div>
      {yo && (
        <article className="bg-black/85 backdrop-blur-md border border-emerald-500/50 p-2 short:p-1.5 rounded clip-bezel-corner shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between font-mono text-xs mb-1">
            <div className="flex items-center gap-1.5 font-bold min-w-0"><span className="w-4 h-4 rounded bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black shrink-0">1</span>
              <span className="text-white truncate">{yo.nombre}</span><span className="text-[9px] text-emerald-400 font-normal shrink-0">[TÚ]</span></div>
            <span className="text-[10px] font-bold text-emerald-400 shrink-0">{Math.round(pct(yo))}%</span>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1 short:hidden"><span>{f.op.nombre}</span><span className="text-tactical-amber">NV {f.nivel}</span></div>
          <div className="w-full bg-slate-900 h-2 rounded-sm overflow-hidden border border-white/10"><div className={`${color(yo)} h-full shadow-[0_0_8px_#10b981] transition-[width] duration-150`} style={{ width: pct(yo) + '%' }}></div></div>
        </article>
      )}
      {otros.map((j, i) => (
        <article key={j.nombre + i} className={`bg-black/70 backdrop-blur-md border border-white/10 p-1.5 rounded text-slate-300 short:hidden ${j.muerto ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between font-mono text-[11px] mb-1">
            <div className="flex items-center gap-1.5 min-w-0"><span className="w-3.5 h-3.5 rounded bg-slate-700 text-slate-200 flex items-center justify-center text-[9px] shrink-0">{i + 2}</span><span className="font-semibold text-slate-200 truncate">{j.nombre}{j.bot ? ' [BOT]' : ''}</span></div>
            <span className={`text-[9px] font-mono ${pct(j) > 35 ? 'text-slate-400' : 'text-tactical-amber'}`}>{j.muerto ? 'CAÍDO' : Math.round(pct(j)) + '%'}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-sm overflow-hidden"><div className={`${color(j)} h-full`} style={{ width: pct(j) + '%' }}></div></div>
        </article>
      ))}
    </section>
  );
}

// ---------- Abajo a la derecha: rachas y arma ----------
function Rachas({ f }) {
  const r = [
    { k: 'dron', n: 'DRON DE APOYO', i: 'drone', a: 'z', tecla: 'Z', meta: 3 }, { k: 'aereo', n: 'ATAQUE AÉREO', i: 'flight', a: 'x', tecla: 'X', meta: 6 },
    { k: 'torreta', n: 'TORRETA AUTO', i: 'target', a: 'c', tecla: 'C', meta: 10 },
  ];
  return (
    <div className="flex flex-col gap-1 font-mono text-[10px] short:hidden md:short:flex" aria-label="Rachas de bajas">
      {r.map(x => {
        const on = f.S[x.k], act = f.activos[x.k];
        return (
          <button key={x.k} onClick={() => API.accion(x.a)} disabled={!on}
            className={`pointer-events-auto flex items-center justify-between gap-2 px-2 py-1 rounded backdrop-blur-sm text-left transition-colors ${on ? 'bg-emerald-950/80 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse text-emerald-300' : 'bg-black/75 border border-white/10 text-slate-500'}`}>
            <span className="flex items-center gap-1.5 font-bold"><Icon n={x.i} className="text-sm" />{x.n}{act > 0 && <span className="text-sky-300 font-normal">{x.k === 'aereo' ? '!' : act + 's'}</span>}</span>
            {on ? <kbd className="bg-emerald-400 text-black px-1.5 rounded font-black text-[9px]">[{x.tecla}]</kbd> : <span className="text-[9px] text-slate-400 font-semibold">[{Math.min(f.racha, x.meta)}/{x.meta}]</span>}
          </button>
        );
      })}
    </div>
  );
}
function Arma({ f }) {
  const NOMBRES = ['PISTOLA', 'FUSIL M4', 'ESCOPETA'], m = f.mun[f.arma] || { c: 0, res: 0 }, tc = f.touch, ai = f.armaInfo;
  const vacio = m.c === 0, bajo = m.c <= f.cargador * 0.25;
  return (
    <article className="bg-black/90 backdrop-blur-md border border-white/20 p-2.5 short:p-1.5 rounded clip-bezel-corner w-64 short:w-52 md:w-72 shadow-[0_0_20px_rgba(0,0,0,0.8)]" aria-label="Arma activa">
      <div className="grid grid-cols-3 gap-1 mb-1.5 pointer-events-auto">
        {NOMBRES.map((n, i) => {
          const mi = f.mun[i] || { c: 0, res: 0 }, act = i === f.arma, sin = mi.c === 0 && mi.res === 0;
          return (
            <button key={n} onClick={() => API.accion(String(i + 1))} aria-pressed={act}
              className={`rounded px-1 py-0.5 text-center leading-tight border font-mono transition-colors ${act ? 'bg-tactical-amber/20 border-tactical-amber text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
              <div className={`text-[9px] ${sin ? 'text-red-400' : ''}`}>{tc ? '' : <span className="text-tactical-amber mr-0.5">{i + 1}</span>}{n.split(' ')[0]}</div>
              <div className={`text-[9px] ${sin ? 'text-red-400' : 'text-slate-500'}`}>{mi.res < 0 ? `${mi.c}/∞` : `${mi.c}/${mi.res}`}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 short:hidden">
        <div><h2 className="text-sm font-black font-tactical tracking-wider text-white uppercase">{ai.nombre}</h2><p className="text-[10px] font-mono text-slate-400">CALIBRE {ai.calibre}</p></div>
        <div className="flex flex-col items-end">
          {ai.sil && <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1"><Icon n="volume_off" className="text-[10px]" />SILENCIADO</span>}
          <div className="flex items-center gap-1 mt-0.5"><span className="text-[9px] font-mono text-slate-300">{ai.modo}</span><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981]"></span></div>
        </div>
      </div>
      <div className="flex items-baseline justify-between px-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-5xl short:text-4xl md:text-6xl font-black font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.35)] ${vacio ? 'text-tactical-threat' : bajo ? 'text-tactical-amberGlow' : 'text-white'}`}>{m.c}</span>
          <span className="text-slate-500 font-mono text-xl">/</span>
          <span className="text-slate-400 font-mono text-lg md:text-xl font-bold">{m.res < 0 ? '∞' : m.res}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-mono text-tactical-amber bg-tactical-amber/10 px-1 rounded border border-tactical-amber/30">CARGADOR {f.cargador} RDS</span>
          {f.recargando && <span className="text-[10px] font-mono text-tactical-amberGlow mt-1 animate-pulse">RECARGANDO {Math.round(f.recProg * 100)}%</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 mt-1 border-t border-white/10 font-mono short:hidden">
        {[['explosion', 'text-tactical-amber', `x${f.gran}`, 'G', 'g'], ['restart_alt', 'text-emerald-400', f.recargando ? '...' : 'RECAR', 'R', 'r'], ['swap_horiz', 'text-sky-400', 'ARMA', 'Q', 'q']].map(([ic, col, tx, k, a]) => (
          <button key={a} onClick={() => API.accion(a)} className="pointer-events-auto flex items-center justify-between bg-white/5 px-2 py-1 rounded border border-white/10 hover:bg-white/10">
            <span className="flex items-center gap-1 text-slate-200"><Icon n={ic} className={`text-xs ${col}`} /><span className="text-[10px] font-bold">{tx}</span></span>
            <kbd className="text-[9px] text-slate-400 font-bold">[{k}]</kbd>
          </button>
        ))}
      </div>
    </article>
  );
}
function BotonDisparo() {
  const soltar = () => API.setDisparo(false);
  return (
    <button type="button" aria-label="Disparar"
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); API.setDisparo(true); }}
      onPointerUp={soltar} onPointerCancel={soltar}
      className="pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[46%] z-10 w-16 h-16 short:w-14 short:h-14 rounded-full border-2 border-red-300 bg-red-950/85 text-white font-mono text-[11px] font-bold tracking-wider select-none touch-none active:scale-95 active:bg-red-700">
      FUEGO
    </button>
  );
}
function BotonesTactiles({ f }) {
  const m = f.mun[f.arma] || { c: 0, res: 0 };
  const lista = [
    { t: 'RECAR', a: 'r', alerta: m.c <= f.cargador * 0.25 && m.res !== 0 }, { t: 'GRAN', a: 'g' },
    { t: 'ARMA', a: 'q', alerta: m.c === 0 && m.res === 0 }, { t: 'CAJA', a: 'e', ok: !!f.caja && f.caja.cd === 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 pointer-events-auto">
      {lista.map(b => (
        <button key={b.t} onPointerDown={e => { e.preventDefault(); API.accion(b.a); }} aria-label={b.t}
          className={`w-12 h-12 short:w-11 short:h-11 rounded-full border font-mono text-[10px] font-bold flex items-center justify-center select-none touch-none active:scale-95 transition-colors ${b.alerta ? 'bg-red-900/80 border-red-400 text-red-100 animate-pulse' : b.ok ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' : 'bg-black/70 border-white/30 text-white'}`}>{b.t}</button>
      ))}
    </div>
  );
}

// ---------- Mensajes al centro ----------
function Mensajes({ f }) {
  const b = f.banner, r = f.radio, tc = f.touch;
  const a = b ? Math.max(0, Math.min(1, b.k * 3, (b.dur - b.k) * 2)) : 0;
  const n = r ? Math.min(r.txt.length, Math.floor(r.k * 45)) : 0;
  const m = f.mun[f.arma] || { c: 0, res: 0 };
  let msg = null, cls = 'text-tactical-amberGlow', grande = false;
  if (f.recargando) { msg = 'RECARGANDO...'; cls = 'text-tactical-amber'; }
  else if (m.c === 0 && m.res !== 0) { msg = tc ? '¡SIN BALAS! TOCÁ RECAR' : '¡SIN BALAS! APRETÁ  R  PARA RECARGAR'; cls = 'text-red-400 animate-pulse'; grande = true; }
  else if (m.c === 0 && m.res === 0) { msg = tc ? '¡SIN MUNICIÓN! TOCÁ ARMA PARA CAMBIAR' : '¡SIN MUNICIÓN! CAMBIÁ DE ARMA CON  1  2  3  O  Q'; cls = 'text-red-400 animate-pulse'; grande = true; }
  else if (m.c <= f.cargador * 0.25 && m.res !== 0) msg = tc ? 'Pocas balas: tocá RECAR' : 'Pocas balas: apretá R para recargar';
  else if (f.hp < f.maxhp * 0.35 && !f.muerto) { msg = '¡CUBRITE PARA RECUPERAR VIDA!'; cls = 'text-red-400 animate-pulse'; }
  return (
    <>
      {b && (
        <div key={b.id} className="absolute inset-x-0 top-[26%] short:top-[30%] flex flex-col items-center gap-2 pointer-events-none" style={{ opacity: a }}>
          <div className="w-full bg-black/70 backdrop-blur-md border-y border-tactical-amber/40 py-2 short:py-1 text-center">
            <div className="font-tactical font-bold text-3xl md:text-5xl short:text-2xl text-tactical-amber uppercase tracking-[0.12em] drop-shadow-[0_0_14px_rgba(245,158,11,0.5)]">{b.t}</div>
            {b.sub && <div className="font-mono text-[11px] text-slate-300 uppercase mt-0.5 tracking-wider">{b.sub}</div>}
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 top-[40%] flex flex-col items-center gap-1 pointer-events-none">
        {f.toasts.map(t => <div key={t.id} className="bg-black/80 backdrop-blur border-l-2 border-tactical-amber rounded px-3 py-0.5 font-mono text-[11px] anim-entrar" style={{ color: t.color, opacity: Math.min(1, (2.5 - t.k) * 2) }}>{t.txt}</div>)}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-none px-2">
        {r && (
          <div key={r.id} className="w-[min(30rem,92%)] bg-black/80 backdrop-blur-md border-l-2 border-sky-400 px-3 py-1.5 short:py-1 rounded">
            <div className="font-mono text-[10px] text-sky-400 tracking-widest uppercase flex items-center gap-1"><Icon n="headset_mic" className="text-[11px]" />[RADIO] {r.quien}</div>
            <div className="font-mono text-[11px] text-slate-100">{r.txt.slice(0, n)}</div>
          </div>
        )}
        {f.caja && <div className="bg-black/80 backdrop-blur rounded px-3 py-0.5 font-mono text-[11px] text-tactical-amber border border-tactical-amber/30"><kbd className="font-bold">{tc ? 'TOCÁ CAJA' : '[E]'}</kbd> {f.caja.cd > 0 ? `CAJA VACÍA (${f.caja.cd}S)` : 'CAJA DE MUNICIÓN'}</div>}
        {msg && <div className={`bg-black/75 backdrop-blur rounded px-4 py-1 font-tactical font-bold tracking-wider ${grande ? 'text-lg' : 'text-sm'} ${cls}`}>{msg}</div>}
        {!tc && (
          <section className="hidden lg:flex items-center gap-4 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-mono text-slate-300">
            <span><kbd className="bg-white/15 px-1.5 py-0.5 rounded text-white font-bold">[SHIFT]</kbd> SPRINT</span><span className="text-slate-600">·</span>
            <span><kbd className="bg-white/15 px-1.5 py-0.5 rounded text-white font-bold">[1 2 3]</kbd> ARMAS</span><span className="text-slate-600">·</span>
            <span><kbd className="bg-white/15 px-1.5 py-0.5 rounded text-white font-bold">[R]</kbd> RECARGAR</span><span className="text-slate-600">·</span>
            <span className="text-tactical-amber"><kbd className="bg-tactical-amber/20 border border-tactical-amber/40 px-1.5 py-0.5 rounded font-bold">[E]</kbd> CAJA</span>
          </section>
        )}
        {f.tiempo < 14 && f.estado === 'jugando' && !f.muerto && (
          <div className="bg-black/70 rounded px-3 py-1 font-mono text-[11px] text-tactical-amber text-center">{tc ? ((f.camara === 'primera' || f.camara === 'tercera') ? 'IZQUIERDA = caminar · DERECHA = mover la mira · FUEGO = disparar' : 'Pulgar IZQUIERDO = caminar · Pulgar DERECHO = apuntar y disparar') : 'R = RECARGAR · 1 2 3 o Q = CAMBIAR ARMA · G = GRANADA'}</div>
        )}
      </div>
    </>
  );
}

export default function Hud({ f }) {
  const [nvg, setNvg] = useState(false);
  // La visión nocturna se aplica al mundo (el canvas) y se activa también con la tecla N
  useEffect(() => {
    const c = document.getElementById('c');
    const c3 = document.getElementById('c3d');
    if (c) c.classList.toggle('nvg-activo', nvg);
    if (c3) c3.classList.toggle('nvg-activo', nvg);
    return () => { if (c) c.classList.remove('nvg-activo'); if (c3) c3.classList.remove('nvg-activo'); };
  }, [nvg]);
  useEffect(() => {
    const al = e => { if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return; if (e.key === 'n' || e.key === 'N') setNvg(v => !v); };
    addEventListener('keydown', al); return () => removeEventListener('keydown', al);
  }, []);
  const tc = f.touch;
  return (
    <div className="absolute inset-0 pointer-events-none font-tactical text-xs tracking-wider">
      <Efectos nvg={nvg} />
      <header className={`absolute top-0 inset-x-0 flex justify-between items-start gap-2 ${seguro.top} ${seguro.izq} ${seguro.der}`}>
        <div className="flex flex-col gap-1.5 shrink-0"><Radar /><Sector f={f} /><PanelTiro f={f} /></div>
        <Brujula f={f} />
        <Derecha f={f} nvg={nvg} setNvg={setNvg} />
      </header>
      <footer className={`absolute bottom-0 inset-x-0 flex justify-between items-end gap-2 ${seguro.abajo} ${seguro.izq} ${seguro.der}`}>
        <Escuadron f={f} />
        <div className="flex flex-col items-end gap-2">
          <Rachas f={f} />
          {tc && <BotonesTactiles f={f} />}
          <Arma f={f} />
        </div>
      </footer>
      <Mensajes f={f} />
      {tc && (f.camara === 'primera' || f.camara === 'tercera') && <BotonDisparo />}
      {f.mp && f.muerto && f.estado === 'jugando' && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black/75 backdrop-blur-md py-3 text-center">
          <div className="font-tactical font-bold text-5xl text-red-400 uppercase tracking-widest">CAÍSTE</div>
          <div className="font-mono text-[11px] text-slate-300">VOLVÉS EN {Math.max(0, f.respT)}...</div>
        </div>
      )}
    </div>
  );
}
