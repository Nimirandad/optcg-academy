/** Puntuación editorial 0–100 (`plan.md` §7, `docs/rubrica.md`). Pura y determinista. */
export const weights = {
  ease: 30,
  colorIdentity: 25,
  affordability: 20,
  consistency: 15,
  upgrades: 10,
} as const;

export type Criterion = keyof typeof weights;

export type Breakdown = Record<Criterion, { value: number; evidence: string } | null>;

export interface Score {
  /** `null` si no hay ningún criterio evaluado. */
  score: number | null;
  /** Porcentaje del peso total con datos. */
  coverage: number;
  missing: Criterion[];
}

export function scoreDeck(breakdown: Breakdown): Score {
  let total = 0;
  let coverage = 0;
  const missing: Criterion[] = [];
  for (const [criterion, weight] of Object.entries(weights) as [Criterion, number][]) {
    const item = breakdown[criterion];
    if (item === null) {
      missing.push(criterion);
    } else {
      total += item.value * weight;
      coverage += weight;
    }
  }
  return { score: coverage ? Math.round((total / coverage) * 10) / 10 : null, coverage, missing };
}

export interface Candidate {
  deck: { id: string; scoreBreakdown: Breakdown };
  validation: { status: 'valid' | 'invalid' | 'unknown' | 'pending-review' };
  /** Afinidad del test; solo desempata. */
  affinity?: number;
}

export type Ranked<T> = T & Score;

/** Primero filtra por legalidad (solo `valid`); después ordena por puntuación, afinidad e ID. */
export function rankDecks<T extends Candidate>(candidates: readonly T[]): Ranked<T>[] {
  return candidates
    .filter((candidate) => candidate.validation.status === 'valid')
    .map((candidate) => ({ ...candidate, ...scoreDeck(candidate.deck.scoreBreakdown) }))
    .sort(
      (a, b) =>
        (b.score ?? -1) - (a.score ?? -1) ||
        (b.affinity ?? 0) - (a.affinity ?? 0) ||
        a.deck.id.localeCompare(b.deck.id),
    );
}
