import { useEffect, useRef, useState } from 'react';
import { Icon, Bruco } from './Icon.jsx';
import { API, fmt, mmss, pantallaCompleta, puedePantallaCompleta } from './comun.js';
import { AyudaContenido } from './Paginas.jsx';

const panel = 'bg-surface-container-lowest/80 backdrop-blur-md rounded-lg';
const insetSup = 'pt-[max(0.5rem,env(safe-area-inset-top))]';

// ---------- Marco de las ventanas (pausa, tienda, fin) ----------
function Ventana({ titulo, chip, color = 'bg-primary', children, ancho = 'max-w-md', cerrar }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-sm scroll-y anim-entrar pointer-events-auto">
      <div className={`w-full ${ancho} max-h-full scroll-y bg-surface-container-low rounded-lg shadow-2xl p-space-md short:p-space-sm flex flex-col gap-space-md short:gap-space-sm`}>
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2"><span className={`w-1.5 h-4 ${color}`}></span><h2 className="font-headline-lg-mobile text-headline-lg-mobile md:text-headline-lg md:font-headline-lg text-on-surface uppercase tracking-wider">{titulo}</h2></div>
          {chip}
          {cerrar && <button onClick={cerrar} aria-label="Cerrar" className="p-1 rounded text-on-surface-variant hover:text-on-surface"><Icon n="close" /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}
const Boton = ({ children, onClick, icono, primario, deshabilitado, className = '' }) => (
  <button onClick={() => { API.click(); onClick(); }} disabled={deshabilitado}
    className={`w-full py-2.5 px-space-md rounded-lg font-headline-md text-headline-md tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 ${primario ? 'bg-primary hover:bg-primary-fixed text-on-primary shadow-[0_0_20px_rgba(245,158,11,0.35)]' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'} ${className}`}>
    {icono && <Icon n={icono} className="text-xl" />}{children}
  </button>
);

// ---------- Pausa ----------
function Pausa({ f, abrirAyuda }) {
  return (
    <Ventana titulo={f.mp ? 'MENÚ' : 'PAUSA'} chip={<span className="font-label-sm text-label-sm text-primary bg-surface-container-highest px-space-xs py-0.5 rounded">{f.mp ? 'LA PARTIDA SIGUE' : 'EN ESPERA'}</span>}>
      <div className="flex flex-col gap-space-sm">
        <Boton primario icono="play_arrow" onClick={API.reanudar}>SEGUIR</Boton>
        <Boton icono="help" onClick={abrirAyuda}>CÓMO JUGAR</Boton>
        <Boton icono={f.mute ? 'volume_off' : 'volume_up'} onClick={API.toggleSonido}>SONIDO: {f.mute ? 'NO' : 'SÍ'}</Boton>
        {puedePantallaCompleta() && <Boton icono="fullscreen" onClick={pantallaCompleta}>PANTALLA COMPLETA</Boton>}
        <Boton icono="logout" onClick={API.salir}>{f.mp ? 'SALIR DE LA SALA' : 'SALIR AL MENÚ'}</Boton>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">Consejo: los enemigos con láser rojo están por disparar. ¡Movete o cubrite!</p>
    </Ventana>
  );
}

function AyudaModal({ cerrar }) {
  useEffect(() => {
    const al = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.stopImmediatePropagation(); e.preventDefault(); cerrar(); } };
    addEventListener('keydown', al, true);
    return () => removeEventListener('keydown', al, true);
  }, [cerrar]);
  return (
    <Ventana titulo="CÓMO JUGAR" ancho="max-w-4xl" color="bg-tertiary" cerrar={cerrar}>
      <AyudaContenido />
      <Boton primario onClick={cerrar}>LISTO</Boton>
    </Ventana>
  );
}

// ---------- Tienda ----------
function Tienda({ f }) {
  const t = f.tienda;
  return (
    <Ventana titulo="TIENDA DEL ESCUADRÓN" ancho="max-w-3xl" color="bg-secondary"
      chip={<span className="font-label-md text-label-md text-secondary bg-surface-container-highest px-space-sm py-1 rounded font-bold whitespace-nowrap">{fmt(t.creditos)} PTS</span>}>
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Gastá tus puntos antes de seguir. También podés usar las teclas 1 a 6.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
        {t.items.map((it, i) => {
          const agotado = it.max && it.veces >= it.max, puede = !agotado && t.creditos >= it.p;
          return (
            <button key={it.id} disabled={!puede} onClick={() => API.comprar(it.id)}
              className={`text-left rounded-lg p-space-sm flex items-center justify-between gap-space-sm transition-all ${puede ? 'bg-surface-container hover:bg-surface-container-high hover:shadow-[0_0_14px_rgba(245,158,11,0.25)]' : 'bg-surface-container-lowest/60 opacity-60'}`}>
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="w-7 h-7 rounded bg-surface-container-highest text-primary font-label-md text-label-md font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0"><div className="font-label-lg text-label-lg text-on-surface uppercase font-bold truncate">{it.n}</div><div className="font-label-sm text-label-sm text-on-surface-variant">{it.d}</div></div>
              </div>
              <span className={`font-label-md text-label-md font-bold whitespace-nowrap px-space-xs py-0.5 rounded bg-surface-container-highest ${agotado ? 'text-tertiary' : puede ? 'text-secondary' : 'text-error'}`}>{agotado ? 'COMPRADO' : `${fmt(it.p)} PTS`}</span>
            </button>
          );
        })}
      </div>
      <Boton primario icono="play_arrow" onClick={API.cerrarTienda}>SEGUIR</Boton>
    </Ventana>
  );
}

// ---------- Fin de la partida ----------
const Dato = ({ r, v, c = 'text-on-surface' }) => (
  <div className="flex items-center justify-between bg-surface-container rounded px-space-sm py-1.5"><span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">{r}</span><span className={`font-label-lg text-label-lg font-bold ${c}`}>{v}</span></div>
);
function Fin({ f }) {
  const x = f.fin, listo = x.t > (f.estado === 'victoria' ? 2 : 1.2);
  const credito = <div className="flex items-center justify-center gap-1.5 text-primary font-label-md text-label-md"><Bruco className="w-5 h-5" />PROPIEDAD INTELECTUAL: BRUCO</div>;
  if (f.mp) {
    const eq = f.estado === 'finEq';
    const gano = x.ganador === 'empate' ? '¡EMPATE!' : `¡GANÓ EL EQUIPO ${x.ganador.toUpperCase()}!`;
    return (
      <Ventana ancho="max-w-xl" titulo={eq ? gano : 'CAYÓ TODO EL ESCUADRÓN'} color={eq ? (x.ganador === 'rojo' ? 'bg-error' : 'bg-secondary') : 'bg-error'}>
        {eq ? <div className="text-center font-headline-lg text-headline-lg"><span className="text-secondary">VERDE {x.marc.verde}</span><span className="text-outline mx-3">—</span><span className="text-error">{x.marc.rojo} ROJO</span></div>
          : <p className="font-body-md text-body-md text-on-surface-variant">Aguantaron {x.olasSup} oleadas juntos · {fmt(x.pts)} puntos</p>}
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[1fr_4rem_4rem] px-space-sm font-label-sm text-label-sm text-on-surface-variant tracking-wider"><span>JUGADOR</span><span className="text-right">BAJAS</span><span className="text-right">CAÍDAS</span></div>
          {x.tabla.map(j => (
            <div key={j.nombre + j.bajas + j.muertes} className={`grid grid-cols-[1fr_4rem_4rem] items-center rounded px-space-sm py-1.5 font-label-lg text-label-lg ${j.yo ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container'}`}>
              <span className={`truncate uppercase ${eq ? (j.equipo === 'verde' ? 'text-secondary' : 'text-error') : 'text-on-surface'}`}>{j.yo ? '▸ ' : ''}{j.nombre}</span>
              <span className="text-right text-on-surface">{j.bajas}</span><span className="text-right text-on-surface-variant">{j.muertes}</span></div>))}
        </div>
        <div className="font-label-md text-label-md text-tertiary text-center">XP GANADA: +{fmt(x.xpPartida)}</div>
        {listo && (f.red.host
          ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs"><Boton primario icono="restart_alt" onClick={API.reintentar}>JUGAR OTRA</Boton><Boton icono="groups" onClick={API.volverSala}>A LA SALA</Boton><Boton icono="logout" onClick={API.salir}>SALIR</Boton></div>
          : <div className="flex flex-col gap-space-xs"><p className="text-center font-label-md text-label-md text-on-surface-variant">Esperando al anfitrión...</p><Boton icono="logout" onClick={API.salir}>SALIR</Boton></div>)}
      </Ventana>
    );
  }
  if (f.estado === 'victoria') {
    const t = x.tiempo;
    return (
      <Ventana ancho="max-w-xl" titulo="¡MISIÓN CUMPLIDA!" color="bg-primary">
        <p className="font-body-md text-body-md text-on-surface-variant -mt-2">Aguantaste todas las oleadas y el helicóptero te rescató.</p>
        <div className="flex flex-col gap-1.5">
          <Dato r="PUNTOS" v={fmt(x.pts)} c="text-primary" /><Dato r="BAJAS" v={x.bajas} /><Dato r="PUNTERÍA" v={x.prec + '%'} /><Dato r="TIEMPO" v={mmss(t)} /><Dato r="DIFICULTAD" v={x.dificultad} /><Dato r="XP GANADA" v={'+' + fmt(x.xpPartida)} c="text-tertiary" />
        </div>
        <div className="text-center"><div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest">RANGO DE LA MISIÓN</div><div className="font-headline-lg text-headline-lg text-secondary tracking-wider">{x.rango}</div>
          {x.nuevoRecord && <div className="mt-1 inline-block bg-error-container text-on-error-container px-space-sm py-0.5 rounded font-label-md text-label-md animate-pulse">¡NUEVO RÉCORD!</div>}</div>
        {credito}
        {listo && <Boton primario icono="logout" onClick={API.salir}>VOLVER AL MENÚ</Boton>}
      </Ventana>
    );
  }
  return (
    <Ventana ancho="max-w-xl" titulo={x.sup ? 'FIN DE LA SUPERVIVENCIA' : 'MISIÓN FALLIDA'} color="bg-error">
      <p className="font-body-md text-body-md text-on-surface-variant -mt-2">{x.sup ? `Aguantaste ${x.olasSup} oleadas · récord: ${x.recordSup}` : 'Se te acabó la vida antes de la extracción.'}</p>
      <div className="flex flex-col gap-1.5">
        <Dato r="PUNTOS" v={fmt(x.pts)} c="text-primary" /><Dato r="BAJAS" v={x.bajas} />{!x.sup && <Dato r="ZONA" v={`${x.zona}/4`} />}<Dato r="XP GANADA" v={'+' + fmt(x.xpPartida)} c="text-tertiary" /><Dato r="TU NIVEL" v={f.nivel} c="text-secondary" />
      </div>
      {listo && <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs"><Boton primario icono="restart_alt" onClick={API.reintentar}>{x.sup ? 'OTRA VEZ' : `REINTENTAR ZONA ${x.zona}`}</Boton><Boton icono="logout" onClick={API.salir}>MENÚ</Boton></div>}
    </Ventana>
  );
}

// ---------- HUD ----------
function Minimapa() {
  const ref = useRef(null);
  useEffect(() => { API.registrarMinimapa(ref.current); return () => API.registrarMinimapa(null); }, []);
  return <canvas ref={ref} width={400} height={100} className="w-40 short:w-32 md:w-52 h-auto block rounded" aria-label="Minimapa" />;
}

function PanelVida({ f }) {
  const pct = Math.max(0, Math.min(100, 100 * f.hp / f.maxhp)), xp = f.xpSig ? Math.min(100, 100 * (f.xp - f.xpIni) / (f.xpSig - f.xpIni)) : 100;
  const color = pct > 60 ? 'bg-secondary' : pct > 30 ? 'bg-primary-container' : 'bg-error';
  return (
    <div className={`${panel} w-44 short:w-40 md:w-56 p-space-sm short:p-1.5 flex flex-col gap-1`}>
      <div className="flex items-center justify-between font-label-sm text-label-sm"><span className="text-on-surface-variant tracking-widest">VIDA</span><span className={pct > 30 ? 'text-on-surface' : 'text-error'}>{f.hp}/{f.maxhp}</span></div>
      <div className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-[width] duration-150`} style={{ width: pct + '%' }}></div></div>
      <div className="flex items-center justify-between font-label-md text-label-md"><span className="text-primary">{fmt(f.pts)} PTS</span><span className="text-tertiary">NV {f.nivel}</span></div>
      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-tertiary" style={{ width: xp + '%' }}></div></div>
    </div>
  );
}

function PanelZona({ f }) {
  if (f.modo === 'equipos') {
    return (
      <div className={`${panel} px-space-md py-space-sm short:py-1 text-center min-w-[12rem]`}>
        <div className="flex items-center justify-center gap-3 font-headline-md text-headline-md"><span className="text-secondary">VERDE {f.eq.verde}</span><span className="text-outline">—</span><span className="text-error">{f.eq.rojo} ROJO</span></div>
        <div className="font-label-sm text-label-sm text-on-surface-variant">{mmss(f.eq.tiempo)} // TU EQUIPO: <span className={f.eq.mio === 'verde' ? 'text-secondary' : 'text-error'}>{f.eq.mio.toUpperCase()}</span></div>
      </div>
    );
  }
  const i = f.info;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${panel} px-space-md py-space-sm short:py-1 text-center min-w-[12rem] max-w-[18rem]`}>
        <div className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider">{i.titulo}</div>
        <div className={`font-label-sm text-label-sm ${i.urgente ? 'text-error animate-pulse' : 'text-on-surface-variant'}`}>{i.sub}{i.n != null ? ` // ENEMIGOS ${i.n}` : ''}</div>
      </div>
      {f.jefe && (
        <div className={`${panel} px-space-md py-1 w-64 max-w-full`}>
          <div className="font-label-sm text-label-sm text-error tracking-widest text-center">COMANDANTE ENEMIGO</div>
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-1"><div className="h-full bg-error rounded-full transition-[width] duration-150" style={{ width: (100 * f.jefe.hp / f.jefe.maxhp) + '%' }}></div></div>
        </div>
      )}
    </div>
  );
}

function Rachas({ f }) {
  const r = [
    { k: 'dron', tecla: 'Z', n: 'DRON', c: 'primary', a: 'z' }, { k: 'aereo', tecla: 'X', n: 'AÉREO', c: 'error', a: 'x' }, { k: 'torreta', tecla: 'C', n: 'TORRE', c: 'secondary', a: 'c' },
  ];
  const col = { primary: 'text-primary border-primary bg-primary/15', error: 'text-error border-error bg-error/15', secondary: 'text-secondary border-secondary bg-secondary/15' };
  return (
    <div className={`${panel} p-space-sm short:p-1.5 flex flex-col gap-1.5`}>
      <div className="flex items-center justify-between gap-space-sm font-label-sm text-label-sm"><span className="text-on-surface-variant tracking-widest">RACHA {f.racha}/10</span>
        <div className="w-16 h-1 bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: f.racha * 10 + '%' }}></div></div></div>
      <div className="flex items-center gap-1.5">
        {r.map(x => {
          const on = f.S[x.k], act = f.activos[x.k];
          return (
            <button key={x.k} onClick={() => API.accion(x.a)} disabled={!on}
              className={`w-12 short:w-11 py-1 rounded border flex flex-col items-center leading-none transition-colors ${on ? col[x.c] + ' animate-pulse' : 'border-transparent bg-surface-container text-outline'}`}>
              <span className="font-label-md text-label-md font-bold">{x.tecla}</span>
              <span className="font-label-sm text-label-sm mt-0.5">{x.n}</span>
              {act > 0 && <span className="font-label-sm text-label-sm text-tertiary mt-0.5">{x.k === 'aereo' ? '!' : act + 's'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Armas({ f }) {
  const nombres = ['PISTOLA', 'FUSIL', 'ESCOPETA'], m = f.mun[f.arma] || { c: 0, res: 0 }, tc = f.touch;
  const bajo = m.c <= f.cargador * 0.25;
  return (
    <div className={`${panel} p-space-sm short:p-1.5 w-56 short:w-52 md:w-64 flex flex-col gap-1.5`}>
      <div className="grid grid-cols-3 gap-1">
        {nombres.map((n, i) => {
          const mi = f.mun[i] || { c: 0, res: 0 }, act = i === f.arma, vacia = mi.c === 0 && mi.res === 0;
          return (
            <button key={n} onClick={() => API.accion(String(i + 1))} aria-pressed={act}
              className={`rounded px-1 py-1 text-center leading-tight border transition-colors ${act ? 'bg-primary-container/25 border-primary text-on-surface' : 'bg-surface-container border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              <div className={`font-label-sm text-label-sm ${vacia ? 'text-error' : ''}`}>{tc ? '' : <span className="text-primary mr-1">{i + 1}</span>}{n}</div>
              <div className={`font-label-sm text-label-sm ${vacia ? 'text-error' : 'text-on-surface-variant'}`}>{mi.res < 0 ? `${mi.c} / ∞` : `${mi.c}/${mi.res}`}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-end justify-between gap-space-sm">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-headline-lg text-headline-lg short:text-headline-md leading-none ${m.c === 0 ? 'text-error' : bajo ? 'text-primary-container' : 'text-on-surface'}`}>{m.c}</span>
          <span className="font-label-md text-label-md text-on-surface-variant">/ {m.res < 0 ? '∞' : m.res}</span>
        </div>
        <div className="text-right font-label-sm text-label-sm leading-tight">
          <div className="text-secondary">GRANADAS x{f.gran}</div>
          {!tc && <div className="text-outline">R recargar · Q arma · G granada</div>}
        </div>
      </div>
    </div>
  );
}

function BotonesTactiles({ f }) {
  const m = f.mun[f.arma] || { c: 0, res: 0 };
  const lista = [
    { t: 'RECAR', a: 'r', alerta: m.c <= f.cargador * 0.25 && m.res !== 0 }, { t: 'GRAN', a: 'g' },
    { t: 'ARMA', a: 'q', alerta: m.c === 0 && m.res === 0 }, { t: 'CAJA', a: 'e', ok: !!f.caja && f.caja.cd === 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {lista.map(b => (
        <button key={b.t} onPointerDown={e => { e.preventDefault(); API.accion(b.a); }} aria-label={b.t}
          className={`w-12 h-12 short:w-11 short:h-11 rounded-full border font-label-sm text-label-sm font-bold flex items-center justify-center select-none touch-none active:scale-95 transition-colors ${b.alerta ? 'bg-error-container/80 border-error text-on-error-container animate-pulse' : b.ok ? 'bg-secondary/30 border-secondary text-secondary' : 'bg-surface-container-lowest/70 border-outline-variant text-on-surface'}`}>
          {b.t}
        </button>
      ))}
    </div>
  );
}

function Avisos({ f }) {
  const m = f.mun[f.arma] || { c: 0, res: 0 }, tc = f.touch;
  let msg = null, cls = 'text-primary-container', grande = false;
  if (f.recargando) { msg = 'RECARGANDO...'; cls = 'text-primary'; }
  else if (m.c === 0 && m.res !== 0) { msg = tc ? '¡SIN BALAS! TOCÁ RECAR' : '¡SIN BALAS! APRETÁ  R  PARA RECARGAR'; cls = 'text-error animate-pulse'; grande = true; }
  else if (m.c === 0 && m.res === 0) { msg = tc ? '¡SIN MUNICIÓN! TOCÁ ARMA PARA CAMBIAR' : '¡SIN MUNICIÓN! CAMBIÁ DE ARMA CON  1  2  3  O  Q'; cls = 'text-error animate-pulse'; grande = true; }
  else if (m.c <= f.cargador * 0.25 && m.res !== 0) msg = tc ? 'Pocas balas: tocá RECAR' : 'Pocas balas: apretá R para recargar';
  else if (f.hp < f.maxhp * 0.35 && !f.muerto) { msg = '¡CUBRITE PARA RECUPERAR VIDA!'; cls = 'text-error animate-pulse'; }
  return (
    <div className="flex flex-col items-center gap-1 pointer-events-none">
      {f.caja && <div className="bg-surface-container-lowest/80 backdrop-blur rounded px-space-sm py-1 font-label-md text-label-md text-primary">{f.caja.cd > 0 ? `CAJA VACÍA (${f.caja.cd}S)` : (tc ? 'TOCÁ CAJA: MUNICIÓN' : '[E] CAJA DE MUNICIÓN')}</div>}
      {msg && <div className={`bg-surface-container-lowest/70 backdrop-blur rounded px-space-md py-1 font-label-lg text-label-lg ${grande ? 'text-headline-md font-headline-md' : ''} ${cls}`}>{msg}</div>}
      {f.tiempo < 14 && f.estado === 'jugando' && !f.muerto && (
        <div className="bg-surface-container-lowest/70 backdrop-blur rounded px-space-md py-1 font-label-md text-label-md text-primary text-center">
          {f.touch ? 'Pulgar IZQUIERDO = caminar · Pulgar DERECHO = apuntar y disparar' : 'R = RECARGAR · 1 2 3 o Q = CAMBIAR ARMA · G = GRANADA'}
        </div>
      )}
    </div>
  );
}

function Mensajes({ f }) {
  const b = f.banner, r = f.radio;
  const a = b ? Math.max(0, Math.min(1, b.k * 3, (b.dur - b.k) * 2)) : 0;
  const n = r ? Math.min(r.txt.length, Math.floor(r.k * 45)) : 0;
  return (
    <>
      {b && (
        <div key={b.id} className="absolute inset-x-0 top-[24%] short:top-[20%] flex flex-col items-center gap-2 pointer-events-none" style={{ opacity: a }}>
          <div className="w-full bg-surface-container-lowest/75 backdrop-blur-md border-y border-primary/40 py-space-sm short:py-1 text-center">
            <div className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl short:text-headline-lg-mobile text-primary uppercase tracking-wider drop-shadow-[0_0_14px_rgba(245,158,11,0.45)]">{b.t}</div>
            {b.sub && <div className="font-label-md text-label-md text-on-surface-variant uppercase mt-0.5">{b.sub}</div>}
          </div>
          <div className="flex flex-col items-center gap-1">
            {f.toasts.map(t => <div key={t.id} className="bg-surface-container-lowest/80 backdrop-blur rounded px-space-sm py-0.5 font-label-md text-label-md anim-entrar" style={{ color: t.color, opacity: Math.min(1, (2.5 - t.k) * 2) }}>{t.txt}</div>)}
          </div>
        </div>
      )}
      {!b && f.toasts.length > 0 && (
        <div className="absolute inset-x-0 top-[26%] flex flex-col items-center gap-1 pointer-events-none">
          {f.toasts.map(t => <div key={t.id} className="bg-surface-container-lowest/80 backdrop-blur rounded px-space-sm py-0.5 font-label-md text-label-md anim-entrar" style={{ color: t.color, opacity: Math.min(1, (2.5 - t.k) * 2) }}>{t.txt}</div>)}
        </div>
      )}
      {r && (
        <div key={r.id} className={`absolute left-[max(0.5rem,env(safe-area-inset-left))] top-[6.25rem] short:top-[4.75rem] w-[min(22rem,40vw)] ${panel} px-space-md py-space-sm short:py-1 pointer-events-none`}>
          <div className="font-label-sm text-label-sm text-tertiary tracking-widest uppercase flex items-center gap-1"><Icon n="headset_mic" className="text-sm" />[RADIO] {r.quien}</div>
          <div className="font-body-md text-body-md text-on-surface">{r.txt.slice(0, n)}</div>
        </div>
      )}
    </>
  );
}

function Hud({ f }) {
  const tc = f.touch;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className={`absolute top-0 left-0 ${insetSup} pl-[max(0.5rem,env(safe-area-inset-left))]`}><PanelVida f={f} /></div>
      <div className={`absolute top-0 inset-x-0 flex justify-center ${insetSup} pointer-events-none`}><PanelZona f={f} /></div>
      <div className={`absolute top-0 right-0 ${insetSup} pr-[max(0.5rem,env(safe-area-inset-right))] flex items-start gap-1.5`}>
        <button onClick={API.pausar} aria-label="Pausa" className={`pointer-events-auto ${panel} w-9 h-9 flex items-center justify-center text-on-surface hover:text-primary`}><Icon n="pause" className="text-xl" /></button>
        <div className={`${panel} p-1`}><Minimapa /></div>
      </div>
      <div className="absolute bottom-0 left-0 pl-[max(0.5rem,env(safe-area-inset-left))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-auto"><Rachas f={f} /></div>
      <div className="absolute bottom-0 right-0 pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col items-end gap-2 pointer-events-auto">
        {tc && <BotonesTactiles f={f} />}
        <Armas f={f} />
      </div>
      <div className="absolute inset-x-0 bottom-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-center"><div className="mb-[5.5rem] short:mb-[4.5rem]"><Avisos f={f} /></div></div>
      <Mensajes f={f} />
      {f.mp && f.muerto && f.estado === 'jugando' && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-surface-container-lowest/75 backdrop-blur-md py-space-sm text-center">
          <div className="font-headline-xl-mobile text-headline-xl-mobile text-error uppercase tracking-wider">CAÍSTE</div>
          <div className="font-label-md text-label-md text-on-surface-variant">VOLVÉS EN {Math.max(0, f.respT)}...</div>
        </div>
      )}
    </div>
  );
}

export default function Juego({ f }) {
  const [ayuda, setAyuda] = useState(false);
  if (f.mp && f.cargando) {
    return <div className="absolute inset-0 flex items-center justify-center bg-background"><div className="flex items-center gap-2 font-label-lg text-label-lg text-tertiary"><Icon n="progress_activity" className="animate-spin text-2xl" />CARGANDO PARTIDA...</div></div>;
  }
  const fin = f.estado === 'muerto' || f.estado === 'victoria' || f.estado === 'finEq';
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Hud f={f} />
      {f.estado === 'pausa' && !ayuda && <Pausa f={f} abrirAyuda={() => setAyuda(true)} />}
      {f.mp && f.pausaLocal && !fin && !ayuda && <Pausa f={f} abrirAyuda={() => setAyuda(true)} />}
      {f.estado === 'tienda' && <Tienda f={f} />}
      {fin && f.fin && <Fin f={f} />}
      {ayuda && <AyudaModal cerrar={() => setAyuda(false)} />}
    </div>
  );
}
