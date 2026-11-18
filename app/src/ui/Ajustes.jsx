import { useEffect } from 'react';
import { Icon } from './Icon.jsx';
import { API } from './comun.js';

const VISTAS = [
  { id: 'arriba25', t: 'DESDE ARRIBA 2.5D', i: 'layers', d: 'Vista de arriba con paredes y árboles en relieve.' },
  { id: 'tercera', t: 'TERCERA PERSONA', i: 'person_pin', d: 'Cámara detrás tuyo: mirás hacia donde apunta el soldado.' },
  { id: 'primera', t: 'PRIMERA PERSONA', i: 'visibility', d: 'Ves por los ojos del soldado, con el arma en la mano.' },
  { id: 'clasica', t: 'CLÁSICA', i: 'map', d: 'La vista plana de siempre.' },
];
const MUSICAS = [
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
  const m = f.musica || { menu: 'ambiente', juego: 'metal', vol: 0.7 };
  return (
    <div className="flex flex-col gap-space-sm">
      <Titulo>VISTA DE LA CÁMARA</Titulo>
      <Opciones lista={VISTAS} valor={f.camara} onElegir={API.setCamara} />
      <p className="font-label-sm text-label-sm text-on-surface-variant">Tip: en la partida apretá <b className="text-primary">V</b> para cambiar de vista. En primera y tercera persona, hacé clic en el juego para capturar el mouse (mirás moviendo el mouse; ESC lo suelta). En el celu, el joystick derecho gira y dispara.</p>
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
