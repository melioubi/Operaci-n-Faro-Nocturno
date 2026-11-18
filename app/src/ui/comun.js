import { useEffect, useState, useSyncExternalStore } from 'react';
import { store, API, DATOS } from '../engine/juego.js';
import { perfil, suscribirPerfil, versionPerfil } from '../progreso/perfil.js';

export { API, DATOS };

// La "foto" del juego: se actualiza ~15 veces por segundo mientras jugás
export const useFoto = () => useSyncExternalStore(store.suscribir, store.foto);

// Avisos chiquitos abajo ("¡Link copiado!")
export function aviso(texto) { window.dispatchEvent(new CustomEvent('faro-aviso', { detail: texto })); }
export function useAviso() {
  const [a, setA] = useState(null);
  useEffect(() => {
    let t;
    const f = e => { setA({ texto: e.detail, id: Math.random() }); clearTimeout(t); t = setTimeout(() => setA(null), 3200); };
    window.addEventListener('faro-aviso', f);
    return () => { window.removeEventListener('faro-aviso', f); clearTimeout(t); };
  }, []);
  return a;
}

export function useVertical() {
  const calc = () => innerHeight > innerWidth;
  const [v, setV] = useState(calc);
  useEffect(() => { const f = () => setV(calc()); addEventListener('resize', f); return () => removeEventListener('resize', f); }, []);
  return v;
}

export const fmt = n => Number(n || 0).toLocaleString('es-AR');
export const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Copiar / compartir el link de la sala
export async function copiarLink(link) {
  try { await navigator.clipboard.writeText(link); aviso('¡Link copiado! Mandáselo a tus amigos'); }
  catch (e) { aviso('No se pudo copiar. Copialo a mano: ' + link); }
}
export async function compartirLink(link, codigo) {
  if (navigator.share) { try { await navigator.share({ title: 'Operación Faro Nocturno', text: `¡Vení a jugar conmigo! Sala ${codigo}`, url: link }); return; } catch (e) { return; } }
  copiarLink(link);
}

// Pantalla completa (en el celu esconde la barra del navegador y bloquea horizontal)
export const puedePantallaCompleta = () => !!(document.documentElement.requestFullscreen);
export async function pantallaCompleta() {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    await document.documentElement.requestFullscreen();
    try { await screen.orientation.lock('landscape'); } catch (e) { /* no todos los navegadores lo permiten */ }
  } catch (e) { aviso('Este navegador no permite pantalla completa'); }
}

// El perfil (experiencia, monedas, desbloqueos, equipo). Se vuelve a dibujar cuando cambia.
export const usePerfil = () => { useSyncExternalStore(suscribirPerfil, versionPerfil); return perfil; };

// Pestaña con la que se abre el menú (por ejemplo, al volver del campo de tiro vuelve a la armería)
let pestanaInicial = 'jugar';
export const setPestanaInicial = t => { pestanaInicial = t; };
export const tomarPestanaInicial = () => { const t = pestanaInicial; pestanaInicial = 'jugar'; return t; };
