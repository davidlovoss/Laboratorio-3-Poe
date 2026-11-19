import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export const STORAGE_KEY = 'constelario.sqlite.v1';
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS constellations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('alegria', 'calma', 'nostalgia', 'aventura')),
    event_date TEXT NOT NULL,
    seed INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_constellations_mood ON constellations(mood);
  CREATE INDEX IF NOT EXISTS idx_constellations_date ON constellations(event_date);
`;

const SAMPLE_RECORDS: Array<[string, string, string, string, number]> = [
  ['La noche de las mil luces', 'Esa noche miramos el cielo y entendimos que los momentos sencillos pueden ser los más grandes.', 'alegria', '2026-06-21', 1135],
  ['Un domingo sin prisa', 'El café se enfrió mientras escuchábamos la lluvia. No hacía falta estar en ningún otro lugar.', 'calma', '2026-08-09', 2408],
  ['El camino que elegí', 'Había nervios y muchas preguntas, pero dar el primer paso terminó siendo mi mejor aventura.', 'aventura', '2026-10-14', 3914],
];

function encodeBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function decodeBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export type SqlValue = string | number | null;
export type SqlRecord = Record<string, SqlValue | Uint8Array>;

export class AppDatabase {
  constructor(private readonly database: Database, private readonly storage: Storage) {}

  all(sql: string, params: SqlValue[] = []): SqlRecord[] {
    const statement = this.database.prepare(sql);
    try {
      statement.bind(params);
      const rows: SqlRecord[] = [];
      while (statement.step()) rows.push(statement.getAsObject() as SqlRecord);
      return rows;
    } finally {
      statement.free();
    }
  }

  execute(sql: string, params: SqlValue[] = []): void {
    this.database.run(sql, params);
    this.save();
  }

  save(): void {
    this.storage.setItem(STORAGE_KEY, encodeBytes(this.database.export()));
  }

  exportFile(): Uint8Array {
    return this.database.export();
  }
}

function seedDatabase(database: Database): void {
  database.run('BEGIN TRANSACTION');
  try {
    for (const [title, story, mood, date, seed] of SAMPLE_RECORDS) {
      database.run(
        'INSERT INTO constellations (title, story, mood, event_date, seed) VALUES (?, ?, ?, ?, ?)',
        [title, story, mood, date, seed],
      );
    }
    database.run('COMMIT');
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

export async function openDatabase(storage: Storage = window.localStorage): Promise<AppDatabase> {
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: () => wasmUrl });
  const previous = storage.getItem(STORAGE_KEY);
  const database = previous ? new SQL.Database(decodeBytes(previous)) : new SQL.Database();
  database.run(SCHEMA);
  if (!previous) seedDatabase(database);
  const appDb = new AppDatabase(database, storage);
  if (!previous) appDb.save();
  return appDb;
}
