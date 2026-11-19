import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Los escenarios grandes se guardan ya simplificados (tala, restos, centinela, ruinas).
const ARCHIVOS = {
  faro: 'op-faro.glb',
  sombra: 'op-sombra.glb',
  viper: 'op-viper.glb',
  hielo: 'op-hielo.glb',
  cobra: 'op-cobra.glb',
  nova: 'op-nova.glb',
  perro: 'perro.glb',
  pistola: 'arma-pistola.glb',
  fusil: 'arma-fusil.glb',
  escopeta: 'arma-escopeta.glb',
  faroTorre: 'faro.glb',
  cabana: 'cabana.glb',
  heli: 'heli.glb',
  madera: 'madera.glb',
  metal: 'metal.glb',
  tala: 'tala.glb',
  restos: 'restos.glb',
  centinela: 'centinela.glb',
  ruinas: 'ruinas.glb',
};

const MODO = {
  faro: 'persona', sombra: 'persona', viper: 'persona', hielo: 'persona',
  cobra: 'persona', nova: 'persona', enemigo: 'persona',
  perro: 'largo', heli: 'largo',
  pistola: 'arma', fusil: 'arma', escopeta: 'arma',
  faroTorre: 'alto', cabana: 'prop', madera: 'prop', metal: 'panel',
  tala: 'prop', restos: 'prop', centinela: 'prop', ruinas: 'prop',
};

const OPERADOR = {
  faro: 'faro', sombra: 'sombra', viper: 'viper', hielo: 'hielo',
  cobra: 'cobra', nova: 'nova', leyenda: 'faro', valkiria: 'nova',
};

const listos = {};
let pedido = false;

const ruta = (nombre) => `${import.meta.env.BASE_URL}modelos/${nombre}`;

function orientar(raiz, modo) {
  const caja = new THREE.Box3().setFromObject(raiz);
  const tam = caja.getSize(new THREE.Vector3());
  const giro = new THREE.Group();
  giro.add(raiz);
  const largo = tam.x >= tam.y && tam.x >= tam.z ? 'x' : tam.y >= tam.z ? 'y' : 'z';
  const fino = tam.x <= tam.y && tam.x <= tam.z ? 'x' : tam.y <= tam.z ? 'y' : 'z';
  if (modo === 'arma' || modo === 'largo') {
    if (largo === 'x') giro.rotation.y = Math.PI / 2;
    else if (largo === 'y') giro.rotation.x = Math.PI / 2;
  } else if (modo === 'persona' || modo === 'alto') {
    if (largo === 'x') giro.rotation.z = Math.PI / 2;
    else if (largo === 'z') giro.rotation.x = Math.PI / 2;
  } else if (modo === 'panel' && fino === 'y') {
    giro.rotation.x = Math.PI / 2;
  } else if (modo === 'panel' && fino === 'x') {
    giro.rotation.y = Math.PI / 2;
  }
  return giro;
}

function ajustar(raiz, modo) {
  const giro = orientar(raiz, modo);
  giro.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(giro);
  const tam = caja.getSize(new THREE.Vector3());
  giro.position.set(-(caja.min.x + caja.max.x) / 2, -caja.min.y, -(caja.min.z + caja.max.z) / 2);
  let medida = tam.y;
  if (modo === 'arma' || modo === 'largo' || modo === 'prop') medida = Math.max(tam.x, tam.y, tam.z);
  if (modo === 'panel') medida = Math.max(tam.x, tam.y);
  giro.userData.medida = Math.max(medida, 0.001);
  giro.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
  return giro;
}

export function claveOperador(op) {
  return OPERADOR[op] || 'faro';
}

export function modeloListo(clave) {
  return !!listos[clave];
}

export function tomarModelo(clave, medida) {
  const base = listos[clave];
  if (!base) return null;
  const factor = medida / (base.userData.medida || 1);
  const puesto = new THREE.Group();
  const copia = base.clone(true);
  // El apoyo en el piso está en la posición. Hay que escalarla junto con la malla,
  // si no el modelo crece desde el centro y se hunde.
  copia.position.multiplyScalar(factor);
  copia.scale.setScalar(factor);
  puesto.add(copia);
  return puesto;
}

export function mapaDe(clave) {
  const base = listos[clave];
  if (!base) return null;
  let mapa = null;
  base.traverse((obj) => {
    if (mapa || !obj.isMesh) return;
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (mat && mat.map) mapa = mat.map;
  });
  return mapa;
}

export function cargarModelos(alTerminar) {
  if (pedido) return;
  pedido = true;
  const loader = new GLTFLoader();
  const claves = Object.keys(ARCHIVOS);
  let faltan = claves.length;
  const cerrar = () => {
    faltan -= 1;
    if (faltan === 0 && alTerminar) alTerminar();
  };
  for (const clave of claves) {
    loader.load(ruta(ARCHIVOS[clave]), (gltf) => {
      try {
        listos[clave] = ajustar(gltf.scene, MODO[clave]);
        if (clave === 'hielo') listos.enemigo = listos.hielo;
      } catch (err) {
        console.error('No se pudo preparar', clave, err);
      }
      cerrar();
    }, undefined, (err) => {
      console.error('No se pudo cargar', clave, err);
      cerrar();
    });
  }
}
