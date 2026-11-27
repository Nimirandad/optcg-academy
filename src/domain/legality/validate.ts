/**
 * Validador de legalidad. Puro y determinista: la fecha y los datos se reciben.
 * Un dato ausente nunca produce `valid` (ADR-008).
 */
import type { Card, DeckList, DeckRule, Finding, FormatSnapshot, Period, Suspension, Validation } from './types';

export const DECK_SIZE = 50;
export const DON_DECK_SIZE = 10;
export const COPY_LIMIT = 4;

export interface LegalityData {
  cards: ReadonlyMap<string, Card>;
  snapshot: FormatSnapshot;
  /** Obligatorio: omitirlo permitiría recomendar un mazo suspendido. */
  suspensions: readonly Suspension[];
}

/** Las fechas ISO (`AAAA-MM-DD`) se ordenan como texto. Ambos extremos incluidos. */
export const inForce = (item: Period, date: string) =>
  item.effectiveFrom <= date && (item.effectiveUntil === null || date <= item.effectiveUntil);

const dayAfter = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

const finding = (code: string, message: string, cardIds: string[] = [], ruleIds: string[] = []): Finding => ({
  code,
  message,
  cardIds,
  ruleIds,
});

type Verdict = 'ok' | 'violation' | 'unknown';

/** Disponibilidad y bloque de un número de carta, considerando todas sus impresiones. */
function cardPool(card: Card, snapshot: FormatSnapshot, date: string): { release: Verdict; block: Verdict } {
  const printings = card.printings.filter((printing) => printing.region === snapshot.region);
  const released = printings.filter((printing) => printing.releaseDate !== null && printing.releaseDate <= date);
  const undated = printings.some((printing) => printing.releaseDate === null);
  if (released.length === 0) {
    const certain = printings.length > 0 && !undated && card.printingsComplete;
    return { release: certain ? 'violation' : 'unknown', block: 'ok' };
  }

  const allowed = (block: number | 'X') => block === 'X' || snapshot.blockWindow.includes(block);
  const excepted = snapshot.blockExceptions.some(
    (exception) => exception.cardId === card.canonicalId && inForce(exception, date) && allowed(exception.treatedAs),
  );
  if (excepted || released.some((printing) => printing.blockSymbol !== null && allowed(printing.blockSymbol))) {
    return { release: 'ok', block: 'ok' };
  }
  const incomplete = !card.printingsComplete || undated || released.some((printing) => printing.blockSymbol === null);
  return { release: 'ok', block: incomplete ? 'unknown' : 'violation' };
}

function matches(card: Card, rule: Extract<DeckRule, { kind: 'forbid' }>): Verdict {
  if (rule.category !== undefined && card.category !== rule.category) return 'ok';
  if (rule.minCost === undefined && rule.maxCost === undefined) return 'violation';
  if (card.cost === null) return 'unknown';
  const inRange = card.cost >= (rule.minCost ?? 0) && card.cost <= (rule.maxCost ?? Infinity);
  return inRange ? 'violation' : 'ok';
}

/** El mazo de DON!! se valida por separado del mazo principal. */
export function validateDonDeck(size: number, leader: Card | undefined): Finding[] {
  const override = leader?.deckRules?.find((rule) => rule.kind === 'don-deck-size');
  const expected = override?.size ?? DON_DECK_SIZE;
  return size === expected
    ? []
    : [finding('don-deck-size', `El mazo de DON!! debe tener ${expected} cartas; tiene ${size}.`, [], ['5-1-2'])];
}

export function validateDeck(deck: DeckList, { cards, snapshot, suspensions }: LegalityData, date: string): Validation {
  const violations: Finding[] = [];
  const unknowns: Finding[] = [];
  const pendingReview: string[] = [];

  const quantities = new Map<string, number>();
  for (const { cardId, quantity } of deck.entries) quantities.set(cardId, (quantities.get(cardId) ?? 0) + quantity);
  const ids = [...new Set([deck.leaderId, ...quantities.keys()])];
  const leader = cards.get(deck.leaderId);

  const size = [...quantities.values()].reduce((sum, quantity) => sum + quantity, 0);
  if (size !== DECK_SIZE) {
    violations.push(finding('deck-size', `El mazo debe tener ${DECK_SIZE} cartas; tiene ${size}.`, [], ['5-1-2']));
  }
  if (leader && leader.category !== 'leader') {
    violations.push(finding('not-a-leader', `${deck.leaderId} no es un Leader.`, [deck.leaderId], ['5-1-2']));
  }

  for (const id of ids) {
    const card = cards.get(id);
    if (!card) {
      unknowns.push(finding('missing-card', `No hay datos de ${id}.`, [id]));
      continue;
    }
    if (card.reviewStatus !== 'reviewed') pendingReview.push(`Carta ${id}`);
    if (card.deckRules === null) {
      unknowns.push(finding('deck-rules-unverified', `Falta comprobar si ${id} altera la construcción.`, [id], ['5-1-2-4']));
    }
    for (const rule of card.deckRules ?? []) {
      const misplaced = id !== deck.leaderId && (rule.kind === 'forbid' || rule.kind === 'don-deck-size');
      if (rule.kind === 'unsupported' || misplaced) {
        unknowns.push(finding('deck-rule-unsupported', `El validador no evalúa un efecto de construcción de ${id}.`, [id], ['5-1-2-4']));
      }
    }
  }

  for (const [id, quantity] of quantities) {
    const card = cards.get(id);
    if (!card) continue;
    if (card.category === 'leader' || card.category === 'don') {
      violations.push(finding('category', `${id} no puede ir en el mazo principal.`, [id], ['5-1-2-1']));
      continue;
    }

    const own = card.deckRules?.find((rule) => rule.kind === 'copy-limit');
    const limit = own ? (own.limit ?? Infinity) : COPY_LIMIT;
    if (quantity > limit) {
      const message = `${id}: ${quantity} copias; el máximo es ${limit}.`;
      // Sin haber comprobado la carta, el límite general podría no aplicarse.
      const target = card.deckRules === null ? unknowns : violations;
      target.push(finding('copy-limit', message, [id], ['5-1-2-3']));
    }

    if (leader?.category === 'leader') {
      if (card.colors.some((color) => !leader.colors.includes(color))) {
        violations.push(finding('color', `${id} tiene un color que el Leader no tiene.`, [id], ['5-1-2-2']));
      }
      for (const rule of leader.deckRules ?? []) {
        if (rule.kind !== 'forbid') continue;
        const verdict = matches(card, rule);
        if (verdict === 'ok') continue;
        const message = `El Leader ${deck.leaderId} limita la inclusión de ${id}.`;
        const target = verdict === 'violation' ? violations : unknowns;
        target.push(finding('leader-restriction', message, [id, deck.leaderId], ['5-1-2-4']));
      }
    }
  }

  violations.push(...validateDonDeck(deck.donDeckSize, leader));

  const changes: string[] = [];
  const track = (item: Period) => {
    if (item.effectiveFrom > date) changes.push(item.effectiveFrom);
    if (item.effectiveUntil !== null && item.effectiveUntil >= date) changes.push(dayAfter(item.effectiveUntil));
  };
  const included = new Set(ids);
  const bans = snapshot.bans.filter((ban) => included.has(ban.cardId));
  const restrictions = snapshot.restrictions.filter((item) => included.has(item.cardId));
  const pairs = snapshot.bannedPairs.filter((pair) => pair.cards.every((id) => included.has(id)));
  const exceptions = snapshot.blockExceptions.filter((item) => included.has(item.cardId));
  const affecting = suspensions.filter(({ target }) =>
    target.kind === 'format'
      ? true
      : (target.kind === 'card' ? [target.cardId] : target.cardIds).every((id) => included.has(id)),
  );
  for (const item of [snapshot, ...bans, ...restrictions, ...pairs, ...exceptions, ...affecting]) track(item);

  if (!inForce(snapshot, date)) {
    // Un snapshot fuera de vigencia no permite afirmar ni negar nada sobre el formato.
    unknowns.push(finding('snapshot-not-in-force', `El snapshot ${snapshot.id} no rige el ${date}.`));
  } else {
    if (snapshot.reviewStatus !== 'reviewed') pendingReview.push(`Formato ${snapshot.id}`);
    for (const id of ids) {
      const card = cards.get(id);
      if (!card) continue;
      const pool = cardPool(card, snapshot, date);
      if (pool.release === 'violation') violations.push(finding('not-released', `${id} aún no está disponible el ${date}.`, [id]));
      if (pool.release === 'unknown') unknowns.push(finding('release-unknown', `No consta que ${id} esté disponible el ${date}.`, [id]));
      if (pool.block === 'violation') violations.push(finding('rotated', `${id} está fuera de los bloques permitidos.`, [id]));
      if (pool.block === 'unknown') unknowns.push(finding('block-unknown', `Falta verificar el bloque de ${id}.`, [id]));
    }
    for (const ban of bans.filter((item) => inForce(item, date))) {
      violations.push(finding('banned', `${ban.cardId} está prohibida desde el ${ban.effectiveFrom}.`, [ban.cardId]));
    }
    for (const item of restrictions.filter((entry) => inForce(entry, date))) {
      const copies = (quantities.get(item.cardId) ?? 0) + (item.cardId === deck.leaderId ? 1 : 0);
      if (copies > item.maxCopies) {
        violations.push(finding('restricted', `${item.cardId} está restringida a ${item.maxCopies}.`, [item.cardId]));
      }
    }
    for (const pair of pairs.filter((item) => inForce(item, date))) {
      violations.push(
        finding('banned-pair', `${pair.cards.join(' y ')} no pueden ir juntas desde el ${pair.effectiveFrom}.`, [...pair.cards]),
      );
    }
  }

  if (deck.reviewStatus !== 'reviewed') pendingReview.push(`Mazo ${deck.id}`);

  // Una suspensión no declara ilegal el mazo: impide que sea `valid` hasta resolverla.
  const suspendedBy = affecting.filter((item) => inForce(item, date)).map((item) => item.id);
  const held = pendingReview.length > 0 || suspendedBy.length > 0;
  const status = violations.length ? 'invalid' : unknowns.length ? 'unknown' : held ? 'pending-review' : 'valid';
  return {
    deckId: deck.id,
    snapshotId: snapshot.id,
    status,
    violations,
    unknowns,
    pendingReview,
    suspendedBy,
    checkedAt: date,
    nextKnownChange: changes.sort()[0] ?? null,
  };
}
