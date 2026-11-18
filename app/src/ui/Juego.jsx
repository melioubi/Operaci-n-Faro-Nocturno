import { useEffect, useState } from 'react';
import { Icon, Bruco } from './Icon.jsx';
import { API, fmt, mmss, pantallaCompleta, puedePantallaCompleta } from './comun.js';
import { AyudaContenido } from './Paginas.jsx';
import Hud from './Hud.jsx';

// ---------- Marco de las ventanas (pausa, abastecimiento, fin) ----------
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
    <Ventana titulo={f.mp ? 'MENÚ' : 'PAUSA'} chip={<span className="font-label-sm text-label-sm text-primary bg-surface-container-highest px-space-xs py-0.5 rounded">{f.mp ? 'LA PARTIDA SIGUE' : f.modo === 'tiro' ? 'CAMPO DE TIRO' : 'EN ESPERA'}</span>}>
      <div className="flex flex-col gap-space-sm">
        <Boton primario icono="play_arrow" onClick={API.reanudar}>SEGUIR</Boton>
        <Boton icono="help" onClick={abrirAyuda}>CÓMO JUGAR</Boton>
        <Boton icono={f.mute ? 'volume_off' : 'volume_up'} onClick={API.toggleSonido}>SONIDO: {f.mute ? 'NO' : 'SÍ'}</Boton>
        {puedePantallaCompleta() && <Boton icono="fullscreen" onClick={pantallaCompleta}>PANTALLA COMPLETA</Boton>}
        <Boton icono="logout" onClick={API.salir}>{f.mp ? 'SALIR DE LA SALA' : f.modo === 'tiro' ? 'VOLVER A LA ARMERÍA' : 'SALIR AL MENÚ'}</Boton>
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

// ---------- Abastecimiento entre zonas (se paga con los puntos de la partida) ----------
function Abastecimiento({ f }) {
  const t = f.tienda;
  return (
    <Ventana titulo="ABASTECIMIENTO" ancho="max-w-3xl" color="bg-secondary"
      chip={<span className="font-label-md text-label-md text-secondary bg-surface-container-highest px-space-sm py-1 rounded font-bold whitespace-nowrap">{fmt(t.creditos)} PTS</span>}>
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">Gastá los puntos de esta partida antes de seguir. También podés usar las teclas 1 a 6.</p>
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
  const recompensa = <div className="grid grid-cols-2 gap-1.5"><Dato r="XP GANADA" v={'+' + fmt(x.xpPartida)} c="text-tertiary" /><Dato r="CRÉDITOS" v={'+' + fmt(x.creditos)} c="text-primary" /></div>;
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
        {recompensa}
        {listo && (f.red.host
          ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs"><Boton primario icono="restart_alt" onClick={API.reintentar}>JUGAR OTRA</Boton><Boton icono="groups" onClick={API.volverSala}>A LA SALA</Boton><Boton icono="logout" onClick={API.salir}>SALIR</Boton></div>
          : <div className="flex flex-col gap-space-xs"><p className="text-center font-label-md text-label-md text-on-surface-variant">Esperando al anfitrión...</p><Boton icono="logout" onClick={API.salir}>SALIR</Boton></div>)}
      </Ventana>
    );
  }
  if (f.estado === 'victoria') {
    return (
      <Ventana ancho="max-w-xl" titulo="¡MISIÓN CUMPLIDA!" color="bg-primary">
        <p className="font-body-md text-body-md text-on-surface-variant -mt-2">Aguantaste todas las oleadas y el helicóptero te rescató.</p>
        <div className="flex flex-col gap-1.5">
          <Dato r="PUNTOS" v={fmt(x.pts)} c="text-primary" /><Dato r="BAJAS" v={x.bajas} /><Dato r="PUNTERÍA" v={x.prec + '%'} /><Dato r="TIEMPO" v={mmss(x.tiempo)} /><Dato r="DIFICULTAD" v={x.dificultad} />
        </div>
        {recompensa}
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
        <Dato r="PUNTOS" v={fmt(x.pts)} c="text-primary" /><Dato r="BAJAS" v={x.bajas} />{!x.sup && <Dato r="ZONA" v={`${x.zona}/4`} />}<Dato r="TU NIVEL" v={f.nivel} c="text-secondary" />
      </div>
      {recompensa}
      {listo && <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs"><Boton primario icono="restart_alt" onClick={API.reintentar}>{x.sup ? 'OTRA VEZ' : `REINTENTAR ZONA ${x.zona}`}</Boton><Boton icono="logout" onClick={API.salir}>MENÚ</Boton></div>}
    </Ventana>
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
      {f.estado === 'tienda' && <Abastecimiento f={f} />}
      {fin && f.fin && <Fin f={f} />}
      {ayuda && <AyudaModal cerrar={() => setAyuda(false)} />}
    </div>
  );
}
