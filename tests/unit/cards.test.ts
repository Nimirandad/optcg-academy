/** Datos reales de los Starter Decks candidatos (`src/data/cards/` y `src/data/products/`). */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateDeck } from '../../src/domain/legality/validate.ts';
import current from '../../src/data/rotation/standard-2026-04.json';
import next from '../../src/data/rotation/standard-2027-04.json';
import { rankDecks } from '../../src/domain/recommendation/score.ts';
import { cardSchema, deckSchema, formatSnapshotSchema, productSchema, type Card } from '../../src/lib/deck-schemas.ts';

const read = (path: string): unknown[] => JSON.parse(readFileSync(path, 'utf8'));
const products = read('src/data/products/starter-decks.json').map((item) => productSchema.parse(item));
const files = readdirSync('src/data/cards').sort();
const decks = files.map((file) => read(`src/data/cards/${file}`).map((item) => cardSchema.parse(item)));
const all = decks.flat();
const snapshots = [current, next].map((data) => formatSnapshotSchema.parse(data));

describe('Starter Decks candidatos', () => {
  it('son ST-31 a ST-36, publicados el 2026-07-31', () => {
    expect(products.map((product) => product.id)).toEqual(['ST-31', 'ST-32', 'ST-33', 'ST-34', 'ST-35', 'ST-36']);
    expect(files).toEqual(products.map((product) => `${product.id.toLowerCase()}.json`));
    expect(new Set(products.map((product) => product.releaseDate))).toEqual(new Set(['2026-07-31']));
  });

  it('cada uno tiene 15 cartas con un Leader que cubre sus colores', () => {
    const leaders = decks.map((cards) => {
      expect(cards).toHaveLength(15);
      const found = cards.filter((card) => card.category === 'leader');
      expect(found).toHaveLength(1);
      for (const card of cards) for (const color of card.colors) expect(found[0]!.colors).toContain(color);
      return found[0]!.colors.join('/');
    });
    expect(leaders).toEqual(['red', 'green', 'blue', 'purple', 'red/black', 'yellow']);
  });

  it('las cartas son únicas, incluyen impresión de su producto y no copian efectos', () => {
    expect(new Set(all.map((card) => card.number)).size).toBe(all.length);
    for (const [index, cards] of decks.entries()) {
      for (const card of cards) expect(card.printings.map((printing) => printing.productId)).toContain(products[index]!.id);
    }
    expect(all.filter((card) => card.effect !== undefined || card.trigger !== undefined)).toEqual([]);
    expect(all.every((card) => card.reviewStatus === 'pending')).toBe(true);
  });

  it.each(snapshots)('todas están disponibles y dentro de bloque en $id', (snapshot) => {
    const lookup = new Map<string, Card>(all.map((card) => [card.canonicalId, card]));
    const date = snapshot.effectiveFrom > '2026-11-27' ? snapshot.effectiveFrom : '2026-11-27';
    for (const cards of decks) {
      // Solo interesan los hallazgos por carta: las cantidades de cada mazo aún no se conocen.
      const list = {
        id: 'sin-cantidades',
        leaderId: cards.find((card) => card.category === 'leader')!.canonicalId,
        entries: cards.filter((card) => card.category !== 'leader').map((card) => ({ cardId: card.canonicalId, quantity: 1 })),
        donDeckSize: 10,
        reviewStatus: 'pending' as const,
      };
      const result = validateDeck(list, { cards: lookup, snapshot, suspensions: [] }, date);
      expect(result.violations.map((item) => item.code)).toEqual(['deck-size']);
      expect(result.unknowns).toEqual([]);
    }
  });
});

describe('listas cargadas', () => {
  const lists = read('src/data/decks/starter-decks.json').map((item) => deckSchema.parse(item));
  const lookup = new Map<string, Card>(all.map((card) => [card.canonicalId, card]));

  it('hay listas de ST-31 a ST-35; ST-36 sigue sin cantidades', () => {
    expect(lists.map((list) => list.id)).toEqual(['st-31', 'st-32', 'st-33', 'st-34', 'st-35']);
  });

  it('usan exactamente las cartas de su producto', () => {
    for (const list of lists) {
      const own = decks[files.indexOf(`${list.id}.json`)]!.map((card) => card.number);
      expect([list.leaderId, ...list.entries.map((entry) => entry.cardId)].sort()).toEqual(own.sort());
    }
  });

  const check = (cardData: Map<string, Card>) =>
    lists.map((list) => ({ deck: list, validation: validateDeck(list, { cards: cardData, snapshot: snapshots[0]!, suspensions: [] }, '2026-11-27') }));

  it('están aprobadas, pero no se recomiendan mientras las cartas sigan sin revisar', () => {
    expect(lists.every((list) => list.reviewStatus === 'reviewed')).toBe(true);
    const candidates = check(lookup);
    for (const { validation } of candidates) {
      expect(validation).toMatchObject({ status: 'pending-review', violations: [], unknowns: [] });
      expect(validation.pendingReview.filter((item) => !item.startsWith('Carta '))).toEqual([]);
    }
    expect(rankDecks(candidates)).toEqual([]);
  });

  it('con las cartas revisadas (simulado) serían válidas', () => {
    const reviewed = new Map([...lookup].map(([id, card]) => [id, { ...card, reviewStatus: 'reviewed' as const }]));
    expect(check(reviewed).map((item) => item.validation.status)).toEqual(Array(5).fill('valid'));
  });
});
