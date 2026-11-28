import { getCollection } from 'astro:content';
import { checkCases, levels } from './academy';
import { inventory } from './inventory';
import { withBase } from './paths';
import { documents } from './qa';

export async function loadCaseGroups() {
  const cases = (await getCollection('cases')).map((entry) => entry.data);
  const qaDocument = new Map(documents.flatMap((d) => d.questions.map((question) => [question.id, d.slug])));
  const problems = checkCases(cases, new Set(inventory.rules.map((rule) => rule.ruleId)), new Set(qaDocument.keys()));
  if (problems.length) throw new Error(`Casos inconsistentes:\n${problems.join('\n')}`);

  return Object.entries(levels)
    .map(([level, name]) => ({
      level: Number(level),
      name,
      cases: cases
        .filter((item) => item.level === Number(level))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ qaIds, ...item }) => ({
          ...item,
          links: qaIds.map((id) => ({ href: withBase(`qa/${qaDocument.get(id)}/#${id}`), label: id })),
        })),
    }))
    .filter((group) => group.cases.length > 0);
}
