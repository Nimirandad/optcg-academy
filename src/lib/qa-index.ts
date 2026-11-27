import type { QaDocument, QaQuestion } from './schemas.ts';

/** Fila de tabla extraída: `[carta, nombre, pregunta, respuesta]` o `[categoría, pregunta, respuesta]`. */
export type Row = string[];

const CARD_ID = /\b(?:(?:OP|ST|EB|PRB)\d{2}-\d{3}|P-\d{3})\b/g;
const EXACT_CARD_ID = new RegExp(`^(?:${CARD_ID.source})$`);

/** `qa_st-15-20.pdf` → `st15-st20`; `qa_op14_eb04.pdf` → `op14-eb04`. */
export function documentSlug(file: string): string {
  const name = file.replace(/^(qa|faq)_/, '').replace(/\.pdf$/, '').replace(/_/g, '-');
  if (name === 'promotion-cards') return 'promocionales';
  return name.replace(/(op|eb|st|prb)-?(\d\d)/g, '$1$2').replace(/^st(\d\d)-(\d\d)$/, 'st$1-st$2');
}

/** Código(s) de producto de un documento; los rangos de Starter Deck se expanden. */
export function setCodes(slug: string): string[] {
  const range = /^st(\d\d)-st(\d\d)$/.exec(slug);
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    return Array.from({ length: to - from + 1 }, (_, i) => `ST-${String(from + i).padStart(2, '0')}`);
  }
  return [...slug.matchAll(/(op|eb|st|prb)(\d\d)/g)].map((m) => `${m[1].toUpperCase()}-${m[2]}`);
}

/** Keywords citadas en el texto (detección automática, sin interpretación). */
export function detectMechanics(text: string, keywords: { slug: string; term: string }[]): string[] {
  const plain = text.replace(/’/g, "'").toLowerCase();
  return keywords
    .filter(({ slug, term }) => {
      if (slug === 'don-requirement') return /\[don!! x/.test(plain);
      if (slug === 'don-minus') return /don!! ?[−-] ?[\dx○]/.test(plain);
      if (slug === 'ko') return plain.includes('k.o.');
      if (slug === 'trash') return false; // Palabra de uso común: no permite distinguir la keyword.
      return plain.includes(`[${term.replace(/’/g, "'").toLowerCase()}]`);
    })
    .map(({ slug }) => slug)
    .sort();
}

/** Carga manual de respaldo: cada página indicada reemplaza por completo a la extraída. */
export function applyManual(pages: Row[][], manual: Record<string, Row[]> = {}): Row[][] {
  for (const page of Object.keys(manual)) {
    if (!pages[Number(page) - 1]) throw new Error(`Carga manual: la página ${page} no existe`);
  }
  return pages.map((rows, index) => manual[String(index + 1)] ?? rows);
}

/**
 * Convierte las filas de un documento en índice sin texto oficial.
 * `digest` produce la huella de cada pregunta para detectar cambios.
 */
export function indexDocument(
  pages: Row[][],
  keywords: { slug: string; term: string }[],
  slug: string,
  digest: (text: string) => string,
): Pick<QaDocument, 'questions' | 'gaps'> {
  const questions: QaQuestion[] = [];
  const gaps: QaDocument['gaps'] = [];
  pages.forEach((rows, pageIndex) => {
    const page = pageIndex + 1;
    let position = 0;
    if (!rows.length) gaps.push({ page, reason: 'No se detectó tabla en la página.' });
    for (const row of rows) {
      if (row.every((cell) => !cell) || row.includes('Question')) continue;
      const first = row[0] ?? '';
      const cardId = EXACT_CARD_ID.test(first) ? first : null;
      const question = row.at(-2) ?? '';
      const answer = row.at(-1) ?? '';
      if ((row.length !== 3 && row.length !== 4) || !question || !answer) {
        gaps.push({ page, reason: `Fila sin pregunta o respuesta${cardId ? ` (${cardId})` : ''}.` });
        continue;
      }
      position += 1;
      const text = `${question} ${answer}`;
      const flags: QaQuestion['flags'] = [];
      if (!question.endsWith('?')) flags.push('revisar-extraccion');
      if (row.length === 4 && !cardId) flags.push('revisar-extraccion');
      questions.push({
        id: `${slug}-p${page}-${position}`,
        page,
        cardIds: [...new Set([...(cardId ? [cardId] : []), ...(text.match(CARD_ID) ?? [])])],
        mechanics: detectMechanics(text, keywords),
        hash: digest(row.join('|')),
        flags: [...new Set(flags)],
      });
    }
  });
  return { questions, gaps };
}
