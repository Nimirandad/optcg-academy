/** Crea la hoja de revisión humana de contenido (T2.10). No sobrescribe sin `--force`. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const json = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const list = (dir: string) => readdirSync(new URL(dir, root)).filter((name) => name.endsWith('.json')).sort().map((name) => dir + name);
const output = new URL('docs/coverage/revision-contenido-T2.10.csv', root);
if (existsSync(output) && !process.argv.includes('--force')) {
  console.error('La hoja ya existe y puede tener anotaciones. Usa --force para reemplazarla.');
  process.exit(1);
}

const pages = new Map<string, number>(
  json('docs/coverage/rules-inventory.json').rules.map((rule: { ruleId: string; sourcePage: number }) => [rule.ruleId, rule.sourcePage]),
);
type Text = { id: string; explanation: string; example?: string; tip?: string; reviewStatus: string };
type Note = { id: string; question: string; answer: string; note?: string; reviewStatus: string };
const rows: (string | number)[][] = [['Tipo', 'ID', 'Dónde comprobar', 'Texto a revisar', 'Estado', 'Resultado', 'Revisor', 'Fecha', 'Comentario']];

for (const file of list('src/content/rules/')) {
  for (const rule of json(file).rules as Text[]) {
    const text = [rule.explanation, rule.example && `Ejemplo: ${rule.example}`, rule.tip && `Consejo: ${rule.tip}`].filter(Boolean).join(' ');
    rows.push(['Regla', rule.id, `Reglamento, p. ${pages.get(rule.id)}`, text, rule.reviewStatus]);
  }
}
for (const file of list('src/content/keywords/')) {
  const keyword = json(file);
  rows.push(['Glosario', keyword.term, `Regla ${keyword.ruleId}`, `${keyword.aliases.join(', ')}: ${keyword.definition}`, keyword.reviewStatus]);
}
const documents = json('src/data/qa/documents.json').documents as { slug: string; sourceUrl: string; questions: { id: string; page: number }[] }[];
for (const file of list('src/content/qa/')) {
  const notes = json(file) as { document: string; entries: Note[] };
  const document = documents.find((item) => item.slug === notes.document)!;
  for (const entry of notes.entries) {
    const page = document.questions.find((question) => question.id === entry.id)!.page;
    const text = [entry.question, entry.answer, entry.note && `Duda: ${entry.note}`].filter(Boolean).join(' ');
    rows.push(['Q&A', entry.id, `${document.sourceUrl}#page=${page}`, text, entry.reviewStatus]);
  }
}

const cell = (value: string | number = '') => `"${String(value).replace(/"/g, '""')}"`;
const csv = rows.map((row) => Array.from({ length: 9 }, (_, i) => cell(row[i])).join(',')).join('\r\n');
// BOM: Excel necesita la marca para leer UTF-8.
writeFileSync(output, `\uFEFF${csv}\r\n`);
console.log(`${rows.length - 1} filas`);
