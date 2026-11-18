import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { API, aviso, usePerfil } from './comun.js';
import { CAMOS, OPERADORES, textoFuente } from '../progreso/catalogo.js';
import { camoActivo, equiparCamo, equiparOperador, opActivo, tiene } from '../progreso/perfil.js';
import { IMG_OPERADOR } from './datos.js';
import { NombreEditable } from './Lobby.jsx';

export function Preview({ paleta, tam = 96, bloqueado, arma = 1 }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) API.previewSoldado(ref.current, paleta, arma); }, [paleta, arma]);
  return <canvas ref={ref} width={tam} height={tam} className={bloqueado ? 'opacity-30 grayscale' : ''} style={{ width: tam, height: tam }} aria-hidden="true" />;
}
const hint = (f, irA) => (f.tipo === 'tienda' ? <button onClick={() => irA('tienda')} className="underline text-primary">Comprala en la TIENDA</button> : f.tipo === 'pase' ? <button onClick={() => irA('pase')} className="underline text-primary">Se gana en el PASE DE BATALLA</button> : null);

export default function Operadores({ f, irA }) {
  usePerfil();
  const [sel, setSel] = useState(opActivo());
  const o = OPERADORES.find(x => x.id === sel) || OPERADORES[0];
  const mio = tiene(o.id), puesto = opActivo() === o.id, camo = camoActivo();
  const paletaVista = puesto ? (camo !== 'bosque' ? CAMOS.find(c => c.id === camo) : o.paleta) : o.paleta;
  const equipar = () => { if (equiparOperador(o.id)) { API.click(); aviso(`Equipaste a ${o.n}`); } };

  return (
    <div className="flex flex-col gap-space-md anim-entrar">
      <div className="flex items-center justify-between pb-space-xs gap-space-sm">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-secondary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">OPERADORES</h2></div>
        <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">{OPERADORES.filter(x => tiene(x.id)).length}/{OPERADORES.length} DESBLOQUEADOS</span>
      </div>

      {/* Operador elegido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-7 relative bg-surface-container-lowest/85 backdrop-blur-md rounded-lg shadow-xl overflow-hidden p-space-md flex flex-col sm:flex-row gap-space-md">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none [mask-image:linear-gradient(90deg,transparent,#000_60%)]" style={{ backgroundImage: `url('${IMG_OPERADOR}')` }}></div>
          <div className="relative flex items-center justify-center bg-surface-container-low rounded-lg p-space-md shrink-0 self-start">
            <Preview paleta={paletaVista} tam={160} bloqueado={!mio} />
          </div>
          <div className="relative flex flex-col gap-space-sm min-w-0">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-label-sm text-label-sm text-secondary bg-surface-container-high px-space-xs py-0.5 rounded font-mono font-bold">{o.rol}</span>
              {puesto && <span className="font-label-sm text-label-sm text-on-primary-container bg-primary-container px-space-xs py-0.5 rounded font-bold">EQUIPADO</span>}
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-wider uppercase leading-none">{o.n}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{o.desc}</p>
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">HABILIDADES</span>
              {o.perks.map(k => <div key={k.t} className={`flex items-center gap-2 rounded px-space-sm py-1 font-label-md text-label-md ${k.malo ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}><Icon n={k.malo ? 'remove' : 'add'} className="text-sm" />{k.t}</div>)}
            </div>
            <div className="flex items-center gap-space-sm flex-wrap pt-space-xs">
              {mio
                ? <button onClick={equipar} disabled={puesto} className="px-space-lg py-2 bg-primary hover:bg-primary-fixed disabled:opacity-60 text-on-primary rounded-lg font-headline-md text-headline-md tracking-wider uppercase shadow-[0_0_16px_rgba(245,158,11,0.35)]">{puesto ? 'EN USO' : 'EQUIPAR'}</button>
                : <div className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2"><Icon n="lock" className="text-base" /><span>BLOQUEADO · {textoFuente(o.fuente)}</span>{hint(o.fuente, irA)}</div>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 bg-surface-container-low rounded-lg p-space-md flex flex-col gap-1 self-start">
          <span className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">TU NOMBRE DE OPERADOR (SE VE EN LAS SALAS)</span>
          <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase"><NombreEditable nombre={f.perfil.nombre} /></div>
        </div>
      </div>

      {/* Lista de operadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-space-sm">
        {OPERADORES.map(x => {
          const ok = tiene(x.id), uso = opActivo() === x.id;
          return (
            <button key={x.id} onClick={() => { API.click(); setSel(x.id); }} aria-pressed={sel === x.id}
              className={`relative rounded-lg p-space-sm flex flex-col items-center gap-1 transition-all ${sel === x.id ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}>
              {uso && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_#f59e0b]"></span>}
              <Preview paleta={x.paleta} tam={72} bloqueado={!ok} />
              <div className="font-label-md text-label-md text-on-surface uppercase text-center leading-tight">{x.n.replace(/"/g, '')}</div>
              <div className={`font-label-sm text-label-sm flex items-center gap-1 ${ok ? 'text-secondary' : 'text-outline'}`}><Icon n={ok ? 'check_circle' : 'lock'} className="text-sm" />{ok ? 'TUYO' : 'BLOQUEADO'}</div>
            </button>
          );
        })}
      </div>

      {/* Camuflajes */}
      <div className="flex items-center justify-between pt-space-sm gap-space-sm">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-primary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">CAMUFLAJES</h2></div>
        <span className="font-label-sm text-label-sm text-primary-fixed-dim bg-surface-container-highest px-space-xs py-0.5 rounded">{CAMOS.filter(c => tiene(c.id)).length}/{CAMOS.length} DESBLOQUEADOS</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-space-sm">
        {CAMOS.map(c => {
          const ok = tiene(c.id), uso = camo === c.id;
          return (
            <button key={c.id} onClick={() => { if (ok && equiparCamo(c.id)) { API.click(); aviso(`Camuflaje ${c.n} equipado`); } else if (!ok) irA(c.fuente.tipo === 'tienda' ? 'tienda' : 'pase'); }} aria-pressed={uso}
              className={`rounded-lg p-space-sm flex flex-col items-center gap-1 transition-all ${uso ? 'bg-surface-container-high ring-1 ring-primary shadow-[0_0_16px_rgba(245,158,11,0.2)]' : 'bg-surface-container-low hover:bg-surface-container'}`}>
              <Preview paleta={c} tam={72} bloqueado={!ok} />
              <div className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider text-center">{c.n}</div>
              <div className={`font-label-sm text-label-sm text-center flex items-center gap-1 ${uso ? 'text-primary' : ok ? 'text-secondary' : 'text-outline'}`}><Icon n={uso ? 'check_circle' : ok ? 'style' : 'lock'} className="text-sm" />{uso ? 'EQUIPADO' : ok ? 'DESBLOQUEADO' : textoFuente(c.fuente)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
