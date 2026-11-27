/**
 * Lo que el dominio necesita de cada modelo. Los esquemas de `src/lib/deck-schemas.ts`
 * producen datos compatibles; `tsc` lo comprueba al pasarlos al dominio.
 */
export type Color = 'red' | 'green' | 'blue' | 'purple' | 'black' | 'yellow';
export type Category = 'leader' | 'character' | 'event' | 'stage' | 'don';
export type ReviewStatus = 'pending' | 'reviewed' | 'superseded' | 'conflict';
export type Block = number | 'X';

export type DeckRule =
  | { kind: 'copy-limit'; limit: number | null }
  | { kind: 'forbid'; category?: Category; minCost?: number; maxCost?: number }
  | { kind: 'don-deck-size'; size: number }
  | { kind: 'unsupported'; note: string };

export interface Card {
  canonicalId: string;
  category: Category;
  colors: Color[];
  cost: number | null;
  printings: { region: string; releaseDate: string | null; blockSymbol: Block | null }[];
  printingsComplete: boolean;
  deckRules: DeckRule[] | null;
  reviewStatus: ReviewStatus;
}

export interface Period {
  effectiveFrom: string;
  effectiveUntil: string | null;
}

export interface FormatSnapshot extends Period {
  id: string;
  region: string;
  blockWindow: number[];
  blockExceptions: (Period & { cardId: string; treatedAs: Block })[];
  bans: (Period & { cardId: string })[];
  restrictions: (Period & { cardId: string; maxCopies: number })[];
  bannedPairs: (Period & { cards: [string, string] })[];
  reviewStatus: ReviewStatus;
}

/** Suspende la recomendación mientras se revisa un cambio detectado (`plan.md` §9). */
export interface Suspension extends Period {
  id: string;
  target: { kind: 'card'; cardId: string } | { kind: 'pair'; cardIds: [string, string] } | { kind: 'format' };
}

export interface DeckList {
  id: string;
  leaderId: string;
  entries: { cardId: string; quantity: number }[];
  donDeckSize: number;
  reviewStatus: ReviewStatus;
}

export interface Finding {
  code: string;
  message: string;
  cardIds: string[];
  ruleIds: string[];
}

export interface Validation {
  deckId: string;
  snapshotId: string;
  status: 'valid' | 'invalid' | 'unknown' | 'pending-review';
  violations: Finding[];
  unknowns: Finding[];
  pendingReview: string[];
  /** Suspensiones de seguridad vigentes que afectan al mazo. */
  suspendedBy: string[];
  checkedAt: string;
  nextKnownChange: string | null;
}
