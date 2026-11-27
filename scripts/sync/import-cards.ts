/**
 * Genera los datos mínimos de cartas y productos de los Starter Decks candidatos a partir de
 * páginas oficiales ya descargadas en `references/cards/` (ignorada por Git). No usa la red.
 * Guarda solo número, nombre, categoría, color, coste y bloque (ADR-006); ningún texto de efecto.
 *
 * Uso: node scripts/sync/import-cards.ts <fecha de descarga AAAA-MM-DD>
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cardSchema, productSchema, type Card, type Product, type Source } from '../../src/lib/deck-schemas.ts';
import { blockSymbol, cardCost, cardRows, DECK_RULE_TEXT, productId, type CardRow } from './lib/cardlist.ts';
import { required, text } from './lib/html.ts';

const CANDIDATES = ['31', '32', '33', '34', '35', '36'];
const REGION = 'na-eu-oc-latam-me';
const SITE = 'https://en.onepiece-cardgame.com/';
const retrievedAt = process.argv[2] ?? '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt)) throw new Error('Indica la fecha de descarga (AAAA-MM-DD).');

const root = new URL('../../', import.meta.url);
const cache = new URL('references/cards/', root);

const source = (path: string, content: string): Source => ({
  url: SITE + path,
  retrievedAt,
  hash: createHash('sha256').update(content).digest('hex'),
  parserVersion: 'import-cards-1',
  reviewStatus: 'pending',
});

type Row = CardRow & { sourceRef: Source };

const rows = new Map<string, Row>();
for (const file of readdirSync(cache).filter((name) => /^\d+\.html$/.test(name)).sort()) {
  const html = readFileSync(new URL(file, cache), 'utf8');
  const sourceRef = source(`cardlist/?series=${file.replace('.html', '')}`, html);
  for (const row of cardRows(html)) rows.set(row.printing, { ...row, sourceRef });
}

const products: Product[] = CANDIDATES.map((n) => {
  const html = readFileSync(new URL(`products/st${n}.html`, cache), 'utf8');
  const name = text(required(/<title>(.*?)(?:｜|\||－|<\/title>)/s.exec(html)?.[1], `título de ST-${n}`));
  const date = required(/Release Date.*?([A-Z][a-z]+ \d{1,2}, \d{4})/s.exec(html)?.[1], `fecha de ST-${n}`);
  return productSchema.parse({
    id: `ST-${n}`,
    kind: 'starter',
    name,
    region: REGION,
    releaseDate: new Date(`${date} UTC`).toISOString().slice(0, 10),
    sourceRef: source(`products/st${n}.html`, html),
  });
});
const releases = new Map(products.map((product) => [product.id, product.releaseDate]));

const productOf = (row: Row) => productId(row.setLabel, new URL(row.sourceRef.url).searchParams.get('series')!);

function card(number: string): Card {
  const printings = [...rows.values()].filter((row) => row.number === number).sort((a, b) => a.printing.localeCompare(b.printing));
  const base = printings[0]!;
  for (const row of printings) {
    const same = row.name === base.name && row.category === base.category && row.color === base.color && row.cost === base.cost;
    if (!same) throw new Error(`Las impresiones de ${number} no coinciden: revisar a mano.`);
  }
  return cardSchema.parse({
    canonicalId: number,
    number,
    name: base.name,
    category: base.category,
    colors: base.color.toLowerCase().split('/'),
    power: null,
    cost: cardCost(base),
    life: null,
    counter: null,
    printings: printings.map((row) => ({
      id: row.printing,
      cardId: number,
      productId: productOf(row),
      blockSymbol: blockSymbol(row.block),
      region: REGION,
      releaseDate: releases.get(productOf(row)) ?? null,
      sourceRef: row.sourceRef,
    })),
    // Se buscó el número en todas las series de la lista oficial.
    printingsComplete: true,
    deckRules: printings.some((row) => DECK_RULE_TEXT.test(row.effect)) ? null : [],
    sourceRef: base.sourceRef,
    reviewStatus: 'pending',
  });
}

/** Un elemento por línea para que las diferencias se puedan revisar. */
const lines = (items: unknown[]) => `[\n${items.map((item) => `  ${JSON.stringify(item)}`).join(',\n')}\n]\n`;

mkdirSync(new URL('src/data/cards/', root), { recursive: true });
mkdirSync(new URL('src/data/products/', root), { recursive: true });
writeFileSync(new URL('src/data/products/starter-decks.json', root), lines(products));
for (const product of products) {
  const numbers = [...new Set([...rows.values()].filter((row) => productOf(row) === product.id).map((row) => row.number))].sort();
  const cards = numbers.map(card);
  writeFileSync(new URL(`src/data/cards/${product.id.toLowerCase()}.json`, root), lines(cards));
  console.log(`${product.id}: ${product.name} · ${product.releaseDate} · ${cards.length} cartas`);
}
