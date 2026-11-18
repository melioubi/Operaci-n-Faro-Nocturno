// Copia lo compilado (app/dist) a la raíz del repo, que es lo que sirve GitHub Pages.
// Uso:  npm run publicar   (dentro de la carpeta app)
import fs from 'node:fs';
import path from 'node:path';
const dist = path.resolve('dist'), raiz = path.resolve('..');
if (!fs.existsSync(dist)) { console.error('Falta compilar: corré "npm run build" primero.'); process.exit(1); }
fs.rmSync(path.join(raiz, 'assets'), { recursive: true, force: true });   // borra las versiones viejas
fs.cpSync(dist, raiz, { recursive: true });
console.log('Publicado en', raiz);
