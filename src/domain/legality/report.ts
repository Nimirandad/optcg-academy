/** Informe de legalidad y bloqueos de todos los mazos, hoy y en las fechas con cambios conocidos. */
import type { Card, DeckList, FormatSnapshot, Suspension, Validation } from './types';
import { inForce, validateDeck } from './validate.ts';

export interface ReportData {
  decks: readonly DeckList[];
  cards: ReadonlyMap<string, Card>;
  /** Snapshots de un mismo formato y región. */
  snapshots: readonly FormatSnapshot[];
  suspensions: readonly Suspension[];
}

export interface DeckReport {
  deckId: string;
  date: string;
  /** `null`: ningún snapshot rige esa fecha. */
  validation: Validation | null;
}

export interface LegalityReport {
  today: string;
  current: DeckReport[];
  /** Estado en cada fecha futura con un cambio conocido, sin invalidar antes. */
  upcoming: DeckReport[];
  blocks: string[];
}

/**
 * Fecha de hoy en la zona horaria más adelantada (UTC+14): sin zona oficial, un cambio rige
 * desde el comienzo de su fecha en la zona más temprana (ADR-008).
 */
export const earliestDate = (now: Date) => new Date(now.getTime() + 14 * 3_600_000).toISOString().slice(0, 10);

function snapshotFor(snapshots: readonly FormatSnapshot[], date: string): FormatSnapshot | null {
  const found = snapshots.filter((snapshot) => inForce(snapshot, date));
  if (found.length > 1) throw new Error(`Varios snapshots rigen el ${date}: ${found.map((item) => item.id).join(', ')}`);
  return found[0] ?? null;
}

export function legalityReport({ decks, cards, snapshots, suspensions }: ReportData, today: string): LegalityReport {
  const blocks = new Set<string>();
  const evaluate = (deck: DeckList, date: string): DeckReport => {
    const snapshot = snapshotFor(snapshots, date);
    if (!snapshot || snapshot.reviewStatus !== 'reviewed') {
      blocks.add(`${date}: sin snapshot aprobado que rija esa fecha.`);
    }
    return {
      deckId: deck.id,
      date,
      validation: snapshot && validateDeck(deck, { cards, snapshot, suspensions }, date),
    };
  };

  const current = decks.map((deck) => evaluate(deck, today));
  const upcoming = decks.flatMap((deck) => {
    const rows: DeckReport[] = [];
    const pending = new Set(snapshots.map((snapshot) => snapshot.effectiveFrom).filter((date) => date > today));
    const first = current.find((row) => row.deckId === deck.id)?.validation?.nextKnownChange;
    if (first) pending.add(first);
    // Cada evaluación puede revelar el cambio siguiente.
    while (pending.size) {
      const date = [...pending].sort()[0]!;
      pending.delete(date);
      const row = evaluate(deck, date);
      rows.push(row);
      const next = row.validation?.nextKnownChange;
      if (next && next > date) pending.add(next);
    }
    return rows;
  });

  return { today, current, upcoming, blocks: [...blocks].sort() };
}

/** Requiere atención: hoy no hay formato aplicable o algún mazo es ilegal. */
export const needsAttention = (report: LegalityReport) =>
  report.current.some((row) => row.validation === null || row.validation.status === 'invalid');
