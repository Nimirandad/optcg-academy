/** Una isla por nivel de la academia. */
import { levels } from '../../lib/academy';
import { withBase } from '../../lib/paths';

const teasers: Record<number, string> = {
  1: 'Cómo se gana y qué hay sobre la mesa.',
  2: 'Prepara tu mazo y juega tu primer turno.',
  3: 'Ataca, bloquea y sorprende.',
  4: 'Haz que tus cartas usen sus efectos.',
  5: 'Resuelve las jugadas difíciles.',
};

export const islandsOf = (lessons: { id: string; data: { level: number } }[]) =>
  Object.entries(levels).flatMap(([key, name]) => {
    const level = Number(key);
    const own = lessons.filter((lesson) => lesson.data.level === level).map((lesson) => lesson.id);
    return own.length
      ? [{ level, name, teaser: teasers[level]!, href: withBase(`aprende/islas/${level}/`), lessons: own }]
      : [];
  });
