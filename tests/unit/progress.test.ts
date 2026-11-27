import { describe, expect, it } from 'vitest';
import {
  clearProgress,
  emptyProgress,
  loadProgress,
  parseProgress,
  PROGRESS_KEY,
  recordAttempt,
  saveAttempt,
  type StorageLike,
} from '../../src/lib/progress';

// Datos ficticios.
function memory(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[PROGRESS_KEY, initial]]);
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return { data, get: () => storage };
}
const blocked = (): StorageLike => {
  throw new Error('bloqueado');
};
const now = '2000-01-01T00:00:00.000Z';

describe('progreso', () => {
  it('guarda, conserva el mejor resultado y cuenta intentos sin mutar', () => {
    const first = recordAttempt(emptyProgress(), 'a', { correct: 3, total: 3 }, now);
    const second = recordAttempt(first, 'a', { correct: 1, total: 3 }, now);
    expect(second.lessons.a).toEqual({ completedAt: now, correct: 3, total: 3, attempts: 2 });
    expect(first.lessons.a.attempts).toBe(1);
  });

  it('persiste y se puede borrar', () => {
    const store = memory();
    expect(saveAttempt(store.get, 'a', { correct: 2, total: 3 }, now)).toEqual({ saved: true, issue: undefined });
    expect(loadProgress(store.get).progress.lessons.a.correct).toBe(2);
    expect(clearProgress(store.get)).toBe(true);
    expect(store.data.size).toBe(0);
  });

  it('migra la versión 0', () => {
    const result = parseProgress('{"version":0,"completed":["a",7]}');
    expect(result.issue).toBeUndefined();
    expect(Object.keys(result.progress.lessons)).toEqual(['a']);
  });

  it.each(['no es json', '[]', '{"version":"1"}', '{"version":1,"lessons":3}'])('marca ilegible %s', (raw) => {
    expect(parseProgress(raw)).toEqual({ progress: emptyProgress(), issue: 'corrupt' });
  });

  it('descarta solo las entradas inválidas', () => {
    const ok = { completedAt: now, correct: 1, total: 1, attempts: 1 };
    const result = parseProgress(JSON.stringify({ version: 1, lessons: { ok, mal: { correct: 9 } } }));
    expect(result.progress.lessons).toEqual({ ok });
    expect(result.issue).toBe('corrupt');
  });

  it('respalda los datos ilegibles antes de reemplazarlos', () => {
    const store = memory('roto');
    expect(saveAttempt(store.get, 'a', { correct: 0, total: 1 }, now).saved).toBe(true);
    expect(store.data.get(`${PROGRESS_KEY}:backup`)).toBe('roto');
  });

  it('no sobrescribe una versión futura', () => {
    const raw = '{"version":99}';
    const store = memory(raw);
    expect(saveAttempt(store.get, 'a', { correct: 1, total: 1 }, now)).toEqual({ saved: false, issue: 'future' });
    expect(store.data.get(PROGRESS_KEY)).toBe(raw);
  });

  it('informa cuando el almacenamiento está bloqueado o lleno', () => {
    expect(loadProgress(blocked).issue).toBe('blocked');
    expect(clearProgress(blocked)).toBe(false);
    const full: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('lleno');
      },
      removeItem: () => {},
    };
    expect(saveAttempt(() => full, 'a', { correct: 1, total: 1 }, now)).toEqual({ saved: false, issue: 'blocked' });
  });
});
