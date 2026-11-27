import { describe, expect, it } from 'vitest';
import { validateDeck } from '../../src/domain/legality/validate.ts';
import { cardSchema, deckSchema, formatSnapshotSchema, validationSchema, type Card, type Deck, type FormatSnapshot } from '../../src/lib/deck-schemas.ts';
import { card, cards, deck, FILLERS, LEADER, snapshot } from '../fixtures/decks.fictitious.ts';

const DATE = '2026-06-01';
const [A, B] = FILLERS as [string, string];

function run(options: { deck?: Partial<Deck>; extra?: Card[]; snapshot?: Partial<FormatSnapshot>; date?: string } = {}) {
  return validateDeck(
    deck(options.deck),
    { cards: cards(...(options.extra ?? [])), snapshot: snapshot(options.snapshot), suspensions: [] },
    options.date ?? DATE,
  );
}
const codes = (list: { code: string }[]) => list.map((item) => item.code);
const entries = (...changes: [string, number][]) => {
  const map = new Map(deck().entries.map((entry) => [entry.cardId, entry.quantity]));
  for (const [id, quantity] of changes) map.set(id, quantity);
  return [...map].filter(([, quantity]) => quantity > 0).map(([cardId, quantity]) => ({ cardId, quantity }));
};

describe('esquemas', () => {
  it('aceptan los fixtures y el resultado del validador', () => {
    expect(deckSchema.safeParse(deck()).success).toBe(true);
    expect([...cards().values()].every((item) => cardSchema.safeParse(item).success)).toBe(true);
    expect(formatSnapshotSchema.safeParse(snapshot()).success).toBe(true);
    expect(validationSchema.safeParse(run()).success).toBe(true);
  });

  it('rechazan revisiones sin firma y datos incoherentes', () => {
    expect(cardSchema.safeParse(card(A, { reviewedBy: undefined })).success).toBe(false);
    expect(cardSchema.safeParse(card(A, { number: B })).success).toBe(false);
    expect(cardSchema.safeParse(card(A, { printings: card(B).printings })).success).toBe(false);
    expect(cardSchema.safeParse(card(A, { colors: [] })).success).toBe(false);
    expect(cardSchema.safeParse(card(A, { colors: ['red', 'blue'] })).success).toBe(false);
    expect(cardSchema.safeParse(card(A, { category: 'leader', colors: ['red', 'blue'] })).success).toBe(true);
    expect(deckSchema.safeParse(deck({ reviewedAt: undefined })).success).toBe(false);
    expect(deckSchema.safeParse(deck({ strategy: null })).success).toBe(true);
    expect(deckSchema.safeParse(deck({ listSources: [] })).success).toBe(false);
    const priced = { ...deck().scoreBreakdown, affordability: { value: 50, evidence: 'Ficticia' } };
    expect(deckSchema.safeParse(deck({ scoreBreakdown: priced })).success).toBe(false);
    expect(formatSnapshotSchema.safeParse(snapshot({ effectiveUntil: '2025-01-01' })).success).toBe(false);
    expect(formatSnapshotSchema.safeParse(snapshot({ sources: [] })).success).toBe(false);
  });
});

describe('construcción', () => {
  it('un mazo completo y revisado es válido', () => {
    expect(run()).toMatchObject({ status: 'valid', violations: [], unknowns: [], pendingReview: [], nextKnownChange: null });
  });

  it('exige 50 cartas', () => {
    for (const quantity of [1, 3]) {
      expect(codes(run({ deck: { entries: entries([FILLERS[12]!, quantity]) } }).violations)).toContain('deck-size');
    }
  });

  it('limita a 4 copias por número, sumando líneas repetidas', () => {
    const split = [...entries([B, 3]), { cardId: A, quantity: 1 }];
    expect(codes(run({ deck: { entries: split } }).violations)).toEqual(['copy-limit']);
  });

  it('respeta la excepción de copias de una carta', () => {
    const free = card(A, { deckRules: [{ kind: 'copy-limit', limit: null }] });
    expect(run({ deck: { entries: entries([A, 8], [B, 0]) }, extra: [free] }).status).toBe('valid');
  });

  it('exige un Leader y no admite otro en el mazo', () => {
    expect(codes(run({ deck: { leaderId: A } }).violations)).toContain('not-a-leader');
    const leader = card(A, { category: 'leader' });
    expect(codes(run({ extra: [leader] }).violations)).toContain('category');
  });

  it('solo admite cartas de los colores del Leader', () => {
    expect(codes(run({ extra: [card(A, { colors: ['blue'] })] }).violations)).toEqual(['color']);
    const bicolor = card(LEADER, { category: 'leader', colors: ['red', 'blue'] });
    expect(run({ extra: [bicolor, card(A, { colors: ['blue'] })] }).status).toBe('valid');
  });

  it('valida el mazo de DON!! por separado, con excepción del Leader', () => {
    expect(codes(run({ deck: { donDeckSize: 9 } }).violations)).toEqual(['don-deck-size']);
    const leader = card(LEADER, { category: 'leader', deckRules: [{ kind: 'don-deck-size', size: 6 }] });
    expect(run({ deck: { donDeckSize: 6 }, extra: [leader] }).status).toBe('valid');
  });

  it('aplica las restricciones del Leader', () => {
    const leader = card(LEADER, { category: 'leader', deckRules: [{ kind: 'forbid', category: 'character', minCost: 5 }] });
    expect(run({ extra: [leader] }).status).toBe('valid');
    expect(codes(run({ extra: [leader, card(A, { cost: 5 })] }).violations)).toEqual(['leader-restriction']);
    expect(codes(run({ extra: [leader, card(A, { cost: null })] }).unknowns)).toEqual(['leader-restriction']);
  });

  it('un dato ausente o no evaluable nunca da válido', () => {
    const cases: [Card[], string][] = [
      [[card(A, { deckRules: null })], 'deck-rules-unverified'],
      [[card(A, { deckRules: [{ kind: 'unsupported', note: 'Ficticio' }] })], 'deck-rule-unsupported'],
      [[card(A, {}, null)], 'block-unknown'],
      [[card(A, { printingsComplete: false }, 1)], 'block-unknown'],
      [[card(A, {}, 3, null)], 'release-unknown'],
      [[card(A, { printings: [] })], 'release-unknown'],
    ];
    for (const [extra, code] of cases) {
      const result = run({ extra });
      expect(result.status).toBe('unknown');
      expect(codes(result.unknowns)).toContain(code);
    }
    expect(codes(run({ deck: { entries: entries([A, 0], ['OP99-999', 4]) } }).unknowns)).toContain('missing-card');
  });

  it('queda en revisión si falta revisar carta, formato o mazo', () => {
    expect(run({ extra: [card(A, { reviewStatus: 'pending' })] }).status).toBe('pending-review');
    expect(run({ snapshot: { reviewStatus: 'pending' } }).status).toBe('pending-review');
    expect(run({ deck: { reviewStatus: 'pending' } }).status).toBe('pending-review');
  });
});

describe('disponibilidad y bloques', () => {
  it('rechaza una carta antes de su lanzamiento y la admite el mismo día', () => {
    const extra = [card(A, {}, 3, DATE)];
    expect(run({ extra }).status).toBe('valid');
    expect(codes(run({ extra, date: '2026-05-31' }).violations)).toEqual(['not-released']);
  });

  it('ignora impresiones de otra región', () => {
    const other = card(A);
    other.printings[0]!.region = 'otra-region';
    expect(codes(run({ extra: [other] }).unknowns)).toEqual(['release-unknown']);
  });

  it('rota un bloque antiguo salvo reimpresión vigente o bloque X', () => {
    const old = card(A, {}, 1);
    expect(codes(run({ extra: [old] }).violations)).toEqual(['rotated']);
    const reprint = { ...old.printings[0]!, id: 'reimpresion', blockSymbol: 3, releaseDate: '2026-05-01' };
    expect(run({ extra: [{ ...old, printings: [...old.printings, reprint] }] }).status).toBe('valid');
    expect(run({ extra: [card(A, {}, 'X')] }).status).toBe('valid');
    // Una reimpresión futura no legaliza antes de tiempo.
    const later = { ...reprint, releaseDate: '2026-07-01' };
    expect(codes(run({ extra: [{ ...old, printings: [...old.printings, later] }] }).violations)).toEqual(['rotated']);
  });

  it('excepción de bloque vigente hasta el 2029-03-31 inclusive', () => {
    const exception = { cardId: A, treatedAs: 4, effectiveFrom: '2026-04-01', effectiveUntil: '2029-03-31' };
    const options = { extra: [card(A, {}, 1)], snapshot: { blockWindow: [4], blockExceptions: [exception] } };
    const others = FILLERS.slice(1).map((id) => card(id, {}, 4));
    const leader = card(LEADER, { category: 'leader' }, 4);
    const extra = [...options.extra, ...others, leader];
    const last = run({ ...options, extra, date: '2029-03-31' });
    expect(last).toMatchObject({ status: 'valid', nextKnownChange: '2029-04-01' });
    expect(codes(run({ ...options, extra, date: '2029-04-01' }).violations)).toEqual(['rotated']);
  });
});

describe('restricciones y fechas efectivas', () => {
  const effective = { effectiveFrom: '2026-07-01', effectiveUntil: null };

  it('prohibición: no se anticipa y rige desde su fecha, también sobre el Leader', () => {
    for (const cardId of [A, LEADER]) {
      const options = { snapshot: { bans: [{ cardId, ...effective }] } };
      expect(run({ ...options, date: '2026-06-30' })).toMatchObject({ status: 'valid', nextKnownChange: '2026-07-01' });
      expect(codes(run({ ...options, date: '2026-07-01' }).violations)).toEqual(['banned']);
    }
  });

  it('una prohibición retirada deja de aplicarse', () => {
    const bans = [{ cardId: A, effectiveFrom: '2026-01-01', effectiveUntil: '2026-05-31' }];
    expect(run({ snapshot: { bans } }).status).toBe('valid');
    expect(run({ snapshot: { bans }, date: '2026-05-31' }).status).toBe('invalid');
  });

  it('pareja prohibida solo si están las dos', () => {
    const pair = (second: string) => ({ snapshot: { bannedPairs: [{ cards: [LEADER, second] as [string, string], ...effective }] }, date: '2026-07-01' });
    expect(codes(run(pair(A)).violations)).toEqual(['banned-pair']);
    expect(run(pair('OP99-999')).status).toBe('valid');
  });

  it('carta restringida', () => {
    const restrictions = [{ cardId: A, maxCopies: 1, effectiveFrom: '2026-01-01', effectiveUntil: null }];
    expect(codes(run({ snapshot: { restrictions } }).violations)).toEqual(['restricted']);
  });

  it('fuera de la vigencia del snapshot no se afirma nada del formato', () => {
    const options = { snapshot: { effectiveUntil: '2026-06-30', bans: [{ cardId: A, effectiveFrom: '2026-01-01', effectiveUntil: null }] } };
    const result = run({ ...options, date: '2026-07-01' });
    expect(result.status).toBe('unknown');
    expect(codes(result.unknowns)).toEqual(['snapshot-not-in-force']);
    expect(run({ ...options, date: '2026-06-30' }).nextKnownChange).toBe('2026-07-01');
  });
});
