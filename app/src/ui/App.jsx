import { Icon } from './Icon.jsx';
import { API, useAviso, useFoto, useVertical } from './comun.js';
import Menu from './Menu.jsx';
import Juego from './Juego.jsx';

// Avisos chiquitos abajo ("¡Link copiado!")
function Avisos() {
  const a = useAviso();
  if (!a) return null;
  return (
    <div key={a.id} role="status" className="absolute inset-x-0 bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+4rem))] flex justify-center z-[60] pointer-events-none anim-entrar">
      <div className="bg-surface-container-highest text-on-surface px-space-md py-2 rounded-lg shadow-xl font-label-md text-label-md max-w-[90vw] text-center border border-primary/30">{a.texto}</div>
    </div>
  );
}

export default function App() {
  const f = useFoto();
  const vertical = useVertical();
  const enMenu = f.estado === 'titulo' || f.estado === 'sala';
  if (!f.estado) return null;
  return (
    <div className="absolute inset-0 text-on-surface pointer-events-none" onPointerDownCapture={API.audio}>
      {enMenu ? <Menu f={f} /> : <Juego f={f} />}
      {/* En el celular parado no se puede jugar: pedimos girarlo */}
      {f.touch && vertical && !enMenu && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-surface-container-lowest flex flex-col items-center justify-center gap-space-md text-center p-space-lg">
          <Icon n="restart_alt" className="text-primary text-6xl animate-spin [animation-duration:3s]" />
          <div className="font-headline-lg text-headline-lg text-primary uppercase">GIRÁ EL CELULAR</div>
          <div className="font-body-md text-body-md text-on-surface-variant">El juego se juega en horizontal.</div>
          <button onClick={API.pausar} className="mt-space-sm px-space-lg py-2 bg-surface-container rounded-lg font-label-lg text-label-lg uppercase">Pausar</button>
        </div>
      )}
      <Avisos />
    </div>
  );
}
