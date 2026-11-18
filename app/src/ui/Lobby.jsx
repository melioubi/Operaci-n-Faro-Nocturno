import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, DATOS, compartirLink, copiarLink, fmt, usePerfil } from './comun.js';
import { ARMAS_BASE, CAMO_POR_ID, OPERADOR_POR_ID, SLOTS, recompensasPase } from '../progreso/catalogo.js';
import { accesoriosEquipados, camoActivo, opActivo, pendientesPase } from '../progreso/perfil.js';
import { describir } from './Pase.jsx';
import { IMG_MODO, IMG_OPERADOR, MODOS } from './datos.js';

function Etiqueta({ color = 'bg-primary', texto, chip, chipClase = 'text-primary-fixed-dim bg-surface-container-highest' }) {
  return (
    <div className="flex items-center justify-between pb-space-xs gap-space-sm">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-3.5 ${color}`}></span>
        <span className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">{texto}</span>
      </div>
      {chip && <span className={`font-label-sm text-label-sm px-space-xs py-0.5 rounded whitespace-nowrap ${chipClase}`}>{chip}</span>}
    </div>
  );
}

export function NombreEditable({ nombre }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(nombre);
  const guardar = () => { setEdit(false); if (v.trim() && v !== nombre) API.setNombre(v); };
  if (edit) {
    return (
      <input autoFocus maxLength={10} value={v} onChange={e => setV(e.target.value.toUpperCase())} onBlur={guardar} aria-label="Tu nombre"
        onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') { setV(nombre); setEdit(false); } }}
        className="bg-surface-container-high text-primary font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-wider w-full max-w-[16rem] rounded px-space-xs outline-none ring-1 ring-primary" />
    );
  }
  return (
    <button onClick={() => { setV(nombre); setEdit(true); }} className="group flex items-center gap-2 text-left" title="Cambiar nombre">
      <span className="text-primary font-black">"{nombre}"</span>
      <Icon n="edit" className="text-base text-outline group-hover:text-primary transition-colors" />
    </button>
  );
}

function Miembro({ s, yo, f, esHost, modoEquipos }) {
  const camo = CAMO_POR_ID(s.camo);
  return (
    <div className={`relative p-space-sm rounded flex items-center justify-between gap-space-sm transition-colors ${yo ? 'bg-surface-container shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>
      <div className="flex items-center gap-space-sm min-w-0">
        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${yo ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
          <Icon n="person" className={yo ? 'text-primary' : 'text-base'} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-label-lg text-label-lg uppercase font-bold truncate ${yo ? 'text-primary' : 'text-on-surface'}`}>{s.nombre}</span>
            {s.id === 'host' || (s.lider) ? <span className="bg-primary-container/20 text-primary-container px-1 py-0.5 rounded font-label-sm text-label-sm">LÍDER</span> : null}
            {modoEquipos && <span className={`px-1 py-0.5 rounded font-label-sm text-label-sm ${s.equipo === 'verde' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>{s.equipo.toUpperCase()}</span>}
          </div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
            <span>NIVEL {s.nivel}</span><span>•</span><span className="text-tertiary">Camuflaje {camo.n.toLowerCase()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {esHost && modoEquipos && (
          <button onClick={() => { API.click(); API.cambiarEquipo(s.id); }} title="Cambiar de equipo" aria-label={`Cambiar a ${s.nombre} de equipo`}
            className="p-1 rounded bg-surface-container-highest text-on-surface-variant hover:text-primary"><Icon n="swap_horiz" className="text-base" /></button>
        )}
        <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-space-xs py-0.5 rounded">LISTO</span>
      </div>
    </div>
  );
}

function Escuadron({ f, modo, m }) {
  const red = f.red, enSala = red.activo, esHost = red.host, esCliente = red.cliente;
  const equipos = (enSala ? red.salaModo : modo) === 'equipos';
  const yoSolo = [{ id: 'host', nombre: f.perfil.nombre, equipo: 'verde', nivel: f.nivel, camo: f.perfil.camo }];
  const miembros = enSala ? red.sala : yoSolo;
  const total = miembros.length + (enSala ? red.bots : 0);
  const invitar = () => { API.click(); API.crearSala(); API.setModoSala(m.online ? m.id : 'coop'); };
  return (
    <div className="flex flex-col gap-space-sm">
      <Etiqueta color="bg-secondary" texto="ESCUADRÓN TÁCTICO" chip={`${total}/8 OPERADORES`} chipClase="text-secondary bg-surface-container-high font-bold" />
      <div className="flex flex-col gap-space-xs max-h-[19rem] scroll-y">
        {miembros.map(s => <Miembro key={s.id} s={s} yo={enSala ? s.id === red.miId : true} f={f} esHost={esHost} modoEquipos={equipos} />)}
        {enSala && Array.from({ length: red.bots }).map((_, i) => (
          <div key={'b' + i} className="p-space-sm bg-surface-container-low rounded flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-tertiary"><Icon n="smart_toy" className="text-lg" /></div>
              <div>
                <span className="font-label-lg text-label-lg text-on-surface uppercase font-bold">BOT {i + 1}</span>
                <div className="font-label-sm text-label-sm text-on-surface-variant">Operador de la compu</div>
              </div>
            </div>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-space-xs py-0.5 rounded">LISTO</span>
          </div>
        ))}
        {!enSala && (
          <button onClick={invitar} className="p-space-sm bg-surface-container-lowest/60 hover:bg-surface-container-low rounded flex items-center justify-between cursor-pointer group transition-all text-left">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded bg-surface-container-high/40 flex items-center justify-center text-outline group-hover:text-primary transition-colors"><Icon n="person_add" className="text-lg" /></div>
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg text-outline group-hover:text-primary uppercase tracking-wider transition-colors">+ INVITAR OPERADOR</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Creá una sala y mandá el link a tus amigos</span>
              </div>
            </div>
            <Icon n="add_circle" className="text-outline group-hover:text-primary transition-colors text-base" />
          </button>
        )}
      </div>

      {enSala && (
        <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm">
          {red.estado === 'error' ? (
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md text-error flex items-center gap-1"><Icon n="cloud_off" className="text-base" />{red.error}</span>
              <button onClick={API.salir} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded font-label-md text-label-md tracking-wider uppercase">VOLVER</button>
            </div>
          ) : red.estado !== 'listo' ? (
            <span className="font-label-md text-label-md text-tertiary flex items-center gap-1"><Icon n="progress_activity" className="text-base animate-spin" />CONECTANDO CON LA SALA...</span>
          ) : (
            <>
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold flex items-center gap-1"><Icon n="link" className="text-sm" />CÓDIGO DE SALA</span>
                <span className="font-headline-md text-headline-md text-on-surface tracking-[0.3em]">{red.codigo}</span>
              </div>
              {esHost && (
                <>
                  <p className="font-body-sm text-body-sm text-on-surface-variant break-all select-text">{red.link}</p>
                  <div className="grid grid-cols-2 gap-space-xs">
                    <button onClick={() => copiarLink(red.link)} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5"><Icon n="content_copy" className="text-sm text-primary" />COPIAR LINK</button>
                    <button onClick={() => compartirLink(red.link, red.codigo)} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5"><Icon n="share" className="text-sm text-tertiary" />COMPARTIR</button>
                  </div>
                  <div className="flex items-center justify-between bg-surface-container px-space-sm py-1.5 rounded">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase flex items-center gap-1"><Icon n="smart_toy" className="text-base text-tertiary" />BOTS DE LA COMPU</span>
                    <div className="flex items-center gap-space-sm">
                      <button onClick={() => API.setBots(red.bots - 1)} aria-label="Menos bots" className="w-7 h-7 rounded bg-surface-container-highest hover:text-primary flex items-center justify-center"><Icon n="remove" className="text-base" /></button>
                      <span className="font-headline-md text-headline-md text-on-surface w-5 text-center">{red.bots}</span>
                      <button onClick={() => API.setBots(red.bots + 1)} aria-label="Más bots" className="w-7 h-7 rounded bg-surface-container-highest hover:text-primary flex items-center justify-center"><Icon n="add" className="text-base" /></button>
                    </div>
                  </div>
                </>
              )}
              {esCliente && <p className="font-body-sm text-body-sm text-on-surface-variant">El anfitrión elige el modo y empieza la partida. Mientras tanto podés cambiar tu nombre tocándolo.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Progreso({ f, irA }) {
  usePerfil();
  const sig = f.xpSig, pct = sig ? Math.min(100, Math.round(100 * (f.xp - f.xpIni) / (sig - f.xpIni))) : 100;
  const premio = f.nivel < 100 ? recompensasPase(f.nivel + 1).libre.map(r => describir(r).titulo).join(' + ').toUpperCase() : null;
  const pend = pendientesPase();
  return (
    <div className="bg-surface-container-low rounded-lg p-space-md shadow-md flex flex-col gap-space-sm">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold flex items-center gap-1"><Icon n="flag" className="text-sm" />DIRECTIVA TÁCTICA // PRÓXIMO RANGO</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">NIVEL {f.nivel}{sig ? ` → ${f.nivel + 1}` : ' (MÁX)'}</span>
      </div>
      <div>
        <h3 className="font-label-lg text-label-lg text-on-surface uppercase font-bold">{sig ? `PRÓXIMO NIVEL: ${f.nivel + 1} DE 100` : 'RANGO MÁXIMO: LEYENDA DEL FARO'}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Cada baja suma experiencia. Se guarda en este dispositivo, también cuando jugás con amigos.</p>
      </div>
      <div className="flex flex-col gap-1 mt-space-xs">
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-on-surface-variant">PROGRESO DEL OPERATIVO</span>
          <span className="text-primary font-bold">{sig ? `${fmt(f.xp - f.xpIni)} / ${fmt(sig - f.xpIni)} XP` : 'COMPLETADO'}</span>
        </div>
        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,193,116,0.5)]" style={{ width: pct + '%' }}></div>
        </div>
      </div>
      {pend > 0 && <button onClick={() => irA('pase')} className="px-space-sm py-1.5 bg-primary/15 ring-1 ring-primary text-primary rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse"><Icon n="redeem" className="text-base" />TENÉS {pend} RECOMPENSAS PARA RECLAMAR</button>}
      {premio && (
        <div className="flex items-center justify-between pt-space-xs bg-surface-container px-space-sm py-1.5 rounded gap-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <Icon n="style" className="text-secondary text-base" />
            <span className="font-label-sm text-label-sm text-on-surface">RECOMPENSA: {premio}</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary font-bold whitespace-nowrap">NV {f.nivel + 1}</span>
        </div>
      )}
    </div>
  );
}

export default function Lobby({ f, modo, setModo, irA }) {
  const m = MODOS.find(o => o.id === modo);
  const red = f.red, enSala = red.activo, esHost = red.host, esCliente = red.cliente;
  usePerfil();
  const camo = CAMO_POR_ID(camoActivo()), op = OPERADOR_POR_ID(opActivo()), arma = ARMAS_BASE[1];
  const nAcc = Object.keys(accesoriosEquipados(1)).length, nSlots = SLOTS.filter(s => s.armas.includes(1)).length;

  const elegir = id => {
    if (esCliente) return;
    API.click(); setModo(id);
    const mo = MODOS.find(o => o.id === id);
    if (enSala && esHost && mo.online) API.setModoSala(id);
  };

  // Botón principal (cambia según el modo y el estado de la sala)
  let titulo, sub, deshabilitado = false, esperando = false;
  if (!m.online) { titulo = modo === 'tiro' ? 'IR AL CAMPO DE TIRO' : 'DESPLEGAR ESCUADRA'; sub = enSala ? '[ACT-01] SALDRÁS DE LA SALA' : '[ACT-01] INICIAR OPERACIÓN'; }
  else if (!enSala) { titulo = 'INVITAR Y CREAR SALA'; sub = '[ACT-02] ABRIR SALA ONLINE'; }
  else if (red.estado === 'error') { titulo = 'SIN CONEXIÓN'; sub = red.error; deshabilitado = true; }
  else if (red.estado !== 'listo') { titulo = 'ABRIENDO SALA...'; sub = '[IFF-PING] CONECTANDO'; deshabilitado = true; esperando = true; }
  else if (esHost) { titulo = 'INICIAR PARTIDA'; sub = `[ANFITRIÓN] ${red.sala.length} OPERADORES + ${red.bots} BOTS`; }
  else { titulo = 'ESPERANDO AL ANFITRIÓN...'; sub = `[IFF-PING] SALA ${red.codigo}`; deshabilitado = true; esperando = true; }

  const desplegar = () => {
    API.audio();
    if (!m.online) { if (modo === 'campania') API.jugarCampania(); else if (modo === 'tiro') API.jugarTiro(); else API.jugarSupervivencia(); return; }
    if (!enSala) { API.crearSala(); API.setModoSala(modo); return; }
    if (esHost) { if (red.salaModo !== modo) API.setModoSala(modo); API.empezar(); }
  };
  const save = f.perfil.partida;

  return (
    <>
      {/* Invitación recibida por link */}
      {red.invitacion && !enSala && (
        <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm bg-primary-container/15 border border-primary/40 rounded-lg px-space-md py-space-sm anim-entrar">
          <div className="flex items-center gap-space-sm">
            <Icon n="groups" className="text-primary text-2xl" />
            <div>
              <div className="font-label-sm text-label-sm text-primary tracking-widest uppercase">INVITACIÓN RECIBIDA</div>
              <div className="font-headline-md text-headline-md text-on-surface">TE INVITARON A LA SALA {red.invitacion}</div>
            </div>
          </div>
          <button onClick={() => { API.audio(); API.unirseSala(red.invitacion); }} className="px-space-lg py-2 bg-primary hover:bg-primary-fixed text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase shadow-[0_0_16px_rgba(245,158,11,0.4)]">UNIRME A LA SALA</button>
        </div>
      )}
      {f.aviso && !enSala && <div className="mb-space-md px-space-md py-space-sm bg-error-container/40 text-error rounded font-label-md text-label-md">{f.aviso}</div>}

      {/* Franja de telemetría */}
      <div className="flex flex-wrap items-center justify-between w-full mb-space-md gap-space-sm short:hidden">
        <div className="flex flex-wrap items-center gap-space-sm">
          <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 bg-surface-container-high rounded text-secondary font-label-sm text-label-sm shadow-[0_0_8px_rgba(74,225,118,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>IFF: ENLACE SATELITAL ACTIVO
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-space-sm py-0.5 rounded">
            {enSala ? `RED TÁCTICA: SALA ${red.codigo} // CANAL CODIFICADO` : 'RED TÁCTICA: LOBO SOLITARIO // SIN ESCUADRA'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-space-lg">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant"><span className="text-primary font-bold">GRID LOC:</span><span>43°21'18"N 70°24'55"W</span></div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-tertiary"><Icon n="filter_drama" className="text-sm" /><span>VISIBILIDAD: 12% [NIEBLA CRÍTICA]</span></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter md:gap-gutter-desktop items-stretch flex-1">
        {/* IZQUIERDA: modos y despliegue */}
        <div className="col-span-12 sm:col-span-7 lg:col-span-4 order-1 flex flex-col justify-between gap-space-md z-20">
          <div className="flex flex-col gap-space-md">
            <Etiqueta texto="REGISTRO DE OPERACIONES" chip="S01 // EN VIVO" />
            <div className="group relative bg-surface-container-low rounded-lg p-space-md transition-all duration-300 hover:bg-surface-container hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden short:hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url('${IMG_MODO}')` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
              <div className="relative z-10 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between gap-space-sm">
                  <span className="bg-primary-container text-on-primary-container px-space-sm py-0.5 rounded font-label-md text-label-md tracking-widest font-black flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                    <Icon n="bolt" className="text-[14px]" />{m.chip}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest/80 px-space-xs py-0.5 rounded">{m.jugadores}</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase">{m.etiqueta}</span>
                  <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-wide uppercase leading-tight mt-0.5">{m.titulo}</h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{m.desc}</p>
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs font-label-sm text-label-sm text-on-surface">
                  <span className="bg-surface-container-highest px-space-xs py-0.5 rounded text-primary">{m.pie[0]}</span>
                  <span className="text-outline">|</span>
                  <span className="text-tertiary">{m.pie[1]}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden"><div className="w-full h-full bg-primary/20 -rotate-45 translate-x-4 -translate-y-4"></div></div>
            </div>

            <div className="flex flex-col short:grid short:grid-cols-2 gap-1.5" role="radiogroup" aria-label="Modo de juego">
              {MODOS.map(o => {
                const sel = o.id === modo, bloqueado = esCliente && !sel;
                return (
                  <button key={o.id} role="radio" aria-checked={sel} onClick={() => elegir(o.id)} disabled={bloqueado}
                    className={`flex items-center justify-between p-space-sm short:p-1.5 rounded text-left transition-colors duration-200 ${sel ? 'bg-surface-container-high' : 'bg-surface-container-low hover:bg-surface-container'} ${bloqueado ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center gap-space-sm">
                      <span className={`w-1 h-6 rounded-full ${sel ? 'bg-primary' : 'bg-transparent'}`}></span>
                      <div>
                        <div className={`font-label-lg text-label-lg tracking-wider uppercase ${sel ? 'text-primary' : 'text-on-surface'}`}>{o.corto}</div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant short:hidden">{o.sub}</div>
                      </div>
                    </div>
                    <Icon n={sel ? 'radio_button_checked' : 'radio_button_unchecked'} className={`${sel ? 'text-primary' : 'text-outline'} text-base`} />
                  </button>
                );
              })}
            </div>

            <div>
              <div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase mb-1 short:hidden">DIFICULTAD</div>
              <div className="grid grid-cols-3 gap-1.5">
                {DATOS.DIFICULTADES.map((d, i) => (
                  <button key={d.nombre} onClick={() => { API.click(); API.setDificultad(i); }} aria-pressed={f.perfil.dif === i}
                    className={`py-1.5 rounded font-label-md text-label-md tracking-wider uppercase transition-colors ${f.perfil.dif === i ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>{d.nombre}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs pt-space-md short:pt-space-xs">
            <div className="flex items-center justify-between px-space-sm py-1 bg-surface-container-lowest rounded short:hidden">
              <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant"><Icon n="dns" className="text-sm text-secondary" />
                <span>{enSala ? `SALA: ${red.codigo} // ${red.sala.length} OPERADORES` : 'MODO SOLO // FUNCIONA SIN INTERNET'}</span></div>
              <span className="text-secondary font-label-sm text-label-sm font-bold">{f.fps} FPS</span>
            </div>
            <button id="boton-desplegar" onClick={desplegar} disabled={deshabilitado}
              className={`relative group w-full py-4 px-space-lg ${esperando ? 'bg-secondary shadow-[0_0_24px_rgba(74,225,118,0.5)]' : 'bg-primary hover:bg-primary-fixed shadow-[0_0_24px_rgba(245,158,11,0.4)]'} disabled:opacity-80 transition-all duration-200 rounded-lg flex items-center justify-between active:scale-[0.99] overflow-hidden`}>
              <div className="flex flex-col items-start text-left z-10 min-w-0">
                <span className="font-label-sm text-label-sm text-on-primary font-black tracking-widest uppercase opacity-80 truncate max-w-full">{sub}</span>
                <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-wider uppercase leading-none mt-0.5">{titulo}</span>
              </div>
              <div className="w-12 h-12 rounded bg-on-primary/10 flex items-center justify-center z-10 group-hover:translate-x-1 transition-transform shrink-0">
                <Icon n={esperando ? 'progress_activity' : 'play_arrow'} className={`text-on-primary text-3xl ${esperando ? 'animate-spin' : ''}`} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>
            </button>
            <div className="grid grid-cols-2 gap-space-xs">
              {enSala
                ? <button onClick={API.salir} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"><Icon n="close" className="text-sm text-error" />SALIR DE LA SALA</button>
                : <button onClick={() => irA('ayuda')} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"><Icon n="help" className="text-sm text-tertiary" />CÓMO JUGAR</button>}
              {save && modo === 'campania' && !enSala
                ? <button onClick={() => { API.audio(); API.continuar(); }} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"><Icon n="history" className="text-sm text-primary" />CONTINUAR ZONA {save.zona}</button>
                : <button onClick={() => irA('armeria')} className="py-2 px-space-sm bg-surface-container hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface font-label-md text-label-md tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"><Icon n="tune" className="text-sm text-tertiary" />VER ARMERÍA</button>}
            </div>
          </div>
        </div>

        {/* CENTRO: operador */}
        <div className="col-span-12 lg:col-span-4 order-3 lg:order-2 relative flex flex-col justify-end items-center z-10 min-h-0 sm:min-h-[340px] lg:min-h-[460px] short:hidden">
          <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
            <img alt="" decoding="async" referrerPolicy="no-referrer" src={IMG_OPERADOR} onError={e => { e.currentTarget.style.display = 'none'; }}
              className="w-full h-auto max-w-[40rem] object-contain filter contrast-105 opacity-90 [mask-image:radial-gradient(ellipse_68%_62%_at_50%_50%,#000_35%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_68%_62%_at_50%_50%,#000_35%,transparent_100%)]" />
          </div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-40 hidden sm:block">
            <div className="absolute inset-0 rounded-full border border-primary/30"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 h-4 w-0.5 bg-primary"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 h-4 w-0.5 bg-primary"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-4 h-0.5 bg-primary"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-4 h-0.5 bg-primary"></div>
            <div className="absolute inset-4 rounded-full border border-dashed border-secondary/20"></div>
          </div>
          <div className="relative z-20 w-full mb-space-xs bg-surface-container-lowest/85 backdrop-blur-md p-space-md rounded-lg shadow-xl">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => irA('operadores')} className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-space-xs py-0.5 rounded font-mono font-bold hover:bg-surface-container-highest">CAMUFLAJE: {camo.n} // VERDE 532nm</button>
                  <span className="font-label-sm text-label-sm text-primary uppercase">{enSala ? `SALA ${red.codigo}` : 'GRUPO SOMBRA'}</span>
                </div>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-wider uppercase mt-1 leading-none flex items-center gap-2 flex-wrap">
                  <span>{f.rango.split(' ')[0].slice(0, 4)}.</span><NombreEditable nombre={f.perfil.nombre} />
                </h1>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">{op.rol} // ESCUADRÓN FARO</div>
              </div>
              <div className="flex flex-col items-center justify-center bg-surface-container px-space-sm py-1.5 rounded shrink-0">
                <Icon n="shield" className="text-primary text-2xl" />
                <span className="font-label-sm text-label-sm text-primary font-bold">{f.rango.split(' ')[0]}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">NIV. {f.nivel}</span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between bg-surface-container-low px-space-sm py-1.5 rounded gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <Icon n="military_tech" className="text-primary text-base" />
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface leading-none uppercase font-bold truncate">{arma.nombre} // FARO NOCTURNO</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{nAcc}/{nSlots} ACCESORIOS MONTADOS</span>
                </div>
              </div>
              <button onClick={() => irA('armeria')} className="font-label-sm text-label-sm text-primary hover:text-primary-fixed uppercase tracking-wider flex items-center gap-0.5 shrink-0"><span>MODIFICAR</span><Icon n="arrow_forward" className="text-xs" /></button>
            </div>
          </div>
        </div>

        {/* DERECHA: escuadrón y directiva */}
        <div className="col-span-12 sm:col-span-5 lg:col-span-4 order-2 lg:order-3 flex flex-col justify-between gap-space-md z-20">
          <Escuadron f={f} modo={modo} m={m} />
          <Progreso f={f} irA={irA} />
        </div>
      </div>
    </>
  );
}
