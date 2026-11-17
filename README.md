# 🔦 Operación Faro Nocturno

Shooter retro 8-bits con vista desde arriba, estilo supervivencia de Call of Duty.
**Idea y código original: Bruno (12 años).**

## 🎮 Jugar

Abrí el link de GitHub Pages del repo (o abrí `index.html` en el navegador). No hace falta instalar nada.
Funciona en la compu (teclado + mouse) y también en tablet/celular (joysticks táctiles).

## 📖 Historia

Tu escuadrón fue enviado a una isla con un faro abandonado. Un grupo enemigo tomó toda la zona.
Tu misión: limpiar las 4 zonas, sobrevivir a las oleadas y defender el faro hasta que llegue el helicóptero de rescate.

1. 🏠 **La Cabaña**: punto de inicio, con caja de munición adentro
2. 🌲 **El Bosquecito**: muchos árboles, te emboscan
3. 🌊 **Costa rocosa**: espacio abierto, pocas coberturas
4. 🗼 **Torre del faro**: oleadas finales, el Comandante enemigo y defensa de 60 segundos hasta el helicóptero

## 🕹️ Controles

| Acción | Teclado / mouse |
|---|---|
| Moverse | WASD o flechas |
| Correr | Shift |
| Apuntar / disparar | Mouse / click izquierdo |
| Granada | G o click derecho |
| Recargar | R |
| Cambiar arma | 1, 2, 3, Q o la ruedita |
| Caja de munición | E |
| Dron / Ataque aéreo / Torreta | Z / X / C |
| Pausa / Sonido | P o Esc / M |

## ✨ Qué se agregó sobre el código original de Bruno

- Versión web: se juega desde el navegador, sin instalar Python ni pygame.
- Mapa grande con las 4 zonas de la idea, portones que se abren al despejar cada zona y minimapa.
- Gráficos 8-bits, noche oscura con linterna, faro giratorio y fogonazos que iluminan.
- 4 armas de la idea: pistola (munición infinita), fusil M4, escopeta y granadas.
- Regeneración de vida estilo COD: si no te pegan por 3,5 segundos te curás. Pantalla roja e indicador de dónde vienen los tiros.
- Enemigos con IA: soldados que disparan y se cubren detrás de cosas cuando están heridos, corredores con cuchillo, pesados con escopeta y un jefe final que tira granadas. Antes de disparar muestran un láser rojo, así los podés esquivar.
- Las rachas de bajas de Bruno ahora funcionan: x3 dron que te sigue y dispara, x6 ataque aéreo de un avión, x10 torreta.
- Cajas de munición, botiquines y granadas que sueltan los enemigos.
- Puntos, hitmarkers, mensajes de radio, helicóptero que aterriza, final bueno y malo, rangos y récord.
- Pantalla "Cómo jugar", se adapta a celular (horizontal) y compu, y el avance se guarda solo en el navegador (botón CONTINUAR).
- Experiencia y niveles (1 a 10) que desbloquean vida, mejoras de armas, granadas y camuflajes.
- Tienda entre zonas para gastar puntos, perros, francotiradores con láser largo y modo SUPERVIVENCIA con oleadas infinitas.
- Checkpoint al entrar a cada zona, 3 dificultades y música y sonidos chiptune generados por código.

## 🧠 Notas para Bruno (cosas que aprendimos de tu código)

- `pygame.font.SysFont(...)` estaba adentro del `while`, así que creaba la fuente 60 veces por segundo. Conviene crearla una sola vez antes del loop.
- En el `for b in balas[:]` adentro del `for e in enemigos[:]`, si un enemigo moría, el `break` sólo salía del loop de balas. Estaba bien pensado, pero cuando hay muchas cosas que se borran a la vez conviene marcar `muerto = True` y limpiar la lista al final.
- La vida podía pasar de 100 porque se sumaba `0.04` sin tope. Se arregla con `vida = min(max_vida, vida + 0.04)`.
- Las rachas (`bajas == 3`) sólo mostraban un cartel. Ahora cada una hace algo.
- Las coberturas se dibujaban, pero las balas y los personajes las atravesaban. En la versión nueva hay colisiones con todo.

Tu código original está en [`original/juego_bruno.py`](original/juego_bruno.py).
