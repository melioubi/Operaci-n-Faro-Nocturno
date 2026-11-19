import { useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { API } from './comun.js';

const VISTAS = [
  { id: 'arriba25', t: 'DESDE ARRIBA 2.5D', i: 'layers', d: 'Vista de arriba con paredes y árboles en relieve. En la campaña, primera y tercera pasan a 3D.' },
  { id: 'tercera', t: 'TERCERA PERSONA', i: 'person_pin', d: 'Cámara detrás tuyo. En la campaña es 3D, con lluvia, niebla y el haz del faro.' },
  { id: 'primera', t: 'PRIMERA PERSONA', i: 'visibility', d: 'Ves por los ojos del operador, con el arma equipada en la mano.' },
  { id: 'clasica', t: 'CLÁSICA', i: 'map', d: 'La vista plana de siempre.' },
];
const CALIDAD = [
  { id: 'baja', t: 'BAJA', i: 'smartphone', d: 'Para el celular: sin sombras y menos lluvia.' },
  { id: 'alta', t: 'ALTA', i: 'desktop_windows', d: 'Sombras, más lluvia y más detalle. Gasta más batería.' },
];
const MUSICAS = [
  { id: 'pistas', t: 'PISTAS REALES', d: 'Música grabada: oscura en el menú, metal en la partida' },
  { id: 'ambiente', t: 'AMBIENTE TÁCTICO', d: 'Pads oscuros y pulso lejano (menú)' },
  { id: 'metal', t: 'METAL (DOOM)', d: 'Riffs graves y doble bombo (partida)' },
  { id: '8bit', t: '8 BITS', d: 'El sonido original' },
  { id: 'off', t: 'SIN MÚSICA', d: 'Sólo efectos' },
];

function Opciones({ lista, valor, onElegir }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
      {lista.map(o => (
        <button key={o.id} onClick={() => { API.click(); onElegir(o.id); }} aria-pressed={valor === o.id}
          className={`text-left rounded-lg p-space-sm flex items-start gap-space-sm transition-all ${valor === o.id ? 'bg-surface-container-high ring-1 ring-primary' : 'bg-surface-container hover:bg-surface-container-high'}`}>
          {o.i && <Icon n={o.i} className={`text-2xl shrink-0 ${valor === o.id ? 'text-primary' : 'text-on-surface-variant'}`} />}
          <span className="min-w-0"><span className="block font-label-lg text-label-lg text-on-surface uppercase font-bold">{o.t}</span><span className="block font-label-sm text-label-sm text-on-surface-variant">{o.d}</span></span>
        </button>
      ))}
    </div>
  );
}
const Titulo = ({ children, color = 'bg-primary' }) => <div className="flex items-center gap-2 pt-space-xs"><span className={`w-1.5 h-3.5 ${color}`}></span><h3 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">{children}</h3></div>;

export function AjustesContenido({ f }) {
  const m = f.musica || { menu: 'pistas', juego: 'pistas', vol: 0.9 };
  return (
    <div className="flex flex-col gap-space-sm">
      <Titulo>VISTA DE LA CÁMARA</Titulo>
      <Opciones lista={VISTAS} valor={f.camara} onElegir={API.setCamara} />
      <p className="font-label-sm text-label-sm text-on-surface-variant">En la campaña, primera y tercera persona son 3D. El resto de los modos sigue en 2D hasta la próxima etapa. En la compu, clic captura el mouse para mirar y el clic izquierdo dispara. En el celular, el joystick derecho sólo mueve la mira y el botón FUEGO dispara.</p>
      <Titulo color="bg-secondary">CALIDAD 3D</Titulo>
      <Opciones lista={CALIDAD} valor={f.calidad || 'alta'} onElegir={API.setCalidad} />
      <label className="flex items-center gap-space-sm bg-surface-container rounded-lg p-space-sm">
        <Icon n="my_location" className="text-primary text-2xl" />
        <span className="font-label-md text-label-md text-on-surface uppercase font-bold w-28">SENSIBILIDAD</span>
        <input type="range" min="35" max="160" value={Math.round((f.sensibilidad || 0.7) * 100)} onChange={e => API.setSensibilidad(+e.target.value / 100)} className="flex-1 accent-[#f59e0b]" aria-label="Sensibilidad de la mira" />
        <span className="font-label-md text-label-md text-primary w-10 text-right">{Math.round((f.sensibilidad || 0.7) * 100)}%</span>
      </label>
      <Titulo color="bg-tertiary">MÚSICA EN EL MENÚ</Titulo>
      <Opciones lista={MUSICAS} valor={m.menu} onElegir={id => API.setMusica({ menu: id })} />
      <Titulo color="bg-error">MÚSICA EN LA PARTIDA</Titulo>
      <Opciones lista={MUSICAS} valor={m.juego} onElegir={id => API.setMusica({ juego: id })} />
      <label className="flex items-center gap-space-sm bg-surface-container rounded-lg p-space-sm">
        <Icon n="volume_up" className="text-primary text-2xl" />
        <span className="font-label-md text-label-md text-on-surface uppercase font-bold w-24">VOLUMEN</span>
        <input type="range" min="0" max="100" value={Math.round(m.vol * 100)} onChange={e => API.setMusica({ vol: +e.target.value / 100 })} className="flex-1 accent-[#f59e0b]" aria-label="Volumen de la música" />
        <span className="font-label-md text-label-md text-primary w-10 text-right">{Math.round(m.vol * 100)}%</span>
      </label>
    </div>
  );
}

export function AjustesModal({ f, cerrar }) {
  useEffect(() => {
    const al = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); cerrar(); } };
    addEventListener('keydown', al, true);
    return () => removeEventListener('keydown', al, true);
  }, [cerrar]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-space-md bg-surface-container-lowest/85 backdrop-blur-sm anim-entrar pointer-events-auto" onClick={cerrar}>
      <div className="w-full max-w-3xl max-h-full scroll-y bg-surface-container-low rounded-lg shadow-2xl p-space-md flex flex-col gap-space-sm" onClick={e => e.stopPropagation()} role="dialog" aria-label="Ajustes">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2"><span className="w-1.5 h-4 bg-primary"></span><h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-wider">AJUSTES</h2></div>
          <button onClick={cerrar} aria-label="Cerrar" className="p-1 rounded text-on-surface-variant hover:text-on-surface"><Icon n="close" /></button>
        </div>
        <AjustesContenido f={f} />
        <button onClick={() => { API.click(); cerrar(); }} className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-headline-md text-headline-md tracking-wider uppercase">LISTO</button>
      </div>
    </div>
  );
}
