// Imágenes del diseño (se cargan de internet; si no hay conexión el fondo oscuro queda igual de bien)
export const IMG_FONDO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYJBS7Ep1eLUFLgllpsKpPaBuIO0hc6m6VTiYsN5HfAy11t-thJDZVumfWCgZH7Apc8shf-Li9UZi6LW9K1WbY3sbOnNDUEeulDYNHeA14MSgra5x2MEkRb5492u_9h7AVSIrTmocokvsmDZcsFX1LEwpvbzJl2wFbcC_krnmx8vi9fIzac7vzHTaAKruTAyH7Rj66nuHuHROCI8LVt9F38GNZzKFZZirOhWckb-I';
export const IMG_MODO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuO-DeMJqpS51xCzsI_9LOZ3xZU9gVX8Xbleq58jRkLAJ0MfHyFxd-xm_dntMVzB4Iy2odkPZPdkGMlWH8MRkcMgHG_8QODwYC9FVriPpaubhJy0flcXoiyeQ1Exb9SpcLNFS_yx_z37M8NxzXzChLjTx6Ju5YOZt0KzR9hl5CGvCP2J7fVPW1DJvmLk2vCV6wSQsur8R7fzHNVLlnqL9qYvF6VYLihlk2uLKHeLE';
export const IMG_FUSIL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh4rsrsQgeQKjEi11KS_CU8WzWeUfL3QPS8VQvBCF4-enaH3T9v0dn7pCObmyd9JxCjH3LzsJMpC7T8hE6X6E-wn1-SKNF7HOJrkrgVSeYLgHbKNeR5Rx15oNo92Ol_X86T7JmjkriaDVb-XofMwdt-jSytkkUH6p1oY4Wxte5Ei5zaMm-GSBhhJZ4USyQRzMKVmcqzezWLJBek29UYKKNIHKIRibBA7IPEigleCo';
export const IMG_OPERADOR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiw7tXPC6JRamp4ftWyvFcFNEwIGj5VknSmGn_1lcyMOt0An8DXIDEm7ih_pXofiMxidl6sJDz0hc5bdxLG-y3bJhMrC-PzJkV8-Z3YTP4--dErIOvXTPgEVfWIfzUDshNOCjNk1lJosZIPtk0qutNBgby5AwFE8ttDWzbXsRSReQT27iO_O3jY6fmkB3XS5tQae1gfZAaEsoHh74-PVbYHCVQNlcAhMno8o1TipM';

export const MODOS = [
  { id: 'campania', corto: 'ASALTO AL FARO (CAMPAÑA)', sub: 'Niebla densa // 4 zonas // 1 jugador', etiqueta: 'MODO PRINCIPAL // CAMPAÑA', titulo: 'OPERACIÓN: ASALTO AL FARO',
    chip: 'XP POR CADA BAJA', jugadores: '1 JUGADOR', online: false,
    desc: 'Infiltración nocturna en la isla. Limpiá la cabaña, el bosque y la costa, defendé el faro 60 segundos y subí al helicóptero de extracción.',
    pie: ['4 ZONAS // 8 OLEADAS', 'TIEMPO ESTIMADO: ~15 MIN'] },
  { id: 'supervivencia', corto: 'SUPERVIVENCIA', sub: 'Faro sitiado // oleadas infinitas', etiqueta: 'MODO ARCADE // SUPERVIVENCIA', titulo: 'ASEDIO AL FARO',
    chip: 'RÉCORD DE OLEADAS', jugadores: '1 JUGADOR', online: false,
    desc: 'Una oleada tras otra, cada vez más fuertes. Cada 3 oleadas se abre la tienda del escuadrón. ¿Cuántas aguantás?',
    pie: ['OLEADAS INFINITAS', 'COMANDANTE CADA 5 OLEADAS'] },
  { id: 'tiro', corto: 'CAMPO DE TIRO', sub: 'Sin enemigos // Probá tus accesorios', etiqueta: 'ENTRENAMIENTO // ARMERÍA', titulo: 'CAMPO DE TIRO',
    chip: 'PRUEBA TUS ARMAS', jugadores: '1 JUGADOR', online: false,
    desc: 'Blancos que reaparecen y munición infinita. Ideal para probar accesorios y ver cuánto daño hacés por segundo.',
    pie: ['SIN ENEMIGOS', 'MUNICIÓN INFINITA'] },
  { id: 'coop', corto: 'COOPERATIVO (CON AMIGOS)', sub: 'Hasta 8 operadores // Bots opcionales', etiqueta: 'MODO ONLINE // COOPERATIVO', titulo: 'DEFENSA DEL FARO',
    chip: 'ONLINE', jugadores: 'HASTA 8 JUGADORES', online: true,
    desc: 'Invitá a tus amigos con un link y defiendan el faro juntos contra oleadas infinitas. Si alguien cae, vuelve a los pocos segundos.',
    pie: ['SIN INSTALAR NADA', 'BOTS OPCIONALES DE LA COMPU'] },
  { id: 'equipos', corto: 'DUELO POR EQUIPOS', sub: 'Verde vs Rojo // Primero a 20 bajas', etiqueta: 'MODO ONLINE // PVP', titulo: 'DUELO EN EL BOSQUE',
    chip: 'ONLINE', jugadores: 'HASTA 8 JUGADORES', online: true,
    desc: 'Dos equipos, un bosque y un camino de tierra. Gana el primero en llegar a 20 bajas o el que vaya ganando a los 5 minutos.',
    pie: ['VERDE vs ROJO', 'PARTIDA DE ~5 MIN'] },
];

// Instrucciones (se muestran en la pestaña AYUDA y en el menú de pausa)
export const AYUDA = [
  { t: 'LA MISIÓN', i: 'flag', filas: [
    'Tu escuadrón llegó a una isla con un faro abandonado. El enemigo la tomó.',
    'Hay 4 zonas: CABAÑA, BOSQUECITO, COSTA ROCOSA y TORRE DEL FARO.',
    'En cada zona hay que superar 2 oleadas de enemigos.',
    'Al limpiar una zona se abre el portón rojo: seguí la flecha amarilla.',
    'En el faro aguantás 60 segundos y llega el helicóptero. Corré a la H.',
    'Si perdés, reintentás desde la zona donde estabas.',
  ] },
  { t: 'CONTROLES EN COMPU', i: 'gamepad', teclas: [
    ['W A S D / FLECHAS', 'Caminar'], ['SHIFT', 'Correr'], ['MOUSE', 'Apuntar'], ['CLICK', 'Disparar'], ['R', 'Recargar'],
    ['1 2 3 / Q / RUEDITA', 'Cambiar de arma'], ['G / CLICK DERECHO', 'Tirar granada'], ['E', 'Caja de munición (cerca de la caja)'],
    ['Z / X / C', 'Dron / Ataque aéreo / Torreta'], ['V', 'Cambiar de vista (arriba 2.5D / tercera / primera / clásica)'], ['PRIMERA Y TERCERA', 'Clic en el juego captura el mouse: movés el mouse para mirar y el clic izquierdo dispara. La sensibilidad se ajusta en AJUSTES'], ['ESC / P', 'Pausa'], ['M', 'Sonido'],
  ] },
  { t: 'CONTROLES EN CELULAR', i: 'my_location', nota: 'Poné el celular acostado y usá los dos pulgares a la vez.', teclas: [
    ['JOYSTICK IZQUIERDO', 'Arrastrá el dedo para caminar'],
    ['JOYSTICK DERECHO', 'En vista de arriba: apunta y dispara. En primera y tercera: sólo mueve la mira'],
    ['BOTÓN FUEGO', 'En primera y tercera persona: mantenelo apretado para disparar. No mueve la mira'],
    ['RECAR', 'Recargar'], ['ARMA', 'Cambiar de arma'], ['GRAN', 'Tirar granada'], ['CAJA', 'Reabastecer munición'], ['DRON · AÉREO · TORRE', 'Rachas de bajas (cuando se encienden)'],
  ] },
  { t: 'CONSEJOS', i: 'target', filas: [
    'Si no te pegan por 3 segundos, la vida se recupera sola. ¡Cubrite!',
    'Los enemigos con láser rojo están por disparar. ¡Movete!',
    'Rachas: 3 bajas = dron, 6 = ataque aéreo, 10 = torreta.',
    'La pistola nunca se queda sin balas.',
    'Los enemigos sueltan munición, botiquines y granadas.',
    'Perros: rápidos y en grupo. Francotiradores: láser largo, ¡escondete!',
  ] },
  { t: 'NIVELES Y TIENDA', i: 'military_tech', filas: [
    'Cada baja da experiencia (XP). Con XP subís de nivel, hasta el 100.',
    'Cada nivel te da una recompensa en el PASE DE BATALLA: reclamala ahí.',
    'Al terminar una partida ganás CRÉDITOS: gastalos en la TIENDA (operadores, camuflajes y accesorios).',
    'En la ARMERÍA equipás accesorios que cambian cómo dispara cada arma. Probalos en el CAMPO DE TIRO.',
    'Cada OPERADOR tiene habilidades propias. Elegí el que más te guste.',
    'Al despejar una zona se abre el ABASTECIMIENTO: gastá los puntos de la partida en munición.',
    'Todo se guarda en este dispositivo.',
  ] },
  { t: 'JUGAR CON AMIGOS', i: 'groups', filas: [
    'Elegí COOPERATIVO o DUELO POR EQUIPOS y tocá INVITAR: se crea una sala con un código.',
    'Tocá COPIAR LINK o COMPARTIR y mandáselo a tus amigos.',
    'Ellos abren el link y tocan UNIRME A LA SALA.',
    'COOPERATIVO: todos juntos contra los enemigos de la compu.',
    'EQUIPOS: verde contra rojo, el primero con 20 bajas gana.',
    'BOTS: soldados que maneja la compu para completar los equipos.',
  ] },
];
