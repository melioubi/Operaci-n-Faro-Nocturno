# 🔦 Operación Faro Nocturno

Shooter táctico con vista desde arriba, de noche, con amigos online.
**Idea y código original: Bruno (BRUCO) 😎 — Propiedad intelectual: BRUCO.**

## 🎮 Jugar

**https://melioubi.github.io/Operaci-n-Faro-Nocturno/**

Funciona en compu (teclado + mouse) y en celular (joysticks). Se puede **instalar como app** (botón INSTALAR APP, o "Agregar a inicio" en iPhone).

## 📖 Historia

Tu escuadrón llegó a una isla con un faro abandonado y un grupo enemigo tomó la zona. Limpiá las 4 zonas (cabaña, bosquecito, costa rocosa y torre del faro), aguantá las oleadas y escapá en el helicóptero.

## ✨ Qué tiene

- **Modos:** Campaña (4 zonas), Supervivencia (oleadas infinitas), Cooperativo con amigos y Duelo por equipos (verde vs rojo). Los modos online usan bots que maneja la compu para completar equipos.
- **Niveles y camuflajes:** la experiencia se guarda en cada dispositivo. Del nivel 1 al 10, con mejoras de vida, armas y camuflajes.
- **Tienda** entre zonas, rachas de bajas (dron, ataque aéreo, torreta), perros y francotiradores.
- **Salas online:** se crea una sala, se manda el link y los amigos entran. Conexión directa entre navegadores (WebRTC con PeerJS), sin servidor propio.
- **Menús y HUD** con estética táctica: pestañas Jugar, Armería, Operadores, Niveles, Historial y Ayuda.

## 🧰 Cómo está hecho

| Parte | Tecnología |
|---|---|
| Mundo del juego (mapa, enemigos, disparos, luces) | Canvas 2D, en `app/src/engine/juego.js` |
| Interfaz (menús, HUD, tienda, pausa) | React + Tailwind CSS, en `app/src/ui/` |
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
