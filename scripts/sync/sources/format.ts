/** Prohibidas, bloques y periodos de rotación. Solo identificadores y fechas (ADR-006). */
import { z } from 'zod';
import type { FormatSnapshot } from '../../../src/lib/deck-schemas.ts';
import { cardId } from '../../../src/lib/schemas.ts';
import type { SourceAdapter } from '../lib/adapter.ts';
import { difference, type Finding } from '../lib/finding.ts';
import { hrefs, isoDate, mainOf, namedCards, required, SITE, text } from '../lib/html.ts';

export const RESTRICTION_URL = `${SITE}/news/restriction.html`;
export const BLOCKS_URL = `${SITE}/news/blockicon-card.html`;
export const ROTATION_URL = `${SITE}/topics/013.php`;
export const ARCHIVE_URL = `${SITE}/news/restriction-archive.html`;

const html = { contentTypes: ['text/html'], parserVersion: 'format-1' };
const cards = z.array(cardId).min(1);
const pair = z.tuple([cardId, cardId]);

const items = (fragment: string) => [...fragment.matchAll(/<li[\s>].*?<\/li>|<li>.*?<\/li>/gs)].map((match) => match[0]);

/** Cada elemento nombra exactamente una carta y no hay cartas fuera de los elementos. */
function listed(fragment: string, what: string): string[] {
  const found = items(fragment).map((item) => {
    const numbers = namedCards(item);
    if (numbers.length !== 1) throw new Error(`${what}: un elemento no nombra exactamente una carta`);
    return numbers[0]!;
  });
  if (namedCards(fragment).length !== found.length) throw new Error(`${what}: hay cartas fuera de la lista`);
  return found;
}

export interface Restrictions {
  banned: string[];
  pairs: [string, string][];
  /** Todas las cartas nombradas en la página, incluidos los avisos. */
  mentioned: string[];
  notices: string[];
}

export const restrictionAdapter: SourceAdapter<Restrictions> = {
  ...html,
  id: 'format-restriction',
  url: RESTRICTION_URL,
  schema: z.strictObject({ banned: cards, pairs: z.array(pair).min(1), mentioned: cards, notices: z.array(z.url()).min(1) }),
  parse(body) {
    const main = mainOf(body);
    const parts = main.split('>Cards with Active Restrictions<');
    if (parts.length !== 2) throw new Error('No se identifica la lista vigente');
    const end = parts[1]!.indexOf('component-opcg-buttons');
    if (end < 0) throw new Error('No se identifica el final de la lista vigente');
    const sections = parts[1]!.slice(0, end).split(/<h4>(.*?)<\/h4>/s);
    const titles = sections.filter((_, index) => index % 2 === 1).map((title) => text(title));
    if (titles.join('|') !== 'Banned Cards|Restricted Cards|Banned Pair Cards') {
      throw new Error(`Apartados inesperados: ${titles.join(', ')}`);
    }
    const [, , banned = '', , restricted = '', , paired = ''] = sections;
    // No se conoce el formato de una restricción: cualquier otro texto exige revisarla a mano.
    if (!text(restricted).includes('There are currently no cards in this category') || namedCards(restricted).length) {
      throw new Error('Hay cartas restringidas: revisar a mano');
    }
    const pairs = [...paired.matchAll(/<ul>(.*?)<\/ul>/gs)].map((match) => {
      const found = listed(match[1]!, 'Parejas');
      if (found.length !== 2) throw new Error('Una pareja no tiene dos cartas: revisar a mano');
      return found as [string, string];
    });
    if (listed(paired, 'Parejas').length !== pairs.length * 2) throw new Error('Parejas fuera de las listas');
    return {
      banned: listed(banned, 'Prohibidas'),
      pairs,
      mentioned: [...new Set(namedCards(main))],
      notices: [...main.matchAll(/<a class="commonBtn" href="([^"]+)"/g)].flatMap((match) => hrefs(`<a href="${match[1]}">`)),
    };
  },
};

export interface Blocks {
  x: string[];
  four: string[];
  fourFrom: string;
  fourUntil: string;
  updated: string[];
}

export const blocksAdapter: SourceAdapter<Blocks> = {
  ...html,
  id: 'format-blocks',
  url: BLOCKS_URL,
  schema: z.strictObject({ x: cards, four: cards, fourFrom: z.iso.date(), fourUntil: z.iso.date(), updated: cards }),
  parse(body) {
    const main = mainOf(body).split('class="pageFooterCol"')[0]!;
    const sections = main.split(/<h3[^>]*>(.*?)<\/h3>/s);
    const found = new Map<string, string>();
    for (let index = 1; index < sections.length; index += 2) {
      const title = text(sections[index]!);
      const content = sections[index + 1]!;
      if (!namedCards(content).length) continue;
      const key = title.startsWith('Cards Generally Permitted')
        ? 'x'
        : title === 'Cards Eligible for Use Under Block Number ④'
          ? 'four'
          : title.startsWith('Updated Block Number')
            ? 'updated'
            : null;
      if (!key || found.has(key)) throw new Error(`Apartado de bloques inesperado: ${title}`);
      found.set(key, content);
    }
    const section = (key: string) => required(found.get(key), `el apartado «${key}»`);
    const period = required(
      /from ([A-Z][a-z]+ \d{1,2}, \d{4}), to ([A-Z][a-z]+ \d{1,2}, \d{4})/.exec(text(section('four'))),
      'el periodo del bloque 4',
    );
    return {
      x: listed(section('x'), 'Bloque X'),
      four: listed(section('four'), 'Bloque 4'),
      fourFrom: isoDate(period[1]!),
      fourUntil: isoDate(period[2]!),
      updated: listed(section('updated'), 'Reimpresas'),
    };
  },
};

export interface Rotation {
  periods: { from: string; until: string; blocks: number[] }[];
}

const circled = '①②③④⑤⑥⑦⑧⑨';

export const rotationAdapter: SourceAdapter<Rotation> = {
  ...html,
  id: 'format-rotation',
  url: ROTATION_URL,
  schema: z.strictObject({
    periods: z
      .array(z.strictObject({ from: z.iso.date(), until: z.iso.date(), blocks: z.array(z.number().int()).min(1) }))
      .min(1),
  }),
  parse(body) {
    const content = text(mainOf(body));
    const start = content.lastIndexOf('STANDARD REGULATION');
    const end = content.indexOf('EXTRA REGULATION', start);
    if (start < 0 || end < 0) throw new Error('No se identifica el apartado Standard');
    const pattern = /from April (\d{4}) to March (\d{4}), cards ([①-⑨]) to ([①-⑨]) will be allowed/gi;
    return {
      periods: [...content.slice(start, end).matchAll(pattern)].map(([, from, until, first = '', last = '']) => {
        const low = circled.indexOf(first) + 1;
        const high = circled.indexOf(last) + 1;
        return {
          from: `${from}-04-01`,
          until: `${until}-03-31`,
          blocks: Array.from({ length: high - low + 1 }, (_, index) => low + index),
        };
      }),
    };
  },
};

export interface Registry {
  banned: { cardId: string }[];
  pairs: { cards: string[] }[];
}

const finding = (url: string, code: string, message: string): Finding => ({
  area: 'format',
  severity: 'legality',
  code,
  message,
  url,
});

const pairKey = (cards: readonly string[]) => [...cards].sort().join(' + ');

function listChanges(url: string, label: string, published: string[], recorded: string[], where: string): Finding[] {
  const { added, removed } = difference(published, recorded);
  return [
    ...added.map((item) => finding(url, 'added', `${label} ${item}: publicada y ausente en ${where}`)),
    ...removed.map((item) => finding(url, 'removed', `${label} ${item}: registrada en ${where} y ya no publicada`)),
  ];
}

/** Compara pertenencia a las listas; la página vigente no indica la fecha de cada entrada. */
export function compareRestrictions(
  data: Restrictions,
  snapshots: FormatSnapshot[],
  registry: Registry,
  knownNotices: string[] = [],
): Finding[] {
  const lists = [
    ...snapshots.map((s) => ({
      where: s.id,
      banned: s.bans.filter((item) => item.effectiveUntil === null).map((item) => item.cardId),
      pairs: s.bannedPairs.filter((item) => item.effectiveUntil === null).map((item) => pairKey(item.cards)),
    })),
    {
      where: 'el registro de restricciones',
      banned: registry.banned.map((item) => item.cardId),
      pairs: registry.pairs.map((item) => pairKey(item.cards)),
    },
  ];
  const known = new Set(lists.flatMap((list) => [...list.banned, ...list.pairs.flatMap((key) => key.split(' + '))]));
  const sources = new Set([...snapshots.flatMap((snapshot) => snapshot.sources.map((source) => source.url)), ...knownNotices]);
  return [
    ...lists.flatMap((list) => [
      ...listChanges(RESTRICTION_URL, 'Prohibida', data.banned, list.banned, list.where),
      ...listChanges(RESTRICTION_URL, 'Pareja', data.pairs.map(pairKey), list.pairs, list.where),
    ]),
    ...data.mentioned
      .filter((card) => !known.has(card))
      .map((card) => finding(RESTRICTION_URL, 'mentioned', `${card}: nombrada en la página y sin restricción registrada`)),
    ...data.notices
      .filter((url) => !sources.has(url) && url !== ARCHIVE_URL)
      .map((url) => finding(url, 'notice', `Aviso no registrado como fuente: ${url}`)),
  ];
}

export function compareBlocks(data: Blocks, snapshots: FormatSnapshot[]): Finding[] {
  return snapshots.flatMap((snapshot) => {
    const treated = (as: 'X' | 4) => snapshot.blockExceptions.filter((item) => item.treatedAs === as);
    const wrongPeriod = treated(4).filter(
      (item) => item.effectiveFrom !== data.fourFrom || item.effectiveUntil !== data.fourUntil,
    );
    return [
      ...listChanges(BLOCKS_URL, 'Bloque X', data.x, treated('X').map((item) => item.cardId), snapshot.id),
      ...listChanges(BLOCKS_URL, 'Bloque 4', data.four, treated(4).map((item) => item.cardId), snapshot.id),
      ...(wrongPeriod.length
        ? [finding(BLOCKS_URL, 'period', `${snapshot.id}: la vigencia del bloque 4 es ${data.fourFrom} a ${data.fourUntil}`)]
        : []),
    ];
  });
}

export function compareRotation(data: Rotation, snapshots: FormatSnapshot[]): Finding[] {
  const standard = snapshots.filter((snapshot) => snapshot.format === 'standard');
  const missing = data.periods
    .filter((period) => !standard.some((snapshot) => snapshot.effectiveFrom === period.from))
    .map((period) => finding(ROTATION_URL, 'period', `Periodo desde ${period.from} sin snapshot`));
  return [
    ...missing,
    ...standard.flatMap((snapshot) => {
      const period = data.periods.find((item) => item.from === snapshot.effectiveFrom);
      const same =
        period && period.until === snapshot.effectiveUntil && period.blocks.join() === snapshot.blockWindow.join();
      return same ? [] : [finding(ROTATION_URL, 'period', `${snapshot.id}: el periodo publicado no coincide o no figura`)];
    }),
  ];
}
