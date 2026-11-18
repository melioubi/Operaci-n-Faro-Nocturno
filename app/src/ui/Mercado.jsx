import { Icon } from './Icon.jsx';
import { API, aviso, fmt, usePerfil } from './comun.js';
import { CONFIG, FICHAS_PACKS, ITEMS, SLOTS, productosTienda } from '../progreso/catalogo.js';
import { activarPremium, comprar, regaloDePrueba, tiene } from '../progreso/perfil.js';
import { Preview } from './Operadores.jsx';

function Seccion({ titulo, color = 'bg-primary', chip, children }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-sm"><div className="flex items-center gap-2"><span className={`w-1.5 h-3.5 ${color}`}></span><h3 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">{titulo}</h3></div>{chip}</div>
      {children}
    </section>
  );
}
const Moneda = ({ moneda, n, grande }) => (
  <span className={`inline-flex items-center gap-1 font-bold ${moneda === 'fichas' ? 'text-tertiary' : 'text-primary'} ${grande ? 'font-headline-md text-headline-md' : 'font-label-md text-label-md'}`}>
    <Icon n={moneda === 'fichas' ? 'diamond' : 'toll'} className={grande ? 'text-xl' : 'text-base'} />{fmt(n)}
  </span>
);

function Producto({ it, p }) {
  const mio = tiene(it.id), { precio, moneda } = it.fuente, falta = (p[moneda] || 0) < precio;
  const premium = moneda === 'fichas';
  const slot = it.tipo === 'accesorio' ? SLOTS.find(s => s.id === it.slot) : null;
  const paleta = it.tipo === 'operador' ? it.paleta : it.tipo === 'camo' ? it : null;
  const comprarlo = () => { const r = comprar(it.id); API.click(); aviso(r.msg); };
  return (
    <div className={`bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm relative ${mio ? 'opacity-80' : ''}`}>
      {premium && <span className="absolute top-2 right-2 bg-tertiary/20 text-tertiary font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Icon n="workspace_premium" className="text-xs" />PREMIUM</span>}
      <div className="flex items-center gap-space-sm">
        <div className="w-20 h-20 rounded bg-surface-container flex items-center justify-center shrink-0">
          {paleta ? <Preview paleta={paleta} tam={64} /> : <Icon n={it.tipo === 'skin' ? 'star' : 'tune'} className="text-primary text-4xl" />}
        </div>
        <div className="min-w-0">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{it.tipo === 'operador' ? 'OPERADOR' : it.tipo === 'camo' ? 'CAMUFLAJE' : it.tipo === 'skin' ? 'ASPECTO EVOLUTIVO' : `ACCESORIO · ${slot ? slot.corto : ''}`}</div>
          <div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">{it.n.replace(/"/g, '')}</div>
          {it.rol && <div className="font-label-sm text-label-sm text-primary uppercase">{it.rol}</div>}
        </div>
      </div>
      {it.colores && <div className="flex flex-col gap-1"><div className="flex gap-0.5">{it.colores.map((c, k) => <span key={k} className="flex-1 h-2 rounded-sm" style={{ background: c }}></span>)}</div><span className="font-label-sm text-label-sm text-on-surface-variant">{it.desc} Crece con tus bajas (5 fases).</span></div>}
      {it.perks && <div className="flex flex-col gap-0.5">{it.perks.map(k => <span key={k.t} className={`font-label-sm text-label-sm ${k.malo ? 'text-error' : 'text-secondary'}`}>{k.malo ? '−' : '+'} {k.t}</span>)}</div>}
      {it.mods && <div className="flex flex-wrap gap-1">{Object.entries(it.mods).slice(0, 4).map(([k, v]) => <span key={k} className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${v > 0 ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>{k === 'sil' ? 'Silenciado' : `${v > 0 ? '+' : ''}${v} ${k}`}</span>)}</div>}
      <div className="flex items-center justify-between gap-space-sm mt-auto pt-space-xs">
        <Moneda moneda={moneda} n={precio} grande />
        {mio
          ? <span className="font-label-md text-label-md text-secondary flex items-center gap-1"><Icon n="check_circle" className="text-base" />EN PROPIEDAD</span>
          : <button onClick={comprarlo} disabled={falta} className="px-space-md py-1.5 bg-primary hover:bg-primary-fixed disabled:bg-surface-container disabled:text-on-surface-variant text-on-primary rounded font-label-lg text-label-lg uppercase tracking-wider">{falta ? 'NO ALCANZA' : 'COMPRAR'}</button>}
      </div>
    </div>
  );
}

export default function Mercado({ f }) {
  const p = usePerfil();
  const productos = productosTienda();
  const por = tipo => productos.filter(i => i.tipo === tipo);
  const regalo = () => { const r = regaloDePrueba(); API.click(); aviso(r.msg); };
  const premium = () => { const r = activarPremium(); API.click(); aviso(r.msg); };
  return (
    <div className="flex flex-col gap-space-lg anim-entrar">
      <div className="flex items-center justify-between pb-space-xs gap-space-sm flex-wrap">
        <div className="flex items-center gap-2"><span className="w-1.5 h-3.5 bg-primary"></span><h2 className="font-headline-md text-headline-md tracking-wider text-on-surface uppercase">TIENDA</h2></div>
        <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-1 rounded"><Moneda moneda="creditos" n={p.creditos} /><span className="text-outline">|</span><Moneda moneda="fichas" n={p.fichas} /></div>
      </div>

      {!CONFIG.COBRAR && (
        <div className="bg-tertiary/10 border border-tertiary/30 rounded-lg p-space-md flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-start gap-space-sm"><Icon n="science" className="text-tertiary text-2xl" />
            <div><div className="font-label-lg text-label-lg text-tertiary uppercase font-bold">MODO PRUEBA</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">Los productos PREMIUM (con fichas) se van a cobrar más adelante. Mientras probamos el juego son gratis: pedí fichas de regalo y probá todo.</p></div></div>
          <button onClick={regalo} className="px-space-lg py-2 bg-tertiary text-on-tertiary hover:bg-tertiary-fixed rounded-lg font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-2"><Icon n="redeem" className="text-xl" />RECIBIR {CONFIG.FICHAS_PRUEBA} FICHAS</button>
        </div>
      )}

      <Seccion titulo="PASE PREMIUM" color="bg-tertiary">
        <div className="bg-surface-container-low rounded-lg p-space-md flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm"><Icon n="workspace_premium" className="text-tertiary text-4xl" />
            <div><div className="font-label-lg text-label-lg text-on-surface uppercase font-bold">PASE DE BATALLA PREMIUM · {CONFIG.TEMPORADA}</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Desbloquea la pista premium de los 100 niveles: operadores y camuflajes exclusivos, fichas y más créditos.</p></div></div>
          {p.pase.premium ? <span className="font-label-md text-label-md text-secondary flex items-center gap-1"><Icon n="check_circle" className="text-base" />ACTIVO</span>
            : <button onClick={premium} className="px-space-lg py-2 bg-primary hover:bg-primary-fixed text-on-primary rounded-lg font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-2">ACTIVAR · <Moneda moneda="fichas" n={CONFIG.PRECIO_PASE} /></button>}
        </div>
      </Seccion>

      <Seccion titulo="OPERADORES" color="bg-secondary"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">{por('operador').map(i => <Producto key={i.id} it={i} p={p} />)}</div></Seccion>
      <Seccion titulo="CAMUFLAJES"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">{por('camo').map(i => <Producto key={i.id} it={i} p={p} />)}</div></Seccion>
      <Seccion titulo="ASPECTOS EVOLUTIVOS" color="bg-primary"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">{por('skin').map(i => <Producto key={i.id} it={i} p={p} />)}</div></Seccion>
      <Seccion titulo="ACCESORIOS DE ARMA" color="bg-tertiary"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">{por('accesorio').map(i => <Producto key={i.id} it={i} p={p} />)}</div></Seccion>

      <Seccion titulo="FICHAS" color="bg-tertiary" chip={<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-highest px-space-xs py-0.5 rounded">{CONFIG.COBRAR ? 'PAGO SEGURO' : 'PRÓXIMAMENTE'}</span>}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          {FICHAS_PACKS.map(k => (
            <div key={k.id} className="bg-surface-container-low rounded-lg p-space-md flex flex-col items-center gap-space-sm opacity-80">
              <Icon n="diamond" className="text-tertiary text-4xl" /><Moneda moneda="fichas" n={k.fichas} grande />
              <button disabled className="w-full px-space-md py-1.5 bg-surface-container text-on-surface-variant rounded font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-1.5"><Icon n="lock" className="text-sm" />{k.precio} · PRÓXIMAMENTE</button>
            </div>
          ))}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Las compras con dinero real se van a activar cuando el juego esté listo para publicarse. Todavía no se cobra nada.</p>
      </Seccion>
    </div>
  );
}
