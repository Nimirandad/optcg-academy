/** Los resúmenes por tema solo citan reglas y lecciones que existen. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import rules from '../../docs/coverage/rules-inventory.json';
import { lessonScenes } from '../../src/features/combat/lessons.ts';
import { scenes } from '../../src/features/combat/scenes.ts';
import { topicSchema } from '../../src/lib/topic-schema.ts';

const folder = 'src/data/topics';
const topics = readdirSync(folder).map((file) => ({ file, data: JSON.parse(readFileSync(`${folder}/${file}`, 'utf8')) }));
const known = new Set(rules.rules.map((rule) => rule.ruleId));
const lessonExists = (id: string) => existsSync(`src/content/lessons/${id}.md`);

describe('temas de reglas', () => {
  it.each(topics)('$file cumple el esquema y cita reglas existentes', ({ file, data }) => {
    const topic = topicSchema.parse(data);
    expect(`${topic.id}.json`).toBe(file);
    const cited = [...topic.steps.flatMap((step) => step.ruleIds), ...topic.tipRuleIds];
    expect(cited.filter((id) => !known.has(id))).toEqual([]);
    expect(topic.lessons.filter((id) => !lessonExists(id))).toEqual([]);
  });

  it('no repite el orden', () => {
    expect(new Set(topics.map(({ data }) => data.order)).size).toBe(topics.length);
  });
});

describe('retos por lección', () => {
  it('apuntan a lecciones y retos existentes', () => {
    for (const [lesson, ids] of Object.entries(lessonScenes)) {
      expect(lessonExists(lesson), lesson).toBe(true);
      expect(ids.filter((id) => !scenes.some((scene) => scene.id === id))).toEqual([]);
    }
  });
});
