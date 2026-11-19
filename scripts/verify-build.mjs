import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('../dist/', import.meta.url);
assert(existsSync(root), 'Falta dist/: ejecuta npm run build antes de verificar.');
const index = readFileSync(new URL('index.html', root), 'utf8');
assert(index.includes('Constelario'), 'El HTML de producción no incluye el título.');
const assets = readdirSync(new URL('assets/', root));
assert(assets.some((file) => file.endsWith('.js')), 'No se generó JavaScript.');
assert(assets.some((file) => file.endsWith('.css')), 'No se generó CSS.');
assert(assets.some((file) => file.endsWith('.wasm')), 'No se generó sql-wasm.wasm.');
const jsName = assets.find((file) => file.endsWith('.js'));
const js = readFileSync(join(new URL('assets/', root).pathname, jsName), 'utf8');
assert(js.includes('constelario.sqlite.v1'), 'El bundle no contiene la clave de persistencia.');
console.log('OK: HTML, JavaScript, CSS, SQLite WebAssembly y persistencia presentes en dist/.');
