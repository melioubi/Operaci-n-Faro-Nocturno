import { ARMAS_BASE as ARMAS, CAMOS, NIVEL_MAX, RANGOS, rangoDe, xpTotal, nivelDeXp, statsArma, perksDe, CAMO_POR_ID, OPERADOR_POR_ID } from '../progreso/catalogo.js';
import { perfil as PERFIL, equipoLocal, camoActivo, opActivo, ganarXp as ganarXpPerfil, darCreditos, sumarStat, sumarMaestria, suscribirPerfil, nivelPerfil } from '../progreso/perfil.js';
'use strict';
/* =====================================================================
   OPERACIÓN FARO NOCTURNO
   Idea y código original: BRUCO 
   Todo está en este archivo: gráficos, sonido, mapa y enemigos.
   ===================================================================== */

// ---------- Configuración general ----------
let VW = 480; const VH = 270;      // resolución "8 bits" interna (el ancho se adapta a la pantalla)
const WW = 3600, WH = 900;         // tamaño del mundo
const OSCURIDAD = 0.82;            // qué tan de noche es (0 a 1)

const DIFICULTADES = [
  { nombre: 'RECLUTA',  dmg: 0.55, hp: 0.85, punteria: 1.5 },
  { nombre: 'REGULAR',  dmg: 1.0,  hp: 1.0,  punteria: 1.0 },
  { nombre: 'VETERANO', dmg: 1.5,  hp: 1.2,  punteria: 0.7 },
];
let difIdx = 1;
try { const d = localStorage.getItem('faro_dif'); if (d !== null) difIdx = Math.max(0, Math.min(2, +d || 0)); } catch (e) {}
const dif = () => DIFICULTADES[difIdx];

// Las 4 zonas del mapa (de izquierda a derecha)
const ZONAS = [
  { nombre: 'LA CABAÑA',      x0: 0,    x1: 900,  oleadas: [4, 6],  entrada: [220, 425],
    radio: 'Hay cajas de munición en la cabaña. ¡Vienen del este!' },
  { nombre: 'EL BOSQUECITO',  x0: 900,  x1: 1800, oleadas: [6, 8],  entrada: [940, 0],
    radio: 'Ojo en el bosque... te pueden emboscar entre los árboles.' },
  { nombre: 'COSTA ROCOSA',   x0: 1800, x1: 2700, oleadas: [8, 10], entrada: [1840, 450],
    radio: 'Zona abierta. Usá las rocas para cubrirte y recuperar vida.' },
  { nombre: 'TORRE DEL FARO', x0: 2700, x1: 3600, oleadas: [9, 11], entrada: [2740, 450],
    radio: 'Llegaste al faro. Limpiá la zona y pedimos el helicóptero.' },
];
const PAD = { x: 3360, y: 600 };         // helipuerto (punto de extracción)
const FARO = { x: 3152, y: 272 };        // centro de la torre
const DEFENSA_SEG = 60;

// Tipos de enemigos
const TIPOS = {
  soldado:  { r: 6,  hp: 40,  vel: 52,  cuerpo: '#7a2a2a', casco: '#4a1616', rango: 170, cad: [1.1, 1.8], dmg: 7, perd: 1, disp: 0.09, vbala: 230, pts: 100, arma: 8 },
  corredor: { r: 5,  hp: 26,  vel: 100, cuerpo: '#a0522d', casco: '#5c2a12', melee: 14, pts: 75, arma: 3 },
  pesado:   { r: 8,  hp: 130, vel: 36,  cuerpo: '#4a4a52', casco: '#6a1a1a', rango: 110, cad: [1.4, 2.0], dmg: 6, perd: 4, disp: 0.3, vbala: 210, pts: 200, arma: 9 },
  francotirador: { r: 6, hp: 35, vel: 38, cuerpo: '#3a4a2a', casco: '#2a3018', rango: 320, cad: [2.6, 3.6], dmg: 22, perd: 1, disp: 0.02, vbala: 460, pts: 150, arma: 14, sniper: true },
  perro:    { r: 4,  hp: 14,  vel: 78,  cuerpo: '#6a4a2a', casco: '#4a3018', melee: 6, pts: 50, arma: 0, perro: true },   // más lento y débil que antes
  maniqui:  { r: 7,  hp: 220, vel: 0,   cuerpo: '#6a6a72', casco: '#8a8a92', pts: 0, arma: 0, estatico: true },            // blanco del campo de tiro
  jefe:     { r: 10, hp: 700, vel: 40,  cuerpo: '#2a1a2e', casco: '#8a1010', rango: 160, cad: [0.6, 0.9], dmg: 8, perd: 3, disp: 0.15, vbala: 250, pts: 1500, arma: 11, jefe: true },
};

// ---------- Utilidades ----------
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
function angDif(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const caminoY = x => 450 + 110 * Math.sin((x - 900) / 900 * Math.PI * 2);
ZONAS[1].entrada[1] = caminoY(940);

// ---------- Canvas ----------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const low = document.createElement('canvas'); low.width = VW; low.height = VH;
const lx = low.getContext('2d');
const luz = document.createElement('canvas'); luz.width = VW; luz.height = VH;
const lg = luz.getContext('2d');
const MUNDO = document.createElement('canvas'); MUNDO.width = WW; MUNDO.height = WH;
const wg = MUNDO.getContext('2d');
let ESC = 1, OX = 0, OY = 0, DPR = 1;
function resize() {
  // En celulares con pantallas de muy alta resolución dibujar a 3x hace que todo ande lento.
  // El juego es pixel art: 1.5x alcanza y se ve igual de nítido.
  const tactil = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  DPR = Math.min(window.devicePixelRatio || 1, tactil ? 1.5 : 2);
  cv.width = Math.floor(innerWidth * DPR); cv.height = Math.floor(innerHeight * DPR);
  // Pantallas anchas (celulares acostados, monitores) ven más mapa en vez de bandas negras
  const nuevoVW = Math.round(clamp(VH * innerWidth / innerHeight, 420, 620));
  if (nuevoVW !== VW) { VW = nuevoVW; low.width = VW; luz.width = VW; }
  ESC = Math.min(cv.width / VW, cv.height / VH);
  if (ESC >= 2) ESC = Math.floor(ESC * 2) / 2;
  OX = Math.floor((cv.width - VW * ESC) / 2); OY = Math.floor((cv.height - VH * ESC) / 2);
}
addEventListener('resize', resize); resize();

// ---------- Sonido chiptune (Web Audio, sin archivos) ----------
const Snd = {
  ac: null, out: null, sfx: null, mus: null, nb: null, mute: false, ult: {},
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.out = ac.createGain(); this.out.gain.value = 0.5; this.out.connect(ac.destination);
    this.sfx = ac.createGain(); this.sfx.connect(this.out);
    this.mus = ac.createGain(); this.mus.gain.value = 0.2; this.mus.connect(this.out);
    const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.nb = b; Musica.start();
  },
  tono(tipo, f0, f1, dur, vol, cuando = 0, bus) {
    const ac = this.ac; if (!ac) return; const t = ac.currentTime + cuando;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  ruido(dur, vol, f0, f1, cuando = 0, tipo = 'lowpass', bus) {
    const ac = this.ac; if (!ac) return; const t = ac.currentTime + cuando;
    const s = ac.createBufferSource(); s.buffer = this.nb;
    const f = ac.createBiquadFilter(); f.type = tipo;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(n, v = 1) {
    if (!this.ac || this.mute) return;
    const now = this.ac.currentTime; if (this.ult[n] && now - this.ult[n] < 0.03) return; this.ult[n] = now;
    switch (n) {
      case 'pistola': this.tono('square', 900, 120, 0.09, 0.2 * v); this.ruido(0.07, 0.3 * v, 4000, 800); break;
      case 'fusil': this.tono('square', 700, 90, 0.07, 0.16 * v); this.ruido(0.06, 0.28 * v, 5000, 1000); break;
      case 'escopeta': this.ruido(0.28, 0.55 * v, 2500, 200); this.tono('square', 200, 50, 0.15, 0.25 * v); break;
      case 'eshot': this.tono('sawtooth', 500, 90, 0.08, 0.1 * v); this.ruido(0.05, 0.12 * v, 3000, 600); break;
      case 'hit': this.tono('square', 1400, 1400, 0.03, 0.08); break;
      case 'baja': this.tono('square', 900, 1800, 0.07, 0.1); break;
      case 'herido': this.tono('square', 180, 60, 0.18, 0.25); this.ruido(0.1, 0.2, 800, 200); break;
      case 'boom': this.ruido(0.8, 0.8 * v, 1800, 50); this.tono('sine', 120, 30, 0.5, 0.5 * v); break;
      case 'recarga': this.tono('square', 300, 300, 0.03, 0.1); this.tono('square', 450, 450, 0.03, 0.1, 0.18); break;
      case 'item': [660, 880, 1320].forEach((f, i) => this.tono('square', f, f, 0.06, 0.12, i * 0.06)); break;
      case 'vacio': this.tono('square', 200, 200, 0.03, 0.08); break;
      case 'cambio': this.tono('triangle', 500, 700, 0.05, 0.15); break;
      case 'tirar': this.ruido(0.15, 0.15, 1500, 3000, 0, 'bandpass'); break;
      case 'cuchillo': this.ruido(0.08, 0.3, 6000, 2000, 0, 'highpass'); break;
      case 'alarma': for (let i = 0; i < 3; i++) { this.tono('square', 880, 880, 0.12, 0.1, i * 0.3); this.tono('square', 660, 660, 0.12, 0.1, i * 0.3 + 0.15); } break;
      case 'racha': [523, 659, 784, 1046].forEach((f, i) => this.tono('square', f, f, 0.1, 0.12, i * 0.08)); break;
      case 'jet': this.ruido(1.6, 0.4, 300, 3000, 0, 'bandpass'); break;
      case 'helice': this.ruido(0.06, 0.12 * v, 500, 200); break;
      case 'ladrido': this.tono('square', 420, 250, 0.07, 0.15 * v); this.tono('square', 450, 260, 0.07, 0.15 * v, 0.12); break;
      case 'click': this.tono('square', 600, 600, 0.04, 0.1); break;
      case 'victoria': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tono('square', f, f, 0.18, 0.12, i * 0.14)); break;
      case 'derrota': [392, 330, 262, 196].forEach((f, i) => this.tono('triangle', f, f * 0.98, 0.35, 0.2, i * 0.3)); break;
    }
  },
  toggle() { this.mute = !this.mute; if (this.out) this.out.gain.value = this.mute ? 0 : 0.5; }
};
const Musica = {
  timer: null, paso: 0, prox: 0,
  start() { if (this.timer || !Snd.ac) return; this.prox = Snd.ac.currentTime + 0.1; this.timer = setInterval(() => this.tick(), 40); },
  tick() {
    const ac = Snd.ac; const spb = 60 / 128 / 4;
    while (this.prox < ac.currentTime + 0.15) { this.tocar(this.paso, this.prox - ac.currentTime); this.prox += spb; this.paso = (this.paso + 1) % 64; }
  },
  tocar(s, w) {
    if (Snd.mute || G.estado === 'pausa') return;
    const intenso = G.estado === 'jugando';
    const compas = Math.floor(s / 16), i = s % 16;
    const raiz = [45, 41, 43, 40][compas];
    const acordes = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]][compas];
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);
    const bp = [0, null, 12, null, 0, 0, 12, null, 0, null, 12, null, 0, 7, 12, null];
    if (bp[i] !== null && (intenso || i % 4 === 0)) Snd.tono('square', mf(raiz + bp[i]), mf(raiz + bp[i]), 0.1, 0.25, w, Snd.mus);
    if (i % 2 === 0) { const n = acordes[(i / 2) % 3] + 12; Snd.tono('triangle', mf(n), mf(n), 0.09, intenso ? 0.18 : 0.12, w, Snd.mus); }
    if (intenso) {
      if (i % 8 === 0) Snd.tono('sine', 140, 40, 0.14, 0.7, w, Snd.mus);
      if (i === 4 || i === 12) Snd.ruido(0.1, 0.35, 3000, 1500, w, 'highpass', Snd.mus);
      if (i % 2 === 1) Snd.ruido(0.02, 0.12, 9000, 8000, w, 'highpass', Snd.mus);
    }
  }
};

// ---------- Mapa ----------
let obstaculos = [], estaciones = [], portones = [], keepClear = [];
function addOb(x, y, w, h, tipo) { const o = { x, y, w, h, tipo, abierto: false }; obstaculos.push(o); return o; }
const bloqueaBala = o => !o.abierto && o.tipo !== 'agua';

function libre(x, y, w, h, pad) {
  for (const o of obstaculos) if (x < o.x + o.w + pad && x + w + pad > o.x && y < o.y + o.h + pad && y + h + pad > o.y) return false;
  for (const k of keepClear) if (dist(x + w / 2, y + h / 2, k.x, k.y) < k.r) return false;
  return true;
}

function construirMapa() {
  obstaculos = []; estaciones = []; keepClear = [];
  const R = mulberry32(1234);
  // Portones entre zonas (se abren al despejar la zona)
  portones = [addOb(896, 0, 8, WH, 'porton'), addOb(1796, 0, 8, WH, 'porton'), addOb(2696, 0, 8, WH, 'porton')];
  // Agua (bloquea caminar pero no balas)
  addOb(1800, 740, 900, 160, 'agua');
  addOb(2700, 760, 800, 140, 'agua');
  addOb(3500, 0, 100, WH, 'agua');
  // Cajas de munición (estaciones)
  const est = (x, y) => { estaciones.push({ x, y, cd: 0 }); addOb(x - 9, y - 6, 18, 12, 'municion'); keepClear.push({ x, y, r: 34 }); };
  est(300, 360); est(1350, caminoY(1350) - 44); est(2250, 300); est(2960, 470);
  ZONAS.forEach(z => keepClear.push({ x: z.entrada[0], y: z.entrada[1], r: 46 }));
  keepClear.push({ x: PAD.x, y: PAD.y, r: 56 });

  // ZONA 1: cabaña
  addOb(100, 330, 240, 8, 'pared');            // arriba
  addOb(100, 512, 100, 8, 'pared'); addOb(240, 512, 100, 8, 'pared');  // abajo (puerta)
  addOb(100, 330, 8, 190, 'pared');            // izquierda
  addOb(332, 330, 8, 70, 'pared'); addOb(332, 440, 8, 80, 'pared');    // derecha (puerta)
  addOb(150, 352, 30, 14, 'caja');             // mesa
  [[420, 260], [444, 260], [420, 284], [420, 600], [560, 420], [600, 180], [700, 640], [760, 300], [520, 720], [640, 60]]
    .forEach(([x, y]) => addOb(x, y, 22, 22, 'caja'));
  addOb(640, 480, 50, 12, 'bolsas'); addOb(780, 520, 12, 50, 'bolsas'); addOb(470, 360, 12, 44, 'bolsas');
  for (let x = 340; x < 900; x += 30) keepClear.push({ x, y: 430, r: 28 });
  keepClear.push({ x: 220, y: 560, r: 40 });
  for (let i = 0; i < 60; i++) {
    const x = 20 + R() * 860, y = 20 + R() * 860;
    if (x > 60 && x < 390 && y > 290 && y < 570) continue;
    if (libre(x, y, 18, 18, 22)) addOb(x, y, 18, 18, 'arbol');
  }
  // ZONA 2: bosquecito
  for (let x = 900; x <= 1800; x += 24) keepClear.push({ x, y: caminoY(x), r: 34 });
  for (let i = 0; i < 6; i++) { const x = 940 + R() * 820, y = 40 + R() * 820; if (libre(x, y, 40, 10, 16)) addOb(x, y, 40, 10, 'tronco'); }
  for (let i = 0; i < 400; i++) { const x = 910 + R() * 870, y = 10 + R() * 870; if (libre(x, y, 18, 18, 16)) addOb(x, y, 18, 18, 'arbol'); }
  // ZONA 3: costa rocosa (pocas coberturas)
  addOb(2400, 660, 60, 24, 'bote');
  for (let i = 0; i < 40; i++) {
    const s = 20 + R() * 16, x = 1830 + R() * 840, y = 40 + R() * 640;
    if (libre(x, y, s, s, 60)) addOb(x, y, s, s, 'roca');
  }
  // ZONA 4: el faro
  addOb(FARO.x - 32, FARO.y - 32, 64, 64, 'faro');
  [[3000, 180, 12, 60], [3000, 380, 12, 60], [3060, 420, 60, 12], [3240, 420, 60, 12], [2850, 300, 40, 12],
   [2850, 540, 40, 12], [3300, 170, 12, 50], [3180, 520, 40, 12], [3420, 360, 12, 50]].forEach(([x, y, w, h]) => addOb(x, y, w, h, 'bolsas'));
  for (let i = 0; i < 20; i++) { const x = 2720 + R() * 260, y = 20 + R() * 700; if (libre(x, y, 18, 18, 24)) addOb(x, y, 18, 18, 'arbol'); }
  for (let i = 0; i < 6; i++) { const x = 3200 + R() * 260, y = 40 + R() * 160; if (libre(x, y, 26, 26, 30)) addOb(x, y, 26, 26, 'roca'); }
}

function pintarMundo() {
  const R = mulberry32(99);
  const g = wg;
  // Suelo por zona
  g.fillStyle = '#2f4a2a'; g.fillRect(0, 0, 900, WH);
  g.fillStyle = '#21381e'; g.fillRect(900, 0, 900, WH);
  g.fillStyle = '#3a4a2c'; g.fillRect(1800, 0, 900, 560);
  g.fillStyle = '#8c7a52'; g.fillRect(1800, 560, 900, 180);
  g.fillStyle = '#6d5f42'; g.fillRect(1800, 715, 900, 25);
  g.fillStyle = '#34452c'; g.fillRect(2700, 0, 800, 700);
  g.fillStyle = '#8c7a52'; g.fillRect(2700, 700, 800, 60); g.fillRect(3470, 0, 30, 760);
  g.fillStyle = '#183652'; g.fillRect(1800, 740, 900, 160); g.fillRect(2700, 760, 900, 140); g.fillRect(3500, 0, 100, WH);
  // transiciones suaves (dither)
  for (let i = 0; i < 4000; i++) {
    const y = R() * WH, x = [900, 1800, 2700][i % 3] + (R() - 0.5) * 30;
    g.fillStyle = R() < 0.5 ? '#2a4326' : '#26401f'; g.fillRect(x | 0, y | 0, 2, 2);
  }
  // Caminos de tierra
  g.fillStyle = '#5a4630'; g.fillRect(340, 410, 560, 40); g.fillRect(200, 520, 40, 50);
  for (let x = 900; x < 1800; x += 2) { const y = caminoY(x); g.fillStyle = '#4d3c29'; g.fillRect(x, y - 24, 3, 48); g.fillStyle = '#5a4630'; g.fillRect(x, y - 20, 3, 40); }
  g.fillStyle = '#5a4630'; g.fillRect(1800, 430, 400, 40);
  // Plaza de piedra del faro
  g.fillStyle = '#45464c'; g.beginPath(); g.arc(FARO.x, FARO.y, 110, 0, 7); g.fill();
  g.strokeStyle = '#3a3b40'; g.lineWidth = 1;
  for (let k = -110; k <= 110; k += 12) { g.beginPath(); g.moveTo(FARO.x + k, FARO.y - 110); g.lineTo(FARO.x + k, FARO.y + 110); g.stroke(); g.beginPath(); g.moveTo(FARO.x - 110, FARO.y + k); g.lineTo(FARO.x + 110, FARO.y + k); g.stroke(); }
  g.fillStyle = '#34452c'; // recorta la grilla fuera del círculo
  g.save(); g.beginPath(); g.rect(FARO.x - 120, FARO.y - 120, 240, 240); g.arc(FARO.x, FARO.y, 110, 0, 7, true); g.clip(); g.fillRect(FARO.x - 120, FARO.y - 120, 240, 240); g.restore();
  // Ruido de píxeles (textura 8-bits)
  for (let i = 0; i < 90000; i++) {
    const x = (R() * WW) | 0, y = (R() * WH) | 0, r = R();
    g.fillStyle = r < 0.5 ? 'rgba(0,0,0,0.13)' : r < 0.85 ? 'rgba(255,255,255,0.05)' : 'rgba(120,170,90,0.12)';
    g.fillRect(x, y, r < 0.3 ? 2 : 1, 1);
  }
  // Pastito
  for (let i = 0; i < 5000; i++) {
    const x = (R() * 3460) | 0, y = (R() * 700) | 0;
    if (x > 1800 && x < 2700 && y > 555) continue;
    g.fillStyle = R() < 0.5 ? '#3f6236' : '#2c4a28'; g.fillRect(x, y, 1, 2); g.fillRect(x + 2, y + 1, 1, 2);
  }
  // Arbustos del bosque
  for (let i = 0; i < 160; i++) { const x = 900 + R() * 900, y = R() * WH; g.fillStyle = '#1a2f18'; g.beginPath(); g.arc(x, y, 3 + R() * 4, 0, 7); g.fill(); }
  // Olas
  for (let i = 0; i < 1400; i++) {
    const x = (1800 + R() * 1800) | 0, y = (740 + R() * 160) | 0;
    if (x < 2700 && y < 742) continue; if (x >= 2700 && x < 3500 && y < 762) continue;
    g.fillStyle = R() < 0.5 ? '#21476a' : '#122a42'; g.fillRect(x, y, 4 + (R() * 6 | 0), 1);
  }
  for (let i = 0; i < 1200; i++) { const x = (3500 + R() * 100) | 0, y = (R() * WH) | 0; g.fillStyle = R() < 0.5 ? '#21476a' : '#122a42'; g.fillRect(x, y, 4, 1); }
  // Piso de la cabaña
  g.fillStyle = '#5a412b'; g.fillRect(100, 330, 240, 190);
  g.fillStyle = '#4a3523'; for (let y = 334; y < 520; y += 6) g.fillRect(100, y, 240, 1);
  for (let y = 334, k = 0; y < 520; y += 6, k++) for (let x = 100 + (k % 2) * 20; x < 340; x += 40) g.fillRect(x, y, 1, 6);
  // Helipuerto
  g.fillStyle = '#2e2e33'; g.beginPath(); g.arc(PAD.x, PAD.y, 36, 0, 7); g.fill();
  g.strokeStyle = '#d8d8d8'; g.lineWidth = 2; g.beginPath(); g.arc(PAD.x, PAD.y, 30, 0, 7); g.stroke();
  g.fillStyle = '#e8d84a'; g.fillRect(PAD.x - 9, PAD.y - 12, 4, 24); g.fillRect(PAD.x + 5, PAD.y - 12, 4, 24); g.fillRect(PAD.x - 9, PAD.y - 2, 18, 4);
  // Obstáculos
  for (const o of obstaculos) dibujarObstaculo(g, o, R);
}

function dibujarObstaculo(g, o, R) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  switch (o.tipo) {
    case 'pared':
      g.fillStyle = '#2d241c'; g.fillRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2);
      g.fillStyle = '#6b5640'; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = '#8a7052'; if (o.w > o.h) g.fillRect(o.x, o.y, o.w, 2); else g.fillRect(o.x, o.y, 2, o.h);
      break;
    case 'caja':
      g.fillStyle = '#3a2812'; g.fillRect(o.x, o.y + 2, o.w + 1, o.h);
      g.fillStyle = '#7a5a2e'; g.fillRect(o.x, o.y, o.w, o.h);
      g.strokeStyle = '#4a3519'; g.lineWidth = 2; g.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
      g.beginPath(); g.moveTo(o.x + 2, o.y + 2); g.lineTo(o.x + o.w - 2, o.y + o.h - 2); g.stroke();
      break;
    case 'municion':
      g.fillStyle = '#1f2e15'; g.fillRect(o.x, o.y + 2, o.w + 1, o.h);
      g.fillStyle = '#3d5a2a'; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = '#e0c23a'; for (let k = 3; k < o.w - 2; k += 4) g.fillRect(o.x + k, o.y + 3, 2, o.h - 6);
      break;
    case 'arbol': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx + 3, cy + 4, 13, 0, 7); g.fill();
      g.fillStyle = '#142a14'; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.fill();
      g.fillStyle = '#1f4522'; g.beginPath(); g.arc(cx - 1, cy - 1, 10, 0, 7); g.fill();
      g.fillStyle = '#2b5c2e'; g.beginPath(); g.arc(cx - 3, cy - 3, 6, 0, 7); g.fill();
      g.fillStyle = '#3a7a3c'; for (let k = 0; k < 6; k++) g.fillRect((cx - 8 + R() * 10) | 0, (cy - 8 + R() * 10) | 0, 2, 2);
      break;
    }
    case 'roca':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(o.x + 3, o.y + 4, o.w, o.h);
      g.fillStyle = '#3b3d42'; g.fillRect(o.x, o.y + 2, o.w, o.h - 2); g.fillRect(o.x + 2, o.y, o.w - 4, o.h);
      g.fillStyle = '#5c5f66'; g.fillRect(o.x + 2, o.y + 1, o.w - 5, o.h - 5);
      g.fillStyle = '#7d8189'; g.fillRect(o.x + 3, o.y + 2, o.w / 2, 3);
      break;
    case 'bolsas':
      g.fillStyle = '#4d4430'; g.fillRect(o.x, o.y + 1, o.w, o.h);
      g.fillStyle = '#8b7d55'; g.fillRect(o.x, o.y, o.w, o.h - 1);
      g.fillStyle = '#5e5338';
      if (o.w > o.h) for (let k = 8; k < o.w; k += 9) g.fillRect(o.x + k, o.y, 1, o.h);
      else for (let k = 8; k < o.h; k += 9) g.fillRect(o.x, o.y + k, o.w, 1);
      break;
    case 'tronco':
      g.fillStyle = '#3a2614'; g.fillRect(o.x, o.y + 2, o.w, o.h);
      g.fillStyle = '#5a3b22'; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = '#7a5634'; g.fillRect(o.x, o.y, 4, o.h); g.fillStyle = '#4a3019'; g.fillRect(o.x + 1, o.y + 3, 2, 3);
      break;
    case 'bote':
      g.fillStyle = '#3a2614'; g.beginPath(); g.ellipse(cx, cy, o.w / 2, o.h / 2, 0, 0, 7); g.fill();
      g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(cx, cy, o.w / 2 - 3, o.h / 2 - 3, 0, 0, 7); g.fill();
      g.fillStyle = '#4a3019'; g.fillRect(cx - 12, o.y + 3, 2, o.h - 6); g.fillRect(cx + 8, o.y + 3, 2, o.h - 6);
      break;
    case 'faro':
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(cx + 5, cy + 6, 34, 0, 7); g.fill();
      g.fillStyle = '#d8d8d8'; g.beginPath(); g.arc(cx, cy, 33, 0, 7); g.fill();
      g.fillStyle = '#b02828'; g.beginPath(); g.arc(cx, cy, 27, 0, 7); g.fill();
      g.fillStyle = '#e8e8e8'; g.beginPath(); g.arc(cx, cy, 21, 0, 7); g.fill();
      g.fillStyle = '#333'; g.beginPath(); g.arc(cx, cy, 15, 0, 7); g.fill();
      g.fillStyle = '#a07a20'; g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.fill();
      break;
  }
}

// ---------- Estado ----------
let G, P, cam = { x: 0, y: 0 }, NOW = 0;
let enemigos = [], balas = [], granadas = [], explosiones = [], particulas = [], items = [], fogonazos = [], pops = [],
    drones = [], torretas = [], ataques = [], pendientes = [], jets = [], indicadores = [];
let heli = null, S = { dron: false, aereo: false, torreta: false };
let record = 0;
try { record = +localStorage.getItem('faro_record') || 0; } catch (e) {}

// ---------- Perfil del jugador (ver progreso/perfil.js) ----------
let recordSup = 0; try { recordSup = +localStorage.getItem('faro_record_sup') || 0; } catch (e) {}
const nivelActual = nivelPerfil;
function maxVida(j) {
  j = j || P; const pk = perksDe(j && j.op);
  return 100 + 2 * Math.floor(((j && j.nivel) || nivelActual()) / 5) + pk.hpAdd + (G && G.mej && G.mej.chaleco && (!RED.activo || j === YO) ? 25 : 0);
}
const mulDanio = arma => (arma === 1 ? 1 + 0.2 * (G.mej ? G.mej.fusil : 0) : 1);          // mejoras de la tienda del escuadrón (sólo vos)
const extraPerdigones = arma => (arma === 2 ? 2 * (G.mej ? G.mej.escopeta : 0) : 0);
// Color del soldado: el camuflaje elegido, o los colores del operador si usa el de serie
function colorJ(j) { const c = CAMO_POR_ID(j && j.camoId); return c.id !== 'bosque' ? c : OPERADOR_POR_ID(j && j.op).paleta; }
function ganarXp(x) {
  const antes = nivelActual(), real = ganarXpPerfil(x), ahora = nivelActual();
  if (ahora > antes) {
    banner(`¡NIVEL ${ahora}!`, 'Tenés recompensas nuevas en el PASE DE BATALLA', 3.5); Snd.play('victoria');
    if (P && !P.muerto) { P.nivel = ahora; const mv = maxVida(P); P.hp += mv - P.maxhp; P.maxhp = mv; }
  }
  return real;
}
// Al terminar la partida se pagan créditos según la experiencia ganada
function cerrarPartida() {
  if (G.cerrada || G.modo === 'tiro') return; G.cerrada = true;
  G.creditosGanados = Math.floor((G.xpPartida || 0) / 4); darCreditos(G.creditosGanados);
}

// ---------- Tienda entre zonas ----------
const TIENDA = [
  { id: 'muni', n: 'MUNICIÓN LLENA', d: 'Fusil 180 · Escopeta 30', p: 300, f: () => { P.mun[1].res = Math.max(P.mun[1].res, 180); P.mun[2].res = Math.max(P.mun[2].res, 30); } },
  { id: 'gran', n: '+2 GRANADAS', d: 'Máximo 6', p: 400, f: () => { P.gran = Math.min(6, P.gran + 2); } },
  { id: 'vida', n: 'BOTIQUÍN', d: 'Vida al máximo', p: 250, f: () => { P.hp = P.maxhp; } },
  { id: 'chaleco', n: 'CHALECO', d: '+25 vida máxima', p: 1200, max: 1, f: () => { G.mej.chaleco = 1; P.maxhp = maxVida(); P.hp = P.maxhp; } },
  { id: 'fusil', n: 'FUSIL MEJORADO', d: '+20% de daño', p: 1500, max: 2, f: () => { G.mej.fusil++; } },
  { id: 'escopeta', n: 'ESCOPETA MEJORADA', d: '+2 perdigones', p: 1500, max: 2, f: () => { G.mej.escopeta++; } },
];
const creditos = () => G.pts - G.gastado;
function abrirTienda() { G.estado = 'tienda'; mouse.abajo = false; Snd.play('item'); }
function comprar(it) {
  const veces = G.compras[it.id] || 0;
  if (creditos() < it.p || (it.max && veces >= it.max)) { Snd.play('vacio'); return; }
  G.gastado += it.p; G.compras[it.id] = veces + 1; it.f(); Snd.play('item');
}
function nuevoEstado() {
  return { feed: [], alerta: null, estado: 'titulo', modo: 'campania', gastado: 0, compras: {}, mej: { chaleco: 0, fusil: 0, escopeta: 0 }, xpPartida: 0, zona: 0, fase: 'banner', faseT: 0, ola: 0, cola: [], spawnT: 0, pts: 0, bajas: 0, disparos: 0, aciertos: 0,
    racha: 0, tiempo: 0, banner: null, radio: null, toasts: [], shake: 0, rojo: 0, hitmark: 0, hitBaja: false, retroceso: 0,
    jefe: null, muerteT: 0, botones: [], cp: null, ganoT: 0 };
}
G = nuevoEstado();
function nuevoJugador(x, y, equip) {
  const j = { x, y, r: 6, ang: 0, arma: 1, cd: 0, recarga: 0, ultGolpe: 99, oculto: false, paso: 0, corriendo: false, mun: [], gran: 3 };
  equiparJugador(j, equip || equipoLocal());
  return j;
}
// Calcula las armas (con accesorios) y los poderes del operador de un jugador
function equiparJugador(j, e) {
  j.op = e.op || 'faro'; j.nivel = e.nivel || 1; j.camoId = e.camo || 'bosque';
  j.W = [0, 1, 2].map(i => statsArma(i, (e.ar && e.ar[i]) || {}, j.op));
  const pk = perksDe(j.op);
  j.velMul = pk.velMul; j.regenMul = pk.regenMul;
  j.mun = [{ c: j.W[0].cargador, res: Infinity }, { c: j.W[1].cargador, res: 90 }, { c: j.W[2].cargador, res: 12 }];
  j.gran = 3 + pk.granAdd;
  j.maxhp = maxVida(j); j.hp = j.maxhp;
}
function iniciarJuego(opc = {}) {
  Snd.init(); if (!opc.tiro) sumarStat('partidas');
  construirMapa(); pintarMundo(); construirGrilla(); campoT = 0;
  G = nuevoEstado();
  G.cp = { zona: 0, pts: 0, bajas: 0, disparos: 0, aciertos: 0, mun: null, gran: null, racha: 0, S: { dron: false, aereo: false, torreta: false }, gastado: 0, compras: {}, mej: { chaleco: 0, fusil: 0, escopeta: 0 } };
  cargarCheckpoint();
}
// Campo de tiro: blancos que reaparecen, munición infinita, ideal para probar accesorios
let BLANCOS = [];
function iniciarTiro() {
  iniciarJuego({ tiro: true });
  G.modo = 'tiro'; G.cp.zona = 2; cargarCheckpoint();
  portones.forEach(p => { p.abierto = true; });
  P.x = 1840; P.y = 450; G.fase = 'tiro'; G.tiroT = 0; G.danioTiro = 0;
  // Los blancos van en lugares despejados y a la vista, de cerca a lejos
  BLANCOS = [];
  for (const dx of [130, 190, 250, 310, 370, 430]) for (const dy of [0, -60, 60, -30, 30, -90, 90]) {
    const x = P.x + dx, y = P.y + dy;
    if (!circuloBloqueado(x, y, 14) && hayVision(P.x, P.y, x, y) && !BLANCOS.some(o => Math.hypot(o[0] - x, o[1] - y) < 40)) { BLANCOS.push([x, y]); break; }
  }
  banner('CAMPO DE TIRO', 'Sin enemigos: probá tus accesorios en los blancos', 3);
  radio('Disparale a los blancos. Cambiá de arma con 1, 2 y 3.', 'INSTRUCTOR');
}
// Modo supervivencia: oleadas infinitas en el faro
function iniciarSupervivencia() {
  iniciarJuego();
  G.modo = 'supervivencia';
  G.cp.zona = 3;
  cargarCheckpoint();
  P.mun[1].res = 150; P.mun[2].res = 24; P.gran += 1;
  P.x = 3060; P.y = 450;
  banner('MODO SUPERVIVENCIA', '¿Cuántas oleadas aguantás?', 3);
  radio('No viene ningún helicóptero. Aguantá todo lo que puedas.');
}
function guardarCheckpoint() {
  G.cp = { zona: G.zona, pts: G.pts, bajas: G.bajas, disparos: G.disparos, aciertos: G.aciertos, mun: P.mun.map(m => ({ ...m })),
    gran: Math.max(P.gran, 2), racha: G.racha, S: { ...S }, gastado: G.gastado, compras: { ...G.compras }, mej: { ...G.mej } };
  guardarPartida();
}
function cargarCheckpoint() {
  const cp = G.cp;
  enemigos = []; balas = []; granadas = []; explosiones = []; particulas = []; items = []; fogonazos = []; pops = [];
  drones = []; torretas = []; ataques = []; pendientes = []; jets = []; indicadores = []; heli = null;
  portones.forEach((p, i) => p.abierto = i < cp.zona);
  estaciones.forEach(e => e.cd = 0);
  const z = ZONAS[cp.zona];
  G.gastado = cp.gastado || 0; G.compras = { ...(cp.compras || {}) }; G.mej = { chaleco: 0, fusil: 0, escopeta: 0, ...(cp.mej || {}) };
  if (esSup()) portones.forEach(p => p.abierto = true);
  P = nuevoJugador(z.entrada[0], z.entrada[1]);
  if (cp.mun) { P.mun = cp.mun.map(m => ({ ...m })); P.mun.forEach((m, i) => { m.c = Math.min(m.c, P.W[i].cargador); }); }
  if (cp.gran != null) P.gran = cp.gran;
  Object.assign(G, { estado: 'jugando', zona: cp.zona, pts: cp.pts, bajas: cp.bajas, disparos: cp.disparos, aciertos: cp.aciertos,
    racha: cp.racha, jefe: null, muerteT: 0, rojo: 0, toasts: [], ganoT: 0 });
  S = { ...cp.S };
  cam.x = clamp(P.x - VW / 2, 0, WW - VW); cam.y = clamp(P.y - VH / 2, 0, WH - VH);
  entrarZona(cp.zona);
}

function entrarZona(i) {
  G.zona = i; G.fase = 'banner'; G.faseT = 3.2; G.ola = 0;
  banner(`ZONA ${i + 1}: ${ZONAS[i].nombre}`, i === 0 ? 'Limpiá las 4 zonas y llegá al faro' : 'Prepará el arma...');
  radio(ZONAS[i].radio);
}
function olaGlobal() { if (esSup()) return G.ola + 2; let n = 0; for (let i = 0; i < G.zona; i++) n += ZONAS[i].oleadas.length; return n + G.ola; }
function iniciarOla(i) {
  G.ola = i; G.fase = 'ola';
  const sup = esSup();
  const n = sup ? 5 + i * 2 : ZONAS[G.zona].oleadas[i], gw = olaGlobal();
  G.cola = [];
  for (let k = 0; k < n; k++) {
    const r = Math.random(); let t = 'soldado';
    if (gw >= 2 && r < 0.24) t = 'corredor';
    else if (gw >= 4 && r < 0.24 + Math.min(0.22, 0.08 + gw * 0.02)) t = 'pesado';
    else if (gw >= 3 && r > 0.94) t = 'perro';
    else if (gw >= 3 && r > 0.76) t = 'francotirador';
    G.cola.push(t);
  }
  if (sup && (i + 1) % 5 === 0) G.cola.push('jefe');
  G.spawnT = 0.5;
  banner(`OLEADA ${sup ? i + 1 : gw + 1}`, `${G.cola.length} enemigos`, 2);
  alerta('PATRULLA ENEMIGA APROXIMÁNDOSE', 3);
  Snd.play('alarma');
}

// ---------- Mensajes ----------
function banner(t, sub, dur = 3) { G.banner = { t, sub, k: 0, dur }; }
function radio(txt, quien = 'CAP. RAMÍREZ') { G.radio = { quien, txt, k: 0, dur: 3 + txt.length * 0.05 }; }
function toast(txt, color = '#ffffff') {
  if (MP() && P && P !== YO) { if (P.conn) enviar(P.conn, { t: 'toast', txt, color }); return; }   // el mensaje es para otro jugador
  G.toasts.push({ txt, color, k: 0 }); if (G.toasts.length > 3) G.toasts.shift(); }
function pop(x, y, txt, color = '#ffe060') { pops.push({ x, y, txt, color, k: 0 }); }

// ---------- Colisiones ----------
function resolver(e) {
  for (const o of obstaculos) {
    if (o.abierto) continue;
    if (e.x + e.r < o.x || e.x - e.r > o.x + o.w || e.y + e.r < o.y || e.y - e.r > o.y + o.h) continue;
    const cx = clamp(e.x, o.x, o.x + o.w), cy = clamp(e.y, o.y, o.y + o.h);
    const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= e.r * e.r) continue;
    if (d2 > 0.0001) { const d = Math.sqrt(d2); e.x = cx + dx / d * e.r; e.y = cy + dy / d * e.r; }
    else {
      const l = e.x - o.x, r = o.x + o.w - e.x, t = e.y - o.y, b = o.y + o.h - e.y, m = Math.min(l, r, t, b);
      if (m === l) e.x = o.x - e.r; else if (m === r) e.x = o.x + o.w + e.r; else if (m === t) e.y = o.y - e.r; else e.y = o.y + o.h + e.r;
    }
  }
  e.x = clamp(e.x, e.r, WW - e.r); e.y = clamp(e.y, e.r, WH - e.r);
}
function circuloBloqueado(x, y, r) {
  for (const o of obstaculos) {
    if (o.abierto) continue;
    const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h);
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}
function puntoBloqueado(x, y) {
  for (const o of obstaculos) if (bloqueaBala(o) && x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
  return null;
}
function segRect(x1, y1, x2, y2, o) {
  if (Math.max(x1, x2) < o.x || Math.min(x1, x2) > o.x + o.w || Math.max(y1, y2) < o.y || Math.min(y1, y2) > o.y + o.h) return false;
  let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
  const ps = [-dx, dx, -dy, dy], qs = [x1 - o.x, o.x + o.w - x1, y1 - o.y, o.y + o.h - y1];
  for (let i = 0; i < 4; i++) {
    const p = ps[i], q = qs[i];
    if (p === 0) { if (q < 0) return false; }
    else { const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
  }
  return true;
}
function hayVision(x1, y1, x2, y2) { for (const o of obstaculos) if (bloqueaBala(o) && segRect(x1, y1, x2, y2, o)) return false; return true; }

// ---------- Jugador: armas ----------
function disparar() {
  const w = P.W[P.arma], m = P.mun[P.arma];
  if (P.recarga > 0 || P.cd > 0) return;
  if (m.c <= 0) {
    if (m.res > 0) recargar();
    else { Snd.play('vacio'); P.cd = 0.3; toast('¡SIN MUNICIÓN! Cambiá de arma (1/2/3)', '#ff8080'); }
    return;
  }
  m.c--; P.cd = w.cadencia; G.disparos += w.perdigones;
  const mx = P.x + Math.cos(P.ang) * 9, my = P.y + Math.sin(P.ang) * 9;
  const extra = (P.corriendo ? 1.6 : 1) * (1 + G.retroceso * 0.15);
  for (let i = 0, np = w.perdigones + extraPerdigones(P.arma); i < np; i++) {
    const a = P.ang + rand(-w.disp, w.disp) * extra, v = w.vel * rand(0.92, 1.05);
    balas.push({ x: mx, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: w.vida, dmg: w.dmg * mulDanio(P.arma), duenio: 'j', src: 'arma', eq: P.equipo, id: P.id, ar: P.arma });
  }
  fogonazos.push({ x: mx, y: my, k: 0.06, r: w.sil ? 22 : 46 });
  const pa = P.ang + Math.PI / 2;
  particulas.push({ x: P.x, y: P.y, vx: Math.cos(pa) * rand(30, 50), vy: Math.sin(pa) * rand(30, 50), vida: 1.5, max: 1.5, c: '#d8b040', s: 1, roce: 6, piso: true });
  if (!MP() || P === YO) { G.shake = Math.max(G.shake, w.retro * 0.8); G.retroceso = Math.min(4, G.retroceso + w.retro * 0.5); }
  Snd.play(w.sfx, w.sil ? 0.4 : 1);
}
function recargar() {
  const w = P.W[P.arma], m = P.mun[P.arma];
  if (P.recarga > 0 || m.c >= w.cargador || m.res <= 0) return;
  P.recarga = w.recarga; Snd.play('recarga');
}
function finRecarga() {
  const w = P.W[P.arma], m = P.mun[P.arma];
  const tomo = Math.min(w.cargador - m.c, m.res); m.c += tomo; m.res -= tomo;
}
function cambiarArma(i) {
  if (i === P.arma) return; P.arma = (i + 3) % 3; P.recarga = 0; P.cd = Math.max(P.cd, 0.2); Snd.play('cambio');
}
function apuntado(distMax) {
  if (P.ax != null && !P.apTouch) {   // jugadores remotos y bots mandan su punto de mira
    const d = dist(P.x, P.y, P.ax, P.ay);
    if (d <= distMax) return { x: P.ax, y: P.ay };
    return { x: P.x + (P.ax - P.x) / d * distMax, y: P.y + (P.ay - P.y) / d * distMax };
  }
  if (P.apTouch || (P === YO || !MP()) && touch.activo) return { x: P.x + Math.cos(P.ang) * distMax * 0.7, y: P.y + Math.sin(P.ang) * distMax * 0.7 };
  const ax = cam.x + mouse.x, ay = cam.y + mouse.y, d = dist(P.x, P.y, ax, ay);
  if (d <= distMax) return { x: ax, y: ay };
  return { x: P.x + (ax - P.x) / d * distMax, y: P.y + (ay - P.y) / d * distMax };
}
function tirarGranada() {
  if (G.estado !== 'jugando' || P.oculto) return;
  if (P.gran <= 0) { toast('Sin granadas', '#ff8080'); Snd.play('vacio'); return; }
  P.gran--; const t = apuntado(200);
  granadas.push({ sx: P.x, sy: P.y, x: P.x, y: P.y, tx: t.x, ty: t.y, k: 0, vuelo: 0.6, z: 0, mecha: 1.5, enemiga: false, dueno: P, eq: P.equipo });
  Snd.play('tirar');
}
function usarCaja() {
  for (const e of estaciones) {
    if (dist(P.x, P.y, e.x, e.y) < 30) {
      if (e.cd > 0) { toast(`Caja vacía... vuelve a llenarse en ${Math.ceil(e.cd)}s`, '#c0c0c0'); return; }
      P.mun[1].res = Math.max(P.mun[1].res, 150); P.mun[2].res = Math.max(P.mun[2].res, 24); P.gran = Math.max(P.gran, 3);
      e.cd = 30; Snd.play('item'); toast('¡MUNICIÓN REABASTECIDA!', '#a0ff80'); return;
    }
  }
}
function usarRacha(cual) {
  if (G.estado !== 'jugando' || P.oculto) return;
  if (cual === 'dron' && S.dron) { S.dron = false; drones.push({ x: P.x, y: P.y, k: 25, a: 0, cd: 0, obj: null, bt: 0, dueno: P, eq: P.equipo }); toast('¡DRON EN EL AIRE!', '#ffe060'); Snd.play('racha'); }
  else if (cual === 'aereo' && S.aereo) {
    S.aereo = false; const t = apuntado(260);
    ataques.push({ x: t.x, y: t.y, ang: P.ang, k: 1.6, dueno: P, eq: P.equipo }); radio('¡Ataque aéreo en camino! ¡Agachate!', 'PILOTO');
    Snd.play('racha');
  } else if (cual === 'torreta' && S.torreta) { S.torreta = false; torretas.push({ x: P.x, y: P.y, k: 30, ang: P.ang, cd: 0, obj: null, bt: 0, dueno: P, eq: P.equipo }); toast('¡TORRETA COLOCADA!', '#80ff80'); Snd.play('racha'); }
}
function sumarRacha() {
  G.racha++;
  if (G.racha === 3 && !S.dron) { S.dron = true; toast('RACHA x3: DRON LISTO [Z]', '#ffe060'); Snd.play('racha'); }
  if (G.racha === 6 && !S.aereo) { S.aereo = true; toast('RACHA x6: ATAQUE AÉREO LISTO [X]', '#ff8080'); Snd.play('racha'); }
  if (G.racha >= 10) { if (!S.torreta) { S.torreta = true; toast('RACHA x10: TORRETA DISPONIBLE [C]', '#80ff80'); Snd.play('racha'); } G.racha = 0; }
}

// ---------- Daño ----------
function herirJugador(dmg, sx, sy, quien) {
  if (P.oculto || P.muerto || P.inv > 0 || G.estado !== 'jugando') return;
  P.hp -= dmg * (G.modo === 'equipos' ? 1 : dif().dmg); P.ultGolpe = 0;
  if (!MP() || P === YO) {
    indicadores.push({ a: Math.atan2(sy - P.y, sx - P.x), k: 1 });
    G.rojo = Math.min(0.5, G.rojo + 0.25); G.shake = Math.max(G.shake, 3); Snd.play('herido');
  }
  if (P.hp <= 0) { P.hp = 0; if (MP()) caer(P, quien); else morir(); }
}
function golpearEnemigo(e, dmg, b, src) {
  if (e.muerto) return;
  ARMA_KILL = b && b.ar != null ? b.ar : null;
  if (src === 'arma' && G.modo === 'tiro') G.danioTiro = (G.danioTiro || 0) + Math.min(dmg, Math.max(0, e.hp));
  e.hp -= dmg; e.flash = 0.08;
  if (b) { const v = Math.hypot(b.vx, b.vy) || 1; e.x += b.vx / v * 1.5; e.y += b.vy / v * 1.5; }
  for (let i = 0; i < 3; i++) particulas.push({ x: e.x, y: e.y, vx: rand(-40, 40), vy: rand(-40, 40), vida: 0.4, max: 0.4, c: '#a01818', s: 1, roce: 4 });
  if (src === 'arma') { if (!MP() || TIRADOR === YO.id) { G.aciertos++; G.hitmark = 0.15; G.hitBaja = false; Snd.play('hit'); } else avisarHit(TIRADOR); }
  if (e.hp <= 0) { matarEnemigo(e, src); return; }
  if (!e.T.melee && !e.T.jefe && e.estado !== 'cubierto' && e.hp < e.maxhp * 0.6 && e.cubCd <= 0 && Math.random() < 0.75) {
    const c = buscarCobertura(e);
    if (c) { e.estado = 'cubierto'; e.cx = c.x; e.cy = c.y; e.estT = rand(1.5, 3); e.cubCd = 6; }
  }
}
const NOMBRE_ENEMIGO = { soldado: 'Hostil', corredor: 'Infiltrado', pesado: 'Pesado', francotirador: 'Francotirador', perro: 'Perro', jefe: 'Comandante', maniqui: 'Blanco' };
function pushFeed(quien, arma, objetivo) { G.feed.unshift({ id: ++idFeed, quien, arma, objetivo, k: 0 }); if (G.feed.length > 5) G.feed.pop(); }
function alerta(txt, dur = 3) { G.alerta = { txt, t: dur }; }
function registrarBaja(e, src) {
  const k = MP() ? jugadores.find(o => o.id === TIRADOR) : null;
  const quien = k ? k.nombre : (MP() ? 'APOYO' : miNombre());
  const arma = src === 'arma' && ARMA_KILL != null ? ARMAS[ARMA_KILL].nombre : src === 'granada' ? 'GRANADA' : src === 'racha' ? 'RACHA' : 'ARMA';
  pushFeed(quien, arma, NOMBRE_ENEMIGO[e.tipo] || 'Hostil');
  if (src === 'arma' && ARMA_KILL != null && (!MP() || (YO && TIRADOR === YO.id))) sumarMaestria(ARMA_KILL);
}
function dibujarBlanco(g, e) {
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(e.x + 1, e.y + 2, 8, 6, 0, 0, 7); g.fill();
  const f = e.flash > 0;
  g.fillStyle = f ? '#fff' : '#d8d8d8'; g.beginPath(); g.arc(e.x, e.y, 7, 0, 7); g.fill();
  g.fillStyle = f ? '#fff' : '#c03030'; g.beginPath(); g.arc(e.x, e.y, 5, 0, 7); g.fill();
  g.fillStyle = f ? '#fff' : '#d8d8d8'; g.beginPath(); g.arc(e.x, e.y, 3, 0, 7); g.fill();
  g.fillStyle = '#c03030'; g.beginPath(); g.arc(e.x, e.y, 1.2, 0, 7); g.fill();
}
function matarEnemigo(e, src) {
  if (e.T.estatico) {   // los blancos no dan puntos ni sueltan nada
    e.muerto = true; Snd.play('baja');
    for (let i = 0; i < 8; i++) particulas.push({ x: e.x, y: e.y, vx: rand(-60, 60), vy: rand(-60, 60), vida: 0.5, max: 0.5, c: i % 2 ? '#c03030' : '#d8d8d8', s: 2, roce: 5 });
    return;
  }
  e.muerto = true; G.bajas++; G.pts += e.T.pts; pop(e.x, e.y - 8, '+' + e.T.pts); registrarBaja(e, src);
  if (MP()) acreditarBaja(TIRADOR, e.T.pts, src === 'arma' || src === 'granada');
  else {
    G.xpPartida += ganarXp(e.T.pts); sumarStat('bajas');
    if (src === 'arma' || src === 'granada') { sumarRacha(); G.hitBaja = true; G.hitmark = 0.25; }
  }
  Snd.play('baja');
  for (let i = 0; i < 10; i++) particulas.push({ x: e.x, y: e.y, vx: rand(-60, 60), vy: rand(-60, 60), vida: 0.6, max: 0.6, c: i % 2 ? '#7a1010' : e.T.cuerpo, s: 2, roce: 5 });
  particulas.push({ x: e.x, y: e.y, vx: 0, vy: 0, vida: 6, max: 6, c: 'rgba(60,8,8,0.6)', s: 5, roce: 0, piso: true, mancha: true });
  const r = Math.random();
  if (e.T.jefe) { items.push({ x: e.x, y: e.y, tipo: 'botiquin', k: 30 }); items.push({ x: e.x + 10, y: e.y, tipo: 'granada', k: 30 }); G.jefe = null; G.pts += 1000;
    banner('¡COMANDANTE ABATIDO!', '+1000 puntos', 2.5); radio('¡Excelente trabajo, soldado! ¡Sin su jefe están perdidos!'); }
  else if (r < 0.33) items.push({ x: e.x, y: e.y, tipo: 'municion', k: 25 });
  else if (r < 0.42) items.push({ x: e.x, y: e.y, tipo: 'botiquin', k: 25 });
  else if (r < 0.48) items.push({ x: e.x, y: e.y, tipo: 'granada', k: 25 });
}
function explotar(x, y, r, dmg, o = {}) {
  explosiones.push({ x, y, r, k: 0 });
  fogonazos.push({ x, y, k: 0.25, r: r * 2.6, max: 0.25 });
  for (let i = 0; i < 28; i++) {
    const a = rand(0, 7), v = rand(20, 130);
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rand(0.3, 0.8), max: 0.8, c: ['#ffd040', '#ff8020', '#ff4010', '#555'][i % 4], s: rand(1, 3) | 0, roce: 3, luz: i % 4 < 2 });
  }
  // mancha quemada permanente en el piso
  wg.fillStyle = 'rgba(10,8,6,0.35)'; wg.beginPath(); wg.arc(x, y, r * 0.55, 0, 7); wg.fill();
  TIRADOR = o.dueno ? o.dueno.id : (o.duenoId ?? null);
  const quienExplota = TIRADOR;
  if (o.enemigos !== false) for (const e of enemigos) {
    const d = dist(x, y, e.x, e.y); if (d < r + e.r) golpearEnemigo(e, dmg * (1 - 0.6 * d / r), null, o.src || 'granada');
  }
  // A quién lastima: la granada enemiga a todos, la propia a quien la tiró, y en EQUIPOS al equipo contrario
  const pb = P;
  for (const j of (MP() ? jugadores : [P])) {
    if (!j || j.muerto || j.oculto) continue;
    const d = dist(x, y, j.x, j.y); if (d >= r) continue;
    let dd = 0;
    if (o.enemiga) dd = o.jugador;
    else if (j === o.dueno || (!o.dueno && !MP())) dd = o.jugador || 0;
    else if (o.eq && G.modo === 'equipos' && j.equipo !== o.eq) dd = dmg * 0.6;
    if (dd > 0) { P = j; herirJugador(dd * (1 - 0.5 * d / r), x, y, quienExplota); }
  }
  P = pb;
  const yo = YO || P;
  G.shake = Math.max(G.shake, 7 * clamp(1 - dist(x, y, yo.x, yo.y) / 500, 0.2, 1)); Snd.play('boom', clamp(1 - dist(x, y, yo.x, yo.y) / 600, 0.25, 1));
}
function morir() {
  G.estado = 'muerto'; G.muerteT = 0; Snd.play('derrota'); cerrarPartida();
  if (esSup() && (G.olasSup || 0) > recordSup) { recordSup = G.olasSup; try { localStorage.setItem('faro_record_sup', recordSup); } catch (e) {} }
  for (let i = 0; i < 16; i++) particulas.push({ x: P.x, y: P.y, vx: rand(-60, 60), vy: rand(-60, 60), vida: 0.8, max: 0.8, c: '#3f7a3a', s: 2, roce: 4 });
}

// ---------- Caminos: los enemigos saben rodear paredes (búsqueda BFS en grilla) ----------
const CEL = 12, GWd = Math.ceil(WW / CEL), GHd = Math.ceil(WH / CEL);
let bloq = new Uint8Array(GWd * GHd), campoBase = new Int32Array(GWd * GHd), cola = new Int32Array(GWd * GHd), campoT = 0;
function construirGrilla() {
  bloq.fill(0);
  for (let j = 0; j < GHd; j++) for (let i = 0; i < GWd; i++) {
    const x = (i + 0.5) * CEL, y = (j + 0.5) * CEL;
    for (const o of obstaculos) {
      const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h);
      if ((x - cx) ** 2 + (y - cy) ** 2 < 36) { bloq[j * GWd + i] = o.tipo === 'porton' ? 10 + portones.indexOf(o) : 1; if (o.tipo !== 'porton') break; }
    }
  }
}
const pasable = k => bloq[k] === 0 || (bloq[k] >= 10 && portones[bloq[k] - 10].abierto);
function calcularCampo(fuentes = [P], campo = campoBase) {
  campo.fill(-1);
  let h = 0, t = 0;
  for (const f of fuentes) {
    const si = clamp(Math.floor(f.x / CEL), 0, GWd - 1), sj = clamp(Math.floor(f.y / CEL), 0, GHd - 1), s = sj * GWd + si;
    if (campo[s] < 0) { campo[s] = 0; cola[t++] = s; }
  }
  while (h < t) {
    const k = cola[h++], i = k % GWd, j = (k / GWd) | 0, v = campo[k] + 1;
    if (i > 0 && campo[k - 1] < 0 && pasable(k - 1)) { campo[k - 1] = v; cola[t++] = k - 1; }
    if (i < GWd - 1 && campo[k + 1] < 0 && pasable(k + 1)) { campo[k + 1] = v; cola[t++] = k + 1; }
    if (j > 0 && campo[k - GWd] < 0 && pasable(k - GWd)) { campo[k - GWd] = v; cola[t++] = k - GWd; }
    if (j < GHd - 1 && campo[k + GWd] < 0 && pasable(k + GWd)) { campo[k + GWd] = v; cola[t++] = k + GWd; }
  }
}
function dirCampo(e, campo = campoBase) {
  const ci = Math.floor(e.x / CEL), cj = Math.floor(e.y / CEL), aqui = campo[cj * GWd + ci];
  let bv = 1e9, bx = 0, by = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue; const i = ci + dx, j = cj + dy;
    if (i < 0 || j < 0 || i >= GWd || j >= GHd) continue;
    const v = campo[j * GWd + i]; if (v < 0) continue;
    if (dx && dy && (campo[cj * GWd + i] < 0 || campo[j * GWd + ci] < 0)) continue;
    const vv = v + (dx && dy ? 0.4 : 0);
    if (vv < bv) { bv = vv; bx = (i + 0.5) * CEL; by = (j + 0.5) * CEL; }
  }
  if (bv === 1e9 || (aqui >= 0 && bv >= aqui)) return null;
  const L = Math.hypot(bx - e.x, by - e.y) || 1; return { x: (bx - e.x) / L, y: (by - e.y) / L };
}

// ---------- Enemigos ----------
function crearEnemigo(tipo, x, y) {
  const T = TIPOS[tipo], gw = olaGlobal();
  const hp = T.hp * dif().hp * (T.jefe ? 1 : 1 + gw * 0.06);
  const e = { tipo, T, x, y, r: T.r, hp, maxhp: hp, ang: Math.atan2(P.y - y, P.x - x), estado: 'pelea', estT: 0, strafe: 0, disCd: rand(0.8, 1.6),
    vis: false, visT: 0, flash: 0, cubCd: 0, meleeCd: 0, atasco: 0, desvT: 0, dvx: 0, dvy: 0, paso: 0, granCd: 4, muerto: false };
  if (T.sniper) e.disCd = rand(2, 3);
  if (T.jefe) G.jefe = e;
  if (T.perro && dist(x, y, P.x, P.y) < 500) Snd.play('ladrido');
  enemigos.push(e); return e;
}
function spawnear(tipo) {
  const Z = ZONAS[G.zona];
  for (let i = 0; i < 80; i++) {
    const x = rand(Z.x0 + 30, Z.x1 - 30), y = rand(30, WH - 30), d = distJugadores(x, y);
    if (d < 260 || (i < 50 && d > 520)) continue;
    if (circuloBloqueado(x, y, 12)) continue;
    return crearEnemigo(tipo, x, y);
  }
  return null;
}
function buscarCobertura(e) {
  let mejor = null, bd = 1e9;
  for (const o of obstaculos) {
    if (o.abierto || o.tipo === 'agua' || o.tipo === 'porton' || o.w > 120 || o.h > 120) continue;
    const ocx = o.x + o.w / 2, ocy = o.y + o.h / 2, de = dist(ocx, ocy, e.x, e.y);
    if (de > 180 || de > bd) continue;
    let ux = ocx - P.x, uy = ocy - P.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const off = Math.max(o.w, o.h) / 2 + e.r + 3, cx = ocx + ux * off, cy = ocy + uy * off;
    if (cx < 10 || cy < 10 || cx > WW - 10 || cy > WH - 10 || circuloBloqueado(cx, cy, e.r)) continue;
    bd = de; mejor = { x: cx, y: cy };
  }
  return mejor;
}
function dispararEnemigo(e) {
  const T = e.T, d = dist(e.x, e.y, P.x, P.y);
  const gx = e.x + Math.cos(e.ang) * (e.r + 3), gy = e.y + Math.sin(e.ang) * (e.r + 3);
  // apunta un poquito adelante de donde vas
  const lead = d / T.vbala * 0.5;
  const ta = Math.atan2(P.y + P.vy * lead - gy, P.x + P.vx * lead - gx);
  for (let i = 0; i < T.perd; i++) {
    const a = ta + rand(-T.disp, T.disp) * dif().punteria;
    balas.push({ x: gx, y: gy, vx: Math.cos(a) * T.vbala, vy: Math.sin(a) * T.vbala, vida: 1.6, dmg: T.dmg, duenio: 'e' });
  }
  fogonazos.push({ x: gx, y: gy, k: 0.06, r: 34 });
  const yo = YO || P;
  Snd.play('eshot', clamp(1 - dist(e.x, e.y, yo.x, yo.y) / 400, 0.2, 1));
}
function actualizarEnemigo(e, dt) {
  const T = e.T; e.flash -= dt; if (T.estatico) return; e.visT -= dt; e.cubCd -= dt;
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (e.visT <= 0) { e.vis = !P.oculto && hayVision(e.x, e.y, P.x, P.y); e.visT = rand(0.12, 0.22); }
  const quiere = Math.atan2(dy, dx);
  let mx = 0, my = 0, vel = T.vel;
  if (P.oculto) { mx = 0; my = 0; }
  else if (T.melee) {
    const c = e.vis ? null : dirCampo(e);
    if (c) { mx = c.x; my = c.y; } else { mx = dx / d; my = dy / d; }
    e.ang = quiere; e.meleeCd -= dt;
    if (d < e.r + P.r + 3 && e.meleeCd <= 0) { herirJugador(T.melee, e.x, e.y); e.meleeCd = T.perro ? 1.1 : 0.8; Snd.play(T.perro ? 'ladrido' : 'cuchillo'); }
  } else {
    e.estT -= dt;
    if (e.estado === 'cubierto') {
      const cd = dist(e.x, e.y, e.cx, e.cy);
      if (cd > 3) { mx = (e.cx - e.x) / cd; my = (e.cy - e.y) / cd; vel *= 1.4; }
      if (e.estT <= 0) e.estado = 'pelea';
    } else {
      if (!e.vis || d > T.rango) {
        const c = e.vis ? null : dirCampo(e);
        if (c) { mx = c.x; my = c.y; } else { mx = dx / d; my = dy / d; }
      }
      else if (d < T.rango * 0.45) { mx = -dx / d * 0.6; my = -dy / d * 0.6; }
      else {
        if (e.estT <= 0) { e.strafe = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); e.estT = rand(0.8, 2); }
        mx = -dy / d * e.strafe * 0.6; my = dx / d * e.strafe * 0.6;
      }
    }
    e.ang += angDif(e.ang, quiere) * Math.min(1, dt * 6);
    if (e.vis && d < T.rango * 1.5) {
      e.disCd -= dt;
      if (T.sniper && e.disCd < 1.3 && !G.alerta) alerta('¡FRANCOTIRADOR TE TIENE EN LA MIRA!', 2.5);
      if (e.disCd <= 0) { dispararEnemigo(e); e.disCd = rand(T.cad[0], T.cad[1]); }
    } else e.disCd = Math.max(e.disCd, 0.5);
    if (T.jefe) {
      e.granCd -= dt;
      if (e.granCd <= 0 && d < 230 && d > 50) {
        e.granCd = rand(4, 6);
        granadas.push({ sx: e.x, sy: e.y, x: e.x, y: e.y, tx: P.x + rand(-20, 20), ty: P.y + rand(-20, 20), k: 0, vuelo: 0.7, z: 0, mecha: 1.7, enemiga: true });
        Snd.play('tirar');
      }
    }
  }
  if (e.desvT > 0) { e.desvT -= dt; mx = e.dvx; my = e.dvy; }
  const ox = e.x, oy = e.y;
  e.x += mx * vel * dt; e.y += my * vel * dt;
  resolver(e);
  const movido = dist(ox, oy, e.x, e.y), esperado = Math.hypot(mx, my) * vel * dt;
  if (esperado > 0.1 && movido < esperado * 0.35) {
    e.atasco += dt;
    if (e.atasco > 0.3) {
      e.atasco = 0; const s = Math.random() < 0.5 ? -1 : 1, L = Math.hypot(mx, my) || 1;
      e.dvx = -my / L * s; e.dvy = mx / L * s; e.desvT = rand(0.5, 0.9);
    }
  } else e.atasco = Math.max(0, e.atasco - dt);
  if (movido > 0.05) e.paso += movido;
}

// ---------- Input ----------
const teclas = {};
const mouse = { x: VW / 2, y: VH / 2, abajo: false };
const touch = { activo: false, mov: null, apu: null };
const toVirtual = (cx, cy) => ({ x: (cx * DPR - OX) / ESC, y: (cy * DPR - OY) / ESC });

addEventListener('keydown', e => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;   // escribiendo el nombre: no es una orden del juego
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) && G.estado === 'jugando') e.preventDefault();
  if (teclas[e.code]) return; teclas[e.code] = true;
  Snd.init(); alPresionar(e.code);
});
addEventListener('keyup', e => { teclas[e.code] = false; });
const alPerderFoco = () => { for (const k in teclas) teclas[k] = false; mouse.abajo = false; if (G.estado === 'jugando' && !MP()) G.estado = 'pausa'; };
addEventListener('blur', alPerderFoco);
document.addEventListener('visibilitychange', () => { if (document.hidden) alPerderFoco(); });

function alPresionar(c) {
  if (c === 'KeyM') { Snd.toggle(); return; }
  switch (G.estado) {
    case 'jugando':
      if (MP()) {
        if (c === 'KeyP' || c === 'Escape') { G.pausaLocal = !G.pausaLocal; break; }
        const a = { Digit1: '1', Digit2: '2', Digit3: '3', KeyQ: 'q', KeyR: 'r', KeyG: 'g', KeyE: 'e', KeyZ: 'z', KeyX: 'x', KeyC: 'c' }[c];
        if (a && !G.pausaLocal && YO && !YO.muerto) accion(a);
        break;
      }
      if (c === 'Digit1') cambiarArma(0); if (c === 'Digit2') cambiarArma(1); if (c === 'Digit3') cambiarArma(2);
      if (c === 'KeyQ') cambiarArma(P.arma + 1);
      if (c === 'KeyR') recargar();
      if (c === 'KeyG') tirarGranada();
      if (c === 'KeyE') usarCaja();
      if (c === 'KeyZ') usarRacha('dron');
      if (c === 'KeyX') usarRacha('aereo');
      if (c === 'KeyC') usarRacha('torreta');
      if (c === 'KeyP' || c === 'Escape') G.estado = 'pausa';
      break;
    case 'pausa':
      if (c === 'KeyP' || c === 'Escape' || c === 'Enter') G.estado = 'jugando';
      break;
    case 'muerto':
      if (MP()) break;
      if (G.muerteT > 1 && (c === 'Enter' || c === 'Space')) reintentar();
      if (G.muerteT > 1 && c === 'Escape') irTitulo();
      break;
    case 'tienda':
      if (c === 'Enter' || c === 'Escape' || c === 'Space') G.estado = 'jugando';
      if (c.startsWith('Digit')) { const it = TIENDA[+c.slice(5) - 1]; if (it) comprar(it); }
      if (G.muerteT > 1 && c === 'Escape') irTitulo();
      break;
    case 'victoria':
      if (G.ganoT > 2 && (c === 'Enter' || c === 'Space' || c === 'Escape')) irTitulo();
      break;
  }
}
function irTitulo() { G = nuevoEstado(); }
function reintentar() { if (esSup()) iniciarSupervivencia(); else cargarCheckpoint(); }

touch.activo = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
touch.ult = 0;
// Cualquier toque (también sobre los botones de React) marca que estás en un celular
addEventListener('touchstart', () => { touch.activo = true; touch.ult = performance.now(); Snd.init(); }, { passive: true, capture: true });
const esMouseFalso = () => performance.now() - touch.ult < 800;      // los celulares inventan eventos de mouse después de un toque
addEventListener('mousemove', e => { if (esMouseFalso()) return; const v = toVirtual(e.clientX, e.clientY); mouse.x = v.x; mouse.y = v.y; touch.activo = false; });
cv.addEventListener('mousedown', e => {
  if (esMouseFalso()) return;
  Snd.init(); const v = toVirtual(e.clientX, e.clientY); mouse.x = v.x; mouse.y = v.y; touch.activo = false;
  if (e.button === 0) mouse.abajo = true;
  if (e.button === 2 && G.estado === 'jugando') accion('g');
});
addEventListener('mouseup', e => { if (e.button === 0) mouse.abajo = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  if (G.estado === 'jugando') { if (MP()) accion('q'); else cambiarArma(P.arma + (e.deltaY > 0 ? 1 : -1)); }
  e.preventDefault();
}, { passive: false });

// Joysticks (sólo en el mundo; los botones de acción son de React)
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  if (G.estado !== 'jugando' || G.pausaLocal) return;
  for (const t of e.changedTouches) {
    const v = toVirtual(t.clientX, t.clientY);
    if (v.x < VW * 0.45 && !touch.mov) touch.mov = { id: t.identifier, ox: v.x, oy: v.y, x: v.x, y: v.y };
    else if (!touch.apu) touch.apu = { id: t.identifier, ox: v.x, oy: v.y, x: v.x, y: v.y };
  }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const v = toVirtual(t.clientX, t.clientY);
    for (const s of [touch.mov, touch.apu]) if (s && s.id === t.identifier) { s.x = v.x; s.y = v.y; }
  }
}, { passive: false });
const finTouch = e => { for (const t of e.changedTouches) { if (touch.mov && touch.mov.id === t.identifier) touch.mov = null; if (touch.apu && touch.apu.id === t.identifier) touch.apu = null; } };
cv.addEventListener('touchend', finTouch); cv.addEventListener('touchcancel', finTouch);

// ---------- Actualización ----------
function actualizar(dt) {
  NOW += dt;
  if (G.banner) { G.banner.k += dt; if (G.banner.k > G.banner.dur) G.banner = null; }
  if (G.radio) { G.radio.k += dt; if (G.radio.k > G.radio.dur) G.radio = null; }
  if (G.alerta) { G.alerta.t -= dt; if (G.alerta.t <= 0) G.alerta = null; }
  if (G.feed.length) { G.feed.forEach(f => { f.k += dt; }); G.feed = G.feed.filter(f => f.k < 7); }
  G.toasts.forEach(t => t.k += dt); G.toasts = G.toasts.filter(t => t.k < 2.5);
  G.shake = Math.max(0, G.shake - dt * 25);

  if (G.estado === 'titulo' || G.estado === 'sala') {
    cam.x = (Math.sin(NOW * 0.05) * 0.5 + 0.5) * (WW - VW); cam.y = 300 + Math.sin(NOW * 0.13) * 120;
    return;
  }
  if (RED.cliente && MP()) { if (G.estado !== 'ayuda') actualizarCliente(dt); return; }
  if (G.estado === 'pausa' || G.estado === 'ayuda' || G.estado === 'tienda') return;
  if (G.estado === 'muerto') { G.muerteT += dt; actualizarEfectos(dt * 0.4); return; }
  if (G.estado === 'finEq') { G.ganoT += dt; actualizarEfectos(dt); return; }
  if (G.estado === 'victoria') { G.ganoT += dt; actualizarHeli(dt); actualizarEfectos(dt); return; }

  G.tiempo += dt;
  G.rojo = Math.max(0, G.rojo - dt * 0.8); G.hitmark -= dt; G.retroceso = Math.max(0, G.retroceso - dt * 8);

  // --- Jugador(es) ---
  if (MP()) {
    for (const j of jugadores) {
      if (j.muerto) { j.respT -= dt; if (j.respT <= 0 && !(G.modo === 'coop' && G.fase === 'fin')) reaparecer(j); continue; }
      P = j; S = j.S; G.racha = j.racha;
      const inp = j === YO ? (G.pausaLocal ? null : entradaLocal()) : j.bot ? entradaBot(j, dt) : j.inp;
      moverJugador(j, inp, dt);
      if (j.acc && j.acc.length) { for (const a of j.acc.splice(0)) hacerAccion(a); }
      recogerItems(j);
      j.racha = G.racha;
    }
    P = YO; S = YO.S; G.racha = YO.racha;
    actualizarEquipos(dt);
  } else {
    moverJugador(P, entradaLocal(), dt);
    recogerItems(P);
  }
  for (const it of items) it.k -= dt;
  items = items.filter(i => i.k > 0);
  estaciones.forEach(e => e.cd = Math.max(0, e.cd - dt));
  if (false) for (const it of items) {
    if (!P.oculto && dist(it.x, it.y, P.x, P.y) < 12) {
      it.k = -1;
      if (it.tipo === 'municion') { P.mun[1].res += 30; P.mun[2].res += 4; pop(P.x, P.y - 12, '+MUNICIÓN', '#a0ff80'); }
      if (it.tipo === 'botiquin') { P.hp = Math.min(P.maxhp, P.hp + 40); pop(P.x, P.y - 12, '+VIDA', '#ff9090'); }
      if (it.tipo === 'granada') { P.gran = Math.min(5, P.gran + 1); pop(P.x, P.y - 12, '+GRANADA', '#ffe060'); }
      Snd.play('item');
    }
  }

  // --- Enemigos ---
  campoT -= dt;
  if (campoT <= 0) {
    campoT = 0.3;
    if (MP()) {
      const vivos = jugadores.filter(j => !j.muerto);
      if (vivos.length) calcularCampo(vivos);
      if (G.modo === 'equipos' || jugadores.some(j => j.bot)) {
        calcularCampo(vivos.filter(j => j.equipo === 'rojo'), campoEq.verde);   // los verdes buscan a los rojos
        calcularCampo(vivos.filter(j => j.equipo === 'verde'), campoEq.rojo);
      }
    } else calcularCampo();
  }
  for (const e of enemigos) if (!e.muerto) {
    if (MP()) { const o = masCercano(e.x, e.y, j => !j.muerto); if (!o) continue; P = o; actualizarEnemigo(e, dt); P = YO; }
    else actualizarEnemigo(e, dt);
  }
  for (let i = 0; i < enemigos.length; i++) for (let j = i + 1; j < enemigos.length; j++) {
    const a = enemigos[i], b = enemigos[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d < m && d > 0.01) { const p = (m - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; }
  }
  enemigos = enemigos.filter(e => !e.muerto);

  // --- Balas ---
  for (let i = balas.length - 1; i >= 0; i--) {
    const b = balas[i]; b.vida -= dt; let muere = b.vida <= 0;
    const pasos = Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 4)), sx = b.vx * dt / pasos, sy = b.vy * dt / pasos;
    for (let s = 0; s < pasos && !muere; s++) {
      b.x += sx; b.y += sy;
      if (b.x < 0 || b.y < 0 || b.x > WW || b.y > WH) { muere = true; break; }
      if (puntoBloqueado(b.x, b.y)) {
        muere = true;
        for (let k = 0; k < 3; k++) particulas.push({ x: b.x - sx, y: b.y - sy, vx: rand(-50, 50) - sx * 5, vy: rand(-50, 50) - sy * 5, vida: 0.2, max: 0.2, c: '#ffd080', s: 1, roce: 3, luz: true });
        break;
      }
      if (b.duenio === 'j') {
        TIRADOR = b.id;
        for (const e of enemigos) if (!e.muerto && (b.x - e.x) ** 2 + (b.y - e.y) ** 2 < (e.r + 1.5) ** 2) { golpearEnemigo(e, b.dmg, b, b.src); muere = true; break; }
        if (!muere && G.modo === 'equipos') for (const j of jugadores) {
          if (j.muerto || j.equipo === b.eq || (b.x - j.x) ** 2 + (b.y - j.y) ** 2 >= j.r * j.r) continue;
          P = j; herirJugador(b.dmg, b.x - b.vx * 0.1, b.y - b.vy * 0.1, b.id); P = YO;
          if (b.id === YO.id) { G.hitmark = 0.15; Snd.play('hit'); } else avisarHit(b.id);
          muere = true; break;
        }
      } else if (MP()) {
        for (const j of jugadores) if (!j.muerto && (b.x - j.x) ** 2 + (b.y - j.y) ** 2 < j.r * j.r) { P = j; herirJugador(b.dmg, b.x - b.vx * 0.1, b.y - b.vy * 0.1); P = YO; muere = true; break; }
      } else if (!P.oculto && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < P.r * P.r) { herirJugador(b.dmg, b.x - b.vx * 0.1, b.y - b.vy * 0.1); muere = true; }
    }
    if (muere) balas.splice(i, 1);
  }
  enemigos = enemigos.filter(e => !e.muerto);
  if (G.estado !== 'jugando') return;

  // --- Granadas ---
  for (const g of granadas) {
    g.k += dt;
    if (g.k < g.vuelo) {
      const t = g.k / g.vuelo, nx = lerp(g.sx, g.tx, t), ny = lerp(g.sy, g.ty, t);
      if (puntoBloqueado(nx, ny)) g.vuelo = g.k; else { g.x = nx; g.y = ny; }
      g.z = Math.sin(Math.PI * t) * 14;
    } else g.z = 0;
    if (g.k >= g.mecha) {
      g.fin = true;
      if (g.enemiga) explotar(g.x, g.y, 55, 0, { enemigos: false, jugador: 45, enemiga: true });
      else explotar(g.x, g.y, 58, 140, { jugador: 30, src: 'granada', dueno: g.dueno, eq: g.eq });
    }
  }
  granadas = granadas.filter(g => !g.fin);

  // --- Rachas ---
  for (const d of drones) {
    d.k -= dt; d.a += dt * 1.8; d.cd -= dt; d.bt -= dt;
    const du = d.dueno || P;
    d.x = lerp(d.x, du.x + Math.cos(d.a) * 26, Math.min(1, dt * 5)); d.y = lerp(d.y, du.y + Math.sin(d.a) * 26, Math.min(1, dt * 5));
    apoyoDisparo(d, 220, 0.35, 14, 500);
  }
  drones = drones.filter(d => d.k > 0);
  for (const t of torretas) { t.k -= dt; t.cd -= dt; t.bt -= dt; apoyoDisparo(t, 230, 0.13, 9, 520); }
  torretas = torretas.filter(t => t.k > 0);
  for (const a of ataques) {
    a.k -= dt;
    if (!a.jet && a.k < 0.8) { a.jet = true; jets.push({ x: a.x - Math.cos(a.ang) * 500, y: a.y - Math.sin(a.ang) * 500, ang: a.ang, k: 2 }); Snd.play('jet'); }
    if (a.k <= 0) { a.fin = true; for (let i = -3; i <= 3; i++) pendientes.push({ x: a.x + Math.cos(a.ang) * i * 30 + rand(-6, 6), y: a.y + Math.sin(a.ang) * i * 30 + rand(-6, 6), k: (i + 3) * 0.09, eq: a.eq, id: a.dueno && a.dueno.id }); }
  }
  ataques = ataques.filter(a => !a.fin);
  for (const p of pendientes) { p.k -= dt; if (p.k <= 0) { p.fin = true; explotar(p.x, p.y, 52, 170, { src: 'racha', eq: p.eq, duenoId: p.id }); } }
  pendientes = pendientes.filter(p => !p.fin);

  actualizarEfectos(dt);
  actualizarHeli(dt);
  actualizarMision(dt);

  moverCamara(dt);
}
function moverCamara(dt) {
  // --- Cámara (mira un poco hacia donde apuntás) ---
  const look = touch.activo ? { x: Math.cos(P.ang) * 40, y: Math.sin(P.ang) * 30 } : { x: (mouse.x - VW / 2) * 0.25, y: (mouse.y - VH / 2) * 0.25 };
  const tx = clamp(P.x - VW / 2 + look.x, 0, WW - VW), ty = clamp(P.y - VH / 2 + look.y, 0, WH - VH);
  cam.x = lerp(cam.x, tx, Math.min(1, dt * 6)); cam.y = lerp(cam.y, ty, Math.min(1, dt * 6));
}

function apoyoDisparo(u, rango, cad, dmg, vb) {
  if (u.bt <= 0) {
    u.bt = 0.2; u.obj = null; let bd = rango;
    const blancos = G.modo === 'equipos' ? jugadores.filter(j => j.equipo !== u.eq) : enemigos;
    for (const e of blancos) { const d = dist(u.x, u.y, e.x, e.y); if (d < bd && hayVision(u.x, u.y, e.x, e.y)) { bd = d; u.obj = e; } }
  }
  if (u.obj && !u.obj.muerto) {
    u.ang = Math.atan2(u.obj.y - u.y, u.obj.x - u.x);
    if (u.cd <= 0) {
      u.cd = cad; const a = u.ang + rand(-0.05, 0.05);
      balas.push({ x: u.x, y: u.y, vx: Math.cos(a) * vb, vy: Math.sin(a) * vb, vida: 0.7, dmg, duenio: 'j', src: 'racha', eq: u.eq, id: u.dueno && u.dueno.id });
      fogonazos.push({ x: u.x, y: u.y, k: 0.05, r: 24 }); Snd.play('fusil', 0.4);
    }
  }
}

function actualizarEfectos(dt) {
  for (const p of particulas) {
    p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    const f = Math.max(0, 1 - p.roce * dt); p.vx *= f; p.vy *= f;
  }
  particulas = particulas.filter(p => p.vida > 0);
  if (particulas.length > 900) particulas.splice(0, particulas.length - 900);
  for (const e of explosiones) e.k += dt; explosiones = explosiones.filter(e => e.k < 0.5);
  for (const f of fogonazos) f.k -= dt; fogonazos = fogonazos.filter(f => f.k > 0);
  for (const p of pops) { p.k += dt; p.y -= dt * 18; } pops = pops.filter(p => p.k < 1);
  for (const i of indicadores) i.k -= dt; indicadores = indicadores.filter(i => i.k > 0);
  for (const j of jets) { j.k -= dt; j.x += Math.cos(j.ang) * 520 * dt; j.y += Math.sin(j.ang) * 520 * dt; } jets = jets.filter(j => j.k > 0);
}

function actualizarMision(dt) {
  const Z = ZONAS[G.zona];
  G.faseT -= dt;
  switch (G.fase) {
    case 'tiro': {
      for (const m of P.mun) if (m.res !== Infinity) m.res = Math.max(m.res, 99);
      G.tiroT = (G.tiroT || 0) - dt;
      if (G.tiroT <= 0) {
        G.tiroT = 1.2;
        const vivos = new Set(enemigos.filter(e => e.T.estatico && !e.muerto).map(e => e.slot));
        BLANCOS.forEach(([x, y], i) => { if (!vivos.has(i)) { const b = crearEnemigo('maniqui', x, y); b.slot = i; b.hp = b.maxhp = 220; } });
      }
      break;
    }
    case 'banner': if (G.faseT <= 0) iniciarOla(0); break;
    case 'ola': {
      const sup = esSup();
      const maxVivos = sup ? 10 + Math.min(G.ola, 8) + (MP() ? 2 * jugadores.length : 0) : 6 + G.zona * 2;
      G.spawnT -= dt;
      if (G.cola.length && G.spawnT <= 0 && enemigos.length < maxVivos) { if (spawnear(G.cola[0])) G.cola.shift(); G.spawnT = rand(0.5, 1.1); }
      if (!G.cola.length && !enemigos.length) {
        const bonus = 250 * (olaGlobal() + 1); G.pts += bonus; G.xpPartida += ganarXp(bonus / 5); Snd.play('racha');
        if (sup) {
          G.fase = 'descanso'; G.faseT = 6; G.olasSup = G.ola + 1;
          banner(`OLEADA ${G.ola + 1} SUPERADA`, `+${bonus} puntos · próxima en 6s`, 2.5);
          if ((G.ola + 1) % 3 === 0) {
            if (MP()) reabastecerTodos();   // con amigos no se pausa: llega una caja para todos
            else abrirTienda();
          }
        }
        else if (G.ola < Z.oleadas.length - 1) { G.fase = 'descanso'; G.faseT = 6; banner('OLEADA SUPERADA', `+${bonus} puntos · próxima en 6s`, 2.5); }
        else if (G.zona === ZONAS.length - 1) {
          G.fase = 'defensa'; G.faseT = DEFENSA_SEG; G.spawnT = 2;
          banner('¡DEFENDÉ EL FARO!', `Aguantá ${DEFENSA_SEG} segundos`, 3);
          radio('¡Helicóptero en camino! ¡Aguantá hasta que llegue! ¡Cuidado, viene el COMANDANTE!');
          Snd.play('alarma');
          const j = spawnear('jefe'); if (j) G.jefe = j;
        } else {
          G.fase = 'avanzar'; portones[G.zona].abierto = true;
          banner('¡ZONA DESPEJADA!', `+${bonus} puntos · avanzá hacia el este >>`, 3);
          radio('Buen trabajo. El portón está abierto, seguí hacia el este.');
          abrirTienda();
        }
      }
      break;
    }
    case 'descanso': if (G.faseT <= 0) iniciarOla(G.ola + 1); break;
    case 'avanzar':
      if (P.x > ZONAS[G.zona + 1].x0 + 30) { entrarZona(G.zona + 1); guardarCheckpoint(); toast('CHECKPOINT GUARDADO', '#80c0ff'); }
      break;
    case 'defensa':
      G.spawnT -= dt;
      if (G.spawnT <= 0 && enemigos.length < 12) {
        const r = Math.random(); spawnear(r < 0.25 ? 'corredor' : r < 0.45 ? 'pesado' : r < 0.51 ? 'perro' : r < 0.68 ? 'francotirador' : 'soldado'); G.spawnT = rand(1.2, 1.8);
      }
      if (G.faseT <= 0) {
        G.fase = 'extraccion'; heli = { x: 3800, y: 420, alt: 70, estado: 'llegando', k: 0, sx: 3800, sy: 420 };
        banner('¡LLEGÓ EL HELICÓPTERO!', 'Corré al punto de extracción (H)', 3);
        radio('¡Estamos aterrizando en el helipuerto! ¡Subí ya!', 'PILOTO');
      }
      break;
    case 'extraccion':
      G.spawnT -= dt;
      if (G.spawnT <= 0 && enemigos.length < 8) { spawnear(Math.random() < 0.5 ? 'corredor' : 'soldado'); G.spawnT = rand(2.5, 3.5); }
      if (heli && heli.estado === 'aterrizado' && dist(P.x, P.y, PAD.x, PAD.y) < 26) {
        P.oculto = true; heli.estado = 'despegando'; heli.k = 0; G.fase = 'fin';
        G.pts += 2000 + Math.round(P.hp) * 10; G.xpPartida += ganarXp(1000); banner('¡EXTRACCIÓN!', '+2000 puntos', 3);
      }
      break;
    case 'fin':
      if (heli && heli.k > 3.2) ganar();
      break;
  }
}
function actualizarHeli(dt) {
  if (!heli) return;
  heli.k += dt;
  if (heli.estado === 'llegando') {
    const t = Math.min(1, heli.k / 5), e = 1 - (1 - t) * (1 - t);
    heli.x = lerp(heli.sx, PAD.x, e); heli.y = lerp(heli.sy, PAD.y, e); heli.alt = lerp(70, 0, e);
    if (t >= 1) { heli.estado = 'aterrizado'; }
  } else if (heli.estado === 'despegando') {
    heli.alt += dt * 40; heli.x += dt * heli.k * 60; heli.y -= dt * heli.k * 15;
  }
  heli.sonT = (heli.sonT || 0) - dt;
  if (heli.sonT <= 0) { heli.sonT = 0.09; Snd.play('helice', clamp(1 - dist(heli.x, heli.y, P.x, P.y) / 700, 0.15, 1)); }
}
function ganar() {
  sumarStat('victorias'); cerrarPartida();
  G.estado = 'victoria'; G.ganoT = 0; Snd.play('victoria'); borrarPartida();
  G.nuevoRecord = G.pts > record;
  if (G.nuevoRecord) { record = G.pts; try { localStorage.setItem('faro_record', record); } catch (e) {} }
}

// ---------- Dibujo ----------
function dibujarPerro(g, e) {
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(e.x + 1, e.y + 2, 6, 3, e.ang, 0, 7); g.fill();
  g.save(); g.translate(e.x, e.y); g.rotate(e.ang);
  const p = Math.sin(e.paso * 0.9) * 2, c = e.flash > 0 ? '#fff' : e.T.cuerpo;
  g.fillStyle = '#2a1a0c'; g.fillRect(-4 + p, -3.5, 2, 1.5); g.fillRect(2 - p, -3.5, 2, 1.5); g.fillRect(-4 - p, 2, 2, 1.5); g.fillRect(2 + p, 2, 2, 1.5);
  g.fillStyle = c; g.fillRect(-5, -2.5, 10, 5);          // cuerpo
  g.fillRect(4, -2, 4, 4);                               // cabeza
  g.fillStyle = e.flash > 0 ? '#fff' : e.T.casco; g.fillRect(7, -1, 2, 2); g.fillRect(-8, -0.5 + p * 0.3, 3, 1); // hocico y cola
  g.fillRect(4, -3, 1.5, 1.5); g.fillRect(4, 1.5, 1.5, 1.5); // orejas
  g.restore();
}
function dibujarSoldado(g, x, y, ang, r, cuerpo, casco, largoArma, flash, paso) {
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x + 1, y + 2, r, r * 0.8, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y); g.rotate(ang);
  const pie = Math.sin(paso * 0.5) * r * 0.45;
  g.fillStyle = '#1a1a1a'; g.fillRect(-r * 0.5 + pie, -r * 0.55, r * 0.6, r * 0.4); g.fillRect(-r * 0.5 - pie, r * 0.15, r * 0.6, r * 0.4);
  g.fillStyle = '#111'; g.fillRect(r * 0.2, r * 0.2, largoArma, 2);
  g.fillStyle = flash ? '#fff' : cuerpo; g.fillRect(-r * 0.6, -r, r * 1.2, r * 2);
  g.fillStyle = flash ? '#fff' : '#c89870'; g.fillRect(r * 0.35, r * 0.05, 2, 2);
  g.fillStyle = flash ? '#fff' : casco; g.beginPath(); g.arc(0, 0, r * 0.62, 0, 7); g.fill();
  g.restore();
}

function render() {
  const sh = G.shake;
  const cx = Math.round(cam.x + (Math.random() - 0.5) * sh), cy = Math.round(cam.y + (Math.random() - 0.5) * sh);
  lx.imageSmoothingEnabled = false;
  lx.fillStyle = '#05050a'; lx.fillRect(0, 0, VW, VH);
  lx.drawImage(MUNDO, cx, cy, VW, VH, 0, 0, VW, VH);
  lx.save(); lx.translate(-cx, -cy);
  const visible = (x, y, m = 40) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;

  // Agua con brillo animado
  lx.fillStyle = 'rgba(120,170,220,0.25)';
  for (let i = 0; i < 40; i++) {
    const x = cx + ((i * 97 + NOW * 12) % VW), y = cy + ((i * 53) % VH);
    if (y > 745 || x > 3500) lx.fillRect(x | 0, (y + Math.sin(NOW * 2 + i) * 2) | 0, 3, 1);
  }
  // Portones cerrados
  for (const p of portones) if (!p.abierto && visible(p.x, cy + 100, 20)) {
    for (let y = Math.max(0, cy - 10); y < Math.min(WH, cy + VH + 10); y += 8) {
      lx.fillStyle = (Math.floor(y / 8) % 2) ? '#c03030' : '#d8d8d8'; lx.fillRect(p.x, y - y % 8, p.w, 8);
    }
    lx.fillStyle = '#777'; for (let y = cy - cy % 6; y < cy + VH; y += 6) { lx.fillRect(p.x - 4, y, 3, 1); lx.fillRect(p.x + 9, y + 3, 3, 1); }
  }
  // Estaciones de munición: indicador
  for (const e of estaciones) if (visible(e.x, e.y) && e.cd > 0) {
    lx.strokeStyle = '#555'; lx.lineWidth = 2; lx.beginPath(); lx.arc(e.x, e.y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - e.cd / 30)); lx.stroke();
  }
  // Partículas en el piso (casquillos, manchas)
  for (const p of particulas) if (p.piso && visible(p.x, p.y)) {
    lx.globalAlpha = p.mancha ? Math.min(1, p.vida / 2) : 1;
    lx.fillStyle = p.c; if (p.mancha) { lx.beginPath(); lx.arc(p.x, p.y, p.s, 0, 7); lx.fill(); } else lx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
  }
  lx.globalAlpha = 1;
  // Items
  for (const it of items) {
    if (!visible(it.x, it.y) || (it.k < 5 && Math.floor(NOW * 8) % 2)) continue;
    const y = it.y + Math.sin(NOW * 4 + it.x) * 1.5;
    if (it.tipo === 'municion') { lx.fillStyle = '#2a3d1c'; lx.fillRect(it.x - 5, y - 3, 10, 7); lx.fillStyle = '#e0c23a'; lx.fillRect(it.x - 3, y - 1, 6, 2); }
    if (it.tipo === 'botiquin') { lx.fillStyle = '#e8e8e8'; lx.fillRect(it.x - 4, y - 4, 9, 8); lx.fillStyle = '#d02020'; lx.fillRect(it.x - 1, y - 3, 3, 6); lx.fillRect(it.x - 3, y - 1, 7, 2); }
    if (it.tipo === 'granada') { lx.fillStyle = '#3a4a2a'; lx.beginPath(); lx.arc(it.x, y, 3.5, 0, 7); lx.fill(); lx.fillStyle = '#999'; lx.fillRect(it.x - 1, y - 5, 2, 2); }
  }
  // Granadas
  for (const g of granadas) {
    lx.fillStyle = 'rgba(0,0,0,0.4)'; lx.fillRect(g.x - 2, g.y - 1, 4, 3);
    lx.fillStyle = g.enemiga ? '#5a2a2a' : '#3a4a2a'; lx.beginPath(); lx.arc(g.x, g.y - g.z, 2.5, 0, 7); lx.fill();
  }
  // Torretas
  for (const t of torretas) {
    lx.fillStyle = '#333'; lx.fillRect(t.x - 6, t.y - 6, 12, 12); lx.fillStyle = '#556b2f'; lx.fillRect(t.x - 4, t.y - 4, 8, 8);
    lx.save(); lx.translate(t.x, t.y); lx.rotate(t.ang); lx.fillStyle = '#111'; lx.fillRect(0, -1, 11, 2); lx.restore();
  }
  // Enemigos
  for (const e of enemigos) if (visible(e.x, e.y)) {
    if (e.T.estatico) dibujarBlanco(lx, e);
    else if (e.T.perro) dibujarPerro(lx, e);
    else dibujarSoldado(lx, e.x, e.y, e.ang, e.r, e.T.cuerpo, e.T.casco, e.T.arma, e.flash > 0, e.paso);
    if (e.T.pesado || e.tipo === 'pesado') { lx.fillStyle = '#6a6a72'; lx.fillRect(e.x - 3, e.y - 3, 2, 6); }
    if (e.hp < e.maxhp && !e.T.jefe) { lx.fillStyle = '#300'; lx.fillRect(e.x - 6, e.y - e.r - 5, 12, 2); lx.fillStyle = '#e03030'; lx.fillRect(e.x - 6, e.y - e.r - 5, 12 * e.hp / e.maxhp, 2); }
  }
  // Jugadores (multijugador)
  if (MP()) for (const j of jugadores) {
    if (j.muerto || (j.inv > 0 && Math.floor(NOW * 10) % 2)) continue;
    if (G.modo === 'equipos') { lx.strokeStyle = j.equipo === 'verde' ? '#40ff40' : '#ff4040'; lx.lineWidth = 1; lx.beginPath(); lx.ellipse(j.x, j.y + 1, 8, 6, 0, 0, 7); lx.stroke(); }
    const cm = colorJ(j);
    dibujarSoldado(lx, j.x, j.y, j.ang, j.r, cm.c, cm.h, j.arma === 2 ? 10 : j.arma === 1 ? 9 : 5, false, j.paso);
    if (j === YO && j.recarga > 0) { lx.fillStyle = '#222'; lx.fillRect(j.x - 8, j.y - 13, 16, 2); lx.fillStyle = '#ffe060'; lx.fillRect(j.x - 8, j.y - 13, 16 * (1 - j.recarga / j.W[j.arma].recarga), 2); }
    if (j !== YO && j.hp < j.maxhp) { lx.fillStyle = '#300'; lx.fillRect(j.x - 6, j.y - 11, 12, 2); lx.fillStyle = '#40d040'; lx.fillRect(j.x - 6, j.y - 11, 12 * j.hp / j.maxhp, 2); }
  }
  // Jugador
  else if (!enMenu() && !P.oculto && G.estado !== 'muerto') {
    dibujarSoldado(lx, P.x, P.y, P.ang, P.r, colorJ(P).c, colorJ(P).h, P.arma === 2 ? 10 : P.arma === 1 ? 9 : 5, false, P.paso);
    if (P.recarga > 0) { lx.fillStyle = '#222'; lx.fillRect(P.x - 8, P.y - 13, 16, 2); lx.fillStyle = '#ffe060'; lx.fillRect(P.x - 8, P.y - 13, 16 * (1 - P.recarga / P.W[P.arma].recarga), 2); }
  }
  // Drones (con sombra)
  for (const d of drones) {
    lx.fillStyle = 'rgba(0,0,0,0.35)'; lx.fillRect(d.x + 4, d.y + 8, 7, 4);
    lx.fillStyle = '#444'; lx.fillRect(d.x - 4, d.y - 1, 9, 3); lx.fillRect(d.x - 1, d.y - 4, 3, 9);
    lx.fillStyle = '#888'; [[-5, -5], [4, -5], [-5, 4], [4, 4]].forEach(([a, b]) => lx.fillRect(d.x + a, d.y + b, 2, 2));
  }
  // Helicóptero
  if (heli && !(G.estado === 'victoria' && heli.alt > 250)) dibujarHeli(lx, heli.x, heli.y, heli.alt);
  // Sombra del avión del ataque aéreo
  for (const j of jets) {
    lx.save(); lx.translate(j.x + 20, j.y + 30); lx.rotate(j.ang); lx.fillStyle = 'rgba(0,0,0,0.45)';
    lx.beginPath(); lx.moveTo(14, 0); lx.lineTo(-10, -14); lx.lineTo(-6, 0); lx.lineTo(-10, 14); lx.closePath(); lx.fill(); lx.restore();
  }
  // Marcador del ataque aéreo
  for (const a of ataques) if (Math.floor(NOW * 6) % 2) {
    lx.strokeStyle = '#ff3030'; lx.lineWidth = 1; lx.beginPath(); lx.arc(a.x, a.y, 10, 0, 7); lx.stroke();
    lx.beginPath(); lx.moveTo(a.x - Math.cos(a.ang) * 100, a.y - Math.sin(a.ang) * 100); lx.lineTo(a.x + Math.cos(a.ang) * 100, a.y + Math.sin(a.ang) * 100); lx.stroke();
  }
  lx.restore();

  // ---------- Iluminación nocturna ----------
  lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, VW, VH);
  lg.fillStyle = `rgba(4,6,20,${OSCURIDAD})`; lg.fillRect(0, 0, VW, VH);
  lg.globalCompositeOperation = 'destination-out';
  const circ = (x, y, r, a) => {
    const gx = x - cx, gy = y - cy; if (gx < -r || gy < -r || gx > VW + r || gy > VH + r) return;
    const gr = lg.createRadialGradient(gx, gy, 0, gx, gy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = gr; lg.beginPath(); lg.arc(gx, gy, r, 0, 7); lg.fill();
  };
  const cono = (x, y, ang, len, half, a) => {
    const gx = x - cx, gy = y - cy;
    const gr = lg.createRadialGradient(gx, gy, 0, gx, gy, len); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.7, `rgba(0,0,0,${a * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = gr; lg.beginPath(); lg.moveTo(gx, gy); lg.arc(gx, gy, len, ang - half, ang + half); lg.closePath(); lg.fill();
  };
  // faro giratorio
  const fa = NOW * 0.7;
  cono(FARO.x, FARO.y, fa, 560, 0.13, 0.6); cono(FARO.x, FARO.y, fa + Math.PI, 560, 0.13, 0.6); circ(FARO.x, FARO.y, 70, 0.7);
  circ(220, 425, 90 + Math.sin(NOW * 13) * 3, 0.55); // lámpara de la cabaña
  for (const e of estaciones) circ(e.x, e.y, 26, e.cd > 0 ? 0.2 : 0.55);
  for (const it of items) circ(it.x, it.y, 14, 0.45);
  if (MP()) for (const j of jugadores) { if (j.muerto) continue; circ(j.x, j.y, 50, 0.85); cono(j.x, j.y, j.ang, 175, 0.42, j === YO ? 0.95 : 0.7); }
  else if (!enMenu() && !P.oculto) {
    circ(P.x, P.y, 50, 0.85);
    if (G.estado !== 'muerto') cono(P.x, P.y, P.ang, 175, 0.42, 0.95);
  }
  for (const d of drones) circ(d.x, d.y, 26, 0.5);
  for (const t of torretas) circ(t.x, t.y, 26, 0.5);
  if (heli) { circ(heli.x, heli.y, 70, 0.8); }
  for (const f of fogonazos) circ(f.x, f.y, f.r, Math.min(1, 0.9 * f.k / (f.max || 0.06)));
  for (const p of particulas) if (p.luz) circ(p.x, p.y, 8, 0.4);
  lx.drawImage(luz, 0, 0);

  // ---------- Cosas que brillan (encima de la oscuridad) ----------
  lx.save(); lx.translate(-cx, -cy);
  lx.globalCompositeOperation = 'lighter';
  for (const f of fogonazos) {
    const a = Math.min(1, f.k / (f.max || 0.06));
    const gr = lx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 0.5); gr.addColorStop(0, `rgba(255,170,60,${0.5 * a})`); gr.addColorStop(1, 'rgba(255,80,20,0)');
    lx.fillStyle = gr; lx.beginPath(); lx.arc(f.x, f.y, f.r * 0.5, 0, 7); lx.fill();
  }
  lx.globalCompositeOperation = 'source-over';
  // lámpara del faro
  lx.fillStyle = `rgba(255,240,150,${0.8 + Math.sin(NOW * 5) * 0.2})`; lx.beginPath(); lx.arc(FARO.x, FARO.y, 7, 0, 7); lx.fill();
  // explosiones
  for (const e of explosiones) {
    const t = e.k / 0.5;
    lx.fillStyle = `rgba(255,${200 - t * 150 | 0},40,${1 - t})`; lx.beginPath(); lx.arc(e.x, e.y, e.r * (0.3 + t * 0.7), 0, 7); lx.fill();
    lx.fillStyle = `rgba(255,255,200,${Math.max(0, 1 - t * 2.5)})`; lx.beginPath(); lx.arc(e.x, e.y, e.r * 0.3, 0, 7); lx.fill();
  }
  // partículas en el aire
  for (const p of particulas) if (!p.piso && visible(p.x, p.y)) { lx.globalAlpha = clamp(p.vida / p.max * 1.5, 0, 1); lx.fillStyle = p.c; lx.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
  lx.globalAlpha = 1;
  // láseres de enemigos que están por disparar (¡esquivá!)
  for (const e of enemigos) {
    const aviso = e.T.sniper ? 1.3 : 0.45;   // el francotirador avisa con un láser largo
    if (!e.T.melee && e.vis && e.disCd < aviso && !P.oculto) {
      const d = Math.min(dist(e.x, e.y, P.x, P.y), e.T.sniper ? 400 : 170);
      lx.strokeStyle = `rgba(255,30,30,${0.35 + 0.5 * (1 - e.disCd / aviso)})`; lx.lineWidth = e.T.sniper && e.disCd < 0.3 ? 2 : 1;
      lx.beginPath(); lx.moveTo(e.x + Math.cos(e.ang) * 8, e.y + Math.sin(e.ang) * 8); lx.lineTo(e.x + Math.cos(e.ang) * d, e.y + Math.sin(e.ang) * d); lx.stroke();
    }
    // ojitos rojos para verlos en la oscuridad
    lx.fillStyle = '#ff4040'; lx.fillRect((e.x + Math.cos(e.ang) * 2) | 0, (e.y + Math.sin(e.ang) * 2) | 0, 1, 1);
  }
  // balas
  for (const b of balas) {
    if (b.duenio === 'j') {
      lx.strokeStyle = '#fff2b0'; lx.lineWidth = 1; lx.beginPath(); lx.moveTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); lx.lineTo(b.x, b.y); lx.stroke();
    } else {
      lx.strokeStyle = 'rgba(255,40,40,0.5)'; lx.lineWidth = 1; lx.beginPath(); lx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); lx.lineTo(b.x, b.y); lx.stroke();
      lx.fillStyle = '#ff5050'; lx.fillRect(b.x - 1, b.y - 1, 2, 2);
    }
  }
  // lucecitas de drones/torretas/heli
  const blink = Math.floor(NOW * 4) % 2;
  for (const d of drones) { lx.fillStyle = blink ? '#40ff40' : '#106010'; lx.fillRect(d.x, d.y, 1, 1); }
  for (const t of torretas) { lx.fillStyle = blink ? '#40ff40' : '#106010'; lx.fillRect(t.x - 1, t.y + 3, 2, 1); }
  if (heli) { lx.fillStyle = blink ? '#ff3030' : '#30ff30'; lx.fillRect(heli.x - 1, heli.y - heli.alt * 0.3 - 9, 2, 2); }
  // luciérnagas del bosque
  for (let i = 0; i < 26; i++) {
    const x = 920 + ((i * 337) % 860) + Math.sin(NOW * 0.7 + i) * 20, y = 30 + ((i * 211) % 840) + Math.cos(NOW * 0.5 + i * 2) * 15;
    if (visible(x, y, 4) && Math.sin(NOW * 2 + i * 3) > 0) { lx.fillStyle = '#d8ff70'; lx.fillRect(x | 0, y | 0, 1, 1); }
  }
  // estaciones listas: brillito
  for (const e of estaciones) if (e.cd <= 0 && Math.sin(NOW * 4) > 0) { lx.fillStyle = '#ffe060'; lx.fillRect(e.x - 1, e.y - 10, 2, 2); }
  lx.restore();

  // ---------- Pasar a la pantalla ----------
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, VW, VH, OX, OY, VW * ESC, VH * ESC);
  dibujarLluvia();
  ctx.save(); ctx.translate(OX, OY); ctx.scale(ESC, ESC);
  ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
  dibujarCapaMundo(cx, cy);
  if (touch.activo && G.estado === 'jugando' && !G.pausaLocal) dibujarJoysticks();
  if (!touch.activo) dibujarMira();
  ctx.restore();
}

function dibujarHeli(g, x, y, alt) {
  const s = 1 + alt / 120;
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(x + alt * 0.6, y + alt * 0.9, 16, 7, 0, 0, 7); g.fill();
  g.save(); g.translate(x, y - alt * 0.3); g.scale(s, s);
  g.fillStyle = '#2f3d2a'; g.fillRect(6, -2, 22, 4); g.fillRect(26, -6, 3, 12);
  g.fillStyle = '#3e5236'; g.beginPath(); g.ellipse(0, 0, 13, 8, 0, 0, 7); g.fill();
  g.fillStyle = '#4d6644'; g.beginPath(); g.ellipse(2, -2, 8, 4, 0, 0, 7); g.fill();
  g.fillStyle = '#7ab8e0'; g.beginPath(); g.ellipse(-9, 0, 4, 5, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(210,210,210,0.75)'; g.lineWidth = 2; const a = NOW * 28;
  for (let k = 0; k < 2; k++) { const b = a + k * Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(b) * -22, Math.sin(b) * -22); g.lineTo(Math.cos(b) * 22, Math.sin(b) * 22); g.stroke(); }
  g.restore();
}

// ---------- Texto e interfaz ----------
// La fuente pixelada no trae mayúsculas con tilde: las cambiamos por las versiones que sí tiene
// Escribe texto; si no entra en maxW, achica la letra para que nunca se salga
// ---------- Instrucciones ----------
// ---------- Capa de interfaz DENTRO del mundo (el resto de la interfaz es React) ----------
// Texto dentro del mundo (puntos flotantes y nombres arriba de los soldados)
function txt(s, x, y, size = 8, color = '#fff', align = 'left') {
  ctx.font = `800 ${size}px Chivo, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(1, size / 4); ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineJoin = 'round';
  ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function dibujarMira() {
  if (G.estado !== 'jugando' || G.pausaLocal) return;
  const x = mouse.x, y = mouse.y;
  const w = P.W[P.arma], gap = 3 + w.disp * 30 + G.retroceso * 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - gap - 4, y); ctx.lineTo(x - gap, y); ctx.moveTo(x + gap, y); ctx.lineTo(x + gap + 4, y);
  ctx.moveTo(x, y - gap - 4); ctx.lineTo(x, y - gap); ctx.moveTo(x, y + gap); ctx.lineTo(x, y + gap + 4);
  ctx.stroke();
  if (G.hitmark > 0) {
    ctx.strokeStyle = G.hitBaja ? '#ff3030' : '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(x + a * 3, y + b * 3); ctx.lineTo(x + a * 7, y + b * 7); }
    ctx.stroke();
  }
}
function dibujarCapaMundo(cx, cy) {
  const yo = (MP() && YO) ? YO : P;
  // Pantalla roja cuando te lastiman (estilo COD)
  const dano = (1 - yo.hp / yo.maxhp) * 0.75 + G.rojo;
  if (dano > 0.02) {
    const gr = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.25, VW / 2, VH / 2, VW * 0.65);
    gr.addColorStop(0, 'rgba(160,0,0,0)'); gr.addColorStop(1, `rgba(160,0,0,${Math.min(0.85, dano)})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  }
  // Indicadores de dirección de daño
  const px = yo.x - cx, py = yo.y - cy;
  for (const i of indicadores) {
    ctx.strokeStyle = `rgba(255,40,40,${i.k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 28, i.a - 0.35, i.a + 0.35); ctx.stroke();
  }
  // Puntos flotantes
  for (const p of pops) txt(p.txt, p.x - cx, p.y - cy, 5, p.color, 'center');
  // Nombres de los compañeros
  if (MP()) for (const j of jugadores) if (j !== YO && !j.muerto) {
    txt(j.nombre, j.x - cx, j.y - cy - 15, 4, G.modo === 'equipos' ? (j.equipo === 'verde' ? '#80ff80' : '#ff8080') : '#80c0ff', 'center');
  }
  // Flecha de objetivo
  let obj = null;
  if (G.fase === 'avanzar' && ZONAS[G.zona + 1]) obj = { x: ZONAS[G.zona + 1].x0 + 40, y: ZONAS[G.zona + 1].entrada[1] };
  if (G.fase === 'extraccion') obj = PAD;
  if (obj) {
    const ox = obj.x - cx, oy = obj.y - cy, col = Math.floor(NOW * 3) % 2 ? '#ffc174' : '#ffffff';
    if (ox < 10 || ox > VW - 10 || oy < 10 || oy > VH - 10) {
      const a = Math.atan2(oy - VH / 2, ox - VW / 2), ax = clamp(VW / 2 + Math.cos(a) * 200, 14, VW - 14), ay = clamp(VH / 2 + Math.sin(a) * 110, 50, VH - 50);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-2, 0); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    } else {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox - 5, oy - 24); ctx.lineTo(ox + 5, oy - 24); ctx.lineTo(ox, oy - 16); ctx.closePath(); ctx.fill();
    }
  }
}
// Joysticks del celular: el izquierdo CAMINA, el derecho APUNTA Y DISPARA.
// Aparecen donde apoyás el dedo (en tu mitad de la pantalla) y el círculo sigue al dedo.
function dibujarJoysticks() {
  const stick = (s, base, color, l1, l2) => {
    const ox = s ? s.ox : base.x, oy = s ? s.oy : base.y;
    ctx.fillStyle = `rgba(${color},${s ? 0.18 : 0.1})`; ctx.beginPath(); ctx.arc(ox, oy, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(${color},${s ? 0.8 : 0.45})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy, 26, 0, 7); ctx.stroke();
    let kx = 0, ky = 0;
    if (s) { const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), k = d > 26 ? 26 / d : 1; kx = dx * k; ky = dy * k; }
    ctx.fillStyle = `rgba(${color},${s ? 0.75 : 0.4})`; ctx.beginPath(); ctx.arc(ox + kx, oy + ky, 11, 0, 7); ctx.fill();
    if (!s) { txt(l1, ox, oy - 40, 5, `rgb(${color})`, 'center'); txt(l2, ox, oy + 31, 4, '#c0c0c0', 'center'); }
  };
  stick(touch.mov, baseMov(), '84,221,252', 'CAMINAR', 'arrastrá el dedo');
  stick(touch.apu, baseApu(), '255,180,171', 'APUNTAR Y DISPARAR', 'arrastrá: dispara solo');
}
// Minimapa: se dibuja en un <canvas> chiquito de la interfaz
let miniCv = null;
function dibujarMinimapa() {
  const c = miniCv; if (!c || !c.isConnected) return;
  const g = c.getContext('2d'), w = c.width, h = c.height, k = w / WW, yo = (MP() && YO) ? YO : P;
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,14,19,0.55)'; g.fillRect(0, 0, w, h);
  ZONAS.forEach((z, i) => { g.fillStyle = i === G.zona ? 'rgba(74,225,118,0.34)' : 'rgba(160,142,122,0.16)'; g.fillRect(z.x0 * k, 0, (z.x1 - z.x0) * k, h); });
  g.fillStyle = 'rgba(41,193,223,0.45)';
  g.fillRect(1800 * k, 740 * k, 900 * k, 160 * k); g.fillRect(2700 * k, 760 * k, 900 * k, 140 * k); g.fillRect(3500 * k, 0, 100 * k, h);
  portones.forEach(p => { if (!p.abierto) { g.fillStyle = '#ffb4ab'; g.fillRect(p.x * k - 0.5, 0, 1.5, h); } });
  g.fillStyle = '#ffc174'; g.beginPath(); g.arc(FARO.x * k, FARO.y * k, 3, 0, 7); g.fill();
  if (G.fase === 'extraccion' && Math.floor(NOW * 4) % 2) { g.fillStyle = '#fff'; g.fillRect(PAD.x * k - 3, PAD.y * k - 3, 6, 6); }
  g.fillStyle = '#ff5a4a'; for (const e of enemigos) g.fillRect(e.x * k - 1, e.y * k - 1, 2, 2);
  if (MP()) for (const j of jugadores) {
    if (j === YO || j.muerto) continue;
    if (G.modo === 'equipos' && j.equipo !== YO.equipo) continue;   // a los rivales no los ves en el mapa
    g.fillStyle = '#54ddfc'; g.fillRect(j.x * k - 1.5, j.y * k - 1.5, 3, 3);
  }
  g.fillStyle = '#4ae176'; g.beginPath(); g.arc(yo.x * k, yo.y * k, 3, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1; g.strokeRect(cam.x * k, cam.y * k, VW * k, VH * k);
}

const enMenu = () => G.estado === 'titulo' || G.estado === 'sala';

// ---------- Progreso guardado (en este navegador) ----------
function guardarPartida() { try { localStorage.setItem('faro_partida', JSON.stringify({ ...G.cp, mun: G.cp.mun.map(m => ({ c: m.c, res: m.res === Infinity ? -1 : m.res })), dif: difIdx })); } catch (e) {} }
function leerPartida() {
  try { const s = JSON.parse(localStorage.getItem('faro_partida')); if (!s || !s.zona) return null; s.mun.forEach(m => { if (m.res < 0) m.res = Infinity; }); return s; } catch (e) { return null; }
}
function borrarPartida() { try { localStorage.removeItem('faro_partida'); } catch (e) {} }
function continuarPartida() {
  const s = leerPartida(); if (!s) return iniciarJuego();
  iniciarJuego(); difIdx = s.dif ?? difIdx; G.cp = s; cargarCheckpoint();
}

/* =====================================================================
   MULTIJUGADOR ONLINE
   - Un jugador crea la SALA (es el "anfitrión": su compu corre el juego).
   - Los amigos entran con el link ?sala=CODIGO. Se conectan directo
     entre navegadores (WebRTC con PeerJS), sin servidor propio.
   - Modos: COOPERATIVO (todos contra la compu) y EQUIPOS (verde vs rojo).
   - La compu puede manejar BOTS para completar los equipos.
   ===================================================================== */
let jugadores = [], YO = null, TIRADOR = null, ARMA_KILL = null, idFeed = 0;
const campoEq = { verde: new Int32Array(GWd * GHd), rojo: new Int32Array(GWd * GHd) };
const RED = { activo: false, host: false, cliente: false, peer: null, conns: [], conn: null, codigo: '', miId: '', estado: '', error: '',
  acc: [], envT: 0, salaT: 0, salaModo: 'coop', bots: 2, sala: [], ev: [], bannerKey: '', radioKey: '' };
const MP = () => RED.activo && (G.modo === 'coop' || G.modo === 'equipos');
const esSup = () => G.modo === 'supervivencia' || G.modo === 'coop';
const BAJAS_PARA_GANAR = 20, TIEMPO_EQUIPOS = 300;
const TIPO_LISTA = Object.keys(TIPOS), ITEM_LISTA = ['municion', 'botiquin', 'granada'];
const PERSONALES = new Set(['herido', 'hit', 'vacio', 'click', 'recarga', 'cambio', 'item', 'derrota', 'victoria']);
const salaURL = (() => { try { const s = new URLSearchParams(location.search).get('sala'); return s ? s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) : ''; } catch (e) { return ''; } })();

// Los sonidos del anfitrión se mandan a los demás
const _play = Snd.play.bind(Snd);
Snd.play = function (n, v = 1) { _play(n, v); if (RED.host && MP() && !PERSONALES.has(n) && RED.ev.length < 24) RED.ev.push([n, Math.round(v * 100) / 100]); };

// Lo que cada jugador manda a la sala: operador, camuflaje, nivel y armas equipadas
function equipoLocalSala() { const e = equipoLocal(); return { op: e.op, camo: e.camo, nivel: e.nivel, ar: e.ar }; }
// El anfitrión no confía en lo que llega: sólo acepta cosas que existen en el catálogo
function sanearEquipo(d) {
  const op = OPERADOR_POR_ID(d.op).id, camo = CAMO_POR_ID(d.camo).id, ar = { 0: {}, 1: {}, 2: {} };
  for (const i of [0, 1, 2]) { const e = d.ar && d.ar[i]; if (e && typeof e === 'object') for (const slot of Object.keys(e)) if (typeof e[slot] === 'string' && e[slot].length < 20) ar[i][slot] = e[slot]; }
  return { op, camo, nivel: clamp(+d.nivel || 1, 1, NIVEL_MAX), ar };
}
function miNombre() { try { return localStorage.getItem('faro_nombre') || 'SOLDADO'; } catch (e) { return 'SOLDADO'; } }
function limpiarNombre(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÑ ]/g, '').trim().slice(0, 10) || 'SOLDADO'; }
const vidaNivel = n => 100 + (n >= 2 ? 10 : 0) + (n >= 7 ? 10 : 0) + (n >= 10 ? 15 : 0);
const distJugadores = (x, y) => { const lista = MP() ? jugadores.filter(j => !j.muerto) : [P]; let m = 1e9; for (const j of lista) m = Math.min(m, dist(x, y, j.x, j.y)); return m; };
function masCercano(x, y, filtro) { let m = null, bd = 1e9; for (const j of jugadores) { if (!filtro(j)) continue; const d = dist(x, y, j.x, j.y); if (d < bd) { bd = d; m = j; } } return m; }
function avisoTodos(txt, color = '#ffffff') { G.toasts.push({ txt, color, k: 0 }); if (G.toasts.length > 3) G.toasts.shift(); if (RED.host) todos({ t: 'toast', txt, color }); }

// ---------- Entrada (teclado, mouse, táctil) convertida en "comandos" ----------
function entradaLocal() {
  let ix = 0, iy = 0;
  if (teclas.KeyW || teclas.ArrowUp) iy--; if (teclas.KeyS || teclas.ArrowDown) iy++;
  if (teclas.KeyA || teclas.ArrowLeft) ix--; if (teclas.KeyD || teclas.ArrowRight) ix++;
  if (touch.mov) { const dx = touch.mov.x - touch.mov.ox, dy = touch.mov.y - touch.mov.oy; ix += dx / 24; iy += dy / 24; }
  const L = Math.hypot(ix, iy); if (L > 1) { ix /= L; iy /= L; }
  const correr = !!(teclas.ShiftLeft || teclas.ShiftRight) || !!(touch.mov && L > 1.6);
  let ang = P.ang, fuego = mouse.abajo, ax = null, ay = null, apTouch = false;
  if (touch.activo) {
    apTouch = true; fuego = false;
    // Joystick derecho: hacia donde lo empujás, apuntás Y disparás al mismo tiempo.
    if (touch.apu) {
      const dx = touch.apu.x - touch.apu.ox, dy = touch.apu.y - touch.apu.oy, d = Math.hypot(dx, dy);
      if (d > 3) { ang = asistirMira(Math.atan2(dy, dx)); fuego = true; }
    }
    else if (L > 0.2) ang = Math.atan2(iy, ix);
  } else { ax = cam.x + mouse.x; ay = cam.y + mouse.y; ang = Math.atan2(ay - P.y, ax - P.x); }
  return { ix, iy, correr, ang, fuego, ax, ay, apTouch };
}
// Ayuda de puntería para el celular: si hay un enemigo cerca de donde apuntás, la mira se le pega
function asistirMira(ang) {
  const blancos = G.modo === 'equipos' ? jugadores.filter(o => o.equipo !== P.equipo && !o.muerto) : enemigos;
  let mejor = ang, md = 0.4;
  for (const e of blancos) {
    const d = dist(P.x, P.y, e.x, e.y); if (d > 280 || e.muerto) continue;
    const a = Math.atan2(e.y - P.y, e.x - P.x), dif = Math.abs(angDif(ang, a));
    if (dif < md && hayVision(P.x, P.y, e.x, e.y)) { md = dif; mejor = a; }
  }
  return mejor;
}
// Dónde se dibujan los joysticks cuando no los estás tocando
const baseMov = () => ({ x: 62, y: VH - 92 }), baseApu = () => ({ x: VW - 118, y: VH - 92 });
function moverJugador(j, inp, dt) {
  if (!inp) inp = { ix: 0, iy: 0, ang: j.ang };
  j.inv = Math.max(0, (j.inv || 0) - dt);
  j.corriendo = !!inp.correr;
  const vel = 88 * (j.corriendo ? 1.45 : 1) * (j.velMul || 1) * (j.W ? j.W[j.arma].mov : 1);
  if (!j.oculto) {
    const ox = j.x, oy = j.y;
    j.x += inp.ix * vel * dt; j.y += inp.iy * vel * dt; resolver(j);
    j.vx = (j.x - ox) / dt; j.vy = (j.y - oy) / dt; j.paso += Math.hypot(j.x - ox, j.y - oy);
  }
  if (inp.ang != null) j.ang = inp.ang;
  j.ax = inp.ax; j.ay = inp.ay; j.apTouch = inp.apTouch;
  j.cd -= dt;
  if (j.recarga > 0) { j.recarga -= dt; if (j.recarga <= 0) { j.recarga = 0; finRecarga(); } }
  if (inp.fuego && !j.oculto) disparar();
  // Regeneración estilo COD: si no te pegan por 3.5s, te curás
  j.ultGolpe += dt;
  if (j.ultGolpe > 3.5 && j.hp < j.maxhp) j.hp = Math.min(j.maxhp, j.hp + 30 * (j.regenMul || 1) * dt);
}
function recogerItems(j) {
  for (const it of items) {
    if (it.k <= 0 || j.oculto || dist(it.x, it.y, j.x, j.y) >= 12) continue;
    it.k = -1;
    if (it.tipo === 'municion') { j.mun[1].res += 30; j.mun[2].res += 4; pop(j.x, j.y - 12, '+MUNICIÓN', '#a0ff80'); }
    if (it.tipo === 'botiquin') { j.hp = Math.min(j.maxhp, j.hp + 40); pop(j.x, j.y - 12, '+VIDA', '#ff9090'); }
    if (it.tipo === 'granada') { j.gran = Math.min(5, j.gran + 1); pop(j.x, j.y - 12, '+GRANADA', '#ffe060'); }
    if (j === YO || !MP()) Snd.play('item');
  }
}
const ACCIONES = new Set(['1', '2', '3', 'q', 'r', 'g', 'e', 'z', 'x', 'c']);
function hacerAccion(a) {
  switch (a) {
    case '1': cambiarArma(0); break; case '2': cambiarArma(1); break; case '3': cambiarArma(2); break;
    case 'q': cambiarArma(P.arma + 1); break; case 'r': recargar(); break; case 'g': tirarGranada(); break;
    case 'e': usarCaja(); break; case 'z': usarRacha('dron'); break; case 'x': usarRacha('aereo'); break; case 'c': usarRacha('torreta'); break;
  }
}
// Botones y teclas pasan por acá: si sos invitado, la acción viaja al anfitrión
function accion(a) { if (RED.cliente) { if (ACCIONES.has(a)) RED.acc.push(a); } else hacerAccion(a); }

// ---------- Bots (los maneja la compu) ----------
function entradaBot(j, dt) {
  j.botT = (j.botT || 0) - dt;
  if (j.botT <= 0) {
    j.botT = rand(0.15, 0.3);
    const cands = G.modo === 'equipos' ? jugadores.filter(o => !o.muerto && o.equipo !== j.equipo) : enemigos;
    let obj = null, bd = 1e9;
    for (const o of cands) { const d = dist(j.x, j.y, o.x, o.y); if (d < bd) { bd = d; obj = o; } }
    j.obj = obj; j.objVis = !!obj && bd < 260 && hayVision(j.x, j.y, obj.x, obj.y);
    if (Math.random() < 0.25) j.strafe = Math.random() < 0.5 ? -1 : 1;
    if (j.mun[j.arma].c <= 0 && j.arma !== 1) cambiarArma(1);
  }
  let ix = 0, iy = 0, fuego = false, ang = j.ang;
  const o = j.obj;
  if (o && !o.muerto) {
    const dx = o.x - j.x, dy = o.y - j.y, d = Math.hypot(dx, dy) || 1, directo = Math.atan2(dy, dx);
    if (j.objVis) {
      const quiere = directo + Math.sin(NOW * 2.3 + j.semilla) * 0.12;      // no tienen puntería perfecta
      ang = j.ang + angDif(j.ang, quiere) * Math.min(1, dt * 7);
      fuego = Math.abs(angDif(ang, directo)) < 0.3;
      if (d > 160) { ix = dx / d; iy = dy / d; } else if (d < 70) { ix = -dx / d; iy = -dy / d; }
      const s = j.strafe || 1; ix += -dy / d * s * 0.7; iy += dx / d * s * 0.7;
    } else {
      const c = G.modo === 'equipos' ? dirCampo(j, campoEq[j.equipo]) : null;
      if (c) { ix = c.x; iy = c.y; } else { ix = dx / d; iy = dy / d; }
      ang = Math.atan2(iy, ix);
    }
  } else if (G.modo === 'coop') {   // sin enemigos: sigue a un compañero humano
    const lider = masCercano(j.x, j.y, x => !x.bot && !x.muerto);
    if (lider && dist(j.x, j.y, lider.x, lider.y) > 50) { const dx = lider.x - j.x, dy = lider.y - j.y, d = Math.hypot(dx, dy); ix = dx / d; iy = dy / d; ang = Math.atan2(dy, dx); }
  }
  const L = Math.hypot(ix, iy); if (L > 1) { ix /= L; iy /= L; }
  return { ix, iy, correr: false, ang, fuego, ax: o ? o.x : null, ay: o ? o.y : null };
}

// ---------- Bajas, caídas y reaparición ----------
function darXp(k, n) {
  if (!k || k.bot) return;
  if (k === YO) { G.xpPartida += ganarXp(n); }
  else if (k.conn) enviar(k.conn, { t: 'xp', n });
}
function avisarHit(id, baja) { const k = jugadores.find(o => o.id === id); if (k && k.conn) enviar(k.conn, { t: 'hm', baja: !!baja }); }
function acreditarBaja(id, pts, cuentaRacha) {
  const k = jugadores.find(o => o.id === id); if (!k) return;
  k.bajas = (k.bajas || 0) + 1; darXp(k, pts); if (k === YO) sumarStat('bajas');
  if (k === YO) { G.hitBaja = true; G.hitmark = 0.25; } else avisarHit(id, true);
  if (cuentaRacha) {
    P = k; S = k.S; G.racha = k.racha; sumarRacha(); k.racha = G.racha;
    P = YO; S = YO.S; G.racha = YO.racha;
  }
}
function caer(j, quien) {
  j.muerto = true; j.hp = 0; j.muertes = (j.muertes || 0) + 1; j.respT = G.modo === 'equipos' ? 4 : 12;
  for (let i = 0; i < 16; i++) particulas.push({ x: j.x, y: j.y, vx: rand(-60, 60), vy: rand(-60, 60), vida: 0.8, max: 0.8, c: colorJ(j).c, s: 2, roce: 4 });
  items.push({ x: j.x, y: j.y, tipo: 'municion', k: 20 });
  if (j === YO) Snd.play('derrota');
  const k = jugadores.find(o => o.id === quien);
  if (G.modo === 'equipos') {
    if (k && k.equipo !== j.equipo) { acreditarBaja(k.id, 100, true); G.marc[k.equipo]++; pushFeed(k.nombre, 'ARMA', j.nombre); avisoTodos(`${k.nombre} eliminó a ${j.nombre}`, k.equipo === 'verde' ? '#80ff80' : '#ff8080'); }
    else avisoTodos(`${j.nombre} cayó`, '#c0c0c0');
  } else {
    avisoTodos(`${j.nombre} cayó · vuelve en ${j.respT}s`, '#ff9090');
    if (jugadores.every(o => o.muerto)) {
      G.estado = 'muerto'; G.muerteT = 0; G.fase = 'fin'; cerrarPartida();
      if ((G.olasSup || 0) > recordSup) { recordSup = G.olasSup; try { localStorage.setItem('faro_record_sup', recordSup); } catch (e) {} }
    }
  }
}
function puntoBase(j) {
  if (G.modo === 'equipos') {
    const x = j.equipo === 'verde' ? rand(930, 990) : rand(1710, 1770);
    for (let i = 0; i < 30; i++) { const y = caminoY(x) + rand(-40, 40); if (!circuloBloqueado(x, y, 8)) return { x, y }; }
    return { x, y: caminoY(x) };
  }
  const vivo = jugadores.find(o => !o.muerto && o !== j);
  const cx = vivo ? vivo.x : 3060, cy = vivo ? vivo.y : 450;
  for (let i = 0; i < 30; i++) { const x = cx + rand(-40, 40), y = cy + rand(-40, 40); if (!circuloBloqueado(x, y, 8)) return { x, y }; }
  return { x: 3060, y: 450 };
}
function reaparecer(j) {
  const p = puntoBase(j);
  Object.assign(j, { x: p.x, y: p.y, muerto: false, hp: j.maxhp, ultGolpe: 99, recarga: 0, inv: 2.5 });
  j.mun[1].res = Math.max(j.mun[1].res, 90); j.mun[1].c = j.W[1].cargador; j.gran = Math.max(j.gran, 2);
}
function reabastecerTodos() {
  for (const j of jugadores) { j.mun[1].res = Math.max(j.mun[1].res, 180); j.mun[2].res = Math.max(j.mun[2].res, 30); j.gran = Math.max(j.gran, 3); if (!j.muerto) j.hp = j.maxhp; }
  avisoTodos('¡REABASTECIMIENTO PARA TODOS!', '#a0ff80'); Snd.play('item');
}
function actualizarEquipos(dt) {
  if (G.modo !== 'equipos' || G.estado !== 'jugando') return;
  G.tiempoEq -= dt;
  if (G.marc.verde >= BAJAS_PARA_GANAR || G.marc.rojo >= BAJAS_PARA_GANAR || G.tiempoEq <= 0) {
    G.estado = 'finEq'; G.ganoT = 0; cerrarPartida();
    G.ganador = G.marc.verde > G.marc.rojo ? 'verde' : G.marc.rojo > G.marc.verde ? 'rojo' : 'empate';
    if (YO && G.ganador === YO.equipo) darXp(YO, 500);
    for (const j of jugadores) if (j !== YO && j.equipo === G.ganador) darXp(j, 500);
    Snd.play('victoria');
  }
}

// ---------- Armar la partida ----------
function nuevoSoldado(s, p) {
  const j = nuevoJugador(p.x, p.y, { op: s.op, ar: s.ar, camo: s.camo, nivel: s.nivel });
  Object.assign(j, { id: s.id, nombre: s.nombre, equipo: s.equipo, bot: !!s.bot, S: { dron: false, aereo: false, torreta: false },
    racha: 0, bajas: 0, muertes: 0, acc: [], inp: null, semilla: Math.random() * 10, inv: 2 });
  j.conn = RED.conns.find(c => c.peer === s.id) || null;
  if (j.bot) { j.mun[1].res = 9999; j.mun[2].res = 999; }
  return j;
}
function empezarMP() {
  const modo = RED.salaModo; sumarStat('partidas');
  construirMapa(); pintarMundo(); construirGrilla(); campoT = 0;
  G = nuevoEstado(); G.modo = modo; G.marc = { verde: 0, rojo: 0 }; G.tiempoEq = TIEMPO_EQUIPOS;
  // bots de la compu
  const lista = RED.sala.map(s => ({ ...s }));
  for (let i = 0; i < RED.bots; i++) {
    const v = lista.filter(s => s.equipo === 'verde').length, r = lista.filter(s => s.equipo === 'rojo').length;
    lista.push({ id: 'bot' + i, nombre: 'BOT ' + (i + 1), equipo: modo === 'coop' ? 'verde' : (v <= r ? 'verde' : 'rojo'), camo: ['desierto', 'nieve', 'noche', 'jungla'][i % 4], op: ['sombra', 'viper', 'hielo', 'cobra'][i % 4], ar: {}, nivel: 20 + i * 3, bot: true });
  }
  if (modo === 'coop') lista.forEach(s => s.equipo = 'verde');
  jugadores = [];
  portones.forEach(p => p.abierto = modo === 'coop');
  for (const s of lista) {
    const tmp = { equipo: s.equipo };
    const p = modo === 'coop' ? { x: 3060 + rand(-30, 30), y: 450 + rand(-30, 30) } : (G.modo = modo, puntoBase(tmp));
    const j = nuevoSoldado(s, p); resolver(j); jugadores.push(j);
  }
  YO = jugadores[0]; P = YO; S = YO.S;
  G.estado = 'jugando';
  if (modo === 'coop') {
    G.zona = 3; G.fase = 'banner'; G.faseT = 3.5; G.ola = 0;
    banner('COOPERATIVO', 'Todos juntos contra la compu', 3);
    radio('Escuadrón, defiendan el faro. Vienen oleadas sin fin. ¡Cúbranse entre ustedes!');
  } else {
    G.zona = 1; G.fase = 'equipos';
    banner('VERDE vs ROJO', `Gana el primer equipo con ${BAJAS_PARA_GANAR} bajas`, 3);
  }
  cam.x = clamp(YO.x - VW / 2, 0, WW - VW); cam.y = clamp(YO.y - VH / 2, 0, WH - VH);
  todos({ t: 'start', modo, lista: jugadores.map(j => ({ id: j.id, nombre: j.nombre, equipo: j.equipo, camo: j.camoId, op: j.op, bot: j.bot })) });
}

// ---------- Conexión ----------
let Peer = null;
async function cargarPeer() { if (!Peer) Peer = (await import('peerjs')).Peer; }
const codigoAzar = () => { const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += L[Math.random() * L.length | 0]; return s; };
const idSala = c => 'faro-nocturno-sala-' + c.toLowerCase();
function enviar(c, msg) { try { if (c && c.open) c.send(msg); } catch (e) {} }
function todos(msg) { for (const c of RED.conns) enviar(c, msg); }
function linkSala() { return location.origin + location.pathname + '?sala=' + RED.codigo; }

async function crearSala() {
  Snd.init();
  Object.assign(RED, { activo: true, host: true, cliente: false, conns: [], estado: 'conectando', error: '', sala: [] });
  G.estado = 'sala';
  try { await cargarPeer(); } catch (e) { RED.estado = 'error'; RED.error = 'No se pudo cargar el modo online. ¿Hay internet?'; return; }
  const intentar = () => {
    RED.codigo = codigoAzar();
    let peer;
    try { peer = RED.peer = new Peer(idSala(RED.codigo)); } catch (e) { RED.estado = 'error'; RED.error = 'Este navegador no permite jugar online.'; return; }
    peer.on('open', () => { RED.estado = 'listo'; });
    peer.on('error', err => {
      if (err.type === 'unavailable-id') { peer.destroy(); intentar(); return; }
      if (RED.estado !== 'listo') { RED.estado = 'error'; RED.error = 'No se pudo crear la sala (' + err.type + ').'; }
    });
    peer.on('connection', conn => {
      conn.on('open', () => { RED.conns.push(conn); });
      conn.on('data', d => hostRecibe(conn, d));
      conn.on('close', () => hostSeFue(conn));
    });
  };
  RED.sala = [{ id: 'host', nombre: miNombre(), equipo: 'verde', ...equipoLocalSala() }];
  RED.miId = 'host';
  intentar();
}
async function unirseSala(codigo) {
  Snd.init();
  Object.assign(RED, { activo: true, host: false, cliente: true, codigo, estado: 'conectando', error: '', sala: [], acc: [] });
  G.estado = 'sala';
  try { await cargarPeer(); } catch (e) { RED.estado = 'error'; RED.error = 'No se pudo cargar el modo online. ¿Hay internet?'; return; }
  let peer;
  try { peer = RED.peer = new Peer(); } catch (e) { RED.estado = 'error'; RED.error = 'Este navegador no permite jugar online.'; return; }
  peer.on('open', id => {
    RED.miId = id;
    const conn = RED.conn = peer.connect(idSala(codigo), { reliable: true });
    conn.on('open', () => { RED.estado = 'listo'; RED.error = ''; enviar(conn, { t: 'hola', nombre: miNombre(), ...equipoLocalSala() }); });
    conn.on('data', d => clienteRecibe(d));
    conn.on('close', () => desconectado('Se cortó la conexión con la sala.'));
    setTimeout(() => { if (RED.estado === 'conectando') { RED.estado = 'error'; RED.error = `No se encontró la sala ${codigo}.`; } }, 30000);
  });
  peer.on('error', err => { if (RED.estado !== 'listo' || err.type === 'peer-unavailable') { RED.estado = 'error'; RED.error = err.type === 'peer-unavailable' ? `No existe la sala ${codigo}. ¿Está bien el código?` : 'Error de conexión (' + err.type + ').'; } });
}
function salirRed() {
  try { if (RED.conn) RED.conn.close(); } catch (e) {}
  for (const c of RED.conns) { try { c.close(); } catch (e) {} }
  try { if (RED.peer) RED.peer.destroy(); } catch (e) {}
  Object.assign(RED, { activo: false, host: false, cliente: false, peer: null, conns: [], conn: null, estado: '', sala: [], ev: [] });
  jugadores = []; YO = null;
  try { if (location.search.includes('sala=')) history.replaceState(null, '', location.pathname); } catch (e) {}
  irTitulo(); P = nuevoJugador(220, 425);
}
function desconectado(msg) { if (!RED.activo) return; salirRed(); G.aviso = msg; }

function hostRecibe(conn, d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hola') {
    if (RED.sala.find(s => s.id === conn.peer)) return;
    const v = RED.sala.filter(s => s.equipo === 'verde').length, r = RED.sala.length - v;
    const s = { id: conn.peer, nombre: limpiarNombre(d.nombre), equipo: v <= r ? 'verde' : 'rojo', ...sanearEquipo(d) };
    if (RED.sala.length >= 8) { enviar(conn, { t: 'lleno' }); return; }
    RED.sala.push(s); Snd.play('item');
    G.toasts.push({ txt: `${s.nombre} entró a la sala`, color: '#80c0ff', k: 0 });
    if (MP() && (G.estado === 'jugando')) {   // se suma con la partida empezada
      if (G.modo === 'coop') s.equipo = 'verde';
      const p = G.modo === 'coop' ? puntoBase({}) : puntoBase({ equipo: s.equipo });
      jugadores.push(nuevoSoldado(s, p));
      enviar(conn, { t: 'start', modo: G.modo, lista: jugadores.map(j => ({ id: j.id, nombre: j.nombre, equipo: j.equipo, camo: j.camoId, op: j.op, bot: j.bot })) });
      avisoTodos(`${s.nombre} se sumó a la partida`, '#80c0ff');
    }
    return;
  }
  if (d.t === 'nombre') { const s = RED.sala.find(s => s.id === conn.peer); if (s) s.nombre = limpiarNombre(d.nombre); return; }
  if (d.t === 'in') {
    const j = jugadores.find(o => o.id === conn.peer); if (!j) return;
    const n = (v, a, b) => clamp(+v || 0, a, b);
    j.inp = { ix: n(d.ix, -1, 1), iy: n(d.iy, -1, 1), correr: !!d.correr, ang: n(d.ang, -7, 7), fuego: !!d.fuego,
      ax: d.ax == null ? null : n(d.ax, 0, WW), ay: d.ay == null ? null : n(d.ay, 0, WH), apTouch: !!d.apTouch };
    if (Array.isArray(d.acc)) for (const a of d.acc.slice(0, 8)) if (ACCIONES.has(a)) j.acc.push(a);
  }
}
function hostSeFue(conn) {
  RED.conns = RED.conns.filter(c => c !== conn);
  const s = RED.sala.find(s => s.id === conn.peer);
  RED.sala = RED.sala.filter(s => s.id !== conn.peer);
  const j = jugadores.find(o => o.id === conn.peer);
  if (j) { j.bot = true; j.conn = null; j.nombre = (j.nombre + '').slice(0, 7) + ' BOT'; j.mun[1].res = 9999; }
  if (s) G.toasts.push({ txt: `${s.nombre} se fue`, color: '#c0c0c0', k: 0 });
}

// Foto del juego que el anfitrión manda 20 veces por segundo
function fotoJuego() {
  const r1 = v => Math.round(v), r2 = v => Math.round(v * 100) / 100;
  return {
    t: 'st',
    g: [G.estado, G.fase, r2(G.faseT), G.ola, G.cola.length, G.pts, G.marc.verde, G.marc.rojo, r1(G.tiempoEq || 0), G.olasSup || 0,
      G.jefe && !G.jefe.muerto ? [r1(G.jefe.hp), r1(G.jefe.maxhp)] : 0, G.zona, G.ganador || ''],
    bn: G.banner ? [G.banner.t, G.banner.sub, G.banner.dur, r2(G.banner.k)] : 0,
    rd: G.radio ? [G.radio.quien, G.radio.txt, G.radio.dur, r2(G.radio.k)] : 0,
    j: jugadores.map(j => [j.id, r1(j.x), r1(j.y), r2(j.ang), Math.ceil(j.hp), j.maxhp, j.arma, j.muerto ? 1 : 0, r1(j.paso), Math.ceil(j.respT || 0), j.bajas || 0, j.muertes || 0, j.inv > 0 ? 1 : 0]),
    e: enemigos.map(e => [e.id, TIPO_LISTA.indexOf(e.tipo), r1(e.x), r1(e.y), r2(e.ang), Math.round(100 * e.hp / e.maxhp), e.flash > 0 ? 1 : 0,
      (!e.T.melee && e.vis && e.disCd < (e.T.sniper ? 1.3 : 0.45)) ? r2(e.disCd) : -1, r1(e.paso)]),
    b: balas.map(b => [r1(b.x), r1(b.y), r1(b.vx), r1(b.vy), b.duenio === 'e' ? 1 : 0]),
    it: items.map(i => [r1(i.x), r1(i.y), ITEM_LISTA.indexOf(i.tipo), r1(i.k)]),
    gr: granadas.map(g => [r1(g.x), r1(g.y), r1(g.z), g.enemiga ? 1 : 0]),
    ex: explosiones.map(e => [r1(e.x), r1(e.y), e.r, r2(e.k)]),
    fo: fogonazos.map(f => [r1(f.x), r1(f.y), r1(f.r), r2(f.k), f.max || 0]),
    dr: drones.map(d => [r1(d.x), r1(d.y)]), to: torretas.map(t => [r1(t.x), r1(t.y), r2(t.ang || 0)]),
    at: ataques.map(a => [r1(a.x), r1(a.y), r2(a.ang)]), jt: jets.map(j => [r1(j.x), r1(j.y), r2(j.ang)]),
    es: estaciones.map(e => Math.ceil(e.cd)),
    fd: G.feed.map(f => [f.quien, f.arma, f.objetivo, Math.round(f.k * 10) / 10]), al: G.alerta ? G.alerta.txt : '',
    ev: RED.ev.splice(0),
  };
}
function datosPrivados(j) {
  return { mun: j.mun.map(m => [m.c, m.res === Infinity ? -1 : m.res]), gran: j.gran, arma: j.arma, racha: j.racha, S: j.S, rec: Math.round((j.recarga || 0) * 100) / 100 };
}
let idEnemigo = 1;
function redTick(dt) {
  RED.envT -= dt; RED.salaT -= dt;
  if (RED.host) {
    if (G.estado === 'sala' && RED.salaT <= 0) { RED.salaT = 0.4; todos({ t: 'sala', sala: RED.sala, modo: RED.salaModo, bots: RED.bots }); }
    if (MP() && RED.envT <= 0) {
      RED.envT = 0.05;
      for (const e of enemigos) if (!e.id) e.id = idEnemigo++;
      const base = fotoJuego();
      for (const c of RED.conns) { const j = jugadores.find(o => o.id === c.peer); enviar(c, j ? { ...base, yo: datosPrivados(j) } : base); }
    }
  } else if (RED.cliente && MP() && RED.envT <= 0 && YO) {
    RED.envT = 1 / 30;
    const inp = G.pausaLocal ? { ix: 0, iy: 0, ang: YO.ang } : entradaLocal();
    enviar(RED.conn, { t: 'in', ...inp, acc: RED.acc.splice(0) });
  }
}

// ---------- Lado del invitado ----------
function clienteRecibe(d) {
  if (!d || typeof d !== 'object') return;
  switch (d.t) {
    case 'sala':
      RED.sala = d.sala || []; RED.salaModo = d.modo; RED.bots = d.bots;
      // El anfitrión volvió a la sala después de la partida: nosotros también
      if (['muerto', 'finEq'].includes(G.estado)) { G = nuevoEstado(); G.estado = 'sala'; jugadores = []; YO = null; P = nuevoJugador(220, 425); S = { dron: false, aereo: false, torreta: false }; }
      break;
    case 'lleno': RED.estado = 'error'; RED.error = 'La sala está llena (máximo 8).'; break;
    case 'start':
      sumarStat('partidas');
      construirMapa(); pintarMundo(); construirGrilla();
      G = nuevoEstado(); G.modo = d.modo; G.marc = { verde: 0, rojo: 0 }; G.estado = 'jugando';
      portones.forEach(p => p.abierto = d.modo === 'coop');
      RED.lista = d.lista || []; jugadores = []; YO = null; P = nuevoJugador(3060, 450);
      break;
    case 'st': aplicarFoto(d); break;
    case 'toast': G.toasts.push({ txt: String(d.txt).slice(0, 60), color: d.color, k: 0 }); if (G.toasts.length > 3) G.toasts.shift(); break;
    case 'xp': { const n = clamp(+d.n || 0, 0, 3000); G.xpPartida += ganarXp(n); break; }
    case 'hm': G.hitmark = d.baja ? 0.25 : 0.15; G.hitBaja = !!d.baja; _play('hit'); break;
  }
}
function aplicarFoto(d) {
  if (!MP()) return;
  const g = d.g;
  if ((g[0] === 'muerto' || g[0] === 'finEq') && !G.cerrada) cerrarPartida();
  if (['jugando', 'muerto', 'finEq'].includes(g[0])) { if (g[0] === 'muerto' && G.estado !== 'muerto') G.muerteT = 0; if (g[0] === 'finEq' && G.estado !== 'finEq') G.ganoT = 0; G.estado = g[0]; }
  G.fase = g[1]; G.faseT = g[2]; G.ola = g[3]; G.cola = new Array(g[4]); G.pts = g[5]; G.marc = { verde: g[6], rojo: g[7] }; G.tiempoEq = g[8];
  G.olasSup = g[9]; G.jefe = g[10] ? { hp: g[10][0], maxhp: g[10][1], muerto: false } : null; G.zona = g[11]; G.ganador = g[12];
  const bk = d.bn ? d.bn[0] + d.bn[1] : ''; if (bk && bk !== RED.bannerKey) G.banner = { t: d.bn[0], sub: d.bn[1], dur: d.bn[2], k: d.bn[3] }; RED.bannerKey = bk;
  const rk = d.rd ? d.rd[1] : ''; if (rk && rk !== RED.radioKey) G.radio = { quien: d.rd[0], txt: d.rd[1], dur: d.rd[2], k: d.rd[3] }; RED.radioKey = rk;
  // jugadores
  const prev = new Map(jugadores.map(j => [j.id, j]));
  jugadores = d.j.map(a => {
    let j = prev.get(a[0]);
    if (!j) {
      const info = (RED.lista || []).find(s => s.id === a[0]) || {};
      j = nuevoJugador(a[1], a[2]); Object.assign(j, { id: a[0], nombre: info.nombre || '?', equipo: info.equipo || 'verde', camoId: info.camo, op: info.op, bot: !!info.bot, S: {} });
    }
    j.tx = a[1]; j.ty = a[2]; if (j.id !== RED.miId) j.ang = a[3];
    const hpAntes = j.hp; j.hp = a[4]; j.maxhp = a[5]; j.arma = a[6];
    if (j.id === RED.miId && j.hp < hpAntes && !j.muerto) { G.rojo = Math.min(0.5, G.rojo + 0.25); G.shake = Math.max(G.shake, 3); _play('herido'); }
    j.muerto = !!a[7]; j.paso = a[8]; j.respT = a[9]; j.bajas = a[10]; j.muertes = a[11]; j.inv = a[12] ? 1 : 0;
    if (!prev.has(a[0]) || Math.hypot(j.x - j.tx, j.y - j.ty) > 80) { j.x = j.tx; j.y = j.ty; }
    return j;
  });
  YO = jugadores.find(j => j.id === RED.miId) || YO;
  if (YO) {
    P = YO;
    if (d.yo) { YO.mun = d.yo.mun.map(m => ({ c: m[0], res: m[1] < 0 ? Infinity : m[1] })); YO.gran = d.yo.gran; YO.arma = d.yo.arma; G.racha = d.yo.racha; S = d.yo.S || S; YO.recarga = d.yo.rec; }
  }
  // enemigos
  const pe = new Map(enemigos.map(e => [e.id, e]));
  enemigos = d.e.map(a => {
    let e = pe.get(a[0]);
    const tipo = TIPO_LISTA[a[1]];
    if (!e) e = { id: a[0], tipo, T: TIPOS[tipo], r: TIPOS[tipo].r, x: a[2], y: a[3], maxhp: 100 };
    e.tx = a[2]; e.ty = a[3]; e.ang = a[4]; e.hp = a[5]; e.flash = a[6] ? 0.05 : 0; e.vis = a[7] >= 0; e.disCd = a[7] >= 0 ? a[7] : 9; e.paso = a[8];
    return e;
  });
  balas = d.b.map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3], duenio: a[4] ? 'e' : 'j' }));
  items = d.it.map(a => ({ x: a[0], y: a[1], tipo: ITEM_LISTA[a[2]], k: a[3] }));
  granadas = d.gr.map(a => ({ x: a[0], y: a[1], z: a[2], enemiga: !!a[3] }));
  explosiones = d.ex.map(a => ({ x: a[0], y: a[1], r: a[2], k: a[3] }));
  fogonazos = d.fo.map(a => ({ x: a[0], y: a[1], r: a[2], k: a[3], max: a[4] || undefined }));
  drones = d.dr.map(a => ({ x: a[0], y: a[1] })); torretas = d.to.map(a => ({ x: a[0], y: a[1], ang: a[2] }));
  ataques = d.at.map(a => ({ x: a[0], y: a[1], ang: a[2] })); jets = d.jt.map(a => ({ x: a[0], y: a[1], ang: a[2], k: 1 }));
  d.es.forEach((cd, i) => { if (estaciones[i]) estaciones[i].cd = cd; });
  G.feed = (d.fd || []).map((a, i) => ({ id: a[0] + a[2] + i, quien: a[0], arma: a[1], objetivo: a[2], k: a[3] }));
  G.alerta = d.al ? { txt: String(d.al), t: 2 } : null;
  for (const [n, v] of d.ev || []) if (typeof n === 'string') _play(n, v);
}
function actualizarCliente(dt) {
  if (G.estado === 'jugando') G.tiempo += dt;
  G.rojo = Math.max(0, G.rojo - dt * 0.8); G.hitmark -= dt; G.retroceso = Math.max(0, G.retroceso - dt * 8);
  if (G.estado === 'muerto') G.muerteT += dt;
  if (G.estado === 'finEq') G.ganoT += dt;
  const k = Math.min(1, dt * 15);
  for (const j of jugadores) if (j.tx != null) { j.x = lerp(j.x, j.tx, k); j.y = lerp(j.y, j.ty, k); }
  for (const e of enemigos) if (e.tx != null) { e.x = lerp(e.x, e.tx, k); e.y = lerp(e.y, e.ty, k); }
  for (const b of balas) { b.x += b.vx * dt; b.y += b.vy * dt; }
  if (YO && !YO.muerto && !G.pausaLocal) { const inp = entradaLocal(); YO.ang = inp.ang; if (inp.fuego && YO.mun[YO.arma].c > 0 && YO.recarga <= 0) G.retroceso = Math.min(4, G.retroceso + 0.3); }
  actualizarEfectos(dt);
  if (YO) { P = YO; moverCamara(dt); }
}

// ---------- Pantallas de multijugador ----------
// ---------- Lluvia y relámpagos (por encima del mundo) ----------
function dibujarLluvia() {
  const w = cv.width, h = cv.height, t = NOW;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = 'rgba(170,200,230,0.20)'; ctx.lineWidth = Math.max(1, DPR * 0.8); ctx.beginPath();
  for (let i = 0; i < 110; i++) {
    const sx = ((i * 7919) % 1009) / 1009, sy = ((i * 104729) % 1013) / 1013, v = 0.7 + ((i * 31) % 10) / 14;
    const x = (((sx - t * 0.05 * v) % 1) + 1) % 1 * w, y = ((sy + t * 0.9 * v) % 1) * h;
    ctx.moveTo(x, y); ctx.lineTo(x - 5 * DPR, y + 20 * DPR * v);
  }
  ctx.stroke();
  const ciclo = t % 26;                      // un relámpago cada tanto
  if (ciclo < 0.3) { ctx.fillStyle = `rgba(190,215,255,${0.16 * (1 - ciclo / 0.3)})`; ctx.fillRect(0, 0, w, h); }
  ctx.restore();
}

// ---------- Puente con la interfaz (React) ----------
// El motor publica una "foto" del estado ~15 veces por segundo; React la dibuja. React le manda órdenes con API.
const oyentes = new Set();
let foto = {}, fps = 60, idSeq = 0;
export const DATOS = { DIFICULTADES, ZONAS: ZONAS.map(z => ({ nombre: z.nombre })), BAJAS_PARA_GANAR };

const rumboA = (dx, dy) => Math.round(((Math.atan2(dy, dx) * 180 / Math.PI) + 90 + 360) % 360);   // 0 = norte (arriba), 90 = este
function objetivoInfo(yo) {
  let tx = null, ty = null, texto = '';
  const masCerca = lista => { let m = null, bd = 1e9; for (const o of lista) { const d = dist(yo.x, yo.y, o.x, o.y); if (d < bd) { bd = d; m = o; } } return m; };
  if (G.modo === 'equipos') texto = 'ELIMINÁ AL EQUIPO CONTRARIO';
  else if (G.modo === 'tiro') { texto = 'PRACTICÁ TU PUNTERÍA EN LOS BLANCOS'; const b = masCerca(enemigos.filter(e => e.T.estatico)); if (b) { tx = b.x; ty = b.y; } }
  else if (G.fase === 'ola') { texto = `ELIMINÁ A LOS HOSTILES (${enemigos.length + G.cola.length})`; const e = masCerca(enemigos); if (e) { tx = e.x; ty = e.y; } }
  else if (G.fase === 'descanso' || G.fase === 'banner') texto = 'REAGRUPATE: VIENE LA PRÓXIMA OLEADA';
  else if (G.fase === 'avanzar' && ZONAS[G.zona + 1]) { texto = 'AVANZÁ AL SIGUIENTE SECTOR'; tx = ZONAS[G.zona + 1].x0 + 40; ty = ZONAS[G.zona + 1].entrada[1]; }
  else if (G.fase === 'defensa') { texto = 'DEFENDÉ EL FARO HASTA LA EXTRACCIÓN'; tx = FARO.x; ty = FARO.y; }
  else if (G.fase === 'extraccion') { texto = 'LLEGÁ AL HELIPUERTO PARA ESCAPAR'; tx = PAD.x; ty = PAD.y; }
  else if (G.fase === 'fin') texto = 'EXTRACCIÓN EN CURSO';
  return { texto, dist: tx != null ? Math.round(dist(yo.x, yo.y, tx, ty) / 8) : null, rumbo: tx != null ? rumboA(tx - yo.x, ty - yo.y) : null, tx, ty };
}
function infoFase() {
  const Z = ZONAS[G.zona] || ZONAS[0];
  if (G.modo === 'equipos') return { titulo: 'DUELO POR EQUIPOS', sub: 'VERDE vs ROJO', n: null, urgente: false };
  if (G.modo === 'tiro') return { titulo: 'CAMPO DE TIRO', sub: 'SIN ENEMIGOS // BLANCOS INFINITOS', n: null, urgente: false };
  let sub = '', urgente = false;
  const n = enemigos.length + G.cola.length;
  if (G.fase === 'ola') sub = esSup() ? `${G.modo === 'coop' ? 'COOPERATIVO' : 'SUPERVIVENCIA'} // OLEADA ${G.ola + 1}` : `OLEADA ${G.ola + 1}/${Z.oleadas.length}`;
  else if (G.fase === 'descanso') sub = `PRÓXIMA OLEADA EN ${Math.ceil(G.faseT)}S`;
  else if (G.fase === 'banner') sub = '¡PREPARATE!';
  else if (G.fase === 'avanzar') sub = 'AVANZÁ HACIA EL ESTE »';
  else if (G.fase === 'defensa') { sub = `HELICÓPTERO EN 0:${String(Math.max(0, Math.ceil(G.faseT))).padStart(2, '0')}`; urgente = true; }
  else if (G.fase === 'extraccion') sub = heli && heli.estado === 'aterrizado' ? '¡SUBÍ AL HELICÓPTERO!' : 'HELICÓPTERO ATERRIZANDO...';
  else if (G.fase === 'fin') sub = '¡EXTRACCIÓN!';
  return { titulo: `ZONA ${G.zona + 1}: ${Z.nombre.toUpperCase()}`, sub, n: G.fase === 'ola' ? n : null, urgente };
}
function datosFin() {
  const prec = G.disparos ? Math.round(100 * G.aciertos / G.disparos) : 0;
  const rango = G.pts > 30000 ? 'LEYENDA DEL FARO' : G.pts > 22000 ? 'CAPITÁN' : G.pts > 15000 ? 'SARGENTO' : 'SOLDADO';
  const tabla = MP() ? [...jugadores].sort((a, b) => (b.bajas || 0) - (a.bajas || 0)).map(j => ({ nombre: j.nombre, equipo: j.equipo, bajas: j.bajas || 0, muertes: j.muertes || 0, yo: j === YO })) : [];
  return { sup: esSup(), olasSup: G.olasSup || 0, recordSup, pts: G.pts, bajas: G.bajas, prec, tiempo: Math.floor(G.tiempo), dificultad: dif().nombre, rango,
    xpPartida: G.xpPartida || 0, creditos: G.creditosGanados || 0, nuevoRecord: !!G.nuevoRecord, record, zona: G.zona + 1, tabla, ganador: G.ganador || '', marc: G.marc || { verde: 0, rojo: 0 },
    t: G.estado === 'victoria' || G.estado === 'finEq' ? G.ganoT : G.muerteT };
}
function tomarFoto() {
  const yo = (MP() && YO) ? YO : P;
  const nv = nivelActual(), menu = enMenu();
  const w = (yo.W && yo.W[yo.arma]) || ARMAS[yo.arma] || ARMAS[1], base = ARMAS[yo.arma] || ARMAS[1];
  const caja = !menu && !yo.muerto ? estaciones.find(e => dist(yo.x, yo.y, e.x, e.y) < 30) : null;
  const save = leerPartida(), op = OPERADOR_POR_ID(yo.op);
  G.toasts.forEach(t => { if (!t.id) t.id = ++idSeq; });
  if (G.banner && !G.banner.id) G.banner.id = ++idSeq;
  if (G.radio && !G.radio.id) G.radio.id = ++idSeq;
  const yoHp = Math.max(0, Math.ceil(yo.hp));
  const escuadron = menu ? [] : MP()
    ? jugadores.map(j => ({ nombre: j.nombre, hp: Math.max(0, Math.ceil(j.hp)), maxhp: j.maxhp, muerto: !!j.muerto, yo: j === YO, equipo: j.equipo, bot: !!j.bot }))
    : [{ nombre: miNombre(), hp: yoHp, maxhp: yo.maxhp, muerto: false, yo: true, equipo: 'verde', bot: false }];
  return {
    estado: G.estado, modo: G.modo, fase: G.fase, mp: MP(), cargando: MP() && !YO, pausaLocal: !!G.pausaLocal, tiempo: G.tiempo, fps: Math.round(fps),
    info: menu ? null : infoFase(), obj: menu ? null : objetivoInfo(yo), pts: G.pts, bajas: G.bajas,
    nivel: nv, xp: PERFIL.xp, xpIni: xpTotal(nv), xpSig: nv >= NIVEL_MAX ? null : xpTotal(nv + 1), rango: rangoDe(nv),
    rumbo: Math.round(((yo.ang * 180 / Math.PI) + 90 + 360) % 360), enemigos: enemigos.length, cola: G.cola.length,
    hp: yoHp, maxhp: yo.maxhp, arma: yo.arma, armaNombre: w.nombre, cargador: w.cargador,
    armaInfo: { nombre: base.nombre, clase: base.clase, calibre: base.calibre, modo: base.modo, sil: !!w.sil, cargador: w.cargador },
    op: { nombre: op.n, rol: op.rol },
    mun: (yo.mun || []).map(m => ({ c: m.c, res: m.res === Infinity ? -1 : m.res })), gran: yo.gran,
    recargando: yo.recarga > 0, recProg: yo.recarga > 0 ? 1 - yo.recarga / w.recarga : 0,
    racha: G.racha, S: { dron: !!S.dron, aereo: !!S.aereo, torreta: !!S.torreta },
    activos: { dron: drones.length ? Math.ceil(drones[0].k) : 0, aereo: ataques.length ? 1 : 0, torreta: torretas.length ? Math.ceil(torretas[0].k) : 0 },
    muerto: !!yo.muerto, respT: Math.ceil(yo.respT || 0), caja: caja ? { cd: Math.ceil(caja.cd) } : null,
    banner: G.banner ? { id: G.banner.id, t: G.banner.t, sub: G.banner.sub, k: G.banner.k, dur: G.banner.dur } : null,
    radio: G.radio ? { id: G.radio.id, quien: G.radio.quien, txt: G.radio.txt, k: G.radio.k, dur: G.radio.dur } : null,
    toasts: G.toasts.map(t => ({ id: t.id, txt: t.txt, color: t.color, k: t.k })),
    feed: G.feed.map(f => ({ id: f.id, quien: f.quien, arma: f.arma, objetivo: f.objetivo, k: f.k })), alerta: G.alerta ? G.alerta.txt : '',
    escuadron, tiro: G.modo === 'tiro' ? { disparos: G.disparos, aciertos: G.aciertos, danio: Math.round(G.danioTiro || 0), t: G.tiempo } : null,
    jefe: G.jefe && !G.jefe.muerto ? { hp: G.jefe.hp, maxhp: G.jefe.maxhp } : null,
    eq: { verde: G.marc ? G.marc.verde : 0, rojo: G.marc ? G.marc.rojo : 0, tiempo: Math.max(0, Math.ceil(G.tiempoEq || 0)), mio: YO ? YO.equipo : 'verde' },
    tienda: { creditos: G.estado === 'tienda' || G.compras ? creditos() : 0, items: TIENDA.map(it => ({ id: it.id, n: it.n, d: it.d, p: it.p, max: it.max || 0, veces: (G.compras || {})[it.id] || 0 })) },
    fin: ['muerto', 'victoria', 'finEq'].includes(G.estado) ? datosFin() : null,
    red: { activo: RED.activo, host: RED.host, cliente: RED.cliente, estado: RED.estado, error: RED.error, codigo: RED.codigo, link: RED.codigo ? linkSala() : '',
      sala: RED.sala.map(s => ({ ...s })), salaModo: RED.salaModo, bots: RED.bots, miId: RED.miId, invitacion: salaURL },
    perfil: { nombre: miNombre(), record, recordSup, dif: difIdx, partida: save ? { zona: save.zona + 1, pts: save.pts } : null },
    touch: touch.activo, mute: Snd.mute, aviso: G.aviso || '',
  };
}
function publicar() { foto = tomarFoto(); for (const f of oyentes) f(); }
export const store = { suscribir: f => { oyentes.add(f); return () => oyentes.delete(f); }, foto: () => foto };

// Dibuja un soldado con su paleta en un <canvas> chiquito (vista previa de operadores y camuflajes)
function previewSoldado(canvas, paleta, armaIdx = 1) {
  const g = canvas.getContext('2d'), c = paleta || CAMOS[0];
  g.clearRect(0, 0, canvas.width, canvas.height); g.imageSmoothingEnabled = false;
  g.save(); g.scale(canvas.width / 17, canvas.height / 17);
  dibujarSoldado(g, 8.5, 8.5, -0.5, 6, c.c, c.h, armaIdx === 2 ? 10 : armaIdx === 1 ? 9 : 5, false, 0);
  g.restore();
}

// Radar circular (arriba a la izquierda): muestra lo que hay cerca, con el norte arriba
let radarCv = null;
function dibujarRadar() {
  const c = radarCv; if (!c || !c.isConnected) return;
  const g = c.getContext('2d'), w = c.width, R = w / 2, yo = (MP() && YO) ? YO : P, ALC = 460, k = (R - 6) / ALC;
  g.clearRect(0, 0, w, w); g.save(); g.beginPath(); g.arc(R, R, R - 2, 0, 7); g.clip();
  g.fillStyle = 'rgba(2,12,9,0.6)'; g.fillRect(0, 0, w, w);
  g.strokeStyle = 'rgba(16,185,129,0.25)'; g.lineWidth = 1;
  for (const f of [0.34, 0.67, 1]) { g.beginPath(); g.arc(R, R, (R - 6) * f, 0, 7); g.stroke(); }
  g.beginPath(); g.moveTo(R, 4); g.lineTo(R, w - 4); g.moveTo(4, R); g.lineTo(w - 4, R); g.stroke();
  g.fillStyle = 'rgba(16,185,129,0.15)'; g.beginPath(); g.moveTo(R, R); g.arc(R, R, R - 6, yo.ang - 0.5, yo.ang + 0.5); g.closePath(); g.fill();   // hacia dónde mirás
  const pt = (x, y) => ({ x: R + (x - yo.x) * k, y: R + (y - yo.y) * k });
  for (const e of enemigos) {
    if (e.muerto || dist(e.x, e.y, yo.x, yo.y) > ALC) continue;
    const p = pt(e.x, e.y); g.fillStyle = e.T.estatico ? '#fbbf24' : '#ef4444';
    g.beginPath(); g.arc(p.x, p.y, e.T.sniper || e.T.jefe ? 3.6 : 2.6, 0, 7); g.fill();
  }
  if (MP()) jugadores.forEach((j, i) => {
    if (j === YO || j.muerto || (G.modo === 'equipos' && j.equipo !== YO.equipo) || dist(j.x, j.y, yo.x, yo.y) > ALC) return;
    const p = pt(j.x, j.y); g.fillStyle = '#34d399'; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill();
    g.fillStyle = '#04120c'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), p.x, p.y + 0.5);
  });
  const o = objetivoInfo(yo);
  if (o.tx != null && G.modo !== 'tiro' && G.fase !== 'ola') {
    const dx = o.tx - yo.x, dy = o.ty - yo.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const rr = d > ALC ? R - 10 : d * k, px = R + Math.cos(a) * rr, py = R + Math.sin(a) * rr;
    g.fillStyle = '#fbbf24'; g.beginPath(); g.moveTo(px, py - 5); g.lineTo(px + 4, py); g.lineTo(px, py + 5); g.lineTo(px - 4, py); g.closePath(); g.fill();
  }
  g.fillStyle = '#10b981'; g.save(); g.translate(R, R); g.rotate(yo.ang); g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-2, 0); g.lineTo(-4, 4); g.closePath(); g.fill(); g.restore();
  g.restore();
}

export const API = {
  // Los modos solos cierran la sala (si había una)
  jugarCampania() { if (RED.activo) salirRed(); iniciarJuego(); publicar(); },
  continuar() { if (RED.activo) salirRed(); continuarPartida(); publicar(); },
  jugarSupervivencia() { if (RED.activo) salirRed(); iniciarSupervivencia(); publicar(); },
  jugarTiro() { if (RED.activo) salirRed(); iniciarTiro(); publicar(); },
  // El anfitrión vuelve a la sala de espera sin cerrar la sala
  volverSala() {
    if (!RED.host) return;
    G = nuevoEstado(); G.estado = 'sala'; jugadores = []; YO = null; P = nuevoJugador(220, 425); S = { dron: false, aereo: false, torreta: false };
    publicar();
  },
  crearSala() { crearSala(); publicar(); },
  unirseSala(c) { unirseSala(c); publicar(); },
  empezar() { empezarMP(); publicar(); },
  salir() { if (RED.activo) salirRed(); else irTitulo(); publicar(); },
  reintentar() { if (MP()) { if (RED.host) empezarMP(); } else if (G.modo === 'tiro') iniciarTiro(); else reintentar(); publicar(); },
  setModoSala(m) {
    if (!RED.host) return; RED.salaModo = m;
    if (m === 'coop') RED.sala.forEach(s => { s.equipo = 'verde'; }); else RED.sala.forEach((s, i) => { s.equipo = i % 2 ? 'rojo' : 'verde'; });
    publicar();
  },
  setBots(n) { if (RED.host) { RED.bots = clamp(n, 0, 6); publicar(); } },
  cambiarEquipo(id) { if (!RED.host) return; const s = RED.sala.find(o => o.id === id); if (s) { s.equipo = s.equipo === 'verde' ? 'rojo' : 'verde'; publicar(); } },
  pausar() { if (G.estado !== 'jugando') return; if (MP()) G.pausaLocal = true; else G.estado = 'pausa'; publicar(); },
  reanudar() { if (MP()) G.pausaLocal = false; else if (G.estado === 'pausa') G.estado = 'jugando'; publicar(); },
  accion(a) { if (G.estado !== 'jugando' || G.pausaLocal) return; if (MP() && (!YO || YO.muerto)) return; accion(a); publicar(); },
  comprar(id) { const it = TIENDA.find(o => o.id === id); if (it && G.estado === 'tienda') { comprar(it); publicar(); } },
  cerrarTienda() { if (G.estado === 'tienda') { G.estado = 'jugando'; publicar(); } },
  setDificultad(i) { difIdx = clamp(i, 0, 2); try { localStorage.setItem('faro_dif', difIdx); } catch (e) {} publicar(); },
  setNombre(n) {
    n = limpiarNombre(n); try { localStorage.setItem('faro_nombre', n); } catch (e) {}
    if (RED.host && RED.sala[0]) RED.sala[0].nombre = n;
    if (RED.cliente && RED.conn) enviar(RED.conn, { t: 'nombre', nombre: n });
    publicar();
  },
  toggleSonido() { Snd.init(); Snd.toggle(); publicar(); },
  audio() { Snd.init(); },
  click() { Snd.play('click'); },
  registrarMinimapa(el) { miniCv = el; },
  registrarRadar(el) { radarCv = el; },
  previewSoldado,
};

// Si el jugador cambia de operador, camuflaje o accesorios, la sala se entera
suscribirPerfil(() => { if (RED.host && RED.sala[0]) Object.assign(RED.sala[0], equipoLocalSala()); publicar(); });

// ---------- Arranque ----------
construirMapa(); pintarMundo();
P = nuevoJugador(220, 425);
let ultimo = performance.now(), fotoT = 0, miniT = 0;
function loop(ahora) {
  const crudo = (ahora - ultimo) / 1000; ultimo = ahora;
  fps = fps * 0.95 + (1 / Math.max(crudo, 0.001)) * 0.05;
  const dt = Math.min(crudo, 0.05);
  if (RED.activo) redTick(dt);
  actualizar(dt);
  const menu = enMenu();
  if (!menu) render();                      // en los menús la interfaz tapa el mundo: no gastamos batería dibujándolo
  fotoT -= dt; if (fotoT <= 0) { fotoT = menu ? 0.5 : 0.066; publicar(); }
  miniT -= dt; if (!menu && miniT <= 0) { miniT = 0.1; dibujarMinimapa(); dibujarRadar(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
publicar();

// Para probar desde la consola del navegador: agregá ?debug a la dirección
if (/[?&]debug/.test(location.search)) {
  window.__juego = {
    get G() { return G; }, get P() { return P; }, get YO() { return YO; }, get jugadores() { return jugadores; }, get enemigos() { return enemigos; },
    get heli() { return heli; }, get RED() { return RED; }, get PERFIL() { return PERFIL; }, get portones() { return portones; }, get ZONAS() { return ZONAS; },
    mouse, teclas, touch, TIENDA, PAD, actualizar, render, golpearEnemigo, crearEnemigo, hayVision, asistirMira, empezarMP, iniciarJuego, iniciarSupervivencia, iniciarTiro,
    publicar, tomarFoto, tirarGranada, usarRacha, herirJugador, redTick, API, nuevoJugador, statsArma,
  };
}
