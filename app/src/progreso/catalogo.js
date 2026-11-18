// =====================================================================
// CATÁLOGO DEL JUEGO: niveles, armas, accesorios, operadores, camuflajes, pase y tienda.
// Son sólo datos y cuentas (no toca la pantalla ni el navegador), así más adelante
// se puede mover a una base de datos (Supabase) sin cambiar el resto.
// =====================================================================

export const CONFIG = {
  // Cuando esté listo para cobrar productos, se cambia a true. Mientras tanto todo se prueba gratis.
  COBRAR: false,
  TEMPORADA: 'S01',
  NOMBRE_TEMPORADA: 'OPERACIÓN FARO',
  FICHAS_PRUEBA: 500,        // regalo para probar la tienda premium mientras no se cobra
  PRECIO_PASE: 800,          // en fichas
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------- Niveles (100) ----------
export const NIVEL_MAX = 100;
export const XP_ESCALA = 0.2;                                   // cuánta XP real da cada punto de puntaje
export const xpParaSubir = n => 100 + 12 * (n - 1);             // XP para pasar del nivel n al n+1 (poca XP por nivel)
export const xpTotal = n => { n = clamp(n, 1, NIVEL_MAX); return 100 * (n - 1) + 6 * (n - 1) * (n - 2); };   // XP acumulada para alcanzar el nivel n
export function nivelDeXp(xp) {
  let lo = 1, hi = NIVEL_MAX;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (xp >= xpTotal(m)) lo = m; else hi = m - 1; }
  return lo;
}
export const RANGOS = ['SOLDADO', 'CABO', 'SARGENTO', 'SUBTENIENTE', 'TENIENTE', 'CAPITÁN', 'MAYOR', 'CORONEL', 'GENERAL', 'LEYENDA DEL FARO'];
export const rangoDe = n => RANGOS[Math.min(RANGOS.length - 1, Math.floor((n - 1) / 10))];

// ---------- Armas (valores base) ----------
export const ARMAS_BASE = [
  { nombre: 'PISTOLA', clase: 'PISTOLA SEMIAUTOMÁTICA', calibre: '9×19MM', modo: 'SEMI', dmg: 20, cadencia: 0.26, cargador: 12, recarga: 0.9, disp: 0.03, vel: 430, perdigones: 1, vida: 0.9, sfx: 'pistola', retro: 1 },
  { nombre: 'FUSIL M4', clase: 'FUSIL DE ASALTO', calibre: '5.56×45MM', modo: 'AUTO', dmg: 17, cadencia: 0.095, cargador: 30, recarga: 1.4, disp: 0.06, vel: 470, perdigones: 1, vida: 0.9, sfx: 'fusil', retro: 1.5 },
  { nombre: 'ESCOPETA', clase: 'ESCOPETA DE CORREDERA', calibre: 'CALIBRE 12', modo: 'PUMP', dmg: 13, cadencia: 0.7, cargador: 6, recarga: 1.8, disp: 0.32, vel: 400, perdigones: 7, vida: 0.32, sfx: 'escopeta', retro: 4 },
];
// Valores "de vitrina" (0 a 100) para las barras de la armería
export const ARMA_VISUAL = [
  { dano: 46, alcance: 48, precision: 78, cadencia: 45, movilidad: 90, retroceso: 70 },
  { dano: 62, alcance: 78, precision: 74, cadencia: 88, movilidad: 68, retroceso: 62 },
  { dano: 92, alcance: 30, precision: 40, cadencia: 25, movilidad: 60, retroceso: 40 },
];

// ---------- Accesorios ----------
export const SLOTS = [
  { id: 'boca', n: 'BOCA DE CAÑÓN', corto: 'BOCA CAÑÓN', armas: [0, 1, 2] },
  { id: 'laser', n: 'LÁSER / TAC', corto: 'LÁSER', armas: [0, 1, 2] },
  { id: 'optica', n: 'ÓPTICA', corto: 'MIRA / ÓPTICA', armas: [0, 1, 2] },
  { id: 'acople', n: 'ACOPLE', corto: 'ACOPLE', armas: [1, 2] },
  { id: 'municion', n: 'MUNICIÓN', corto: 'MUNICIÓN', armas: [0, 1, 2] },
  { id: 'culata', n: 'CULATA', corto: 'CULATA', armas: [1, 2] },
];
// mods: dmg/alc/pre/cad/mov/rec/carg en porcentaje, ret en puntos, perd en perdigones, sil = silenciado
const acc = (id, slot, n, mods, fuente, extra = {}) => ({ tipo: 'accesorio', id, slot, n, mods, fuente, ...extra });
export const ACCESORIOS = [
  acc('sil', 'boca', 'Silenciador Monolítico', { dmg: -4, alc: 6, ret: 4, sil: 1 }, { tipo: 'inicial' }),
  acc('comp', 'boca', 'Compensador', { ret: 10, pre: 3 }, { tipo: 'pase', n: 4 }),
  acc('freno', 'boca', 'Freno de Boca', { ret: 16, mov: -3 }, { tipo: 'tienda', precio: 600, moneda: 'creditos' }),
  acc('choke', 'boca', 'Choke Cerrado', { pre: 14, alc: 8 }, { tipo: 'pase', n: 11 }, { armas: [2] }),
  acc('dispersor', 'boca', 'Dispersor de Perdigones', { perd: 2, pre: -10 }, { tipo: 'pase', n: 17 }, { armas: [2] }),
  acc('peq', 'laser', 'PEQ NVG 532nm', { pre: 8, ret: 2 }, { tipo: 'inicial' }),
  acc('ir', 'laser', 'Láser IR Táctico', { pre: 12, mov: -2 }, { tipo: 'pase', n: 9 }),
  acc('pulso', 'laser', 'Láser de Pulso', { pre: 6, cad: 3 }, { tipo: 'tienda', precio: 500, moneda: 'creditos' }),
  acc('reflex', 'optica', 'Mira Reflex', { pre: 6 }, { tipo: 'inicial' }),
  acc('termica', 'optica', 'Híbrida Térmica 4X', { alc: 14, pre: 10, mov: -6 }, { tipo: 'pase', n: 14 }),
  acc('holo', 'optica', 'Holográfica', { pre: 9, ret: 3 }, { tipo: 'tienda', precio: 700, moneda: 'creditos' }),
  acc('angulada', 'acople', 'Empuñadura Angulada', { ret: 9, mov: -1 }, { tipo: 'inicial' }),
  acc('vertical', 'acople', 'Empuñadura Vertical', { ret: 12, pre: 3, mov: -3 }, { tipo: 'pase', n: 6 }),
  acc('bipode', 'acople', 'Bípode', { ret: 18, mov: -8 }, { tipo: 'tienda', precio: 900, moneda: 'creditos' }),
  acc('ext', 'municion', 'Cargador Extendido', { carg: 40, rec: -8 }, { tipo: 'inicial' }),
  acc('rapido', 'municion', 'Cargador Rápido', { rec: 22 }, { tipo: 'pase', n: 3 }),
  acc('perf', 'municion', 'Munición Perforante', { dmg: 10, cad: -6 }, { tipo: 'tienda', precio: 800, moneda: 'creditos' }),
  acc('tambor', 'municion', 'Tambor de Alta Capacidad', { carg: 100, rec: -18, mov: -4 }, { tipo: 'pase', n: 22, premium: true }),
  acc('tactica', 'culata', 'Culata Táctica', { ret: 7, pre: 4 }, { tipo: 'inicial' }),
  acc('ligera', 'culata', 'Culata Ligera', { mov: 6, ret: -4 }, { tipo: 'tienda', precio: 400, moneda: 'creditos' }),
  acc('pesada', 'culata', 'Culata Pesada', { ret: 14, mov: -5 }, { tipo: 'pase', n: 28 }),
];

// ---------- Operadores y camuflajes ----------
const op = (id, nombre, rol, desc, perks, paleta, fuente) => ({ tipo: 'operador', id, n: nombre, rol, desc, perks, paleta, fuente });
export const OPERADORES = [
  op('faro', 'LT. SÁNCHEZ "FARO"', 'LÍDER DE ESCUADRA', 'Veterano de la costa. Se recupera más rápido que nadie.', [{ k: 'regenMul', v: 1.25, t: '+25% regeneración de vida' }], { c: '#3f7a3a', h: '#2e5a2b' }, { tipo: 'inicial' }),
  op('sombra', 'SHADOW_BRAVO', 'FRANCOTIRADOR TÉRMICO', 'Dispara de lejos y no falla, pero se mueve despacio.',
    [{ k: 'danioMul', v: 1.1, t: '+10% de daño' }, { k: 'alcMul', v: 1.15, t: '+15% de alcance' }, { k: 'velMul', v: 0.95, t: '-5% de velocidad', malo: true }], { c: '#4a5a6a', h: '#2a3646' }, { tipo: 'pase', n: 10 }),
  op('viper', 'VIPER_04', 'ASALTO BRECHER', 'Rápido y ágil: entra primero y recarga en un suspiro.',
    [{ k: 'velMul', v: 1.08, t: '+8% de velocidad' }, { k: 'recMul', v: 0.88, t: '+12% velocidad de recarga' }], { c: '#a0522d', h: '#6a2f12' }, { tipo: 'pase', n: 20 }),
  op('hielo', 'HIELO', 'PESADO DE ASALTO', 'Una pared con patas: aguanta muchísimo castigo.',
    [{ k: 'hpAdd', v: 30, t: '+30 de vida máxima' }, { k: 'velMul', v: 0.94, t: '-6% de velocidad', malo: true }], { c: '#8a9bb0', h: '#55667a' }, { tipo: 'tienda', precio: 2500, moneda: 'creditos' }),
  op('cobra', 'COBRA', 'DEMOLICIONES', 'Siempre lleva granadas de más.',
    [{ k: 'granAdd', v: 2, t: '+2 granadas al empezar' }, { k: 'danioMul', v: 1.03, t: '+3% de daño' }], { c: '#7a2a2a', h: '#4a1616' }, { tipo: 'pase', n: 35, premium: true }),
  op('nova', 'NOVA', 'INTELIGENCIA TÁCTICA', 'Aprende de cada combate: sube de nivel más rápido.',
    [{ k: 'xpMul', v: 1.15, t: '+15% de experiencia' }, { k: 'alcMul', v: 1.1, t: '+10% de alcance' }], { c: '#6a3f9a', h: '#44226e' }, { tipo: 'tienda', precio: 90, moneda: 'fichas' }),
  op('leyenda', 'LEYENDA DEL FARO', 'EDICIÓN ÉLITE', 'Sólo para quienes llegaron al final del pase.',
    [{ k: 'danioMul', v: 1.05, t: '+5% de daño' }, { k: 'hpAdd', v: 15, t: '+15 de vida máxima' }, { k: 'regenMul', v: 1.15, t: '+15% regeneración' }], { c: '#d4a830', h: '#a07818' }, { tipo: 'pase', n: 100, premium: true }),
];
const cam = (id, n, c, h, fuente) => ({ tipo: 'camo', id, n, c, h, fuente });
export const CAMOS = [
  cam('bosque', 'BOSQUE', '#3f7a3a', '#2e5a2b', { tipo: 'inicial' }),
  cam('desierto', 'DESIERTO', '#a08a55', '#7a6a3a', { tipo: 'pase', n: 5 }),
  cam('nieve', 'NIEVE', '#c8ccd0', '#8a9098', { tipo: 'pase', n: 12 }),
  cam('carbon', 'CARBÓN', '#33363c', '#1c1e22', { tipo: 'tienda', precio: 400, moneda: 'creditos' }),
  cam('noche', 'NOCHE', '#2a3550', '#1a2238', { tipo: 'pase', n: 25 }),
  cam('jungla', 'JUNGLA', '#2f6a3a', '#1d4a26', { tipo: 'pase', n: 30 }),
  cam('urbano', 'URBANO', '#7a7f88', '#565b64', { tipo: 'tienda', precio: 600, moneda: 'creditos' }),
  cam('artico', 'ÁRTICO', '#9ec4d8', '#6a98b2', { tipo: 'pase', n: 45 }),
  cam('magma', 'MAGMA', '#c0501a', '#7a2a08', { tipo: 'tienda', precio: 900, moneda: 'creditos' }),
  cam('neon', 'NEÓN', '#20d8a8', '#0a8a6a', { tipo: 'tienda', precio: 60, moneda: 'fichas' }),
  cam('faronoct', 'FARO NOCTURNO', '#e0a030', '#2a1a2e', { tipo: 'pase', n: 60, premium: true }),
  cam('dorado', 'DORADO', '#d4a830', '#a07818', { tipo: 'pase', n: 80, premium: true }),
];
export const ITEMS = {};
[...OPERADORES, ...CAMOS, ...ACCESORIOS].forEach(i => { ITEMS[i.id] = i; });
export const OPERADOR_POR_ID = id => ITEMS[id] && ITEMS[id].tipo === 'operador' ? ITEMS[id] : OPERADORES[0];
export const CAMO_POR_ID = id => ITEMS[id] && ITEMS[id].tipo === 'camo' ? ITEMS[id] : CAMOS[0];
export const slotsDe = arma => SLOTS.filter(s => s.armas.includes(arma));
export const accesoriosDe = (arma, slot) => ACCESORIOS.filter(a => a.slot === slot && (!a.armas || a.armas.includes(arma)));

// ---------- Cuentas de armas y perks ----------
export function perksDe(opId) {
  const p = { hpAdd: 0, velMul: 1, danioMul: 1, recMul: 1, regenMul: 1, granAdd: 0, xpMul: 1, alcMul: 1 };
  for (const k of OPERADOR_POR_ID(opId).perks) { if (k.k === 'hpAdd' || k.k === 'granAdd') p[k.k] += k.v; else p[k.k] *= k.v; }
  return p;
}
export function modsDe(arma, equipado) {
  const m = { dmg: 0, alc: 0, pre: 0, cad: 0, mov: 0, ret: 0, carg: 0, rec: 0, perd: 0, sil: 0 };
  const e = equipado || {};
  for (const slot of Object.keys(e)) {
    const a = ITEMS[e[slot]];
    if (!a || a.tipo !== 'accesorio' || a.slot !== slot || !slotsDe(arma).some(s => s.id === slot) || (a.armas && !a.armas.includes(arma))) continue;
    for (const k of Object.keys(a.mods)) m[k] += a.mods[k];
  }
  return m;
}
// Estadísticas reales con las que dispara el arma (las usa el motor del juego)
export function statsArma(arma, equipado, opId) {
  const b = ARMAS_BASE[arma], m = modsDe(arma, equipado), p = perksDe(opId);
  return {
    ...b,
    dmg: b.dmg * (1 + m.dmg / 100) * p.danioMul,
    cadencia: b.cadencia * (1 - clamp(m.cad, -40, 50) / 100),
    cargador: Math.max(1, Math.round(b.cargador * (1 + m.carg / 100))),
    recarga: b.recarga * (1 - clamp(m.rec, -60, 50) / 100) * p.recMul,
    disp: b.disp * (1 - clamp(m.pre, -60, 60) / 100),
    vida: b.vida * (1 + m.alc / 100) * p.alcMul,
    perdigones: b.perdigones + m.perd,
    retro: b.retro * (1 - clamp(m.ret, -50, 60) / 100),
    mov: 1 + m.mov / 100, sil: !!m.sil,
  };
}
// Barras de la armería: valor base + cambios por accesorios
export function barrasArma(arma, equipado) {
  const v = ARMA_VISUAL[arma], m = modsDe(arma, equipado);
  const mk = (base, d) => ({ v: clamp(base + d, 0, 100), d });
  return {
    dano: mk(v.dano, m.dmg), alcance: mk(v.alcance, m.alc), precision: mk(v.precision, m.pre),
    cadencia: mk(v.cadencia, m.cad), movilidad: mk(v.movilidad, m.mov), retroceso: mk(v.retroceso, m.ret),
  };
}
export const NOMBRE_MOD = { dmg: 'daño', alc: 'alcance', pre: 'precisión', cad: 'cadencia', mov: 'movilidad', ret: 'control de retroceso', carg: 'capacidad del cargador', rec: 'velocidad de recarga', perd: 'perdigones' };

// ---------- Pase de batalla (100 niveles, pista libre y pista premium) ----------
export const TODOS = [...OPERADORES, ...CAMOS, ...ACCESORIOS];
export function recompensasPase(n) {
  const libre = [], prem = [];
  for (const it of TODOS) {
    if (it.fuente.tipo === 'pase' && it.fuente.n === n) (it.fuente.premium ? prem : libre).push({ tipo: 'item', id: it.id });
  }
  if (!libre.length) libre.push({ tipo: 'creditos', cantidad: 60 + 8 * Math.floor(n / 5) });
  if (!prem.length) prem.push(n % 5 === 0 ? { tipo: 'fichas', cantidad: 25 } : { tipo: 'creditos', cantidad: 130 + 16 * Math.floor(n / 5) });
  return { libre, prem };
}

// ---------- Tienda permanente ----------
export const productosTienda = () => TODOS.filter(i => i.fuente.tipo === 'tienda');
export const FICHAS_PACKS = [
  { id: 'f100', fichas: 100, precio: '1 USD' }, { id: 'f550', fichas: 550, precio: '5 USD' }, { id: 'f1200', fichas: 1200, precio: '10 USD' },
];
export const textoFuente = f => f.tipo === 'inicial' ? 'INCLUIDO' : f.tipo === 'pase' ? `PASE · NIVEL ${f.n}${f.premium ? ' PREMIUM' : ''}` : `TIENDA · ${f.precio} ${f.moneda === 'fichas' ? 'FICHAS' : 'CRÉDITOS'}`;
