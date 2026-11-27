import { z } from 'zod';

export const reviewStatus = z.enum(['pending', 'reviewed', 'superseded', 'conflict']);
export const ruleId = z.string().regex(/^\d{1,2}(-\d{1,2}){0,6}$/);

export const lessonSchema = z.strictObject({
  title: z.string().min(1),
  level: z.number().int().min(1).max(5),
  prerequisites: z.array(z.string()).default([]),
  ruleIds: z.array(ruleId).min(1),
  exerciseIds: z.array(z.string()).default([]),
  reviewStatus,
});

export const keywordSchema = z.strictObject({
  term: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  ruleId,
  reviewStatus,
});

export const inventorySchema = z.object({
  source: z.object({
    version: z.string(),
    lastUpdated: z.iso.date(),
    pdfPages: z.number().int().positive(),
    sha256: z.string().length(64),
  }),
  extraction: z.object({ humanReview: z.string() }),
  rules: z
    .array(
      z.object({
        ruleId,
        parentId: ruleId.nullable(),
        chapter: z.number().int().min(1).max(11),
        sourcePage: z.number().int().positive(),
        reviewStatus,
      }),
    )
    .min(1),
});
