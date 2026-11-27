/** Snapshots reales de `src/data/rotation/`. Las cartas de las pruebas son ficticias, aunque usen números reales. */
import { describe, expect, it } from 'vitest';
import { validateDeck } from '../../src/domain/legality/validate.ts';
import current from '../../src/data/rotation/standard-2026-04.json';
import next from '../../src/data/rotation/standard-2027-04.json';
import restrictions from '../../src/data/restrictions/standard.json';
import { formatSnapshotSchema, type Card } from '../../src/lib/deck-schemas.ts';
import { card, cards, deck, FILLERS } from '../fixtures/decks.fictitious.ts';

const [now, future] = [current, next].map((data) => formatSnapshotSchema.parse(data)) as [
  ReturnType<typeof formatSnapshotSchema.parse>,
  ReturnType<typeof formatSnapshotSchema.parse>,
];

const regional = (item: Card): Card => ({
  ...item,
  printings: item.printings.map((printing) => ({ ...printing, region: now.region })),
});
const data = (...extra: Card[]) => new Map([...cards(...extra)].map(([id, item]) => [id, regional(item)]));
const withCards = (...ids: string[]) => ({
  entries: deck().entries.map((entry, index) => ({ ...entry, cardId: ids[index] ?? entry.cardId })),
});
const codes = (list: { code: string }[]) => list.map((item) => item.code);

describe('snapshots de Standard', () => {
  it('cumplen el esquema, están aprobados y no se solapan', () => {
    expect([now.reviewStatus, future.reviewStatus]).toEqual(['reviewed', 'reviewed']);
    expect(now.effectiveUntil).toBe('2027-03-31');
    expect(future.effectiveFrom).toBe('2027-04-01');
    expect(now.blockWindow).toEqual([2, 3, 4, 5]);
    expect(future.blockWindow).toEqual([3, 4, 5, 6]);
  });

  it('coinciden con el registro de prohibidas que muestra el sitio', () => {
    for (const snapshot of [now, future]) {
      expect(snapshot.bans.map(({ cardId, effectiveFrom }) => ({ cardId, effectiveFrom }))).toEqual(restrictions.banned);
      expect(snapshot.bannedPairs.map(({ cards, effectiveFrom }) => ({ cards, effectiveFrom }))).toEqual(restrictions.pairs);
    }
  });

  it('listan 40 números de bloque X y 15 tratados como bloque 4, sin repetidos', () => {
    const byBlock = (block: number | 'X') => now.blockExceptions.filter((item) => item.treatedAs === block).map((item) => item.cardId);
    expect(new Set(byBlock('X')).size).toBe(40);
    expect(new Set(byBlock(4)).size).toBe(15);
    expect(new Set(now.blockExceptions.map((item) => item.cardId)).size).toBe(55);
  });

  it('2026-11-27: la pareja EB05-001 y OP13-001 rige desde ese día', () => {
    const extra = [card('EB05-001'), card('OP13-001')];
    const list = deck(withCards('EB05-001', 'OP13-001'));
    const before = validateDeck(list, { cards: data(...extra), snapshot: now, suspensions: [] }, '2026-11-26');
    expect(codes(before.violations)).toEqual([]);
    expect(before.nextKnownChange).toBe('2026-11-27');
    const after = validateDeck(list, { cards: data(...extra), snapshot: now, suspensions: [] }, '2026-11-27');
    expect(codes(after.violations)).toEqual(['banned-pair']);
  });

  it('2027-04-01: el bloque 2 sale de Standard, sin invalidar antes', () => {
    const lookup = data(card(FILLERS[0]!, {}, 2));
    const list = deck();
    const last = validateDeck(list, { cards: lookup, snapshot: now, suspensions: [] }, '2027-03-31');
    expect(last).toMatchObject({ status: 'valid', violations: [], nextKnownChange: '2027-04-01' });
    expect(validateDeck(list, { cards: lookup, snapshot: now, suspensions: [] }, '2027-04-01').status).toBe('unknown');
    const rotated = validateDeck(list, { cards: lookup, snapshot: future, suspensions: [] }, '2027-04-01');
    expect(codes(rotated.violations)).toEqual(['rotated']);
  });

  it('un número tratado como bloque 4 y uno X siguen legales tras la rotación', () => {
    const extra = [card('OP01-039', {}, 1), card('OP01-016', {}, 1)];
    const result = validateDeck(deck(withCards('OP01-039', 'OP01-016')), { cards: data(...extra), snapshot: future, suspensions: [] }, '2027-04-01');
    expect(result.violations).toEqual([]);
    expect(result.unknowns).toEqual([]);
  });

  it('2029-03-31: no hay snapshot para esa fecha', () => {
    for (const snapshot of [now, future]) {
      const result = validateDeck(deck(), { cards: data(), snapshot, suspensions: [] }, '2029-03-31');
      expect(result.status).toBe('unknown');
      expect(codes(result.unknowns)).toContain('snapshot-not-in-force');
    }
  });
});
