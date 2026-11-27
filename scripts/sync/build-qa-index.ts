/**
 * Genera `src/data/qa/documents.json` (solo metadatos) a partir de las tablas extraídas.
 * Uso: node scripts/sync/build-qa-index.ts [carpeta-con-pdf-y-extracted.json]
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { applyManual, documentSlug, indexDocument, setCodes, type Row } from '../../src/lib/qa-index.ts';
import { qaIndexSchema } from '../../src/lib/schemas.ts';

const root = new URL('../../', import.meta.url);
const json = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const folder = (process.argv[2] ?? 'references/qa').replace(/\/?$/, '/');
const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

const manifest = json('docs/sources/descargas-2026-11-26.json').documents as {
  url: string; file: string; kind: string; urlDate: string; retrievedAt: string; sha256: string; pages: number;
}[];
const tables = json(`${folder}extracted.json`) as Record<string, Row[][]>;
const manualPath = `${folder}manual.json`;
const manual = (existsSync(new URL(manualPath, root)) ? json(manualPath) : {}) as Record<string, Record<string, Row[]>>;
for (const file of Object.keys(manual)) if (!tables[file]) throw new Error(`Carga manual: ${file} no existe`);
const keywords = readdirSync(new URL('src/content/keywords/', root)).map((file) => ({
  slug: file.replace('.json', ''),
  term: String(json(`src/content/keywords/${file}`).term),
}));

const documents = manifest
  .filter((entry) => entry.kind === 'qa')
  .map((entry) => {
    const hash = sha256(readFileSync(new URL(folder + entry.file, root)));
    if (hash !== entry.sha256) throw new Error(`${entry.file}: el PDF no coincide con el registro de descarga`);
    const pages = tables[entry.file];
    if (pages?.length !== entry.pages) throw new Error(`${entry.file}: faltan páginas en la extracción`);
    const slug = documentSlug(entry.file);
    return {
      slug,
      setCodes: setCodes(slug),
      sourceUrl: entry.url,
      language: 'en',
      publishedAt: entry.urlDate,
      retrievedAt: entry.retrievedAt.slice(0, 10),
      sha256: hash,
      pages: entry.pages,
      status: 'pending',
      ...indexDocument(applyManual(pages, manual[entry.file]), keywords, slug, (text) => sha256(text).slice(0, 16)),
    };
  });

const index = qaIndexSchema.parse({ documents });
const lines = index.documents.map(({ questions, ...rest }) =>
  `{${JSON.stringify(rest).slice(1, -1)},"questions":[\n${questions.map((q) => JSON.stringify(q)).join(',\n')}\n]}`,
);
writeFileSync(new URL('src/data/qa/documents.json', root), `{"documents":[\n${lines.join(',\n')}\n]}\n`);
console.log(`${documents.length} documentos, ${documents.reduce((sum, d) => sum + d.questions.length, 0)} preguntas`);
