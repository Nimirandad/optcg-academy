/** Suspensiones de seguridad e informe de mazos (T6.3). Cartas, formatos y mazos ficticios. */
import { describe, expect, it } from 'vitest';
import { earliestDate, legalityReport, needsAttention } from '../../src/domain/legality/report.ts';
import type { Suspension } from '../../src/domain/legality/types.ts';
import { validateDeck } from '../../src/domain/legality/validate.ts';
import { rankDecks } from '../../src/domain/recommendation/score.ts';
import safety from '../../src/data/safety/standard.json';
import { safetySnapshotSchema, validationSchema } from '../../src/lib/deck-schemas.ts';
import { cards, deck, FILLERS, LEADER, snapshot, source } from '../fixtures/decks.fictitious.ts';

const DATE = '2026-06-01';
const [A] = FILLERS as [string];
const OUTSIDE = 'OP99-099';

const suspension = (target: Suspension['target'], overrides: Partial<Suspension> = {}): Suspension => ({
  id: 'suspension-ficticia',
  target,
  effectiveFrom: '2026-05-01',
  effectiveUntil: null,
  ...overrides,
});
const run = (suspensions: Suspension[], date = DATE, list = deck()) =>
  validateDeck(list, { cards: cards(), snapshot: snapshot(), suspensions }, date);

describe('suspensiones', () => {
  it.each<[string, Suspension['target']]>([
    ['una carta', { kind: 'card', cardId: A }],
    ['el Leader', { kind: 'card', cardId: LEADER }],
    ['una pareja completa', { kind: 'pair', cardIds: [LEADER, A] }],
    ['todo el formato', { kind: 'format' }],
  ])('suspende por %s sin declarar el mazo ilegal', (_name, target) => {
    const result = run([suspension(target)]);
    expect(result).toMatchObject({ status: 'pending-review', violations: [], suspendedBy: ['suspension-ficticia'] });
    expect(validationSchema.safeParse(result).success).toBe(true);
    const candidate = { deck: deck(), validation: result };
    expect(rankDecks([candidate])).toEqual([]);
  });

  it.each<[string, Suspension['target']]>([
    ['una carta ausente', { kind: 'card', cardId: OUTSIDE }],
    ['media pareja', { kind: 'pair', cardIds: [A, OUTSIDE] }],
  ])('no afecta por %s', (_name, target) => {
    expect(run([suspension(target)])).toMatchObject({ status: 'valid', suspendedBy: [] });
  });

  it('rige entre sus fechas y anuncia el cambio', () => {
    const list = [suspension({ kind: 'card', cardId: A }, { effectiveFrom: '2026-07-01', effectiveUntil: '2026-07-31' })];
    expect(run(list, '2026-06-30')).toMatchObject({ status: 'valid', nextKnownChange: '2026-07-01' });
    expect(run(list, '2026-07-01')).toMatchObject({ status: 'pending-review', nextKnownChange: '2026-08-01' });
    expect(run(list, '2026-08-01')).toMatchObject({ status: 'valid', nextKnownChange: null });
  });

  it('no oculta que un mazo es ilegal', () => {
    const short = deck({ entries: deck().entries.slice(1) });
    expect(run([suspension({ kind: 'format' })], DATE, short).status).toBe('invalid');
  });
});

describe('archivo de suspensiones', () => {
  const entry = {
    ...suspension({ kind: 'card', cardId: A }),
    reason: 'Ficticia',
    sourceRef: source,
    reviewStatus: 'pending',
  };
  const parse = (...suspensions: unknown[]) => safetySnapshotSchema.safeParse({ updatedAt: DATE, suspensions }).success;

  it('el registrado cumple el esquema', () => {
    expect(safetySnapshotSchema.safeParse(safety).success).toBe(true);
  });

  it('admite una entrada pendiente y rechaza datos incoherentes', () => {
    expect(parse(entry)).toBe(true);
    expect(parse(entry, entry)).toBe(false);
    expect(parse({ ...entry, sourceRef: undefined })).toBe(false);
    expect(parse({ ...entry, reviewStatus: 'reviewed' })).toBe(false);
    expect(parse({ ...entry, effectiveUntil: '2026-04-01' })).toBe(false);
    expect(parse({ ...entry, target: { kind: 'pair', cardIds: [A, A] } })).toBe(false);
  });
});

describe('informe de mazos', () => {
  const first = snapshot({ id: 'primero', effectiveUntil: '2026-12-31' });
  const second = snapshot({ id: 'segundo', effectiveFrom: '2027-01-01', effectiveUntil: '2027-12-31', blockWindow: [4] });
  const data = { decks: [deck()], cards: cards(), snapshots: [first, second], suspensions: [] };

  it('usa la fecha de la zona más adelantada', () => {
    expect(earliestDate(new Date('2026-11-26T09:59:00Z'))).toBe('2026-11-26');
    expect(earliestDate(new Date('2026-11-26T10:00:00Z'))).toBe('2026-11-27');
  });

  it('evalúa hoy y cada cambio futuro sin invalidar antes', () => {
    const report = legalityReport(data, DATE);
    expect(report.current[0]!.validation).toMatchObject({ snapshotId: 'primero', status: 'valid' });
    expect(report.upcoming.map((row) => [row.date, row.validation?.status ?? null])).toEqual([
      ['2027-01-01', 'invalid'],
      ['2028-01-01', null],
    ]);
    expect(report.blocks).toEqual(['2028-01-01: sin snapshot aprobado que rija esa fecha.']);
    expect(needsAttention(report)).toBe(false);
  });

  it('pide atención ante un mazo ilegal o sin formato hoy', () => {
    expect(needsAttention(legalityReport(data, '2027-01-01'))).toBe(true);
    expect(needsAttention(legalityReport(data, '2028-01-01'))).toBe(true);
  });

  it('señala un snapshot sin aprobar', () => {
    const pending = { ...data, snapshots: [snapshot({ reviewStatus: 'pending' })] };
    expect(legalityReport(pending, DATE).blocks).toHaveLength(1);
  });

  it('rechaza snapshots solapados', () => {
    expect(() => legalityReport({ ...data, snapshots: [first, snapshot({ id: 'otro' })] }, DATE)).toThrow('Varios');
  });
});
