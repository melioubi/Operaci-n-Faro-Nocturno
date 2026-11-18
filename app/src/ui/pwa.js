// Instalar el juego como app (ícono en el celu o la compu)
import { useSyncExternalStore } from 'react';
import { aviso } from './comun.js';

let evento = null, version = 0;
const subs = new Set();
const avisar = () => { version++; subs.forEach(f => f()); };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); evento = e; avisar(); });
addEventListener('appinstalled', () => { evento = null; avisar(); aviso('¡Juego instalado! Buscá el ícono del faro'); });

export const esApp = () => { try { return matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

export function useInstalable() {
  useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => version);
  return !esApp();
}
export function instalar() {
  if (evento) { evento.prompt(); evento.userChoice.finally(() => { evento = null; avisar(); }); return; }
  aviso(esIOS ? 'iPhone: tocá Compartir y elegí "Agregar a inicio"' : 'Menú del navegador (⋮) → "Instalar app" o "Agregar a inicio"');
}
