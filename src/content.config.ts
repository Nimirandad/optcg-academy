import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { keywordSchema, lessonSchema } from './lib/schemas';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: lessonSchema,
});

const keywords = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/keywords' }),
  schema: keywordSchema,
});

export const collections = { lessons, keywords };
