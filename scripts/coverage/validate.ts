/**
 * Valida la cobertura del reglamento. `--write` regenera la matriz;
 * sin él, una matriz desactualizada es un error.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { validateCoverage, validateQa } from '../../src/lib/coverage.ts';
import { inventorySchema } from '../../src/lib/schemas.ts';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const list = (dir: string, extension: string) =>
  readdirSync(new URL(dir, root), { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith(extension))
    .sort()
    .map((name) => dir + name);

const inventory = inventorySchema.parse(JSON.parse(read('docs/coverage/rules-inventory.json')));
const chapters = list('src/content/rules/', '.json').map((file) => ({ file, data: JSON.parse(read(file)) }));

const references = [
  ...list('src/content/keywords/', '.json').map((file) => ({ from: file, ruleId: String(JSON.parse(read(file)).ruleId) })),
  ...list('src/content/lessons/', '.md').flatMap((from) => {
    const block = /^ruleIds:(.*(?:\n[ \t]*-.*)*)/m.exec(read(from))?.[1] ?? '';
    const ids = block.match(/[\w.-]*\d[\w.-]*/g) ?? ['(sin ruleIds legibles)'];
    return ids.map((ruleId) => ({ from, ruleId }));
  }),
];

const { issues, covered } = validateCoverage({ inventory, chapters, references });

const qa = validateQa({
  ruleIds: new Set(inventory.rules.map((rule) => rule.ruleId)),
  index: JSON.parse(read('src/data/qa/documents.json')),
  notes: list('src/content/qa/', '.json').map((file) => ({ file, data: JSON.parse(read(file)) })),
});
issues.push(...qa.issues);

const matrix =
  [
    'ruleId,chapter,sourceVersion,sourcePage,explanationFile,reviewStatus,referencedBy',
    ...inventory.rules.map((rule) => {
      const text = covered.get(rule.ruleId);
      const from = references.filter((ref) => ref.ruleId === rule.ruleId).map((ref) => ref.from);
      return [
        rule.ruleId,
        rule.chapter,
        inventory.source.version,
        rule.sourcePage,
        text?.file ?? '',
        text?.reviewStatus ?? 'missing',
        from.join(' '),
      ].join(',');
    }),
  ].join('\n') + '\n';

const matrixPath = new URL('docs/coverage/rules-matrix.csv', root);
let stale = false;
if (process.argv.includes('--write')) writeFileSync(matrixPath, matrix);
else stale = !existsSync(matrixPath) || readFileSync(matrixPath, 'utf8') !== matrix;

for (const issue of issues.slice(0, 40)) console.error(`[${issue.code}] ${issue.message}`);
if (issues.length > 40) console.error(`… y ${issues.length - 40} problemas más`);
if (stale) console.error('[stale-matrix] ejecuta `npm run validate -- --write`');

const reviewed = [...covered.values()].filter((rule) => rule.reviewStatus === 'reviewed').length;
console.log(
  `Cobertura: ${inventory.rules.filter((rule) => covered.has(rule.ruleId)).length}/${inventory.rules.length} con explicación, ${reviewed} revisadas.`,
);
const { documents, questions, explained } = qa.stats;
console.log(
  `Q&A: ${documents} documentos, ${explained}/${questions} preguntas con explicación, ${qa.stats.reviewed} revisadas, ${qa.stats.conflicts} en conflicto.`,
);
process.exitCode = issues.length || stale ? 1 : 0;
