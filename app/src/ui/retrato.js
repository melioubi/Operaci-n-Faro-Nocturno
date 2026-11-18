// Retrato del operador que se puede girar 360° (dibujado con canvas, sin imágenes)
const mezcla = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

export function dibujarRetrato(cv, pal, ang = 0, { arma = 1, acento = '#ffb35c', chispas = null } = {}) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  g.save(); g.scale(W / 300, H / 400); g.imageSmoothingEnabled = false;
  const cx = 150, base = 372, c = Math.cos(ang), s = Math.sin(ang), ac = Math.abs(c), as = Math.abs(s);
  const cuerpo = pal.c, casco = pal.h, piel = '#d9a27a';
  const tw = 58 + 30 * ac;                                   // ancho del torso según el giro
  const sombra = g.createRadialGradient(cx, base + 8, 4, cx, base + 8, 90); sombra.addColorStop(0, 'rgba(0,0,0,0.55)'); sombra.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sombra; g.beginPath(); g.ellipse(cx, base + 8, 90, 16, 0, 0, 7); g.fill();
  // piernas
  const sepa = 4 + 14 * ac;
  g.fillStyle = mezcla(cuerpo, 0.55); g.fillRect(cx - sepa - 20, 262, 22, 100); g.fillRect(cx + sepa - 2, 262, 22, 100);
  g.fillStyle = '#17181c'; g.fillRect(cx - sepa - 23, 346, 28, 26); g.fillRect(cx + sepa - 5, 346, 28, 26);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - sepa - 20, 300, 22, 5); g.fillRect(cx + sepa - 2, 300, 22, 5);   // rodilleras
  // brazo de atrás (según el giro queda de un lado u otro)
  const lado = s >= 0 ? -1 : 1;
  const brazo = (x, front) => {
    g.fillStyle = mezcla(cuerpo, front ? 0.9 : 0.6); g.fillRect(x - 11, 160, 22, 78);
    g.fillStyle = '#1a1a1a'; g.fillRect(x - 10, 236, 20, 14);
  };
  brazo(cx + lado * (tw / 2 + 4), false);
  // torso + chaleco
  const gr = g.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0); gr.addColorStop(0, mezcla(cuerpo, 0.7)); gr.addColorStop(0.5, mezcla(cuerpo, 1.05)); gr.addColorStop(1, mezcla(cuerpo, 0.65));
  g.fillStyle = gr; g.fillRect(cx - tw / 2, 150, tw, 118);
  g.fillStyle = 'rgba(20,22,26,0.82)'; g.fillRect(cx - tw / 2 + 4, 158, tw - 8, 70);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(cx - tw / 2 + 4, 158, tw - 8, 3);
  if (c > 0) { g.fillStyle = acento; g.fillRect(cx - 5, 168, 10, 4); g.fillStyle = '#111'; for (let i = 0; i < 3; i++) g.fillRect(cx - tw / 2 + 10 + i * (tw - 34) / 2, 200, 12, 18); }
  else { g.fillStyle = '#2a2d33'; g.fillRect(cx - tw / 2 + 8, 170, tw - 16, 50); }   // mochila
  g.fillStyle = '#26282e'; g.fillRect(cx - tw / 2, 252, tw, 12);                      // cinturón
  // cuello y cabeza
  g.fillStyle = piel; g.fillRect(cx - 9, 128, 18, 26);
  g.fillStyle = piel; g.beginPath(); g.arc(cx, 106, 30, 0, 7); g.fill();
  if (c > 0) {                                                // cara
    const ox = s * 12;
    g.fillStyle = '#16181c'; g.fillRect(cx - 22 + ox, 98, 44, 12);
    g.fillStyle = acento; g.fillRect(cx - 18 + ox, 101, 36, 5); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(cx - 16 + ox, 101, 8, 2);
    g.fillStyle = '#3a2a22'; g.fillRect(cx - 8 + ox, 122, 16, 4);
  }
  g.fillStyle = casco; g.beginPath(); g.arc(cx, 100, 33, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + 33, 100); g.arc(cx, 100, 33, 0, Math.PI * 0.12); g.fill();
  g.fillStyle = casco; g.beginPath(); g.arc(cx, 98, 32, Math.PI, 0); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(cx - 8, 82, 14, Math.PI, 0); g.fill();
  if (c <= 0) { g.fillStyle = mezcla(casco, 0.7); g.fillRect(cx - 26, 98, 52, 18); }   // nuca
  // arma cruzada
  const long = arma === 0 ? 46 : arma === 2 ? 98 : 112, grosor = arma === 0 ? 9 : 13;
  const x0 = cx - s * long * 0.45, x1 = cx + s * long * 0.55, y = 214 + (arma === 0 ? 6 : 0);
  if (as > 0.12) {
    g.strokeStyle = '#111317'; g.lineWidth = grosor; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.strokeStyle = mezcla('#555a66', 1); g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y - grosor / 2 + 2); g.lineTo(x1, y - grosor / 2 + 2); g.stroke();
    g.fillStyle = acento; g.fillRect(Math.min(x0, x1) + Math.abs(x1 - x0) * 0.4, y - 3, 12 * as, 3);
    g.strokeStyle = '#0a0a0c'; g.lineWidth = 4; g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 + s * 22, y); g.stroke();
  } else { g.fillStyle = '#0a0a0c'; g.beginPath(); g.arc(cx + s * 30, y, 9, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(cx + s * 30, y, 4, 0, 7); g.fill(); }
  // brazo de adelante (cruza sobre el arma)
  brazo(cx - lado * (tw / 2 + 4), true);
  g.fillStyle = piel; g.fillRect(cx - lado * (tw / 2 + 4) - 8, 244, 16, 10);
  // chispas del REMATE
  if (chispas) for (const p of chispas) { g.globalAlpha = Math.max(0, p.vida); g.fillStyle = p.c; g.fillRect(p.x, p.y, 4, 4); }
  g.globalAlpha = 1; g.restore();
}
