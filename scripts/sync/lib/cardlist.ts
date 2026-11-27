/** Lectura de la lista oficial de cartas. El texto de efecto solo se usa para detectar reglas. */
import { decode, required, text } from './html.ts';

/** Frases propias de los efectos que cambian la construcción del mazo (regla 5-1-2-4-1). */
export const DECK_RULE_TEXT = /under the rules of this game|your deck (can|cannot|may)|cannot include|any number of this card/i;

export interface CardRow {
  printing: string;
  number: string;
  category: string;
  name: string;
  costLabel: string | undefined;
  cost: string | undefined;
  color: string;
  block: string;
  setLabel: string;
  effect: string;
}

export function cardRows(html: string): CardRow[] {
  return [...html.matchAll(/<dl class="modalCol" id="([^"]+)">(.*?)<\/dl>/gs)].map(([, printing = '', block = '']) => {
    const field = (name: string) => {
      const found = new RegExp(`<div class="${name}"><h3>(?:(?!</h3>).)*</h3>(.*?)</div>`, 's').exec(block)?.[1];
      return found === undefined ? undefined : text(found);
    };
    const [number, , category] = [...block.matchAll(/<span>(.*?)<\/span>/gs)].map((match) => text(match[1]!));
    return {
      printing,
      number: required(number, `número de ${printing}`),
      category: required(category, `categoría de ${printing}`).toLowerCase(),
      name: text(required(/<div class="cardName">(.*?)<\/div>/s.exec(block)?.[1], `nombre de ${printing}`)),
      costLabel: /<div class="cost"><h3>(.*?)<\/h3>/s.exec(block)?.[1],
      cost: field('cost'),
      color: required(field('color'), `color de ${printing}`),
      block: required(field('block'), `bloque de ${printing}`),
      setLabel: text(/<div class="getInfo"><h3>.*?<\/h3>(.*?)<div/s.exec(block)?.[1] ?? ''),
      effect: `${field('text') ?? ''} ${field('trigger') ?? ''}`,
    };
  });
}

export const seriesIds = (body: Uint8Array) => {
  const select = required(/<select name="series".*?<\/select>/s.exec(decode(body))?.[0], 'el selector de series');
  return [...select.matchAll(/<option value="(\d+)"/g)].map((match) => match[1]!);
};

/** `[OP05]`, `[ST-10]` → `OP-05`, `ST-10`; sin código, el identificador de la serie. */
export function productId(setLabel: string, series: string): string {
  const code = /\[([A-Z]+)-?(\d+)[^\]]*\]\s*$/.exec(setLabel);
  return code ? `${code[1]}-${code[2]}` : `series-${series}`;
}

export const blockSymbol = (value: string) => (value === 'X' ? 'X' : /^\d+$/.test(value) ? Number(value) : null);
export const cardCost = (row: Pick<CardRow, 'cost' | 'costLabel'>) =>
  row.costLabel === 'Cost' && /^\d+$/.test(row.cost ?? '') ? Number(row.cost) : null;
