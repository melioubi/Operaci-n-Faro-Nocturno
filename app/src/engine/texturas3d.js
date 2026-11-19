import * as THREE from 'three';

// Texturas procedurales (se dibujan una sola vez, sin archivos): se repiten sin costo extra en pantalla.
function azar(semilla) {
  let a = semilla | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function lienzo(n, semilla, pintar) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), r = azar(semilla);
  // cada trazo se repite en los bordes para que el mosaico no tenga costuras
  const envolver = (f) => { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { g.save(); g.translate(dx, dy); f(); g.restore(); } };
  pintar(g, n, r, envolver);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const mezcla = (r, a, b) => { const k = r(); const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };

function pasto() {
  return lienzo(256, 11, (g, n, r, env) => {
    g.fillStyle = '#2c4a24'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 40; i++) { const x = r() * n, y = r() * n, rad = 20 + r() * 40; env(() => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, r() > 0.5 ? 'rgba(70,100,40,0.35)' : 'rgba(20,34,16,0.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
    for (let i = 0; i < 2600; i++) { const x = r() * n, y = r() * n, l = 3 + r() * 6; g.strokeStyle = mezcla(r, '#1c3216', '#5f8a3a'); g.lineWidth = 1; env(() => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke(); }); }
  });
}
function bosque() {
  return lienzo(256, 22, (g, n, r, env) => {
    g.fillStyle = '#1d2614'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 1400; i++) { const x = r() * n, y = r() * n, rx = 2 + r() * 5, ry = 1 + r() * 3, a = r() * 3.14; g.fillStyle = mezcla(r, '#2a1f12', '#5a4a22'); env(() => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 7); g.fill(); }); }
    for (let i = 0; i < 700; i++) { const x = r() * n, y = r() * n; g.fillStyle = mezcla(r, '#12190c', '#37501f'); env(() => g.fillRect(x, y, 2, 2)); }
  });
}
function arena() {
  return lienzo(256, 33, (g, n, r, env) => {
    g.fillStyle = '#7d6e52'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 1500; i++) { const x = r() * n, y = r() * n, rad = 1 + r() * 3.2; g.fillStyle = mezcla(r, '#5a5a56', '#b3a583'); env(() => { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(x + 1, y + 1, rad * 0.8, 0, 7); g.fill(); }); }
  });
}
function grava() {
  return lienzo(256, 44, (g, n, r, env) => {
    g.fillStyle = '#3d4a40'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 1100; i++) { const x = r() * n, y = r() * n, rad = 1.5 + r() * 4; g.fillStyle = mezcla(r, '#3a3f40', '#80857f'); env(() => { g.beginPath(); g.ellipse(x, y, rad, rad * 0.75, r() * 3, 0, 7); g.fill(); }); }
    for (let i = 0; i < 18; i++) { const x = r() * n, y = r() * n, rad = 20 + r() * 30; env(() => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(50,80,40,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }); }
  });
}
function yeso() {
  return lienzo(256, 55, (g, n, r, env) => {
    g.fillStyle = '#9d927c'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 2500; i++) { const x = r() * n, y = r() * n; g.fillStyle = mezcla(r, '#7e7462', '#c1b6a0'); env(() => g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2)); }
    g.strokeStyle = 'rgba(40,34,26,0.5)'; g.lineWidth = 1;
    for (let y = 0; y < n; y += 32) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(n, y + 0.5); g.stroke(); }
    for (let i = 0; i < 10; i++) { const x = r() * n; env(() => { const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, 'rgba(30,26,20,0.28)'); gr.addColorStop(1, 'rgba(30,26,20,0)'); g.fillStyle = gr; g.fillRect(x, 0, 6 + r() * 10, n); }); }
  });
}
function roca() {
  return lienzo(256, 66, (g, n, r, env) => {
    g.fillStyle = '#585d64'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 160; i++) { const x = r() * n, y = r() * n; g.fillStyle = mezcla(r, '#3b3f45', '#8a9098'); env(() => { g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) g.lineTo(x + (r() - 0.5) * 46, y + (r() - 0.5) * 22); g.closePath(); g.fill(); }); }
    g.strokeStyle = 'rgba(10,12,16,0.55)'; g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = r() * n, y = r() * n; env(() => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 50, y + (r() - 0.5) * 50); g.stroke(); }); }
  });
}
function corteza() {
  return lienzo(128, 77, (g, n, r, env) => {
    g.fillStyle = '#4a3a2a'; g.fillRect(0, 0, n, n);
    for (let i = 0; i < 160; i++) { const x = r() * n, w = 1 + r() * 3; g.fillStyle = mezcla(r, '#2a1f16', '#6a5440'); env(() => g.fillRect(x, 0, w, n)); }
  });
}

const cache = {};
const hacer = { pasto, bosque, arena, grava, yeso, roca, corteza };
export function textura(nombre) { return cache[nombre] || (cache[nombre] = hacer[nombre]()); }
export function conRepeticion(nombre, rx, ry) { const t = textura(nombre).clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; }

// Cielo nocturno con luna y nubes (una esfera que acompaña a la cámara)
export function crearCielo() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'), r = azar(99);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#05070f'); gr.addColorStop(0.55, '#101b2c'); gr.addColorStop(0.8, '#1d2c3d'); gr.addColorStop(1, '#202e3a');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#dfe8ff'; for (let i = 0; i < 90; i++) g.fillRect(r() * 512, r() * 110, 1, 1);
  const lu = g.createRadialGradient(380, 60, 0, 380, 60, 60); lu.addColorStop(0, 'rgba(235,242,255,0.9)'); lu.addColorStop(0.2, 'rgba(190,210,255,0.35)'); lu.addColorStop(1, 'rgba(120,150,220,0)');
  g.fillStyle = lu; g.fillRect(300, 0, 160, 140); g.fillStyle = '#f2f6ff'; g.beginPath(); g.arc(380, 60, 7, 0, 7); g.fill();
  for (let i = 0; i < 26; i++) { const x = r() * 512, y = 40 + r() * 110, w = 60 + r() * 120, h = 10 + r() * 22; const nb = g.createRadialGradient(x, y, 0, x, y, w); nb.addColorStop(0, 'rgba(70,86,110,0.45)'); nb.addColorStop(1, 'rgba(40,54,72,0)'); g.fillStyle = nb; g.save(); g.translate(x, y); g.scale(1, h / w); g.translate(-x, -y); g.fillRect(x - w, y - w, w * 2, w * 2); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(190, 24, 12), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

// Haz de luz visible del faro (cono aditivo, muy barato)
export function crearHazVisible() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 64;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,244,200,0.95)'); gr.addColorStop(0.5, 'rgba(255,240,190,0.4)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(c);
  const geo = new THREE.CylinderGeometry(7, 0.25, 48, 14, 1, true); geo.translate(0, 24, 0); geo.rotateX(Math.PI / 2);
  // el eje del cilindro queda a lo largo de +Z con la punta en el origen; el degradé corre de la punta al final
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.frustumCulled = false; m.renderOrder = 5;
  return m;
}
