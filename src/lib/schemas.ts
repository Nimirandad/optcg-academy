import { z } from 'zod';

export const reviewStatus = z.enum(['pending', 'reviewed', 'superseded', 'conflict']);
export const ruleId = z.string().regex(/^\d{1,2}(-\d{1,2}){0,6}$/);

export const lessonSchema = z.strictObject({
  title: z.string().min(1),
  objective: z.string().min(1),
  level: z.number().int().min(1).max(5),
  /** Posición dentro del nivel. */
  order: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
  ruleIds: z.array(ruleId).min(1),
  exerciseIds: z.array(z.string()).default([]),
  reviewStatus,
});

const questionShape = {
    id: z.string().regex(/^[a-z0-9-]+$/),
    prompt: z.string().trim().min(1),
    options: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z]$/),
          text: z.string().trim().min(1),
          /** Por qué la opción es correcta o incorrecta. */
          rationale: z.string().trim().min(1),
        }),
      )
      .min(3),
    answer: z.string(),
    ruleIds: z.array(ruleId).min(1),
    assumption: z.string().trim().min(1).optional(),
    version: z.number().int().positive(),
    reviewStatus,
    reviewedBy: z.string().min(1).optional(),
};

/** Reglas comunes a preguntas y casos. */
const coherent = <T extends z.ZodType<{ answer: string; options: { id: string }[]; reviewStatus: string; reviewedBy?: string }>>(schema: T) =>
  schema
    .refine((q) => q.options.some((option) => option.id === q.answer), { message: 'answer no es una opción', path: ['answer'] })
    .refine((q) => new Set(q.options.map((option) => option.id)).size === q.options.length, {
      message: 'opciones repetidas',
      path: ['options'],
    })
    .refine((q) => q.reviewStatus !== 'reviewed' || !!q.reviewedBy, { message: 'reviewed exige reviewedBy', path: ['reviewedBy'] });

const question = coherent(z.strictObject(questionShape));

export const caseSchema = coherent(
  z.strictObject({
    ...questionShape,
    level: z.number().int().min(1).max(5),
    title: z.string().trim().min(1),
    mechanics: z.array(z.string().trim().min(1)).min(1),
    /** Resolución paso a paso. */
    steps: z.array(z.string().trim().min(1)).min(2),
    /** Aclaraciones oficiales en que se apoya. */
    qaIds: z.array(z.string()).default([]),
  }),
);
export type Case = z.infer<typeof caseSchema>;

export const questionSetSchema = z.strictObject({ lesson: z.string(), questions: z.array(question).min(1) });
export type Question = z.infer<typeof question>;

export const keywordSchema = z
  .strictObject({
    term: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    ruleId,
    definition: z.string().trim().min(1),
    reviewStatus,
    reviewedBy: z.string().min(1).optional(),
  })
  .refine((keyword) => keyword.reviewStatus !== 'reviewed' || !!keyword.reviewedBy, {
    message: 'reviewed exige reviewedBy',
    path: ['reviewedBy'],
  });

export const ruleTextSchema = z
  .strictObject({
    id: ruleId,
    title: z.string().min(1).optional(),
    explanation: z.string().trim().min(1),
    example: z.string().trim().min(1).optional(),
    tip: z.string().trim().min(1).optional(),
    relatedIds: z.array(ruleId).default([]),
    /** Discrepancia u observación sobre la fuente oficial. */
    note: z.string().trim().min(1).optional(),
    reviewStatus,
    reviewedBy: z.string().min(1).optional(),
  })
  .refine((rule) => rule.reviewStatus !== 'reviewed' || !!rule.reviewedBy, {
    message: 'reviewed exige reviewedBy (solo una persona puede revisar)',
    path: ['reviewedBy'],
  });

export const ruleChapterSchema = z.strictObject({
  chapter: z.number().int().min(1).max(11),
  sourceVersion: z.string().min(1),
  rules: z.array(ruleTextSchema).min(1),
});

export type RuleText = z.infer<typeof ruleTextSchema>;

export const cardId = z.string().regex(/^(?:(?:OP|ST|EB|PRB)\d{2}-\d{3}|P-\d{3})$/);
const officialUrl = z.url().startsWith('https://en.onepiece-cardgame.com/');

export const qaQuestionSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+-p\d+-\d+$/),
  page: z.number().int().positive(),
  cardIds: z.array(cardId),
  mechanics: z.array(z.string()),
  hash: z.string().regex(/^[0-9a-f]{16}$/),
  flags: z.array(z.enum(['revisar-extraccion'])),
});

export const qaDocumentSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  setCodes: z.array(z.string()),
  sourceUrl: officialUrl,
  language: z.literal('en'),
  publishedAt: z.iso.date(),
  retrievedAt: z.iso.date(),
  sha256: z.string().length(64),
  pages: z.number().int().positive(),
  status: reviewStatus,
  gaps: z.array(z.strictObject({ page: z.number().int().positive(), reason: z.string() })),
  questions: z.array(qaQuestionSchema),
});

export const qaIndexSchema = z.strictObject({ documents: z.array(qaDocumentSchema).min(1) });

export const qaNotesSchema = z.strictObject({
  document: z.string(),
  entries: z.array(
    z
      .strictObject({
        id: z.string(),
        sourceHash: z.string(),
        question: z.string().trim().min(1),
        answer: z.string().trim().min(1),
        ruleIds: z.array(ruleId).min(1),
        note: z.string().trim().min(1).optional(),
        reviewStatus,
        reviewedBy: z.string().min(1).optional(),
        reviewedAt: z.iso.date().optional(),
      })
      .refine((entry) => entry.reviewStatus !== 'reviewed' || (!!entry.reviewedBy && !!entry.reviewedAt), {
        message: 'reviewed exige reviewedBy y reviewedAt',
        path: ['reviewedBy'],
      })
      .refine((entry) => entry.reviewStatus !== 'conflict' || !!entry.note, {
        message: 'conflict exige describir la duda en note',
        path: ['note'],
      }),
  ),
});

export const errataSchema = z.strictObject({
  listUrl: officialUrl,
  retrievedAt: z.iso.date(),
  notices: z.array(
    z.strictObject({
      url: officialUrl,
      publishedAt: z.iso.date(),
      cardIds: z.array(cardId).min(1),
      summary: z.string().trim().min(1),
      reviewStatus,
    }),
  ),
});

export const restrictionsSchema = z.strictObject({
  sourceUrl: officialUrl,
  retrievedAt: z.iso.date(),
  reviewStatus,
  banned: z.array(z.strictObject({ cardId, effectiveFrom: z.iso.date() })),
  pairs: z.array(z.strictObject({ cards: z.tuple([cardId, cardId]), effectiveFrom: z.iso.date() })),
});

export type Restrictions = z.infer<typeof restrictionsSchema>;
export type QaDocument = z.infer<typeof qaDocumentSchema>;
export type QaQuestion = z.infer<typeof qaQuestionSchema>;

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
