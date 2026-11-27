import { describe, expect, it } from 'vitest';
import { validateQa, type IssueCode } from '../../src/lib/coverage';
import { applyManual, detectMechanics, documentSlug, indexDocument, setCodes } from '../../src/lib/qa-index';
import index from '../../src/data/qa/documents.json';
import restrictionsData from '../../src/data/restrictions/standard.json';
import { restrictionsFor } from '../../src/lib/restrictions';
import { restrictionsSchema } from '../../src/lib/schemas';

// Fixtures ficticios: cartas, preguntas y respuestas inventadas.
const keywords = [{ slug: 'blocker', term: 'Blocker' }];
const digest = () => '0123456789abcdef';

describe('índice de Q&A', () => {
  it('deriva el nombre y los productos desde el archivo', () => {
    expect(documentSlug('qa_st-15-20.pdf')).toBe('st15-st20');
    expect(documentSlug('qa_op14_eb04.pdf')).toBe('op14-eb04');
    expect(documentSlug('faq_op15-eb04.pdf')).toBe('op15-eb04');
    expect(documentSlug('qa_st-01-st-04.pdf')).toBe('st01-st04');
    expect(setCodes('st01-st04')).toEqual(['ST-01', 'ST-02', 'ST-03', 'ST-04']);
    expect(setCodes('rules')).toEqual([]);
  });

  it('indexa filas sin conservar texto y registra huecos', () => {
    const result = indexDocument(
      [
        [
          ['Card No.', 'Card Name', 'Question', 'Answer'],
          ['', '', '', ''],
          ['OP99-001', 'Ficticia', 'Does [Blocker] on OP99-002 work?', 'Yes.'],
          ['OP99-003', 'Vacía', '', ''],
          ['OP99-004', 'Cortada', 'Texto cortado', 'No.'],
        ],
        [],
      ],
      keywords,
      'ficticio',
      digest,
    );
    expect(result.questions).toEqual([
      { id: 'ficticio-p1-1', page: 1, cardIds: ['OP99-001', 'OP99-002'], mechanics: ['blocker'], hash: digest(), flags: [] },
      { id: 'ficticio-p1-2', page: 1, cardIds: ['OP99-004'], mechanics: [], hash: digest(), flags: ['revisar-extraccion'] },
    ]);
    expect(result.gaps.map((gap) => gap.page)).toEqual([1, 2]);
    expect(JSON.stringify(result)).not.toContain('Yes.');
  });

  it('la carga manual reemplaza solo la página indicada', () => {
    const pages = [[['a?']], [['b?']]];
    expect(applyManual(pages, { 2: [['manual?']] })).toEqual([[['a?']], [['manual?']]]);
    expect(() => applyManual(pages, { 3: [] })).toThrow(/no existe/);
  });

  it('no detecta keywords sin corchetes', () => {
    expect(detectMechanics('a blocker', keywords)).toEqual([]);
  });

  it('el índice publicado cubre los 49 documentos sin texto oficial', () => {
    expect(index.documents).toHaveLength(49);
    expect(new Set(index.documents.map((document) => document.slug)).size).toBe(49);
    expect(Object.keys(index.documents[0].questions[0]).sort()).toEqual(['cardIds', 'flags', 'hash', 'id', 'mechanics', 'page']);
  });
});

describe('validación de explicaciones', () => {
  const document = index.documents[0];
  const question = document.questions[0];
  const entry = {
    id: question.id,
    sourceHash: question.hash,
    question: 'Pregunta ficticia',
    answer: 'Respuesta ficticia',
    ruleIds: ['1'],
    reviewStatus: 'pending',
  };
  const codes = (entries: object[]) =>
    validateQa({ ruleIds: new Set(['1']), index, notes: [{ file: 'ficticio', data: { document: document.slug, entries } }] })
      .issues.map((issue) => issue.code);

  it('acepta una explicación enlazada', () => {
    expect(codes([entry])).toEqual([]);
  });

  it.each<[string, IssueCode, object[]]>([
    ['pregunta inexistente', 'unknown-id', [{ ...entry, id: 'rules-p99-1' }]],
    ['explicación repetida', 'duplicate', [entry, entry]],
    ['fuente modificada', 'stale-source', [{ ...entry, sourceHash: 'cambiada' }]],
    ['regla inexistente', 'broken-ref', [{ ...entry, ruleIds: ['9-9'] }]],
    ['conflicto sin nota', 'invalid-schema', [{ ...entry, reviewStatus: 'conflict' }]],
    ['revisión sin persona', 'invalid-schema', [{ ...entry, reviewStatus: 'reviewed' }]],
  ])('detecta %s', (_name, code, entries) => {
    expect(codes(entries)).toEqual([code]);
  });
});

describe('cartas prohibidas', () => {
  // Fixtures ficticios.
  const data = {
    banned: [{ cardId: 'OP99-001', effectiveFrom: '2000-01-01' }],
    pairs: [{ cards: ['OP99-002', 'OP99-003'] as [string, string], effectiveFrom: '2000-01-02' }],
  };

  it('avisa por carta prohibida y por cada lado de una pareja', () => {
    expect(restrictionsFor(['OP99-001', 'OP99-003'], data)).toEqual([
      { kind: 'banned', cardId: 'OP99-001', effectiveFrom: '2000-01-01' },
      { kind: 'pair', cardId: 'OP99-003', partnerId: 'OP99-002', effectiveFrom: '2000-01-02' },
    ]);
    expect(restrictionsFor(['OP99-004'], data)).toEqual([]);
  });

  it('el registro cumple el esquema y no repite cartas', () => {
    const parsed = restrictionsSchema.parse(restrictionsData);
    expect(new Set(parsed.banned.map((entry) => entry.cardId)).size).toBe(parsed.banned.length);
    expect(parsed.pairs.every(({ cards }) => cards[0] !== cards[1])).toBe(true);
  });
});
