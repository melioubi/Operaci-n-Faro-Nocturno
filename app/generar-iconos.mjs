// Genera src/ui/iconos.js con los íconos Material Symbols (Outlined) que usa el juego.
// Así no hace falta cargar la fuente de íconos de Google (anda sin internet y pesa poco).
import fs from 'node:fs';
const usados = ['radar','person','person_add','military_tech','shield','filter_drama','headset_mic','public','dns','bolt','flag','style','mic','mic_off','close','tune','play_arrow','arrow_forward','radio_button_checked','radio_button_unchecked','add_circle','download','fullscreen','volume_up','volume_off','help','inventory_2','trophy','history','pause','restart_alt','logout','content_copy','share','wifi','skull','medical_services','explosion','my_location','flight','drone','security','groups','lock','check_circle','swords','target','timer','star','workspace_premium','crisis_alert','local_fire_department','swap_horiz','chevron_left','chevron_right','cloud_off','progress_activity','add','remove','gamepad','bar_chart','emergency','monitor_heart','schedule','edit','link','check'];
const base = 'node_modules/@material-symbols/svg-400/outlined/';
const out = {};
for (const n of usados) {
  const svg = fs.readFileSync(base + n + '.svg', 'utf8');
  out[n] = svg.match(/ d="([^"]+)"/)[1];
}
fs.writeFileSync('src/ui/iconos.js', '// Generado por generar-iconos.mjs (no editar a mano)\nexport const ICONOS = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'iconos');
