import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
function getTypeScript() {
  try { return require('typescript'); }
  catch {
    // Permite correr las pruebas en entornos educativos con TypeScript global.
    const { execFileSync } = require('node:child_process');
    const { join } = require('node:path');
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    return require(join(globalRoot, 'typescript'));
  }
}
const ts = getTypeScript();

function loadTypeScript(file, mocks = {}) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const dependency = (specifier) => {
    if (specifier in mocks) return mocks[specifier];
    throw new Error(`Dependencia inesperada en prueba: ${specifier}`);
  };
  runInNewContext(compiled.outputText, { module, exports: module.exports, require: dependency, Math, Date, Intl }, { filename: file });
  return module.exports;
}

const entity = loadTypeScript('../src/models/constellation.ts');
const view = loadTypeScript('../src/views/constellationView.ts', { '../models/constellation': entity });
const validInput = () => ({ title: ' Mi primer concierto ', story: 'Un día muy especial que recuerdo con emoción.', mood: 'alegria', event_date: '2026-07-24' });

function fakeDb() {
  let records = [];
  let counter = 0;
  let saved = 0;
  return {
    all(sql, params = []) {
      if (/WHERE id = \?/.test(sql)) return records.filter((r) => r.id === params[0]);
      return [...records].reverse();
    },
    execute(sql, params) {
      if (sql.startsWith('INSERT')) records.push({ id: ++counter, title: params[0], story: params[1], mood: params[2], event_date: params[3], seed: params[4], created_at: '2026-11-18', updated_at: '2026-11-18' });
      if (sql.startsWith('UPDATE')) records = records.map((r) => r.id === params[4] ? { ...r, title: params[0], story: params[1], mood: params[2], event_date: params[3] } : r);
      if (sql.startsWith('DELETE')) records = records.filter((r) => r.id !== params[0]);
      saved++;
    },
    get saved() { return saved; },
    exportFile() { return new Uint8Array([83, 81, 76, 105]); },
  };
}

test('valida y limpia los datos antes de ejecutar consultas', () => {
  const value = entity.validateInput(validInput());
  assert.equal(value.title, 'Mi primer concierto');
  assert.equal(value.mood, 'alegria');
  assert.equal(value.event_date, '2026-07-24');
});

test('rechaza títulos, emociones, historias y fechas inválidas', () => {
  for (const replacement of [
    { title: 'a' },
    { story: '' },
    { mood: 'cualquiera' },
    { event_date: '2026-02-30' },
  ]) assert.throws(() => entity.validateInput({ ...validInput(), ...replacement }), /./);
});

test('modelo realiza operaciones CRUD mediante consultas SQL parametrizadas', () => {
  const db = fakeDb();
  const model = new entity.ConstellationModel(db);
  assert.equal(model.list().length, 0);
  model.create(validInput());
  assert.equal(model.list().length, 1);
  assert.equal(model.find(1).title, 'Mi primer concierto');
  model.update(1, { ...validInput(), title: 'Recuerdo renovado' });
  assert.equal(model.find(1).title, 'Recuerdo renovado');
  model.delete(1);
  assert.equal(model.list().length, 0);
  assert.equal(db.saved, 3);
  assert.throws(() => model.update(2, validInput()), /no existe/);
  assert.throws(() => model.delete(2), /no existe/);
});

test('las constelaciones generadas son estables y diferentes por semilla', () => {
  const a = view.drawConstellation(1234, '#abcdef', 'Ejemplo', 'star-1');
  const b = view.drawConstellation(1234, '#abcdef', 'Ejemplo', 'star-1');
  const c = view.drawConstellation(3456, '#abcdef', 'Ejemplo', 'star-1');
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /<svg /);
  assert.match(a, /<polyline /);
});

test('el SVG escapa caracteres peligrosos en el nombre', () => {
  const svg = view.drawConstellation(1, '#abc', '<script>alert(1)</script>', 'star-2');
  assert.ok(!svg.includes('aria-label="Constelación única de <script>'));
  assert.match(svg, /&lt;script&gt;/);
});

test('el proyecto declara SQLite con su esquema e inicialización WASM', () => {
  const database = readFileSync(new URL('../src/db/database.ts', import.meta.url), 'utf8');
  assert.match(database, /CREATE TABLE IF NOT EXISTS constellations/);
  assert.match(database, /new SQL\.Database/);
  assert.match(database, /database\.export\(\)/);
  assert.match(database, /localStorage/);
  assert.match(database, /sql-wasm\.wasm\?url/);
});
