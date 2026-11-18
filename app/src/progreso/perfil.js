// =====================================================================
// PERFIL DEL JUGADOR: experiencia, monedas, desbloqueos, equipo y pase de batalla.
// Es un objeto único. Cuando cambia, se guarda y avisa a quien esté escuchando (la interfaz).
// =====================================================================
import { almacen } from './almacen.js';
import { CONFIG, ITEMS, REMATES, NIVEL_MAX, XP_ESCALA, nivelDeXp, perksDe, recompensasPase, slotsDe, productosTienda } from './catalogo.js';

const base = () => ({
  v: 2, xp: 0, creditos: 0, fichas: 0,
  desbloqueos: {},
  equipado: { operador: 'faro', camo: 'bosque', armeria: { 0: {}, 1: {}, 2: {} }, skins: { 0: null, 1: null, 2: null }, remate: 'destello' },
  skinBajas: {},
  pase: { premium: false, libre: {}, prem: {} },
  stats: { partidas: 0, victorias: 0, bajas: 0 },
  maestria: { 0: 0, 1: 0, 2: 0 },
});

// Convierte perfiles de versiones anteriores (v1 = xp, camo, stats)
function migrar(p) {
  const b = base();
  if (!p || typeof p !== 'object') return b;
  if (p.v === 2) {
    return { ...b, ...p, equipado: { ...b.equipado, ...p.equipado, armeria: { 0: {}, 1: {}, 2: {}, ...(p.equipado && p.equipado.armeria) } },
      skinBajas: { ...p.skinBajas }, pase: { ...b.pase, ...p.pase }, stats: { ...b.stats, ...p.stats }, maestria: { ...b.maestria, ...p.maestria }, desbloqueos: { ...p.desbloqueos } };
  }
  b.xp = Math.floor((+p.xp || 0) * XP_ESCALA);      // la XP vieja valía más: se pasa a la escala nueva
  b.stats = { ...b.stats, ...p.stats };
  const viejos = ['bosque', 'desierto', 'nieve', 'noche', 'dorado'];
  if (typeof p.camo === 'number' && viejos[p.camo]) { b.equipado.camo = viejos[p.camo]; b.desbloqueos[viejos[p.camo]] = true; }
  return b;
}

export const perfil = migrar(almacen.leerPerfil());

// ---------- Avisos a la interfaz ----------
const oyentes = new Set();
let version = 0;
export const suscribirPerfil = f => { oyentes.add(f); return () => oyentes.delete(f); };
export const versionPerfil = () => version;
export function guardarPerfil() { almacen.guardarPerfil(perfil); version++; oyentes.forEach(f => f()); }

// ---------- Consultas ----------
export const nivelPerfil = () => nivelDeXp(perfil.xp);
export const tiene = id => !!ITEMS[id] && (ITEMS[id].fuente.tipo === 'inicial' || !!perfil.desbloqueos[id]);
export const opActivo = () => (tiene(perfil.equipado.operador) ? perfil.equipado.operador : 'faro');
export const camoActivo = () => (tiene(perfil.equipado.camo) ? perfil.equipado.camo : 'bosque');
export const accesoriosEquipados = arma => {
  const out = {}, e = perfil.equipado.armeria[arma] || {};
  for (const slot of Object.keys(e)) if (tiene(e[slot])) out[slot] = e[slot];
  return out;
};
export const equipoLocal = () => ({ op: opActivo(), camo: camoActivo(), nivel: nivelPerfil(), ar: { 0: accesoriosEquipados(0), 1: accesoriosEquipados(1), 2: accesoriosEquipados(2) } });

// ---------- Experiencia y monedas ----------
// Devuelve la XP real ganada (ya con la escala y el bonus del operador)
export function ganarXp(puntos) {
  const real = Math.max(0, Math.round(puntos * XP_ESCALA * perksDe(opActivo()).xpMul));
  perfil.xp += real; guardarPerfil();
  return real;
}
export function darCreditos(n) { if (n > 0) { perfil.creditos += Math.floor(n); guardarPerfil(); } }
export function sumarStat(k) { perfil.stats[k] = (perfil.stats[k] || 0) + 1; guardarPerfil(); }
export function sumarMaestria(arma) { perfil.maestria[arma] = (perfil.maestria[arma] || 0) + 1; }   // se guarda con el próximo cambio

// ---------- Equipar ----------
export function equiparOperador(id) { if (ITEMS[id] && ITEMS[id].tipo === 'operador' && tiene(id)) { perfil.equipado.operador = id; guardarPerfil(); return true; } return false; }
export function equiparCamo(id) { if (ITEMS[id] && ITEMS[id].tipo === 'camo' && tiene(id)) { perfil.equipado.camo = id; guardarPerfil(); return true; } return false; }
export function equiparAccesorio(arma, slot, id) {      // id = null para sacarlo
  if (!slotsDe(arma).some(s => s.id === slot)) return false;
  const e = perfil.equipado.armeria[arma] || (perfil.equipado.armeria[arma] = {});
  if (id === null) { delete e[slot]; guardarPerfil(); return true; }
  const a = ITEMS[id];
  if (!a || a.tipo !== 'accesorio' || a.slot !== slot || (a.armas && !a.armas.includes(arma)) || !tiene(id)) return false;
  e[slot] = id; guardarPerfil(); return true;
}
export function restablecerArma(arma) { perfil.equipado.armeria[arma] = {}; guardarPerfil(); }

// ---------- Aspectos evolutivos y remates ----------
export const skinActiva = arma => { const id = perfil.equipado.skins && perfil.equipado.skins[arma]; return id && tiene(id) ? id : null; };
export const bajasSkin = id => (perfil.skinBajas && perfil.skinBajas[id]) || 0;
export function equiparSkin(arma, id) {          // id = null para sacarla
  if (!perfil.equipado.skins) perfil.equipado.skins = { 0: null, 1: null, 2: null };
  if (id === null) { perfil.equipado.skins[arma] = null; guardarPerfil(); return true; }
  const s = ITEMS[id]; if (!s || s.tipo !== 'skin' || s.arma !== arma || !tiene(id)) return false;
  perfil.equipado.skins[arma] = id; guardarPerfil(); return true;
}
export function acreditarSkins(n = 1) {          // cada baja hace crecer los aspectos equipados (se guarda con el próximo cambio)
  if (!perfil.skinBajas) perfil.skinBajas = {};
  for (const a of [0, 1, 2]) { const id = skinActiva(a); if (id) perfil.skinBajas[id] = (perfil.skinBajas[id] || 0) + n; }
}
export const remateOk = r => nivelPerfil() >= r.nivel;
export const remateActivo = () => { const r = REMATES.find(x => x.id === perfil.equipado.remate); return r && remateOk(r) ? r.id : 'ninguno'; };
export function equiparRemate(id) { const r = REMATES.find(x => x.id === id); if (!r || !remateOk(r)) return false; perfil.equipado.remate = id; guardarPerfil(); return true; }

// ---------- Tienda ----------
// Los productos con "fichas" son los PREMIUM: hoy se prueban gratis; cuando CONFIG.COBRAR sea true
// las fichas se van a comprar con dinero real (eso se conecta más adelante, no está hecho).
export function comprar(id) {
  const it = ITEMS[id];
  if (!it || it.fuente.tipo !== 'tienda') return { ok: false, msg: 'Ese producto no se vende.' };
  if (tiene(id)) return { ok: false, msg: 'Ya lo tenés.' };
  const { precio, moneda } = it.fuente;
  if ((perfil[moneda] || 0) < precio) return { ok: false, msg: moneda === 'fichas' ? 'No te alcanzan las fichas.' : 'No te alcanzan los créditos.' };
  perfil[moneda] -= precio; perfil.desbloqueos[id] = true; guardarPerfil();
  return { ok: true, msg: `¡Compraste ${it.n}!` };
}
export function regaloDePrueba() {
  if (CONFIG.COBRAR) return { ok: false, msg: 'El regalo de prueba ya no está disponible.' };
  perfil.fichas += CONFIG.FICHAS_PRUEBA; guardarPerfil();
  return { ok: true, msg: `Recibiste ${CONFIG.FICHAS_PRUEBA} fichas de prueba.` };
}
export function activarPremium() {
  if (perfil.pase.premium) return { ok: false, msg: 'Ya tenés el pase premium.' };
  if (perfil.fichas < CONFIG.PRECIO_PASE) return { ok: false, msg: 'No te alcanzan las fichas.' };
  perfil.fichas -= CONFIG.PRECIO_PASE; perfil.pase.premium = true; guardarPerfil();
  return { ok: true, msg: '¡Pase premium activado!' };
}

// ---------- Pase de batalla ----------
function entregar(r) {
  if (r.tipo === 'creditos') perfil.creditos += r.cantidad;
  else if (r.tipo === 'fichas') perfil.fichas += r.cantidad;
  else if (r.tipo === 'item') perfil.desbloqueos[r.id] = true;
}
export function estadoPase(n, pista) {          // 'bloqueado' | 'reclamable' | 'reclamado'
  const hecho = pista === 'libre' ? perfil.pase.libre[n] : perfil.pase.prem[n];
  if (hecho) return 'reclamado';
  if (nivelPerfil() < n) return 'bloqueado';
  if (pista === 'prem' && !perfil.pase.premium) return 'bloqueado';
  return 'reclamable';
}
export function reclamarPase(n, pista) {
  if (estadoPase(n, pista) !== 'reclamable') return false;
  recompensasPase(n)[pista === 'libre' ? 'libre' : 'prem'].forEach(entregar);
  (pista === 'libre' ? perfil.pase.libre : perfil.pase.prem)[n] = true;
  guardarPerfil(); return true;
}
export function reclamarTodo() {
  let c = 0;
  for (let n = 1; n <= NIVEL_MAX; n++) for (const p of ['libre', 'prem']) {
    if (estadoPase(n, p) === 'reclamable') { recompensasPase(n)[p === 'libre' ? 'libre' : 'prem'].forEach(entregar); (p === 'libre' ? perfil.pase.libre : perfil.pase.prem)[n] = true; c++; }
  }
  if (c) guardarPerfil();
  return c;
}
export function pendientesPase() {
  let c = 0;
  for (let n = 1; n <= nivelPerfil(); n++) for (const p of ['libre', 'prem']) if (estadoPase(n, p) === 'reclamable') c++;
  return c;
}
export const hayProductos = () => productosTienda().length;
