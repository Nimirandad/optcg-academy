/** Cartas y productos: solo los datos de ADR-006. Nunca reescribe el repositorio. */
import { z } from 'zod';
import type { Card, Product } from '../../../src/lib/deck-schemas.ts';
import type { SourceAdapter } from '../lib/adapter.ts';
import { blockSymbol, cardCost, cardRows, DECK_RULE_TEXT, productId, seriesIds } from '../lib/cardlist.ts';
import { difference, type Finding } from '../lib/finding.ts';
import { absolute, decode, isoDate, mainOf, required, SITE, text } from '../lib/html.ts';

export const PRODUCTS_URL = `${SITE}/products/`;
export const seriesUrl = (series: string) => `${SITE}/cardlist/?series=${series}`;

const printingSchema = z.strictObject({
  id: z.string(),
  number: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  colors: z.array(z.string()).min(1),
  cost: z.number().int().nullable(),
  block: z.union([z.number().int(), z.literal('X'), z.null()]),
  productId: z.string(),
  deckRule: z.boolean(),
});
const seriesSchema = z.strictObject({
  series: z.array(z.string()).min(1),
  printings: z.array(printingSchema).min(1),
});
export type Series = z.infer<typeof seriesSchema>;

export const seriesAdapter = (series: string): SourceAdapter<Series> => ({
  id: `cards-${series}`,
  url: seriesUrl(series),
  parserVersion: 'cards-1',
  contentTypes: ['text/html'],
  schema: seriesSchema,
  parse(body) {
    const html = decode(body);
    const rows = cardRows(html);
    // Un bloque que no encaje con el patrón no puede perderse en silencio.
    if (rows.length !== html.split('class="modalCol"').length - 1) throw new Error('Hay cartas sin extraer');
    return {
      series: seriesIds(body),
      printings: rows.map((row) => ({
        id: row.printing,
        number: row.number,
        name: row.name,
        category: row.category,
        colors: row.color.toLowerCase().split('/'),
        cost: cardCost(row),
        block: blockSymbol(row.block),
        productId: productId(row.setLabel, series),
        deckRule: DECK_RULE_TEXT.test(row.effect),
      })),
    };
  },
});

export const productListSchema = z.strictObject({
  products: z
    .array(z.strictObject({ url: z.url(), title: z.string().min(1), releaseDate: z.iso.date().nullable() }))
    .min(1),
});
export type ProductList = z.infer<typeof productListSchema>;

/** Solo la primera página del listado. */
export const productListAdapter: SourceAdapter<ProductList> = {
  id: 'cards-products',
  url: PRODUCTS_URL,
  parserVersion: 'products-1',
  contentTypes: ['text/html'],
  schema: productListSchema,
  parse(body) {
    const main = mainOf(body);
    const parts = main.split('<li class="linkListColBox"').slice(1);
    return {
      products: parts.map((part) => {
        const date = /<time class="newsDate" datetime="([^"]*)"/.exec(part)?.[1];
        return {
          url: absolute(required(/<a href="([^"]+)"/.exec(part)?.[1], 'el enlace de un producto'), PRODUCTS_URL),
          title: text(required(/<h4 class="linkListColTitle">(.*?)<\/h4>/s.exec(part)?.[1], 'el título de un producto')),
          releaseDate: date ? date : null,
        };
      }),
    };
  },
};

export const productAdapter = (url: string): SourceAdapter<{ releaseDate: string }> => ({
  id: `product ${new URL(url).pathname}`,
  url,
  parserVersion: 'product-1',
  contentTypes: ['text/html'],
  schema: z.strictObject({ releaseDate: z.iso.date() }),
  parse(body) {
    const found = /Release Date.*?([A-Z][a-z]+ \d{1,2}, \d{4})/s.exec(decode(body))?.[1];
    return { releaseDate: isoDate(required(found, 'la fecha de lanzamiento')) };
  },
});

const finding = (code: string, message: string, url: string, severity: Finding['severity'] = 'legality'): Finding => ({
  area: 'cards',
  severity,
  code,
  message,
  url,
});

/** `complete`: se leyeron todas las series; sin ello no se puede afirmar que algo falte. */
export function compareCards(printings: Series['printings'], cards: Card[], complete: boolean): Finding[] {
  return cards.flatMap((card) => {
    const published = printings.filter((printing) => printing.number === card.number);
    const url = card.sourceRef.url;
    const report = (code: string, message: string) => finding(code, `${card.number}: ${message}`, url);
    if (!published.length) return complete ? [report('removed', 'ya no figura en la lista')] : [];
    const { added, removed } = difference(
      published.map((item) => item.id),
      card.printings.map((item) => item.id),
    );
    const found = [
      ...added.map((id) => report('printing', `impresión nueva ${id}`)),
      ...(complete ? removed.map((id) => report('printing', `impresión retirada ${id}`)) : []),
    ];
    for (const item of published) {
      const changed = [
        item.name !== card.name && 'nombre',
        item.category !== card.category && 'categoría',
        item.colors.join() !== card.colors.join() && 'color',
        item.cost !== card.cost && 'coste',
        item.deckRule && card.deckRules?.length === 0 && 'regla de construcción',
      ];
      const printing = card.printings.find((candidate) => candidate.id === item.id);
      if (printing) {
        changed.push(item.block !== printing.blockSymbol && 'bloque', item.productId !== printing.productId && 'producto');
      }
      const names = changed.filter((value) => value !== false);
      if (names.length) found.push(report('changed', `${item.id} difiere en ${names.join(', ')}`));
    }
    return found;
  });
}

export function compareProductList(data: ProductList, products: Product[], base: ProductList): Finding[] {
  return data.products.flatMap((item) => {
    const code = /\[([A-Z]+-\d+)\]/.exec(item.title)?.[1];
    const recorded = products.find((product) => product.id === code);
    if (recorded && item.releaseDate !== recorded.releaseDate) {
      return [finding('date', `${recorded.id}: fecha publicada ${item.releaseDate ?? 'ausente'}`, item.url)];
    }
    const before = base.products.find((candidate) => candidate.url === item.url);
    if (!before) return [finding('added', `Producto nuevo: ${item.title}`, item.url, 'content')];
    return before.releaseDate === item.releaseDate
      ? []
      : [finding('date', `${item.title}: fecha publicada ${item.releaseDate ?? 'ausente'}`, item.url)];
  });
}
