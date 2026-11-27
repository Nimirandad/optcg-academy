/** Lectura validada de los datos del repositorio y de las copias locales. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { cardSchema, formatSnapshotSchema, productSchema } from '../../../src/lib/deck-schemas.ts';
import { cardId, qaIndexSchema } from '../../../src/lib/schemas.ts';
import { productListSchema, seriesUrl } from '../sources/cards.ts';
import { errataSchema, rulesPageSchema } from '../sources/rules.ts';
import type { Baseline, Repository } from './sync.ts';

export const BASELINE_PATH = 'docs/sources/linea-base-sync.json';

const baselineSchema: z.ZodType<Baseline & { note: string; createdAt: string; reviewStatus: string }> = z.strictObject({
  note: z.string(),
  createdAt: z.iso.date(),
  reviewStatus: z.enum(['pending', 'reviewed']),
  rules: rulesPageSchema,
  errata: errataSchema,
  products: productListSchema,
  series: z.array(z.string().regex(/^\d+$/)).min(1),
  restrictionNotices: z.array(z.url()).min(1),
  archiveHash: z.string().regex(/^[0-9a-f]{64}$/),
});

interface Download {
  url: string;
  file: string;
  kind: string;
  sha256: string;
}

const read = (root: URL, path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const files = (root: URL, folder: string) =>
  readdirSync(new URL(folder, root))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => read(root, folder + name));

const downloads = (root: URL): Download[] => read(root, 'docs/sources/descargas-2026-11-26.json').documents;

export function loadRepository(root: URL): Repository {
  const registry = z
    .object({
      banned: z.array(z.object({ cardId })),
      pairs: z.array(z.object({ cards: z.array(cardId) })),
    })
    .parse(read(root, 'src/data/restrictions/standard.json'));
  const rulebook = downloads(root).find((item) => item.kind === 'comprehensive-rules');
  if (!rulebook) throw new Error('Falta el reglamento en el registro de descargas');
  return {
    snapshots: files(root, 'src/data/rotation/').map((item) => formatSnapshotSchema.parse(item)),
    registry,
    documents: qaIndexSchema.parse(read(root, 'src/data/qa/documents.json')).documents,
    rulebook,
    errataNotices: z
      .object({ notices: z.array(z.object({ url: z.url() })) })
      .parse(read(root, 'src/data/qa/errata.json'))
      .notices.map((notice) => notice.url),
    cards: files(root, 'src/data/cards/').flatMap((list) => z.array(cardSchema).parse(list)),
    products: files(root, 'src/data/products/').flatMap((list) => z.array(productSchema).parse(list)),
    baseline: existsSync(new URL(BASELINE_PATH, root)) ? baselineSchema.parse(read(root, BASELINE_PATH)) : null,
  };
}

/** URL → copia en el equipo, según los registros de descarga. */
export function localCopies(root: URL): Map<string, URL> {
  const copies = new Map<string, URL>();
  const consultation = read(root, 'docs/sources/consulta-2026-11-27.json').documents as Download[];
  for (const item of consultation) copies.set(item.url, new URL(`references/cache/consulta-2026-11-27/${item.file}`, root));
  for (const item of downloads(root)) {
    const folder = item.kind === 'qa' ? 'references/qa/' : 'references/';
    copies.set(item.url, new URL(folder + item.file, root));
  }
  const cards = new URL('references/cards/', root);
  if (existsSync(cards)) {
    for (const name of readdirSync(cards)) {
      if (/^\d+\.html$/.test(name)) copies.set(seriesUrl(name.replace('.html', '')), new URL(name, cards));
    }
  }
  for (const list of files(root, 'src/data/products/')) {
    for (const product of z.array(productSchema).parse(list)) {
      const name = product.id.toLowerCase().replace('-', '');
      copies.set(product.sourceRef.url, new URL(`references/cards/products/${name}.html`, root));
    }
  }
  return copies;
}
