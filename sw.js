// Service worker: permite instalar el juego como app y jugar sin internet (modo solo).
// Para el juego usa "red primero": si hay internet baja la última versión, si no, usa la guardada.
const CACHE = 'faro-nocturno-v1';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './iconos/icono-192.png', './iconos/icono-512.png', './iconos/icono-180.png', './iconos/icono-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // PeerJS, fuentes, etc. van directo
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
