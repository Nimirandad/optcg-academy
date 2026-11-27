/**
 * Informe de legalidad de los mazos en Markdown. No modifica datos ni usa la red.
 *
 * Uso: node scripts/validate/decks.ts [--fecha AAAA-MM-DD]
 * Código de salida: 0 sin mazos ilegales hoy, 2 si requiere atención, 1 si los datos fallan.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { earliestDate, legalityReport, needsAttention, type DeckReport } from '../../src/domain/legality/report.ts';
import { cardSchema, deckSchema, formatSnapshotSchema, safetySnapshotSchema } from '../../src/lib/deck-schemas.ts';

const { values } = parseArgs({ options: { fecha: { type: 'string' } } });
const today = z.iso.date().parse(values.fecha ?? earliestDate(new Date()));

const root = new URL('../../', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const files = (folder: string) =>
  readdirSync(new URL(folder, root))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => read(folder + name));
const lists = <T extends z.ZodType>(folder: string, schema: T) => files(folder).flatMap((list) => z.array(schema).parse(list));

const safety = safetySnapshotSchema.parse(read('src/data/safety/standard.json'));
const report = legalityReport(
  {
    decks: lists('src/data/decks/', deckSchema),
    cards: new Map(lists('src/data/cards/', cardSchema).map((card) => [card.canonicalId, card])),
    snapshots: files('src/data/rotation/')
      .map((item) => formatSnapshotSchema.parse(item))
      .filter((snapshot) => snapshot.format === 'standard'),
    suspensions: safety.suspensions,
  },
  today,
);

function table(rows: DeckReport[]): string {
  const lines = rows.map(({ deckId, date, validation }) => {
    if (!validation) return `| ${deckId} | ${date} | — | sin formato | |`;
    const detail = [
      ...validation.violations.map((item) => item.message),
      ...validation.unknowns.map((item) => item.message),
      ...validation.suspendedBy.map((id) => `Suspendido: ${id}.`),
      ...(validation.pendingReview.length ? [`${validation.pendingReview.length} elementos sin revisión.`] : []),
    ];
    return `| ${deckId} | ${date} | ${validation.snapshotId} | ${validation.status} | ${detail.join(' ')} |`;
  });
  return ['| Mazo | Fecha | Snapshot | Estado | Detalle |', '|---|---|---|---|---|', ...lines].join('\n');
}

const recommendable = report.current.filter((row) => row.validation?.status === 'valid').length;
console.log(
  [
    `# Legalidad de mazos al ${today}`,
    `${report.current.length} mazos; ${recommendable} con estado \`valid\`. Suspensiones registradas: ${safety.suspensions.length}.`,
    '## Hoy',
    table(report.current),
    '## Fechas con cambios conocidos',
    report.upcoming.length ? table(report.upcoming) : 'Ninguna.',
    '## Bloqueos',
    report.blocks.length ? report.blocks.map((block) => `- ${block}`).join('\n') : 'Ninguno.',
  ].join('\n\n'),
);
process.exitCode = needsAttention(report) ? 2 : 0;
