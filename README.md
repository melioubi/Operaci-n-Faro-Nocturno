# 🔦 Operación Faro Nocturno

Shooter táctico con vista desde arriba, de noche, con amigos online.
**Idea y código original: Bruno (BRUCO) 😎 — Propiedad intelectual: BRUCO.**

## 🎮 Jugar

**https://melioubi.github.io/Operaci-n-Faro-Nocturno/**

Funciona en compu (teclado + mouse) y en celular (joysticks). Se puede **instalar como app** (botón INSTALAR APP, o "Agregar a inicio" en iPhone).

## 📖 Historia

Tu escuadrón llegó a una isla con un faro abandonado y un grupo enemigo tomó la zona. Limpiá las 4 zonas (cabaña, bosquecito, costa rocosa y torre del faro), aguantá las oleadas y escapá en el helicóptero.

## ✨ Qué tiene

- **Modos:** Campaña (4 zonas), Supervivencia (oleadas infinitas), Campo de tiro (para probar armas), Cooperativo con amigos y Duelo por equipos (verde vs rojo). Los modos online usan bots que maneja la compu para completar equipos.
- **100 niveles** con poca experiencia por nivel, y un **pase de batalla** con pista gratis y pista premium.
- **Armería:** accesorios para cada arma (boca de cañón, láser, óptica, acople, munición y culata) que cambian de verdad cómo dispara. Se prueban en el campo de tiro, que muestra daño por segundo y puntería.
- **Operadores:** 7 personajes con habilidades propias (más vida, más velocidad, más daño, más experiencia...) y 12 camuflajes.
- **Tienda:** créditos (se ganan jugando) y fichas (moneda premium). Operadores, camuflajes y accesorios.
- **Campo de batalla** con HUD táctico: radar circular, brújula con el objetivo, registro de bajas, escuadrón, arma con contador de balas, lluvia, relámpagos y visión nocturna (tecla N).
- **Salas online:** se crea una sala, se manda el link y los amigos entran. Conexión directa entre navegadores (WebRTC con PeerJS), sin servidor propio.
- **App instalable** (celular y compu) y funciona sin internet en el modo solo.

## 💰 Cobros (más adelante)

Todo se prueba gratis por ahora. En `app/src/progreso/catalogo.js` hay un interruptor:

```js
export const CONFIG = { COBRAR: false, ... }
```

- Los productos con **fichas** son los premium (por ejemplo el operador NOVA, el camuflaje NEÓN y el pase premium).
- Mientras `COBRAR` sea `false`, la tienda ofrece un **regalo de prueba de fichas** y las compras con dinero real aparecen como "PRÓXIMAMENTE".
- **Todavía no hay ningún cobro real conectado.** Cuando el juego esté listo se va a conectar un medio de pago, se pone `COBRAR: true` y se saca el regalo de prueba.

## ☁️ Cuando esté terminado: GCP y Supabase

Por ahora el juego vive sólo en este repositorio (GitHub Pages) y guarda el progreso en cada navegador. Está preparado para dar el salto:

- **Progreso del jugador:** todo pasa por `app/src/progreso/almacen.js` (leer y guardar el perfil). Para usar Supabase se reemplaza ese archivo por uno que guarde en una tabla de perfiles, y el resto del juego no cambia.
- **Cuentas:** Supabase Auth (correo o Google) para que el avance siga al jugador entre dispositivos.
- **Compras y fichas:** se validan del lado del servidor (una función en GCP, por ejemplo Cloud Run) para que nadie se regale fichas desde el navegador.
- **Multijugador:** hoy es directo entre navegadores. Si crece, se puede mover a un servidor de salas en GCP.
- Nada de esto está desplegado todavía.

## 🧰 Cómo está hecho

| Parte | Tecnología |
|---|---|
| Mundo del juego (mapa, enemigos, disparos, luces) | Canvas 2D, en `app/src/engine/juego.js` |
| Interfaz (menús, HUD, tienda, pausa) | React + Tailwind CSS, en `app/src/ui/` |
| Progresión (niveles, catálogo, perfil, pase) | `app/src/progreso/` |
| Compilación | Vite |
| Multijugador | PeerJS (WebRTC) |
| Sonido | Web Audio (chiptune generado por código, sin archivos) |
| App instalable | `manifest.webmanifest` + `sw.js` |

**¿Por qué Vite + React y no Next.js?** El juego corre 100% en el navegador (usa canvas, teclado y toques) y GitHub Pages sólo sirve archivos. Next.js agrega un servidor y renderizado en el servidor que acá no hacen falta. Vite + React da los mismos componentes y estilos, compila más rápido y se publica como archivos simples.

El motor del juego es un único archivo y se comunica con React mediante una "foto" del estado (`store`) y una lista de órdenes (`API`). Eso permite cambiar toda la interfaz sin tocar la lógica del juego.

## 🛠️ Para modificarlo

Hace falta [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
cd app
npm install        # una sola vez
npm run dev        # abre el juego en http://localhost:5173 (se actualiza solo al guardar)
```

Para probar cosas desde la consola del navegador, agregá `?debug` a la dirección.

### Publicar los cambios

GitHub Pages sirve lo que está en la raíz del repo, así que después de cambiar algo:

```bash
cd app
npm run publicar   # compila y copia el resultado a la raíz del repo
```

Después hacé commit y push de todo (incluida la carpeta `assets/` y `index.html` de la raíz).

## 🧠 Notas para Bruno (cosas que aprendimos de tu código original)

- `pygame.font.SysFont(...)` estaba adentro del `while`, así que creaba la fuente 60 veces por segundo. Conviene crearla una sola vez antes del loop.
- La vida podía pasar de 100 porque se sumaba `0.04` sin tope. Se arregla con `vida = min(max_vida, vida + 0.04)`.
- Las rachas (`bajas == 3`) sólo mostraban un cartel. Ahora cada una hace algo.
- Las coberturas se dibujaban, pero las balas y los personajes las atravesaban. En la versión nueva hay colisiones con todo.

Tu código original está en [`original/juego_bruno.py`](original/juego_bruno.py).
