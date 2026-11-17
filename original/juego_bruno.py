# Código original de Bruno (12 años) — versión Python con pygame.
# La versión web mejorada está en ../index.html
# Para correrlo: pip install pygame  y después  python juego_bruno.py

import pygame
import sys
import math
import random

pygame.init()

ANCHO, ALTO = 960, 640
pantalla = pygame.display.set_mode((ANCHO, ALTO))
pygame.display.set_caption("OPERACIÓN FARO NOCTURNO — METAL MODE")

# Colores
NEGRO = (12, 12, 18)
GRIS = (60, 60, 70)
GRIS_OSCURO = (30, 30, 38)
ROJO = (210, 30, 30)
ROJO_CLARO = (255, 80, 80)
VERDE = (30, 210, 30)
AMARILLO = (230, 200, 30)
BLANCO = (220, 220, 220)

# Jugador
jugador_x = 100
jugador_y = 100
vel_jugador = 3.8
vida = 100
max_vida = 100
angulo_jugador = 0

# Arma
municion = 30
max_municion = 30
tiempo_disparo = 0
cooldown_disparo = 12

# Enemigos
enemigos = []
cant_enemigos_oleada = 5
oleada = 1
bajas = 0

# Rachas de bajas
dron_activado = False
ataque_aereo_listo = False
torreta_activada = False

# Balas
balas = []
vel_bala = 9

# Coberturas
coberturas = [
    pygame.Rect(250, 180, 70, 70),
    pygame.Rect(500, 300, 90, 50),
    pygame.Rect(700, 120, 60, 80),
    pygame.Rect(400, 450, 80, 60)
]

reloj = pygame.time.Clock()
ejecutando = True

def generar_enemigos(cantidad):
    for _ in range(cantidad):
        x = random.randint(400, ANCHO - 30)
        y = random.randint(50, ALTO - 30)
        enemigos.append([x, y, 1.6, 30])

generar_enemigos(cant_enemigos_oleada)

while ejecutando:
    dt = reloj.tick(60)
    tiempo_disparo += 1

    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            ejecutando = False

    teclas = pygame.key.get_pressed()
    mouse_x, mouse_y = pygame.mouse.get_pos()

    # Movimiento jugador
    if teclas[pygame.K_w]: jugador_y -= vel_jugador
    if teclas[pygame.K_s]: jugador_y += vel_jugador
    if teclas[pygame.K_a]: jugador_x -= vel_jugador
    if teclas[pygame.K_d]: jugador_x += vel_jugador

    jugador_x = max(20, min(ANCHO - 20, jugador_x))
    jugador_y = max(20, min(ALTO - 20, jugador_y))

    # Ángulo hacia el mouse
    angulo_jugador = math.atan2(mouse_y - jugador_y, mouse_x - jugador_x)

    # Disparar
    if pygame.mouse.get_pressed()[0] and tiempo_disparo >= cooldown_disparo and municion > 0:
        bx = jugador_x + math.cos(angulo_jugador) * 22
        by = jugador_y + math.sin(angulo_jugador) * 22
        balas.append([bx, by, math.cos(angulo_jugador)*vel_bala, math.sin(angulo_jugador)*vel_bala])
        municion -= 1
        tiempo_disparo = 0

    # Regeneración de vida (estilo COD)
    if vida < max_vida:
        vida += 0.04

    # Actualizar balas
    for b in balas[:]:
        b[0] += b[2]
        b[1] += b[3]
        if b[0] < 0 or b[0] > ANCHO or b[1] < 0 or b[1] > ALTO:
            balas.remove(b)

    # IA enemigos
    for e in enemigos[:]:
        dx = jugador_x - e[0]
        dy = jugador_y - e[1]
        dist = math.hypot(dx, dy)
        if dist > 30:
            e[0] += (dx/dist)*e[2]
            e[1] += (dy/dist)*e[2]
        # Enemigo toca al jugador
        if dist < 28:
            vida -= 0.3

        # Bala toca enemigo
        for b in balas[:]:
            if math.hypot(b[0]-e[0], b[1]-e[1]) < 20:
                e[3] -= 12
                balas.remove(b)
                if e[3] <= 0:
                    enemigos.remove(e)
                    bajas += 1
                    # Rachas de bajas
                    if bajas == 3: dron_activado = True
                    if bajas == 6: ataque_aereo_listo = True
                    if bajas == 10: torreta_activada = True
                    break

    # Nueva oleada si no quedan enemigos
    if len(enemigos) == 0:
        oleada += 1
        cant_enemigos_oleada += 3
        generar_enemigos(cant_enemigos_oleada)

    # Dibujar
    pantalla.fill(NEGRO)

    # Coberturas
    for c in coberturas:
        pygame.draw.rect(pantalla, GRIS_OSCURO, c)

    # Balas
    for b in balas:
        pygame.draw.circle(pantalla, ROJO_CLARO, (int(b[0]), int(b[1])), 5)

    # Enemigos
    for e in enemigos:
        pygame.draw.circle(pantalla, ROJO, (int(e[0]), int(e[1])), 14)

    # Jugador
    pygame.draw.circle(pantalla, VERDE, (int(jugador_x), int(jugador_y)), 16)
    # Arma apuntando al mouse
    arma_x = jugador_x + math.cos(angulo_jugador)*22
    arma_y = jugador_y + math.sin(angulo_jugador)*22
    pygame.draw.line(pantalla, BLANCO, (jugador_x, jugador_y), (arma_x, arma_y), 4)

    # Barra de vida
    pygame.draw.rect(pantalla, GRIS, (20, 20, 200, 22))
    pygame.draw.rect(pantalla, VERDE, (20, 20, vida*2, 22))

    # Texto
    fuente = pygame.font.SysFont("Arial", 22)
    texto_oleada = fuente.render(f"Oleada: {oleada}", True, BLANCO)
    texto_bajas = fuente.render(f"Bajas: {bajas}", True, AMARILLO)
    texto_muni = fuente.render(f"Munición: {municion}/{max_municion}", True, BLANCO)
    pantalla.blit(texto_oleada, (20, 60))
    pantalla.blit(texto_bajas, (20, 90))
    pantalla.blit(texto_muni, (20, 120))

    # Rachas de bajas
    if dron_activado:
        t = fuente.render("✅ DRON DESBLOQUEADO", True, AMARILLO)
        pantalla.blit(t, (700, 30))
    if ataque_aereo_listo:
        t = fuente.render("✅ ATAQUE AÉREO LISTO", True, ROJO_CLARO)
        pantalla.blit(t, (700, 60))
    if torreta_activada:
        t = fuente.render("✅ TORRETA DISPONIBLE", True, VERDE)
        pantalla.blit(t, (700, 90))

    pygame.display.flip()

pygame.quit()
sys.exit()
