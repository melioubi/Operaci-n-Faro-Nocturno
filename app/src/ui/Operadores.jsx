import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, aviso, usePerfil } from './comun.js';
import { CAMOS, FACCIONES, OPERADORES, OP_EXTRA, REMATES, perksDe, textoFuente } from '../progreso/catalogo.js';
import { camoActivo, equiparCamo, equiparOperador, equiparRemate, opActivo, remateActivo, remateOk, tiene } from '../progreso/perfil.js';
import { NombreEditable } from './Lobby.jsx';
import { dibujarRetrato } from './retrato.js';

// Vista chiquita del soldado (la usan la tienda y la armería)
export function Preview({ paleta, tam = 96, bloqueado, arma = 1 }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) API.previewSoldado(ref.current, paleta, arma); }, [paleta, arma]);
  return <canvas ref={ref} width={tam} height={tam} className={bloqueado ? 'opacity-30 grayscale' : ''} style={{ width: tam, height: tam }} aria-hidden="true" />;
}

// Fotos de los operadores (personas reales, del arte de la escuadra OMEGA). Los demás reusan una con otro tono.
const B = import.meta.env.BASE_URL + 'fondos/';
const FOTO = { faro: [B + 'op_faro.jpg', ''], sombra: [B + 'op_sombra.jpg', ''], viper: [B + 'op_viper.jpg', ''], valkiria: [B + 'op_valkiria.jpg', ''],
  hielo: [B + 'op_faro.jpg', 'hue-rotate(160deg)'], cobra: [B + 'op_viper.jpg', 'hue-rotate(-40deg) saturate(1.4)'], nova: [B + 'op_sombra.jpg', 'hue-rotate(70deg)'], leyenda: [B + 'op_valkiria.jpg', 'sepia(0.6) saturate(1.8)'] };
const REM_VISTA = { destello: ['#fff2b0', '#ffd040'], ceniza: ['#888', '#555', '#ddd'], rayo: ['#80e0ff', '#ffffff', '#40a0ff'], brasas: ['#ff8020', '#ff4010', '#ffd040'], toxico: ['#80ff40', '#40c020'] };
const ARMA_IDX = { PISTOLA: 0, 'FUSIL M4': 1, ESCOPETA: 2 };
const hint = (f, irA) => (f.tipo === 'tienda' ? <button onClick={() => irA('tienda')} className="underline text-primary">Comprala en la TIENDA</button> : f.tipo === 'pase' ? <button onClick={() => irA('pase')} className="underline text-primary">Se gana en el PASE DE BATALLA</button> : null);

function Mini({ pal, w = 56, h = 72, bloqueado, id }) {
  if (id && FOTO[id]) return <img src={FOTO[id][0]} alt="" style={{ width: w, height: h, filter: FOTO[id][1] }} className={`object-cover object-top rounded ${bloqueado ? 'opacity-30 grayscale' : ''}`} />;
  const ref = useRef(null);
  useEffect(() => { if (ref.current) dibujarRetrato(ref.current, pal, 0.5, {}); }, [pal]);
  return <canvas ref={ref} width={w * 2} height={h * 2} style={{ width: w, height: h }} className={bloqueado ? 'opacity-30 grayscale' : ''} aria-hidden="true" />;
}

// Figura grande: se gira arrastrando (360°) y sola, despacito
function Heroe({ pal, arma, rafaga }) {
  const ref = useRef(null), est = useRef({ ang: 0.6, drag: false, x: 0, chispas: [], pal, arma });
  est.current.pal = pal; est.current.arma = arma;
  useEffect(() => {
    if (!rafaga) return;
    const col = REM_VISTA[rafaga.id]; if (!col) return;
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; est.current.chispas.push({ x: 150, y: 190, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, vida: 1, c: col[i % col.length] }); }
  }, [rafaga]);
  useEffect(() => {
    let raf, ult = performance.now();
    const paso = ahora => {
      const e = est.current, dt = Math.min(0.05, (ahora - ult) / 1000); ult = ahora;
      if (!e.drag) e.ang += dt * 0.5;
      for (const p of e.chispas) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.vida -= dt * 0.9; }
      e.chispas = e.chispas.filter(p => p.vida > 0);
      if (ref.current) dibujarRetrato(ref.current, e.pal, e.ang, { arma: e.arma, chispas: e.chispas });
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);
  const abajo = e => { est.current.drag = true; est.current.x = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); };
  const mover = e => { const s = est.current; if (!s.drag) return; s.ang += (e.clientX - s.x) * 0.012; s.x = e.clientX; };
  const arriba = () => { est.current.drag = false; };
  return <canvas ref={ref} width={420} height={560} onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba}
    className="h-full max-h-[460px] w-auto cursor-grab active:cursor-grabbing touch-none select-none drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]" aria-label="Operador: arrastrá para girarlo" />;
}

const Barra = ({ rotulo, texto, v, color = 'bg-primary' }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between font-label-sm text-label-sm tracking-widest"><span className="text-on-surface-variant">{rotulo}</span><span className="text-on-surface font-bold font-mono">{texto}</span></div>
    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: Math.max(4, Math.min(100, v * 100)) + '%' }}></div></div>
  </div>
);

export default function Operadores({ f, irA }) {
  usePerfil();
  const [sel, setSel] = useState(opActivo());
  const [fac, setFac] = useState((OP_EXTRA[opActivo()] || OP_EXTRA.faro).fac);
  const [panel, setPanel] = useState(null);           // null | 'aspectos' | 'remate'
  const [rafaga, setRafaga] = useState(null);
  const vozN = useRef(0);
  const o = OPERADORES.find(x => x.id === sel) || OPERADORES[0], x = OP_EXTRA[o.id] || OP_EXTRA.faro;
  const mio = tiene(o.id), puesto = opActivo() === o.id, camo = camoActivo();
  const pal = puesto && camo !== 'bosque' ? CAMOS.find(c => c.id === camo) : o.paleta;
  const pk = perksDe(o.id), remAct = remateActivo();
  const lista = OPERADORES.filter(y => (OP_EXTRA[y.id] || {}).fac === fac);

  const equipar = () => { if (!mio) { aviso('Todavía no lo desbloqueaste'); return; } if (equiparOperador(o.id)) { API.click(); aviso(`Equipaste a ${o.n.replace(/"/g, '')}`); } };
  const voz = () => {
    if (!window.speechSynthesis) { aviso('Este navegador no tiene voces'); return; }
    const l = x.voz[vozN.current++ % x.voz.length];
    try { const u = new SpeechSynthesisUtterance(l); u.lang = 'es-AR'; u.pitch = x.tono; u.rate = 1.02; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) { /* sin voz */ }
    aviso(`${o.n.replace(/"/g, '')}: “${l}”`);
  };
  const probarRemate = id => setRafaga({ id, k: Math.random() });
  const accionRef = useRef({});
  accionRef.current = { equipar, voz, abrirAsp: () => setPanel(p => p === 'aspectos' ? null : 'aspectos'), abrirRem: () => { setPanel(p => p === 'remate' ? null : 'remate'); probarRemate(remAct === 'ninguno' ? x.remate : remAct); } };
  useEffect(() => {
    const al = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && e.code === 'Space') return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); accionRef.current.equipar(); }
      else if (e.code === 'KeyX') accionRef.current.abrirAsp();
      else if (e.code === 'KeyC') accionRef.current.abrirRem();
      else if (e.code === 'KeyV') accionRef.current.voz();
    };
    addEventListener('keydown', al);
    return () => removeEventListener('keydown', al);
  }, []);
  useEffect(() => () => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* nada */ } }, []);

  const Btn = ({ onClick, children, tecla, primario, activo }) => (
    <button onClick={() => { API.click(); onClick(); }} className={`px-space-md py-2 rounded font-label-lg text-label-lg uppercase tracking-wider font-bold flex items-center gap-2 transition-all active:scale-[0.98] ${primario ? 'bg-primary hover:bg-primary-fixed text-on-primary shadow-[0_0_16px_rgba(245,158,11,0.35)]' : activo ? 'bg-surface-container-highest text-primary ring-1 ring-primary' : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'}`}>
      {children}<span className="hidden sm:inline text-[10px] opacity-70 font-mono">[{tecla}]</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-space-sm anim-entrar">
      <div className="flex items-center justify-between pb-space-xs gap-space-sm">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-secondary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">OPERADORES</h2></div>
        <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">{OPERADORES.filter(y => tiene(y.id)).length}/{OPERADORES.length} DESBLOQUEADOS</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-gutter items-start">
        {/* ---------- Lista por facción ---------- */}
        <div className="flex flex-col gap-space-xs order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Facciones">
            {FACCIONES.map(z => (
              <button key={z.id} role="tab" aria-selected={fac === z.id} onClick={() => { API.click(); setFac(z.id); }}
                className={`py-2 px-1 rounded font-label-sm text-label-sm tracking-wider font-bold uppercase transition-all ${fac === z.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>{z.n}</button>
            ))}
          </div>
          <div className="flex lg:flex-col gap-1 scroll-x lg:overflow-visible">
            {lista.map(y => {
              const ok = tiene(y.id), uso = opActivo() === y.id;
              return (
                <button key={y.id} onClick={() => { API.click(); setSel(y.id); setPanel(null); }} aria-pressed={sel === y.id}
                  className={`relative shrink-0 w-44 lg:w-full flex items-center gap-space-sm rounded-lg p-space-xs text-left transition-all border-l-2 ${sel === y.id ? 'bg-surface-container-high border-primary' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}>
                  <div className="bg-surface-container rounded"><Mini id={y.id} pal={y.paleta} bloqueado={!ok} w={44} h={56} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-label-lg text-label-lg text-on-surface uppercase font-bold leading-tight truncate">{y.n.replace(/"/g, '')}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase truncate">{y.rol}</div>
                    <div className={`font-label-sm text-label-sm flex items-center gap-1 ${uso ? 'text-primary' : ok ? 'text-secondary' : 'text-outline'}`}><Icon n={uso ? 'check_circle' : ok ? 'style' : 'lock'} className="text-sm" />{uso ? 'EQUIPADO' : ok ? 'TUYO' : 'BLOQUEADO'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- Escena central ---------- */}
        <div className="order-1 lg:order-2 flex flex-col gap-space-sm min-w-0">
          <div className="relative rounded-lg overflow-hidden bg-surface-container-lowest min-h-[360px] md:min-h-[460px] flex items-end justify-center">
            <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}fondos/omega.jpg')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-surface-container-lowest/60"></div>
            <div className="absolute top-space-sm left-space-sm right-space-sm flex items-start justify-between gap-space-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high/90 px-space-xs py-0.5 rounded font-mono font-bold">{FACCIONES.find(z => z.id === x.fac).n}</span>
                  {puesto && <span className="font-label-sm text-label-sm text-on-primary-container bg-primary-container px-space-xs py-0.5 rounded font-bold">EQUIPADO</span>}
                  {!mio && <span className="font-label-sm text-label-sm text-error bg-error/15 px-space-xs py-0.5 rounded font-bold flex items-center gap-1"><Icon n="lock" className="text-xs" />BLOQUEADO</span>}
                </div>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-wider uppercase leading-none mt-1 drop-shadow">{o.n.replace(/"/g, '')}</h1>
                <div className="font-label-md text-label-md text-primary uppercase tracking-widest">{o.rol}</div>
              </div>
              <div className="hidden sm:flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest/70 rounded px-space-xs py-0.5"><Icon n="rotate_right" className="text-sm" />ARRASTRÁ PARA GIRAR 360°</div>
            </div>
            <div className={`relative h-[360px] md:h-[460px] flex items-end ${mio ? '' : 'brightness-50 saturate-50'}`}>{FOTO[o.id] ? <img src={FOTO[o.id][0]} alt={o.n} style={{ filter: FOTO[o.id][1] }} className="h-full w-auto object-contain" /> : <Heroe pal={pal} arma={ARMA_IDX[x.arma] ?? 1} rafaga={rafaga} />}</div>
          </div>
          <div className="flex items-center gap-space-xs flex-wrap">
            {mio
              ? <Btn onClick={equipar} tecla="ESPACIO" primario>{puesto ? 'EN USO' : 'EQUIPAR'}</Btn>
              : <div className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 bg-surface-container-low rounded px-space-sm py-2"><Icon n="lock" className="text-base" /><span>{textoFuente(o.fuente)}</span>{hint(o.fuente, irA)}</div>}
            <Btn onClick={() => setPanel(p => p === 'aspectos' ? null : 'aspectos')} tecla="X" activo={panel === 'aspectos'}><Icon n="style" className="text-base" />ASPECTOS</Btn>
            <Btn onClick={() => { setPanel(p => p === 'remate' ? null : 'remate'); probarRemate(remAct === 'ninguno' ? x.remate : remAct); }} tecla="C" activo={panel === 'remate'}><Icon n="bolt" className="text-base" />REMATE</Btn>
            <Btn onClick={voz} tecla="V"><Icon n="record_voice_over" className="text-base" />VOZ</Btn>
          </div>

          {panel === 'aspectos' && (
            <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs anim-entrar">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">CAMUFLAJES</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-space-xs">
                {CAMOS.map(c => {
                  const ok = tiene(c.id), uso = camo === c.id;
                  return (
                    <button key={c.id} onClick={() => { if (ok && equiparCamo(c.id)) { API.click(); aviso(`Camuflaje ${c.n} equipado`); } else if (!ok) irA(c.fuente.tipo === 'tienda' ? 'tienda' : 'pase'); }} aria-pressed={uso}
                      className={`rounded-lg p-space-xs flex flex-col items-center gap-1 transition-all ${uso ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container hover:bg-surface-container-high'}`}>
                      <Mini pal={c} w={40} h={52} bloqueado={!ok} />
                      <div className="font-label-sm text-label-sm text-on-surface uppercase text-center leading-tight">{c.n}</div>
                      <div className={`font-label-sm text-[10px] text-center ${uso ? 'text-primary' : ok ? 'text-secondary' : 'text-outline'}`}>{uso ? 'EQUIPADO' : ok ? 'TUYO' : textoFuente(c.fuente)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {panel === 'remate' && (
            <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs anim-entrar">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">REMATES (EFECTO AL DERRIBAR UN ENEMIGO)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                {REMATES.map(r => {
                  const ok = remateOk(r), uso = remAct === r.id;
                  return (
                    <button key={r.id} onClick={() => { if (!ok) { aviso(`Se desbloquea en el nivel ${r.nivel}`); return; } probarRemate(r.id); if (equiparRemate(r.id)) { API.click(); aviso(`Remate ${r.n} equipado`); } }} aria-pressed={uso}
                      className={`text-left rounded-lg p-space-sm flex items-center gap-space-sm transition-all ${uso ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container hover:bg-surface-container-high'} ${ok ? '' : 'opacity-50'}`}>
                      <Icon n={ok ? 'bolt' : 'lock'} className={`text-2xl ${uso ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className="min-w-0"><span className="block font-label-lg text-label-lg text-on-surface uppercase font-bold">{r.n}</span><span className="block font-label-sm text-label-sm text-on-surface-variant">{ok ? r.d : `Se desbloquea en el nivel ${r.nivel}`}</span></span>
                      {uso && <span className="ml-auto font-label-sm text-label-sm text-primary font-bold">EQUIPADO</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ---------- Ficha (dossier) ---------- */}
        <aside className="order-3 bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center justify-between"><span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">DOSSIER</span><Icon n="shield" className="text-primary text-lg" /></div>
          <Barra rotulo="BLINDAJE" texto={100 + pk.hpAdd} v={(100 + pk.hpAdd) / 140} color="bg-secondary" />
          <Barra rotulo="VELOCIDAD" texto={Math.round(pk.velMul * 100)} v={pk.velMul / 1.2} />
          <Barra rotulo="DAÑO" texto={Math.round(pk.danioMul * 100)} v={pk.danioMul / 1.2} color="bg-error" />
          <Barra rotulo="RECARGA" texto={Math.round(100 / pk.recMul)} v={1 / pk.recMul / 1.3} color="bg-tertiary" />
          <Barra rotulo="REGENERACIÓN" texto={Math.round(pk.regenMul * 100)} v={pk.regenMul / 1.6} color="bg-secondary" />
          <div className="border-t border-outline-variant/30 pt-space-sm flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">HABILIDAD DE CAMPO</span>
            <div className="font-label-lg text-label-lg text-primary uppercase font-bold">{x.hab.n}</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{x.hab.d}</p>
            <div className="flex flex-col gap-0.5 pt-1">{o.perks.map(k => <span key={k.t} className={`font-label-sm text-label-sm ${k.malo ? 'text-error' : 'text-secondary'}`}>{k.malo ? '−' : '+'} {k.t}</span>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-space-xs">
            <div className="bg-surface-container rounded p-space-xs"><div className="font-label-sm text-[10px] text-on-surface-variant tracking-widest">ARMA FAVORITA</div><div className="font-label-md text-label-md text-on-surface uppercase font-bold">{x.arma}</div></div>
            <div className="bg-surface-container rounded p-space-xs"><div className="font-label-sm text-[10px] text-on-surface-variant tracking-widest">REMATE</div><div className="font-label-md text-label-md text-on-surface uppercase font-bold">{(REMATES.find(r => r.id === x.remate) || REMATES[1]).n}</div></div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">VARIANTES DE CAMUFLAJE</span>
            <div className="flex flex-wrap gap-1.5">
              {CAMOS.map(c => <button key={c.id} onClick={() => { if (tiene(c.id) && equiparCamo(c.id)) { API.click(); aviso(`Camuflaje ${c.n} equipado`); } else if (!tiene(c.id)) { setPanel('aspectos'); } }} title={c.n} aria-label={`Camuflaje ${c.n}`}
                className={`w-7 h-7 rounded-sm border ${camo === c.id ? 'border-primary ring-1 ring-primary' : 'border-outline-variant'} ${tiene(c.id) ? '' : 'opacity-40'}`} style={{ background: `linear-gradient(135deg, ${c.c} 55%, ${c.h} 55%)` }}></button>)}
            </div>
          </div>
          <div className="border-t border-outline-variant/30 pt-space-sm flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">TU NOMBRE (SE VE EN LAS SALAS)</span>
            <div className="font-headline-md text-headline-md text-on-surface uppercase"><NombreEditable nombre={f.perfil.nombre} /></div>
          </div>
        </aside>
      </div>

      <div className="overflow-hidden rounded bg-surface-container-lowest/80 py-1 font-label-sm text-label-sm text-primary-fixed-dim tracking-widest whitespace-nowrap" aria-hidden="true">
        <div className="inline-block anim-ticker">{Array(2).fill(`ESCUADRÓN FARO ◆ GRUPO SOMBRA ◆ SECTOR FARO ROCOSO ◆ ${OPERADORES.length} OPERADORES ◆ ELEGÍ TU ESTILO ◆ CAMUFLAJES · REMATES · VOCES ◆ `).join('')}</div>
      </div>
    </div>
  );
}
