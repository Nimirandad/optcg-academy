import type { Restrictions } from './schemas';

export interface Warning {
  kind: 'banned' | 'pair';
  cardId: string;
  /** La otra carta de una pareja prohibida. */
  partnerId?: string;
  effectiveFrom: string;
}

/** Avisos aplicables a las cartas citadas. No evalúa la fecha actual: informa desde cuándo rige. */
export function restrictionsFor(cardIds: string[], data: Pick<Restrictions, 'banned' | 'pairs'>): Warning[] {
  const cited = new Set(cardIds);
  const banned: Warning[] = data.banned
    .filter((entry) => cited.has(entry.cardId))
    .map((entry) => ({ kind: 'banned', cardId: entry.cardId, effectiveFrom: entry.effectiveFrom }));
  const pairs: Warning[] = data.pairs.flatMap(({ cards: [a, b], effectiveFrom }) =>
    [
      [a, b],
      [b, a],
    ]
      .filter(([own]) => cited.has(own))
      .map(([cardId, partnerId]) => ({ kind: 'pair' as const, cardId, partnerId, effectiveFrom })),
  );
  return [...banned, ...pairs];
}
