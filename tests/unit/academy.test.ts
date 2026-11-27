import { describe, expect, it } from 'vitest';
import { checkAcademy, checkCases, type LessonNode } from '../../src/lib/academy';
import { score } from '../../src/lib/quiz';
import { questionSetSchema } from '../../src/lib/schemas';

// Fixtures ficticios.
const lesson = (id: string, order: number, extra: Partial<LessonNode['data']> = {}): LessonNode => ({
  id,
  data: { level: 1, order, prerequisites: [], ruleIds: ['1'], exerciseIds: [`${id}-1`], ...extra },
});
const set = (id: string, ruleIds = ['1']) => ({ lesson: id, questions: [{ id: `${id}-1`, ruleIds }] });
const rules = new Set(['1']);

describe('coherencia de la academia', () => {
  it('acepta una secuencia válida', () => {
    expect(checkAcademy([lesson('a', 1), lesson('b', 2, { prerequisites: ['a'] })], [set('a'), set('b')], rules)).toEqual([]);
  });

  it.each([
    ['prerrequisito posterior', [lesson('a', 1, { prerequisites: ['b'] }), lesson('b', 2)], [set('a'), set('b')]],
    ['posición repetida', [lesson('a', 1), lesson('b', 1)], [set('a'), set('b')]],
    ['lección sin preguntas', [lesson('a', 1)], []],
    ['preguntas huérfanas', [lesson('a', 1)], [set('a'), set('z')]],
    ['regla inexistente', [lesson('a', 1)], [set('a', ['9-9'])]],
  ])('detecta %s', (_name, lessons, sets) => {
    expect(checkAcademy(lessons, sets, rules).length).toBeGreaterThan(0);
  });
});

describe('cuestionarios', () => {
  const option = (id: string) => ({ id, text: 'Opción ficticia', rationale: 'Motivo ficticio' });
  const question = {
    id: 'q',
    prompt: 'Pregunta ficticia',
    options: ['a', 'b', 'c'].map(option),
    answer: 'a',
    ruleIds: ['1'],
    version: 1,
    reviewStatus: 'pending',
  };
  const valid = (change: object) => questionSetSchema.safeParse({ lesson: 'x', questions: [{ ...question, ...change }] }).success;

  it('cuenta respondidas y correctas', () => {
    const questions = [
      { id: 'q', answer: 'a' },
      { id: 'r', answer: 'b' },
    ];
    expect(score(questions, { q: 'a' })).toEqual({ correct: 1, answered: 1, total: 2 });
    expect(score(questions, { q: 'c', r: 'b' })).toEqual({ correct: 1, answered: 2, total: 2 });
  });

  it('valida la respuesta, las opciones y la revisión', () => {
    expect(valid({})).toBe(true);
    expect(valid({ answer: 'z' })).toBe(false);
    expect(valid({ options: ['a', 'b'].map(option) })).toBe(false);
    expect(valid({ options: ['a', 'a', 'b'].map(option) })).toBe(false);
    expect(valid({ reviewStatus: 'reviewed' })).toBe(false);
  });
});

describe('casos', () => {
  // Fixtures ficticios.
  const item = { id: 'c', ruleIds: ['1'], qaIds: ['x-p1-1'] };

  it('detecta referencias rotas y casos repetidos', () => {
    expect(checkCases([item], new Set(['1']), new Set(['x-p1-1']))).toEqual([]);
    expect(checkCases([item, item], new Set(), new Set())).toHaveLength(5);
  });
});
