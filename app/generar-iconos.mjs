// Genera src/ui/iconos.js con los íconos Material Symbols (Outlined) que usa el juego.
// Así no hace falta cargar la fuente de íconos de Google (anda sin internet y pesa poco).
import fs from 'node:fs';
const usados = ['layers','person_pin','visibility','map','volume_up','settings','record_voice_over','view_in_ar','star','rotate_right','swap_horiz','keyboard_double_arrow_right','radar','person','person_add','military_tech','shield','filter_drama','headset_mic','public','dns','bolt','flag','style','mic','mic_off','close','tune','play_arrow','arrow_forward','radio_button_checked','radio_button_unchecked','add_circle','download','fullscreen','volume_up','volume_off','help','inventory_2','trophy','history','pause','restart_alt','logout','content_copy','share','wifi','skull','medical_services','explosion','my_location','flight','drone','security','groups','lock','check_circle','swords','target','timer','star','workspace_premium','crisis_alert','local_fire_department','swap_horiz','chevron_left','chevron_right','cloud_off','progress_activity','add','remove','gamepad','bar_chart','emergency','monitor_heart','schedule','edit','link','check','air','cloud','visibility','visibility_off','warning','satellite_alt','gps_fixed','diamond','rainy','sensors','storefront','payments','toll','redeem','verified','query_stats','remove_circle','lock_open','north','explore','pets','science','speed','monitoring','card_giftcard','emoji_events','celebration','navigation','flash_on','inventory','compare_arrows','keyboard_double_arrow_right','fiber_manual_record','shopping_bag'];
const base = 'node_modules/@material-symbols/svg-400/outlined/';
const out = {};
for (const n of usados) {
  if (!fs.existsSync(base + n + '.svg')) { console.log('no existe el ícono', n); continue; }
  const svg = fs.readFileSync(base + n + '.svg', 'utf8');
  out[n] = svg.match(/ d="([^"]+)"/)[1];
}
fs.writeFileSync('src/ui/iconos.js', '// Generado por generar-iconos.mjs (no editar a mano)\nexport const ICONOS = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'iconos');
