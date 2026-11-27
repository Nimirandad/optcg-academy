import { describe, expect, it } from 'vitest';
import { inventory } from '../../src/lib/inventory';
import { keywordSchema, lessonSchema } from '../../src/lib/schemas';
import lesson from '../fixtures/lesson.fictitious.json';

describe('esquemas', () => {
  it('acepta un fixture válido', () => {
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
  });

  it.each([
    ['nivel fuera de rango', { level: 6 }],
    ['sin reglas', { ruleIds: [] }],
    ['ID de regla inválido', { ruleIds: ['uno'] }],
    ['estado desconocido', { reviewStatus: 'listo' }],
    ['campo no previsto', { extra: true }],
  ])('rechaza %s', (_name, change) => {
    expect(lessonSchema.safeParse({ ...lesson, ...change }).success).toBe(false);
  });

  it('exige un ID de regla en cada keyword', () => {
    expect(keywordSchema.safeParse({ term: 'Ficticia', reviewStatus: 'pending' }).success).toBe(false);
  });

  it('el glosario cubre cada keyword de 10-1 y 10-2', () => {
    const files = import.meta.glob<{ ruleId: string }>('../../src/content/keywords/*.json', { eager: true, import: 'default' });
    const covered = Object.values(files).map((keyword) => keyword.ruleId).sort();
    const expected = inventory.rules.filter((rule) => /^10-[12]$/.test(rule.parentId ?? '')).map((rule) => rule.ruleId).sort();
    expect(expected).toHaveLength(24);
    expect(covered).toEqual(expected);
  });

  it('el inventario tiene 492 IDs únicos con padres existentes', () => {
    const ids = new Set(inventory.rules.map((rule) => rule.ruleId));
    expect(inventory.rules).toHaveLength(492);
    expect(ids.size).toBe(492);
    expect(inventory.rules.filter((rule) => rule.parentId && !ids.has(rule.parentId))).toEqual([]);
  });
});
