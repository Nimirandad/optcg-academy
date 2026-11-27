import { describe, expect, it } from 'vitest';
import { validateCoverage, type CoverageInput, type IssueCode } from '../../src/lib/coverage';

// Fixtures ficticios: no representan reglas reales.
const inventory = {
  source: { version: '0.0-ficticia' },
  rules: [
    { ruleId: '1', parentId: null, chapter: 1 },
    { ruleId: '1-1', parentId: '1', chapter: 1 },
  ],
};
const rule = (id: string, extra: object = {}) => ({ id, explanation: 'Texto ficticio.', reviewStatus: 'pending', ...extra });
const input = (rules: object[], change: Partial<CoverageInput> = {}, chapter: object = {}): CoverageInput => ({
  inventory,
  chapters: [{ file: 'ficticio.json', data: { chapter: 1, sourceVersion: '0.0-ficticia', rules, ...chapter } }],
  references: [],
  ...change,
});
const complete = [rule('1'), rule('1-1')];
const codes = (value: CoverageInput) => [...new Set(validateCoverage(value).issues.map((issue) => issue.code))];

describe('cobertura del reglamento', () => {
  it('acepta una cobertura completa', () => {
    expect(codes(input(complete))).toEqual([]);
  });

  it.each<[string, IssueCode, CoverageInput]>([
    ['regla sin explicación', 'missing', input([rule('1')])],
    ['regla repetida', 'duplicate', input([...complete, rule('1-1')])],
    ['ID ajeno al inventario', 'unknown-id', input([...complete, rule('1-9')])],
    ['relacionada inexistente', 'broken-ref', input([rule('1', { relatedIds: ['1-9'] }), rule('1-1')])],
    ['cita en el texto inexistente', 'broken-ref', input([rule('1', { tip: 'Ver 1-9.' }), rule('1-1')])],
    ['referencia externa rota', 'broken-ref', input(complete, { references: [{ from: 'x', ruleId: '9-9' }] })],
    ['versión distinta', 'version-mismatch', input(complete, {}, { sourceVersion: '0.1' })],
    [
      'padre inexistente',
      'orphan-parent',
      input([...complete, rule('1-2-1')], {
        inventory: { ...inventory, rules: [...inventory.rules, { ruleId: '1-2-1', parentId: '1-2', chapter: 1 }] },
      }),
    ],
  ])('detecta %s', (_name, code, value) => {
    expect(codes(value)).toEqual([code]);
  });

  it('detecta una regla en el capítulo equivocado', () => {
    expect(codes(input(complete, {}, { chapter: 2 }))).toContain('wrong-chapter');
  });

  it('no admite reviewed sin la persona que revisó', () => {
    expect(codes(input([rule('1', { reviewStatus: 'reviewed' }), rule('1-1')]))).toContain('invalid-schema');
  });
});
