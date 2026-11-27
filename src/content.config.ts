import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseSchema, keywordSchema, lessonSchema, qaNotesSchema, questionSetSchema, ruleChapterSchema } from './lib/schemas';
import { topicSchema } from './lib/topic-schema';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: lessonSchema,
});

const keywords = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/keywords' }),
  schema: keywordSchema,
});

const rules = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/rules' }),
  schema: ruleChapterSchema,
});

const qa = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/qa' }),
  schema: qaNotesSchema,
});

const questions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/questions' }),
  schema: questionSetSchema,
});

const cases = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/cases' }),
  schema: caseSchema,
});

const topics = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/topics' }),
  schema: topicSchema,
});

export const collections = { lessons, keywords, rules, qa, questions, cases, topics };
