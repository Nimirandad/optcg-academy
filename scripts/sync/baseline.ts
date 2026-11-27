/**
 * Escribe `docs/sources/linea-base-sync.json` a partir de las copias locales. No usa la red.
 * Aceptar una línea base nueva es una decisión editorial: queda en `pending`.
 *
 * Uso: node scripts/sync/baseline.ts <fecha de las copias AAAA-MM-DD>
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { seriesIds } from './lib/cardlist.ts';
import { sha256 } from './lib/hash.ts';
import { BASELINE_PATH, localCopies } from './lib/repository.ts';
import { productListAdapter, seriesUrl } from './sources/cards.ts';
import { ARCHIVE_URL, restrictionAdapter } from './sources/format.ts';
import { errataAdapter, rulesAdapter } from './sources/rules.ts';
import type { SourceAdapter } from './lib/adapter.ts';

const createdAt = process.argv[2] ?? '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) throw new Error('Indica la fecha de las copias (AAAA-MM-DD).');

const root = new URL('../../', import.meta.url);
const copies = localCopies(root);
const body = (url: string) => {
  const file = copies.get(url);
  if (!file) throw new Error(`Sin copia de ${url}`);
  return new Uint8Array(readFileSync(file));
};
const extract = <T>(adapter: SourceAdapter<T>) => adapter.schema.parse(adapter.parse(body(adapter.url)));

const series = [...copies.keys()].filter((url) => url.startsWith(seriesUrl(''))).map((url) => new URL(url).searchParams.get('series')!);
const listed = seriesIds(body(seriesUrl(series[0]!))).sort();
if (listed.join() !== series.sort().join()) throw new Error('Las copias no cubren las series del selector');

const baseline = {
  note: 'Ultima extraccion aceptada para comparar. Solo identificadores, fechas, enlaces y huellas (ADR-006).',
  createdAt,
  reviewStatus: 'pending',
  rules: extract(rulesAdapter),
  errata: extract(errataAdapter),
  products: extract(productListAdapter),
  series: listed,
  restrictionNotices: extract(restrictionAdapter).notices,
  archiveHash: sha256(body(ARCHIVE_URL)),
};
writeFileSync(new URL(BASELINE_PATH, root), `${JSON.stringify(baseline, null, 1)}\n`);
console.log(`${baseline.errata.cards.length} erratas, ${baseline.products.products.length} productos, ${listed.length} series`);
