/** Orden y coherencia de las lecciones. */

export interface LessonNode {
  id: string;
  data: { level: number; order: number; prerequisites: string[]; ruleIds: string[]; exerciseIds: string[] };
}

export const levels: Record<number, string> = {
  1: 'Fundamentos',
  2: 'Primera partida',
  3: 'Combate',
  4: 'Efectos',
  5: 'Avanzado',
};

export const sortLessons = <T extends LessonNode>(lessons: T[]): T[] =>
  [...lessons].sort((a, b) => a.data.level - b.data.level || a.data.order - b.data.order);

/** Problemas que deben hacer fallar el build. */
export function checkAcademy(
  lessons: LessonNode[],
  sets: { lesson: string; questions: { id: string; ruleIds: string[] }[] }[],
  knownRules: Set<string>,
): string[] {
  const problems: string[] = [];
  const sorted = sortLessons(lessons);
  const position = new Map(sorted.map((lesson, index) => [lesson.id, index]));
  if (new Set(sorted.map((l) => `${l.data.level}.${l.data.order}`)).size !== sorted.length) {
    problems.push('Hay dos lecciones en la misma posición.');
  }
  const questionIds = sets.flatMap((set) => set.questions.map((question) => question.id));
  if (new Set(questionIds).size !== questionIds.length) problems.push('Hay preguntas con el mismo ID.');
  for (const [index, lesson] of sorted.entries()) {
    for (const id of lesson.data.prerequisites) {
      const at = position.get(id);
      if (at === undefined || at >= index) problems.push(`${lesson.id}: prerrequisito inexistente o posterior (${id}).`);
    }
    const own = sets.filter((set) => set.lesson === lesson.id).flatMap((set) => set.questions.map((q) => q.id));
    const wanted = lesson.data.exerciseIds;
    if (!wanted.length || [...own].sort().join() !== [...wanted].sort().join()) {
      problems.push(`${lesson.id}: exerciseIds no coincide con sus preguntas.`);
    }
  }
  for (const set of sets) if (!position.has(set.lesson)) problems.push(`Preguntas sin lección: ${set.lesson}.`);
  const cited = [...sorted.flatMap((l) => l.data.ruleIds), ...sets.flatMap((s) => s.questions.flatMap((q) => q.ruleIds))];
  for (const id of new Set(cited)) if (!knownRules.has(id)) problems.push(`Regla inexistente: ${id}.`);
  return problems;
}

/** Referencias de los casos prácticos. */
export function checkCases(
  cases: { id: string; ruleIds: string[]; qaIds: string[] }[],
  knownRules: Set<string>,
  knownQa: Set<string>,
): string[] {
  const problems: string[] = [];
  if (new Set(cases.map((item) => item.id)).size !== cases.length) problems.push('Hay casos con el mismo ID.');
  for (const item of cases) {
    for (const id of item.ruleIds) if (!knownRules.has(id)) problems.push(`${item.id}: regla inexistente ${id}.`);
    for (const id of item.qaIds) if (!knownQa.has(id)) problems.push(`${item.id}: aclaración inexistente ${id}.`);
  }
  return problems;
}
