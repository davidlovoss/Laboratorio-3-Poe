import { type AppDatabase, type SqlRecord } from '../db/database';

export const MOODS = {
  alegria: { name: 'Alegría', accent: '#ffcd94', adjective: 'radiante' },
  calma: { name: 'Calma', accent: '#abb7ff', adjective: 'sereno' },
  nostalgia: { name: 'Nostalgia', accent: '#e5a5ca', adjective: 'eterno' },
  aventura: { name: 'Aventura', accent: '#91dfd0', adjective: 'valiente' },
} as const;
export type Mood = keyof typeof MOODS;

export interface Constellation {
  id: number;
  title: string;
  story: string;
  mood: Mood;
  event_date: string;
  seed: number;
  created_at: string;
  updated_at: string;
}

export interface ConstellationInput {
  title: string;
  story: string;
  mood: string;
  event_date: string;
}

export function validateInput(input: ConstellationInput): Omit<ConstellationInput, 'mood'> & { mood: Mood } {
  const title = input.title.trim();
  const story = input.story.trim();
  const date = input.event_date;
  if (title.length < 3 || title.length > 65) throw new Error('El título debe tener entre 3 y 65 caracteres.');
  if (story.length < 5 || story.length > 550) throw new Error('El recuerdo debe tener entre 5 y 550 caracteres.');
  if (!Object.prototype.hasOwnProperty.call(MOODS, input.mood)) throw new Error('Selecciona una emoción válida.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime()) || new Date(`${date}T12:00:00`).toISOString().slice(0, 10) !== date) {
    throw new Error('Selecciona una fecha válida.');
  }
  return { title, story, mood: input.mood as Mood, event_date: date };
}

function toConstellation(row: SqlRecord): Constellation {
  return {
    id: Number(row.id),
    title: String(row.title),
    story: String(row.story),
    mood: String(row.mood) as Mood,
    event_date: String(row.event_date),
    seed: Number(row.seed),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export class ConstellationModel {
  constructor(private readonly db: AppDatabase) {}

  list(): Constellation[] {
    return this.db.all('SELECT * FROM constellations ORDER BY event_date DESC, id DESC').map(toConstellation);
  }

  find(id: number): Constellation | null {
    const row = this.db.all('SELECT * FROM constellations WHERE id = ?', [id])[0];
    return row ? toConstellation(row) : null;
  }

  create(raw: ConstellationInput): void {
    const item = validateInput(raw);
    const seed = Math.floor(Math.random() * 2147483647);
    this.db.execute(
      'INSERT INTO constellations (title, story, mood, event_date, seed) VALUES (?, ?, ?, ?, ?)',
      [item.title, item.story, item.mood, item.event_date, seed],
    );
  }

  update(id: number, raw: ConstellationInput): void {
    if (!this.find(id)) throw new Error('Esta constelación ya no existe.');
    const item = validateInput(raw);
    this.db.execute(
      "UPDATE constellations SET title = ?, story = ?, mood = ?, event_date = ?, updated_at = datetime('now') WHERE id = ?",
      [item.title, item.story, item.mood, item.event_date, id],
    );
  }

  delete(id: number): void {
    if (!this.find(id)) throw new Error('Esta constelación ya no existe.');
    this.db.execute('DELETE FROM constellations WHERE id = ?', [id]);
  }

  backup(): Uint8Array {
    return this.db.exportFile();
  }
}
