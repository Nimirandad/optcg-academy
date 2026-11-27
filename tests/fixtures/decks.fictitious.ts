/** Datos FICTICIOS para pruebas: ninguna carta, producto, fuente ni mazo es real. */
import type { Card, Deck, FormatSnapshot, Source } from '../../src/lib/deck-schemas.ts';

export const REGION = 'region-ficticia';

export const source: Source = {
  url: 'https://example.com/ficticio',
  retrievedAt: '2026-01-01',
  parserVersion: 'manual',
  reviewStatus: 'reviewed',
};

export function card(id: string, overrides: Partial<Card> = {}, block: number | 'X' | null = 3, releaseDate: string | null = '2026-01-01'): Card {
  return {
    canonicalId: id,
    number: id,
    name: `Carta ficticia ${id}`,
    category: 'character',
    colors: ['red'],
    types: [],
    attributes: [],
    power: 1000,
    cost: 1,
    life: null,
    counter: null,
    printings: [
      { id: `${id}-a`, cardId: id, productId: 'OP99', blockSymbol: block, region: REGION, releaseDate, sourceRef: source },
    ],
    printingsComplete: true,
    deckRules: [],
    sourceRef: source,
    reviewStatus: 'reviewed',
    reviewedBy: 'Revisor ficticio',
    ...overrides,
  };
}

export const LEADER = 'OP99-001';
export const FILLERS = Array.from({ length: 13 }, (_, index) => `OP99-${String(index + 10).padStart(3, '0')}`);

/** Leader rojo y 13 cartas: 12 con cuatro copias y una con dos. */
export const cards = (...extra: Card[]) =>
  new Map(
    [card(LEADER, { category: 'leader', cost: null, life: 5 }), ...FILLERS.map((id) => card(id)), ...extra].map((item) => [
      item.canonicalId,
      item,
    ]),
  );

export const snapshot = (overrides: Partial<FormatSnapshot> = {}): FormatSnapshot => ({
  id: 'formato-ficticio',
  region: REGION,
  format: 'standard',
  effectiveFrom: '2026-01-01',
  effectiveUntil: null,
  rotationPolicy: 'Ficticia',
  blockWindow: [2, 3],
  blockExceptions: [],
  bans: [],
  restrictions: [],
  bannedPairs: [],
  notes: [],
  verifiedAt: '2026-01-01',
  sources: [source],
  reviewStatus: 'reviewed',
  reviewedBy: 'Revisor ficticio',
  ...overrides,
});

export const deck = (overrides: Partial<Deck> = {}): Deck => ({
  id: 'mazo-ficticio',
  name: 'Mazo ficticio',
  leaderId: LEADER,
  entries: FILLERS.map((cardId, index) => ({ cardId, quantity: index < 12 ? 4 : 2 })),
  donDeckSize: 10,
  kind: 'built',
  tags: [],
  styles: ['ficticio'],
  difficulty: 1,
  price: null,
  releasedAt: '2026-01-01',
  listSources: [source],
  scoreBreakdown: { ease: null, colorIdentity: null, affordability: null, consistency: null, upgrades: null },
  strategy: { earlyTurns: 'Ficticio', mulligan: 'Ficticio', combos: [], commonMistakes: [], upgrades: [] },
  alternatives: [],
  version: 1,
  reviewStatus: 'reviewed',
  reviewedBy: 'Revisor ficticio',
  reviewedAt: '2026-01-01',
  ...overrides,
});
