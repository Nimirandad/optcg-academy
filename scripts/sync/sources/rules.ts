/** Versión publicada del reglamento y erratas. Del texto oficial solo se guarda la huella. */
import { z } from 'zod';
import { cardId } from '../../../src/lib/schemas.ts';
import type { SourceAdapter } from '../lib/adapter.ts';
import { difference, type Finding } from '../lib/finding.ts';
import { absolute, isoDate, mainOf, namedCards, required, SITE, text } from '../lib/html.ts';
import { sha256 } from '../lib/hash.ts';

export const RULES_URL = `${SITE}/rules/`;
export const ERRATA_URL = `${SITE}/rules/errata_card/`;

export const rulesPageSchema = z.strictObject({ rulebook: z.url(), notices: z.array(z.url()).min(1) });
export const errataSchema = z.strictObject({
  updatedAt: z.iso.date(),
  cards: z.array(cardId).min(1),
  textHash: z.string().regex(/^[0-9a-f]{64}$/),
});
export type RulesPage = z.infer<typeof rulesPageSchema>;
export type Errata = z.infer<typeof errataSchema>;

const html = { contentTypes: ['text/html'], parserVersion: 'rules-1' };

export const rulesAdapter: SourceAdapter<RulesPage> = {
  ...html,
  id: 'rules-page',
  url: RULES_URL,
  schema: rulesPageSchema,
  parse(body) {
    const main = mainOf(body);
    const books = new Set(
      [...main.matchAll(/href="([^"]*\/rule_comprehensive\.pdf[^"]*)"/g)].map((match) => absolute(match[1]!, RULES_URL)),
    );
    if (books.size !== 1) throw new Error('No hay un único enlace al reglamento');
    const slides = [...main.matchAll(/<li class="swiper-slide">\s*<a href="([^"]+)"/g)];
    // Las hojas resumen en PDF comparten carrusel y no son avisos.
    const notices = slides.map((match) => absolute(match[1]!, RULES_URL)).filter((url) => !new URL(url).pathname.endsWith('.pdf'));
    return { rulebook: [...books][0], notices: [...new Set(notices)].sort() };
  },
};

export const errataAdapter: SourceAdapter<Errata> = {
  ...html,
  id: 'rules-errata',
  url: ERRATA_URL,
  schema: errataSchema,
  parse(body) {
    const main = mainOf(body);
    const headings = [...main.matchAll(/<h5 class="smallTitRed">(.*?)<\/h5>/gs)].map((match) => {
      const numbers = namedCards(match[1]!);
      if (!numbers.length) throw new Error('Una errata no nombra ninguna carta');
      return numbers;
    });
    return {
      updatedAt: isoDate(text(required(/<span class="pageTitDate">(.*?)<\/span>/s.exec(main)?.[1], 'la fecha de erratas'))),
      cards: [...new Set(headings.flat())].sort(),
      textHash: sha256(text(main).replace(/\s+/g, ' ')),
    };
  },
};

const finding = (severity: Finding['severity'], code: string, message: string, url: string): Finding => ({
  area: 'rules',
  severity,
  code,
  message,
  url,
});

export function compareRulesPage(data: RulesPage, rulebook: string, known: string[]): Finding[] {
  return [
    ...(data.rulebook === rulebook
      ? []
      : [finding('legality', 'rulebook', `El reglamento enlazado cambió: ${data.rulebook}`, data.rulebook)]),
    ...difference(data.notices, known).added.map((url) => finding('content', 'notice', `Aviso nuevo: ${url}`, url)),
  ];
}

export function compareErrata(data: Errata, base: Errata): Finding[] {
  const { added, removed } = difference(data.cards, base.cards);
  const changes = [
    ...(data.updatedAt === base.updatedAt ? [] : [`fecha ${base.updatedAt} → ${data.updatedAt}`]),
    ...(added.length ? [`cartas nuevas: ${added.join(', ')}`] : []),
    ...(removed.length ? [`cartas retiradas: ${removed.join(', ')}`] : []),
  ];
  if (!changes.length && data.textHash !== base.textHash) changes.push('cambió el texto');
  return changes.length ? [finding('content', 'errata', `Erratas: ${changes.join('; ')}`, ERRATA_URL)] : [];
}
