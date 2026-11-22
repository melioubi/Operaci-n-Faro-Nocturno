import * as THREE from 'three';
import { textura, conRepeticion, crearCielo, crearHazVisible } from './texturas3d.js';
import { animadoListo, cargarModelos, claveOperador, mapaDe, modeloListo, tomarAnimado, tomarModelo } from './modelos3d.js';

// Campo 3D de la campaña. El combate sigue en el mapa 2D; esta capa lo muestra
// con los modelos cargados: operadores, enemigo, perro, armas, cabaña, faro y helicóptero.

const ESCALA = 0.12;
const ALTO_PERSONA = 1.85;
const CAMPOS = [
  { suelo: 0x3d6a32, niebla: 0x1a2430, dens: 0.018 },
  { suelo: 0x214818, niebla: 0x142018, dens: 0.028 },
  { suelo: 0x8a7348, niebla: 0x1c242c, dens: 0.014 },
  { suelo: 0x3a5240, niebla: 0x1a2228, dens: 0.016 },
];
const ALTURA = { pared: 2.6, caja: 1.05, bolsas: 0.75, tronco: 0.45, bote: 0.7, municion: 0.55, porton: 3.1 };
const COLOR_TIPO = {
  pared: 0xb0a088, caja: 0x8a6840, bolsas: 0xa89870, tronco: 0x6e563a, bote: 0x4a7098, municion: 0x58703c, porton: 0xc04040,
};

const aX = (x) => x * ESCALA;
const aZ = (y) => y * ESCALA;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

let canvas = null;
let renderer = null;
let scene = null;
let camera = null;
let reloj = null;
let listo = false;
let fallo = false;
let mapaHecho = -1;
let calAplicada = '';
let estatico = null;
let puertas = [];
let haz = null;
let linterna = null;
let luna = null;
let ambiente = null;
let lluvia = null;
let lluviaN = 0;
let rayoT = 0;
let jugador = null;
let armaMano = null;
let armaClave = '';
let heliMesh = null;
let luzBoca = null;
let cielo = null;
let hazVis = null;
let escalaDin = 1;
let ema = 0.0167;
let ajusteT = 0;
const figuras = [];
const trazas = [];
const granadasMesh = [];
const itemsMesh = [];
const fuegos = [];

const CUBO = new THREE.BoxGeometry(1, 1, 1);
const GEO_TRONCO = new THREE.CylinderGeometry(0.5, 0.6, 1, 6);
const GEO_COPA = new THREE.SphereGeometry(0.5, 7, 5);
const GEO_ROCA = new THREE.DodecahedronGeometry(0.5, 0);
const GEO_BALA = new THREE.SphereGeometry(0.06, 6, 4);

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.08, ...extra });
}
function caja(w, h, d, color, extra) {
  const m = new THREE.Mesh(CUBO, material(color, extra));
  m.scale.set(Math.max(0.08, w), Math.max(0.08, h), Math.max(0.08, d));
  m.userData.basico = true;
  return m;
}

function texturaClon(clave, repX, repY) {
  const mapa = mapaDe(clave);
  if (!mapa) return null;
  const copia = mapa.clone();
  copia.wrapS = THREE.RepeatWrapping;
  copia.wrapT = THREE.RepeatWrapping;
  copia.repeat.set(repX, repY);
  copia.colorSpace = THREE.SRGBColorSpace;
  copia.needsUpdate = true;
  return copia;
}

function materialConMapa(color, clave, repX, repY, extra) {
  const mapa = texturaClon(clave, repX, repY);
  const mat = material(mapa ? 0xffffff : color, { map: mapa || null, ...extra });
  if (mapa) {
    mat.color.set(color);
    mat.userData.mapaClon = true;
  }
  return mat;
}
function sombrasEn(malla, si) {
  malla.traverse((o) => {
    if (o.isMesh) { o.castShadow = si; o.receiveShadow = si; }
  });
}

function boot() {
  if (listo) return true;
  if (fallo) return false;
  canvas = document.getElementById('c3d');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'c3d';
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  } catch (e) {
    fallo = true;
    return false;
  }
  if (!renderer.getContext()) { fallo = true; return false; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2430);
  scene.fog = new THREE.FogExp2(0x1a2430, 0.02);
  cielo = crearCielo();
  scene.add(cielo);
  hazVis = crearHazVisible();
  scene.add(hazVis);
  if (!document.getElementById('vineta3d')) {
    const v = document.createElement('div');
    v.id = 'vineta3d';
    canvas.insertAdjacentElement('afterend', v);
  }
  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, 220);
  scene.add(camera);
  ambiente = new THREE.HemisphereLight(0x7f9cc8, 0x1c2814, 1.8);
  scene.add(new THREE.AmbientLight(0x243044, 1.1));
  luna = new THREE.DirectionalLight(0xb4c8ff, 6.5);
  luna.position.set(-30, 48, 18);
  scene.add(ambiente, luna, luna.target);
  haz = new THREE.SpotLight(0xfff1c4, 180, 90, 0.22, 0.45, 1.2);
  haz.target.position.set(0, 1, 0);
  scene.add(haz, haz.target);
  linterna = new THREE.SpotLight(0xfff6dd, 80, 28, 0.5, 0.35, 1.4);
  linterna.target.position.set(0, 1, 0);
  scene.add(linterna, linterna.target);
  luzBoca = new THREE.PointLight(0xffe0a0, 0, 6);
  scene.add(luzBoca);
  jugador = crearFigura();
  scene.add(jugador);
  armaMano = new THREE.Group();
  camera.add(armaMano);
  heliMesh = crearHeli();
  scene.add(heliMesh);
  reloj = new THREE.Timer();
  addEventListener('resize', alRedimensionar);
  listo = true;
  if (location.search.includes('debug')) window.__m3 = { THREE, get scene() { return scene; }, get jugador() { return jugador; }, get camera() { return camera; } };
  cargarModelos(modelosLlegaron);
  return true;
}

function modelosLlegaron() {
  if (!scene) return;
  if (jugador) scene.remove(jugador);
  jugador = crearFigura();
  scene.add(jugador);
  for (const m of figuras) scene.remove(m);
  figuras.length = 0;
  vaciarGrupo(armaMano);
  armaMano.userData.clave = '';
  if (heliMesh) scene.remove(heliMesh);
  heliMesh = crearHeli();
  scene.add(heliMesh);
  mapaHecho = -1;
}

function alRedimensionar() {
  if (!renderer || !camera) return;
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  const px = (calAplicada === 'alta' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1) * escalaDin;
  renderer.setPixelRatio(px);
  renderer.setSize(w, h, false);
}

function aplicarCalidad(cal) {
  calAplicada = cal === 'alta' ? 'alta' : 'baja';
  const alta = calAplicada === 'alta';
  renderer.shadowMap.enabled = alta;
  luna.castShadow = alta;
  if (alta) {
    luna.shadow.mapSize.set(1024, 1024);
    luna.shadow.camera.near = 1;
    luna.shadow.camera.far = 80;
    luna.shadow.camera.left = -24;
    luna.shadow.camera.right = 24;
    luna.shadow.camera.top = 24;
    luna.shadow.camera.bottom = -24;
  }
  haz.castShadow = false;
  crearLluvia(alta ? 1400 : 420);
  if (estatico) sombrasEn(estatico, alta);
  alRedimensionar();
}

function crearLluvia(n) {
  if (lluvia) {
    scene.remove(lluvia);
    lluvia.geometry.dispose();
    lluvia.material.dispose();
    lluvia = null;
  }
  lluviaN = n;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = Math.random() * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  lluvia = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xc9d7ef, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  scene.add(lluvia);
}

function vaciarEstatico() {
  if (!estatico) return;
  const compartida = new Set([CUBO, GEO_TRONCO, GEO_COPA, GEO_ROCA]);
  estatico.traverse((o) => {
    if (!o.userData.desechable) return;
    if (o.geometry && !compartida.has(o.geometry)) o.geometry.dispose();
    const mats = [].concat(o.material || []);
    for (const mat of mats) {
      if (!mat || !mat.dispose) continue;
      if (mat.userData.mapaClon && mat.map) mat.map.dispose();
      mat.dispose();
    }
  });
  scene.remove(estatico);
  estatico = null;
  puertas = [];
}

function instancias(lista, geo, mat, poner) {
  if (!lista.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, lista.length);
  const dummy = new THREE.Object3D();
  lista.forEach((o, i) => {
    poner(dummy, o);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function ponerProp(clave, x, y, medida, giro) {
  const m = tomarModelo(clave, medida);
  if (!m) return null;
  m.position.set(aX(x), 0, aZ(y));
  m.rotation.y = giro || 0;
  estatico.add(m);
  return m;
}

function construir(obstaculos, id) {
  vaciarEstatico();
  mapaHecho = id;
  estatico = new THREE.Group();
  const alta = calAplicada === 'alta';
  const hayCabana = modeloListo('cabana');
  CAMPOS.forEach((z, i) => {
    const ancho = 900 * ESCALA;
    const fondo = 900 * ESCALA;
    const tex = conRepeticion(['pasto', 'bosque', 'arena', 'grava'][i] || 'pasto', ancho / 3, fondo / 3);
    const mat = material(0xffffff, { map: tex, bumpMap: tex, bumpScale: 1.6, roughness: 0.62, metalness: 0 });
    mat.userData.mapaClon = true;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), mat);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.set(aX(i * 900 + 450), 0, aZ(450));
    suelo.receiveShadow = alta;
    suelo.userData.desechable = true;
    estatico.add(suelo);
  });
  // Suelo de relleno: cubre todo lo que rodea al mapa (nunca se ve el vacío)
  {
    const W = 3600 * ESCALA + 160, H = 900 * ESCALA + 160, tx = conRepeticion('pasto', W / 3, H / 3);
    const mat = material(0xffffff, { map: tx, bumpMap: tx, bumpScale: 1.6, roughness: 0.62, metalness: 0, color: 0x9aa890 });
    mat.userData.mapaClon = true;
    const borde = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
    borde.rotation.x = -Math.PI / 2;
    borde.position.set(aX(1800), -0.03, aZ(450));
    borde.userData.desechable = true;
    estatico.add(borde);
  }
  const arboles = [];
  const rocas = [];
  for (const o of obstaculos) {
    if (o.tipo === 'agua') {
      const agua = caja(o.w * ESCALA, 0.08, o.h * ESCALA, 0x183652, { roughness: 0.18, metalness: 0.35, transparent: true, opacity: 0.82 });
      agua.position.set(aX(o.x + o.w / 2), 0.02, aZ(o.y + o.h / 2));
      agua.userData.desechable = true;
      estatico.add(agua);
    } else if (o.tipo === 'arbol') arboles.push(o);
    else if (o.tipo === 'roca') rocas.push(o);
    else if (o.tipo === 'faro') ponerFaro(o);
    else if (o.tipo === 'tronco' && modeloListo('madera')) {
      ponerProp('madera', o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h) * ESCALA * 1.6, (o.x % 5) * 0.4);
    } else if (o.tipo === 'bolsas' && modeloListo('metal')) {
      ponerProp('metal', o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h) * ESCALA * 1.3, (o.y % 4) * 0.5);
    } else if (ALTURA[o.tipo]) {
      const alto = ALTURA[o.tipo];
      const clave = (o.tipo === 'caja' || o.tipo === 'tronco') ? 'madera' : (o.tipo === 'bolsas' || o.tipo === 'municion' || o.tipo === 'bote') ? 'metal' : null;
      let mat = clave ? materialConMapa(COLOR_TIPO[o.tipo] || 0x888888, clave, 1, 1, { roughness: 0.8 }) : material(COLOR_TIPO[o.tipo] || 0x888888);
      if (o.tipo === 'pared') {
        const rep = Math.max(1, Math.max(o.w, o.h) * ESCALA / 2.5);
        const tx = conRepeticion('yeso', rep, Math.max(1, alto / 2.5));
        mat = material(0xffffff, { map: tx, bumpMap: tx, bumpScale: 1.2, roughness: 0.92 });
        mat.userData.mapaClon = true;
      }
      const m = new THREE.Mesh(CUBO, mat);
      m.scale.set(Math.max(0.08, o.w * ESCALA), alto, Math.max(0.08, o.h * ESCALA));
      m.position.set(aX(o.x + o.w / 2), alto / 2, aZ(o.y + o.h / 2));
      m.userData.desechable = true;
      m.userData.basico = true;
      if (alta && o.tipo !== 'porton') { m.castShadow = true; m.receiveShadow = true; }
      estatico.add(m);
      if (o.tipo === 'porton') puertas.push({ mesh: m, ob: o });
    }
  }
  if (hayCabana) ponerProp('cabana', 520, 250, 9, 0.4);
  const hitos = [
    ['madera', 640, 160, 3.4, 0.4],
    ['metal', 760, 220, 2.6, 0.8],
    ['restos', 340, 560, 22, 0.6],
    ['tala', 1380, 420, 28, 0.8],
    ['metal', 1500, 220, 2.8, 1.2],
    ['centinela', 2280, 360, 12, 0.4],
    ['madera', 2100, 180, 3.6, 0.6],
    ['metal', 2480, 240, 2.8, 0.3],
    ['ruinas', 2980, 560, 22, 1.1],
    ['madera', 2920, 620, 3.2, 1.1],
  ];
  for (const [clave, x, y, medida, giro] of hitos) {
    if (modeloListo(clave)) ponerProp(clave, x, y, medida, giro);
  }
  const troncos = instancias(arboles, GEO_TRONCO, material(0xffffff, { map: textura('corteza'), roughness: 0.95 }), (d, o) => {
    d.position.set(aX(o.x + o.w / 2), 1.15, aZ(o.y + o.h / 2));
    d.scale.set(o.w * ESCALA * 0.45, 2.3, o.h * ESCALA * 0.45);
  });
  const copas = instancias(arboles, GEO_COPA, material(0x1f6a32), (d, o) => {
    const r = o.w * ESCALA * 2.1;
    d.position.set(aX(o.x + o.w / 2), 2.7, aZ(o.y + o.h / 2));
    d.scale.set(r, r * 0.85, r);
  });
  const piedras = instancias(rocas, GEO_ROCA, material(0xffffff, { map: textura('roca'), bumpMap: textura('roca'), bumpScale: 2, roughness: 0.8 }), (d, o) => {
    d.position.set(aX(o.x + o.w / 2), o.h * ESCALA * 0.35, aZ(o.y + o.h / 2));
    d.scale.set(o.w * ESCALA, o.h * ESCALA * 0.7, o.h * ESCALA);
    d.rotation.y = (o.x % 7) * 0.4;
  });
  if (troncos) { troncos.userData.desechable = true; estatico.add(troncos); }
  if (copas) { copas.userData.desechable = true; estatico.add(copas); }
  if (piedras) { piedras.userData.desechable = true; if (alta) piedras.castShadow = true; estatico.add(piedras); }
  scene.add(estatico);
}

function ponerFaro(o) {
  const cx = aX(o.x + o.w / 2), cz = aZ(o.y + o.h / 2);
  const modelo = tomarModelo('faroTorre', 16);
  if (modelo) {
    modelo.position.set(cx, 0, cz);
    estatico.add(modelo);
  } else {
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 11, 8), material(0xe8e0d0, { roughness: 0.7 }));
    torre.position.set(cx, 5.5, cz);
    torre.castShadow = calAplicada === 'alta';
    torre.userData.desechable = true;
    const galeria = caja(1.8, 0.35, 1.8, 0xc8c0b0);
    galeria.position.set(cx, 11.1, cz);
    galeria.userData.desechable = true;
    estatico.add(torre, galeria);
  }
  const lampara = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), material(0xfff4c8, { emissive: 0xffe7a0, emissiveIntensity: 1.6 }));
  lampara.position.set(cx, modelo ? 15.2 : 11.7, cz);
  lampara.userData.desechable = true;
  estatico.add(lampara);
  haz.position.set(cx, modelo ? 15.1 : 11.6, cz);
}

function capsulaHumana() {
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.62, 4, 8), material(0x3f7a3a));
  cuerpo.position.y = 0.95;
  cuerpo.userData.basico = true;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), material(0xd9a27a));
  cabeza.position.y = 1.52;
  cabeza.userData.basico = true;
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), material(0x2e5a2b));
  casco.position.y = 1.58;
  casco.userData.basico = true;
  const g = new THREE.Group();
  g.add(cuerpo, cabeza, casco);
  g.userData.cuerpo = cuerpo;
  g.userData.casco = casco;
  return g;
}

// ---------- Animación de personajes con esqueleto ----------
let dtFrame = 0.016;
const CLIPS_HUMANO = { quieto: 'Walking', caminar: 'Walking', correr: 'Running', disparar: 'Run_and_Shoot' };
const CLIPS_PERRO = { quieto: 'wolf_idle1', caminar: 'dog_walk', correr: 'dog_run', disparar: 'wolf_run_fight_forward' };
const QP = new THREE.Quaternion();
const QF = new THREE.Quaternion();
const HUESO_MANO = /mixamorig:?RightHand$/;

function reproducir(an, estado, clips, escala) {
  const nombre = clips[estado];
  const acc = an.acciones[nombre];
  if (!acc) return;
  if (an.estado !== estado) {
    const previa = an.acciones[clips[an.estado]];
    acc.reset();
    acc.enabled = true;
    acc.setEffectiveWeight(1);
    acc.play();
    if (previa && previa !== acc) acc.crossFadeFrom(previa, 0.18, false);
    an.estado = estado;
  }
  acc.setEffectiveTimeScale(estado === 'quieto' ? 0 : escala);
  if (estado === 'quieto') acc.time = 0;
}

// Calcula la velocidad real de la figura (por cuánto se movió) y elige la animación
function animarFigura(figura, an, clips, vivo, dispara, pasosCam) {
  const u = figura.userData;
  const x = figura.position.x, z = figura.position.z;
  let vel = 0;
  if (u.prevX !== undefined) {
    const d = Math.hypot(x - u.prevX, z - u.prevZ);
    vel = d > 3 ? 0 : d / Math.max(dtFrame, 0.001);
  }
  u.prevX = x; u.prevZ = z;
  an.vel = (an.vel || 0) * 0.7 + vel * 0.3;
  let estado = 'quieto', escala = 1;
  if (an.vel > 0.6) { estado = an.vel > pasosCam ? 'correr' : 'caminar'; escala = clamp(an.vel / (estado === 'correr' ? 7 : 3.2), 0.6, 2.2); }
  if (dispara && vivo) { estado = 'disparar'; escala = 1; }
  reproducir(an, estado, clips, escala);
  an.mixer.update(dtFrame);
}

function animarHumano(figura, dispara) {
  const an = figura.userData.humano.userData.anim;
  if (!an || !figura.visible || !figura.userData.humano.visible) return;
  animarFigura(figura, an, CLIPS_HUMANO, true, dispara, 7);
  // el arma sigue a la mano, pero siempre apunta hacia donde mira el personaje
  const arma = figura.userData.arma;
  if (arma && arma.userData.enMano) {
    figura.updateWorldMatrix(true, false);
    arma.parent.updateWorldMatrix(true, false);
    arma.parent.getWorldQuaternion(QP);
    figura.getWorldQuaternion(QF);
    arma.quaternion.copy(QP.invert().multiply(QF));
  }
}
function animarPerro(figura) {
  const an = figura.userData.perro.userData.anim;
  if (!an || !figura.visible || !figura.userData.perro.visible) return;
  animarFigura(figura, an, CLIPS_PERRO, false, false, 6);
}

function asegurarHumano(figura, clave, alto) {
  const humano = figura.userData.humano;
  const real = modeloListo(clave);
  const realAnim = (clave === 'faro' || clave === 'enemigo') && animadoListo('soldado');
  if (humano.userData.clave === clave && humano.userData.real === (real || realAnim) && (!realAnim || humano.userData.anim)) return;
  vaciarGrupo(humano);
  humano.userData.anim = null;
  if ((clave === 'faro' || clave === 'enemigo') && animadoListo('soldado')) {
    const an = tomarAnimado('soldado', alto);
    humano.add(an.grupo);
    humano.userData.anim = an;
    if (clave === 'enemigo') an.raiz.traverse((o) => { if (o.isMesh && o.material && o.material.color) o.material.color.setRGB(0.95, 0.62, 0.6); });
    figura.userData.cuerpo = null;
    figura.userData.casco = null;
    const arma = new THREE.Group();
    let mano = null;
    an.raiz.traverse((o) => { if (!mano && o.isBone && HUESO_MANO.test(o.name)) mano = o; });
    an.raiz.updateMatrixWorld(true);
    if (mano) {
      const ws = new THREE.Vector3();
      mano.getWorldScale(ws);
      mano.add(arma);
      arma.scale.setScalar(1 / Math.max(ws.x, 1e-4));
      arma.rotation.set(-Math.PI / 2, 0, 0);
      arma.position.set(0, 0, 0);
      arma.userData.enMano = true;
    } else {
      arma.position.set(0.28, alto * 0.58, 0.16);
      humano.add(arma);
    }
    humano.userData.clave = clave;
    humano.userData.real = true;
    figura.userData.arma = arma;
    return;
  }
  const modelo = tomarModelo(clave, alto);
  if (modelo) {
    humano.add(modelo);
    figura.userData.cuerpo = null;
    figura.userData.casco = null;
  } else {
    const capsula = capsulaHumana();
    humano.add(capsula);
    figura.userData.cuerpo = capsula.userData.cuerpo;
    figura.userData.casco = capsula.userData.casco;
  }
  const arma = new THREE.Group();
  arma.position.set(0.28, alto * 0.58, 0.16);
  humano.add(arma);
  humano.userData.clave = clave;
  humano.userData.real = !!modelo;
  figura.userData.arma = arma;
}

function asegurarPerro(figura) {
  const perro = figura.userData.perro;
  const real = modeloListo('perro');
  if (perro.userData.listo && perro.userData.real === (real || animadoListo('perroAnim')) && (!animadoListo('perroAnim') || perro.userData.anim)) return;
  vaciarGrupo(perro);
  perro.userData.anim = null;
  let modelo = null;
  if (animadoListo('perroAnim')) {
    const an = tomarAnimado('perroAnim', 1.45);
    modelo = an.grupo;
    perro.userData.anim = an;
  } else modelo = tomarModelo('perro', 1.45);
  if (modelo) perro.add(modelo);
  else {
    const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.45, 3, 6), material(0x6a4a2a));
    cuerpo.rotation.z = Math.PI / 2;
    cuerpo.position.y = 0.28;
    cuerpo.userData.basico = true;
    perro.add(cuerpo);
  }
  perro.userData.listo = true;
  perro.userData.real = !!modelo;
}

let matSombra = null;
// Mancha oscura bajo los pies: da la sensación de estar parado sobre el suelo
function sombraSuelo() {
  if (!matSombra) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    matSombra = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), matSombra);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.025; m.renderOrder = 1; m.userData.basico = true;
  return m;
}

function crearFigura() {
  const g = new THREE.Group();
  const humano = new THREE.Group();
  const perro = new THREE.Group();
  perro.visible = false;
  const blanco = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), material(0xf2f2f2));
  blanco.position.y = 1.2;
  blanco.visible = false;
  blanco.userData.basico = true;
  const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 12), material(0xd02020));
  aro.position.y = 1.2;
  aro.userData.basico = true;
  blanco.add(aro);
  humano.position.y = 0.06;
  perro.position.y = 0.04;
  g.add(sombraSuelo(), humano, perro, blanco);
  g.userData = { humano, perro, blanco, arma: null, cuerpo: null, casco: null };
  asegurarHumano(g, 'faro', ALTO_PERSONA);
  return g;
}

// Rotor del helicóptero: gira los huesos de las aspas alrededor del eje del eje central
const CENTRO_ROTOR = new THREE.Vector3(-0.76, 1.4, -0.01);
function prepararRotor(raiz) {
  raiz.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(raiz.matrixWorld).invert();
  const huesos = [];
  raiz.traverse((o) => {
    if (!o.isBone || !['Bone_029', 'Bone_031', 'Bone_033'].includes(o.name) || !o.parent) return;
    const Mb = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const Mp = new THREE.Matrix4().multiplyMatrices(inv, o.parent.matrixWorld);
    huesos.push({ o, Mb, MpInv: Mp.clone().invert() });
  });
  return huesos;
}
const M_R = new THREE.Matrix4();
const M_A = new THREE.Matrix4();
const M_B = new THREE.Matrix4();
function girarRotor(huesos, ang) {
  const c = CENTRO_ROTOR;
  M_R.makeTranslation(c.x, c.y, c.z).multiply(M_A.makeRotationY(ang)).multiply(M_B.makeTranslation(-c.x, -c.y, -c.z));
  for (const h of huesos) {
    const D = M_A.copy(M_R).multiply(h.Mb);
    D.premultiply(h.MpInv).decompose(h.o.position, h.o.quaternion, h.o.scale);
  }
}

function crearHeli() {
  const g = new THREE.Group();
  if (animadoListo('heliAnim')) {
    const an = tomarAnimado('heliAnim', 6.2);
    g.add(an.grupo);
    g.userData.rotor = { rotation: { y: 0 } };
    g.userData.huesos = prepararRotor(an.raiz);
    g.userData.real = true;
    return g;
  }
  const modelo = tomarModelo('heli', 6.2);
  const rotor = caja(0.08, 0.04, 3.4, 0xdddddd);
  rotor.position.y = modelo ? 1.7 : 0.5;
  g.userData.real = !!modelo;
  if (modelo) g.add(modelo);
  else {
    const cuerpo = caja(1.6, 0.7, 2.4, 0x3e5236);
    const cola = caja(0.2, 0.16, 1.8, 0x2f3d2a);
    cola.position.z = -1.8;
    g.add(cuerpo, cola);
  }
  g.add(rotor);
  g.visible = false;
  g.userData.rotor = rotor;
  return g;
}

function mirar(grupo, ang) {
  grupo.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang));
}

function vaciarGrupo(g) {
  for (const c of [...g.children]) {
    g.remove(c);
    if (c.userData.basico && c.material && c.material.dispose) c.material.dispose();
    for (const h of c.children || []) {
      if (h.userData.basico && h.material && h.material.dispose) h.material.dispose();
    }
  }
}

const ARMA_CLAVE = ['pistola', 'fusil', 'escopeta'];

function ponerArma(grupo, tipo, colores, acc) {
  const cuerpo = colores.cuerpo || '#3a3f48';
  const acento = colores.acento || '#c8a060';
  const largo = tipo === 0 ? 0.42 : tipo === 2 ? 0.62 : 0.72;
  const modelo = tomarModelo(ARMA_CLAVE[tipo] || 'fusil', largo);
  grupo.userData.real = !!modelo;
  if (modelo) {
    grupo.add(modelo);
    const flash = caja(0.05, 0.05, 0.05, 0xfff2b0, { emissive: 0xffcc66, emissiveIntensity: 2 });
    flash.position.set(0, 0.02, largo * 0.55);
    flash.visible = false;
    grupo.add(flash);
    grupo.userData.flash = flash;
    grupo.userData.largo = largo;
    grupo.frustumCulled = false;
    grupo.traverse((o) => { o.frustumCulled = false; });
    return;
  }
  const canion = caja(tipo === 2 ? 0.07 : 0.045, tipo === 2 ? 0.08 : 0.045, largo, cuerpo, { metalness: 0.35, roughness: 0.45 });
  canion.position.set(0, 0, largo * 0.35);
  const culata = caja(0.045, tipo === 0 ? 0.09 : 0.1, acc.culata ? 0.26 : 0.16, acc.culata ? acento : 0x1a1c22);
  culata.position.set(0, -0.03, -0.06);
  grupo.add(canion, culata);
  if (acc.optica) {
    const mira = caja(0.03, 0.045, 0.09, 0x111111, { metalness: 0.4 });
    mira.position.set(0, 0.055, largo * 0.15);
    grupo.add(mira);
  }
  if (acc.laser) {
    const laser = caja(0.025, 0.02, 0.05, 0xff3030, { emissive: 0xff2020, emissiveIntensity: 0.6 });
    laser.position.set(0.035, -0.01, largo * 0.4);
    grupo.add(laser);
  }
  if (acc.boca) {
    const boca = caja(0.03, 0.03, acc.boca === 'sil' ? 0.14 : 0.05, 0x222222, { metalness: 0.5 });
    boca.position.set(0, 0, largo * 0.72);
    grupo.add(boca);
  }
  if (acc.acople) {
    const grip = caja(0.025, 0.09, 0.03, 0x2a2a2a);
    grip.position.set(0, -0.07, largo * 0.22);
    grupo.add(grip);
  }
  if (acc.municion) {
    const mag = caja(0.035, acc.municion === 'tambor' ? 0.07 : 0.12, 0.045, acento, { metalness: 0.25 });
    mag.position.set(0, -0.08, largo * 0.12);
    grupo.add(mag);
  }
  const flash = caja(0.05, 0.05, 0.05, 0xfff2b0, { emissive: 0xffcc66, emissiveIntensity: 2 });
  flash.position.set(0, 0, largo * 0.78);
  flash.visible = false;
  grupo.add(flash);
  grupo.userData.flash = flash;
  grupo.userData.largo = largo;
  grupo.frustumCulled = false;
  grupo.traverse((o) => { o.frustumCulled = false; });
}

function claveArma(tipo, colores, acc) {
  return `${tipo}|${colores.cuerpo}|${colores.acento}|${acc.boca || ''}|${acc.laser || ''}|${acc.optica || ''}|${acc.acople || ''}|${acc.municion || ''}|${acc.culata || ''}`;
}

function sincronizarArma(grupo, tipo, colores, acc) {
  if (!grupo) return;
  const clave = claveArma(tipo, colores, acc);
  const real = modeloListo(ARMA_CLAVE[tipo] || 'fusil');
  if (grupo.userData.clave === clave && !!grupo.userData.real === real) return;
  vaciarGrupo(grupo);
  ponerArma(grupo, tipo, colores, acc);
  grupo.userData.clave = clave;
}

function tomar(pool, crear) {
  const libre = pool.find((m) => !m.userData.uso);
  if (libre) { libre.userData.uso = true; libre.visible = true; return libre; }
  const m = crear();
  m.userData.uso = true;
  pool.push(m);
  scene.add(m);
  return m;
}
function soltar(pool) {
  for (const m of pool) { m.userData.uso = false; m.visible = false; }
}

function pintarFigura(m, clase, colCuerpo, colCasco, op) {
  const u = m.userData;
  u.humano.visible = clase === 'humano';
  u.perro.visible = clase === 'perro';
  u.blanco.visible = clase === 'blanco';
  if (clase === 'humano') {
    asegurarHumano(m, op ? claveOperador(op) : 'enemigo', ALTO_PERSONA);
    if (u.cuerpo && u.cuerpo.material) u.cuerpo.material.color.set(colCuerpo);
    if (u.casco && u.casco.material) u.casco.material.color.set(colCasco);
  } else if (clase === 'perro') asegurarPerro(m);
}

function actualizarCamara(datos, dt) {
  const yo = datos.yo;
  const x = aX(yo.x), z = aZ(yo.y);
  const primera = datos.cam === 'primera';
  const fx = Math.cos(datos.head), fz = Math.sin(datos.head);
  const shake = (datos.shake || 0) * 0.012;
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  if (primera) {
    const bob = Math.sin((yo.paso || 0) * 0.08) * (yo.corriendo ? 0.035 : 0.012);
    camera.position.set(x + sx, 1.55 + bob, z);
    camera.lookAt(x + fx * 12, 1.55, z + fz * 12);
    jugador.visible = false;
    armaMano.visible = !yo.muerto;
    armaMano.frustumCulled = false;
    armaMano.position.set(0.28, -0.28 - (datos.retroceso || 0) * 0.05, -0.55);
    armaMano.rotation.set(0.12, Math.PI, 0);
  } else {
    const atrás = 3.8;
    camera.position.set(x - fx * atrás + sx, 1.85 + sy, z - fz * atrás);
    camera.lookAt(x + fx * 6, 1.25, z + fz * 6);
    jugador.visible = !yo.muerto;
    armaMano.visible = false;
  }
  linterna.position.copy(camera.position);
  linterna.target.position.set(camera.position.x + fx * 8, 1.2, camera.position.z + fz * 8);
  linterna.intensity = primera ? (calAplicada === 'alta' ? 90 : 50) : 8;
  if (datos.disparoFlash && armaMano.userData.flash) armaMano.userData.flash.visible = true;
  else if (armaMano.userData.flash) armaMano.userData.flash.visible = false;
  luzBoca.intensity = datos.disparoFlash ? 8 : 0;
  luzBoca.position.set(x + fx * 0.8, 1.35, z + fz * 0.8);
  void dt;
}

function actualizarJugador(datos) {
  const yo = datos.yo;
  const col = datos.col || { c: '#3f7a3a', h: '#2e5a2b' };
  const skin = datos.skin || { cuerpo: '#3a3f48', acento: '#c8a060' };
  const acc = datos.acc || {};
  jugador.position.set(aX(yo.x), 0, aZ(yo.y));
  mirar(jugador, yo.ang);
  pintarFigura(jugador, 'humano', col.c, col.h, yo.op || 'faro');
  sincronizarArma(jugador.userData.arma, yo.arma || 0, skin, acc);
  sincronizarArma(armaMano, yo.arma || 0, skin, acc);
  animarHumano(jugador, !!datos.disparoFlash);
  const flashCuerpo = jugador.userData.arma.userData.flash;
  if (flashCuerpo) flashCuerpo.visible = !!datos.disparoFlash && datos.cam !== 'primera';
  armaClave = jugador.userData.arma.userData.clave || '';
}

function claseDe(e) {
  if (e.T && e.T.estatico) return 'blanco';
  if (e.T && e.T.perro) return 'perro';
  return 'humano';
}

function actualizarOtros(datos) {
  soltar(figuras);
  const lista = [];
  for (const e of datos.enemigos) {
    if (!e || e.muerto) continue;
    lista.push({ x: e.x, y: e.y, ang: e.ang || 0, clase: claseDe(e), c: (e.T && e.T.cuerpo) || '#7a2a2a', h: (e.T && e.T.casco) || '#4a1616', s: e.T && e.T.jefe ? 1.45 : 1 });
  }
  for (const j of datos.otros) {
    if (!j || j.muerto) continue;
    lista.push({ x: j.x, y: j.y, ang: j.ang || 0, clase: 'humano', c: j.c || '#54ddfc', h: j.h || '#2a3646', s: 1, op: j.op || 'faro' });
  }
  for (const it of lista) {
    const m = tomar(figuras, crearFigura);
    m.position.set(aX(it.x), 0, aZ(it.y));
    m.scale.setScalar(it.s);
    mirar(m, it.ang);
    pintarFigura(m, it.clase, it.c, it.h, it.op || null);
    if (it.clase === 'humano') { sincronizarArma(m.userData.arma, 1, { cuerpo: '#2a2a2e', acento: '#666' }, {}); animarHumano(m, false); }
    else if (it.clase === 'perro') animarPerro(m);
  }
}

function actualizarProyectiles(datos) {
  soltar(trazas);
  soltar(granadasMesh);
  soltar(itemsMesh);
  soltar(fuegos);
  for (const b of datos.balas) {
    const m = tomar(trazas, () => new THREE.Mesh(GEO_BALA, material(0xfff2b0, { emissive: 0xffe080, emissiveIntensity: 0.8 })));
    m.material.color.set(b.duenio === 'e' ? 0xff5050 : (datos.skin && datos.skin.acento) || 0xfff2b0);
    m.material.emissive.set(b.duenio === 'e' ? 0xff3030 : 0xffe080);
    m.position.set(aX(b.x), 1.15, aZ(b.y));
  }
  for (const g of datos.granadas) {
    const m = tomar(granadasMesh, () => new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), material(0x4a6a3a)));
    m.position.set(aX(g.x), 0.35 + (g.z || 0) * 0.04, aZ(g.y));
    m.material.color.set(g.enemiga ? 0x8a3a3a : 0x4a6a3a);
  }
  for (const e of datos.explosiones) {
    const t = clamp((e.k || 0) / 0.5, 0, 1);
    const m = tomar(fuegos, () => new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), material(0xffaa40, { transparent: true, opacity: 0.8, emissive: 0xff6020, emissiveIntensity: 1 })));
    const r = Math.max(0.3, (e.r || 20) * ESCALA * (0.35 + t));
    m.scale.setScalar(r);
    m.position.set(aX(e.x), 0.8, aZ(e.y));
    m.material.opacity = 1 - t;
  }
  for (const it of datos.items) {
    if (!it || it.k <= 0) continue;
    const m = tomar(itemsMesh, () => new THREE.Mesh(CUBO, material(0xe0c23a)));
    const col = it.tipo === 'botiquin' ? 0xf0f0f0 : it.tipo === 'granada' ? 0x6a8a4a : 0xe0c23a;
    m.material.color.set(col);
    m.scale.set(0.28, 0.18, 0.28);
    m.position.set(aX(it.x), 0.35 + Math.sin(performance.now() * 0.004 + it.x) * 0.06, aZ(it.y));
  }
}

function actualizarLluvia(x, z, dt) {
  if (!lluvia) return;
  const a = lluvia.geometry.attributes.position;
  const arr = a.array;
  for (let i = 0; i < lluviaN; i++) {
    let y = arr[i * 3 + 1] - (11 + (i % 5)) * dt;
    if (y < 0) {
      arr[i * 3] = x + (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = 6 + Math.random() * 8;
      arr[i * 3 + 2] = z + (Math.random() - 0.5) * 26;
    } else arr[i * 3 + 1] = y;
  }
  a.needsUpdate = true;
}

function actualizarClima(datos, dt) {
  const campo = CAMPOS[clamp(datos.zona | 0, 0, CAMPOS.length - 1)];
  scene.fog.color.setHex(campo.niebla);
  scene.fog.density = campo.dens * (calAplicada === 'baja' ? 0.8 : 1);
  scene.background.copy(scene.fog.color);
  if (Math.random() < dt * 0.05) rayoT = 0.1;
  if (rayoT > 0) { rayoT -= dt; ambiente.intensity = 4.2; }
  else ambiente.intensity = datos.nvg ? 3.0 : 1.8;
  renderer.toneMappingExposure = datos.nvg ? 1.5 : 1.05;
  const t = performance.now() * 0.00035;
  const fx = Math.cos(t), fz = Math.sin(t);
  haz.target.position.set(haz.position.x + fx * 36, 1.2, haz.position.z + fz * 36);
  for (const p of puertas) p.mesh.visible = !(p.ob && p.ob.abierto);
  const hd = datos.heli || (window.__forzarHeli ? { x: datos.yo.x + 80, y: datos.yo.y - 10, alt: 20 } : null);
  if (hd) {
    heliMesh.visible = true;
    heliMesh.position.set(aX(hd.x), 2 + (hd.alt || 0) * 0.06, aZ(hd.y));
    heliMesh.userData.rotor.rotation.y += dt * 18;
    if (heliMesh.userData.huesos) girarRotor(heliMesh.userData.huesos, heliMesh.userData.rotor.rotation.y);
  } else heliMesh.visible = false;
  luna.position.set(aX(datos.yo.x) - 18, 40, aZ(datos.yo.y) + 10);
  luna.target.position.set(aX(datos.yo.x), 0, aZ(datos.yo.y));
}

const CLAVES_MAPA = ['cabana', 'faroTorre', 'madera', 'metal', 'tala', 'restos', 'centinela', 'ruinas'];

function selloMapa() {
  let sello = '';
  for (const clave of CLAVES_MAPA) sello += modeloListo(clave) ? '1' : '0';
  return sello;
}

function asegurarHeli() {
  const real = modeloListo('heli');
  if (!heliMesh || !!heliMesh.userData.real === real) return;
  const visible = heliMesh.visible;
  const pos = heliMesh.position.clone();
  scene.remove(heliMesh);
  heliMesh = crearHeli();
  heliMesh.visible = visible;
  heliMesh.position.copy(pos);
  scene.add(heliMesh);
}

export function ocultarMundo() {
  if (canvas) canvas.style.display = 'none';
  const plano = document.getElementById('c');
  if (plano) plano.classList.remove('sobre-3d');
}

export function renderMundo(datos) {
  if (!boot()) return false;
  canvas.style.display = 'block';
  const plano = document.getElementById('c');
  if (plano) plano.classList.add('sobre-3d');
  if (datos.calidad !== calAplicada) aplicarCalidad(datos.calidad);
  const firma = `${datos.mapaId}:${selloMapa()}`;
  if (firma !== mapaHecho) construir(datos.obstaculos, firma);
  asegurarHeli();
  reloj.update();
  const crudo = reloj.getDelta();
  const dt = Math.min(crudo, 0.05);
  ema = ema * 0.94 + Math.min(crudo, 0.25) * 0.06;
  ajusteT += dt;
  if (ajusteT > 1.5) {
    ajusteT = 0;
    if (ema > 0.024 && escalaDin > 0.55) { escalaDin = Math.max(0.55, escalaDin - 0.1); alRedimensionar(); }
    else if (ema < 0.0185 && escalaDin < 1) { escalaDin = Math.min(1, escalaDin + 0.05); alRedimensionar(); }
  }
  dtFrame = dt;
  actualizarClima(datos, dt);
  actualizarJugador(datos);
  actualizarOtros(datos);
  actualizarProyectiles(datos);
  actualizarCamara(datos, dt);
  actualizarLluvia(aX(datos.yo.x), aZ(datos.yo.y), dt);
  cielo.position.copy(camera.position);
  hazVis.position.copy(haz.position);
  hazVis.lookAt(haz.target.position);
  renderer.render(scene, camera);
  void armaClave;
  return true;
}
