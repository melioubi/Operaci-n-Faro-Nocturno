// Dónde se guarda el progreso del jugador.
// HOY: en este navegador (localStorage). MÁS ADELANTE: se reemplaza este archivo por uno que
// guarde en Supabase (cuentas, perfil y compras) y el resto del juego no cambia.
const CLAVE = 'faro_perfil';

export const almacen = {
  leerPerfil() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { return null; }
  },
  guardarPerfil(perfil) {
    try { localStorage.setItem(CLAVE, JSON.stringify(perfil)); } catch (e) { /* sin espacio o modo privado */ }
  },
};
