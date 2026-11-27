/** Modelos de cartas, productos, formatos y mazos (`plan.md` §8, ADR-007). */
import { z } from 'zod';
import { cardId, reviewStatus } from './schemas.ts';

const text = z.string().trim().min(1);
const isoDate = z.iso.date();
const count = z.number().int().nonnegative();
const unique = (values: unknown[]) => new Set(values).size === values.length;

/** Solo una persona revisa: `reviewed` exige indicar quién. */
const signed = <T extends z.ZodType<{ reviewStatus: string; reviewedBy?: string }>>(schema: T) =>
  schema.refine((item) => item.reviewStatus !== 'reviewed' || !!item.reviewedBy, {
    message: 'reviewed exige reviewedBy',
    path: ['reviewedBy'],
  });
const review = { reviewStatus, reviewedBy: text.optional() };

export const colorSchema = z.enum(['red', 'green', 'blue', 'purple', 'black', 'yellow']);
export const categorySchema = z.enum(['leader', 'character', 'event', 'stage', 'don']);
/** Número de bloque, o `X`. `null` en una impresión significa «sin verificar». */
export const blockSchema = z.union([z.number().int().positive(), z.literal('X')]);

export const sourceSchema = z.strictObject({
  url: z.url({ protocol: /^https$/ }),
  retrievedAt: isoDate,
  effectiveDate: isoDate.optional(),
  hash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  /** `manual` cuando los datos se transcribieron a mano. */
  parserVersion: text,
  reviewStatus,
});

export const productSchema = z.strictObject({
  id: z.string().regex(/^[A-Z]+-?\d*$/),
  kind: z.enum(['starter', 'booster', 'extra', 'premium', 'promo', 'other']),
  name: text,
  region: text,
  releaseDate: isoDate.nullable(),
  sourceRef: sourceSchema,
});

export const printingSchema = z.strictObject({
  id: text,
  cardId,
  productId: text,
  blockSymbol: blockSchema.nullable(),
  region: text,
  releaseDate: isoDate.nullable(),
  sourceRef: sourceSchema,
});

/** Efectos sobre la construcción del mazo (regla 5-1-2-4), sin copiar el texto de la carta. */
export const deckRuleSchema = z.discriminatedUnion('kind', [
  /** Copias permitidas de esta misma carta; `null` es sin límite. */
  z.strictObject({ kind: z.literal('copy-limit'), limit: z.number().int().positive().nullable() }),
  /** Cartas que el Leader impide incluir: deben cumplir todos los criterios indicados. */
  z
    .strictObject({
      kind: z.literal('forbid'),
      category: categorySchema.optional(),
      minCost: count.optional(),
      maxCost: count.optional(),
    })
    .refine((rule) => rule.category !== undefined || rule.minCost !== undefined || rule.maxCost !== undefined, {
      message: 'forbid exige algún criterio',
    }),
  z.strictObject({ kind: z.literal('don-deck-size'), size: count }),
  /** Efecto que el validador no sabe evaluar. */
  z.strictObject({ kind: z.literal('unsupported'), note: text }),
]);

export const cardSchema = signed(
  z.strictObject({
    canonicalId: cardId,
    number: cardId,
    name: text,
    category: categorySchema,
    colors: z.array(colorSchema).refine(unique, { message: 'colores repetidos' }),
    types: z.array(text).default([]),
    attributes: z.array(text).default([]),
    rarity: text.optional(),
    power: count.nullable(),
    cost: count.nullable(),
    life: count.nullable(),
    counter: count.nullable(),
    /** Vacíos sin permiso de reproducción (ADR-006). */
    effect: text.optional(),
    trigger: text.optional(),
    printings: z.array(printingSchema),
    /** Falso mientras no se confirme que están todas las impresiones del número. */
    printingsComplete: z.boolean(),
    /** `null`: no se ha comprobado si la carta altera la construcción. */
    deckRules: z.array(deckRuleSchema).nullable(),
    sourceRef: sourceSchema,
    ...review,
  }),
)
  .refine((card) => card.canonicalId === card.number, { message: 'canonicalId y number difieren', path: ['number'] })
  .refine((card) => card.printings.every((printing) => printing.cardId === card.canonicalId), {
    message: 'impresión de otra carta',
    path: ['printings'],
  })
  .refine((card) => card.category === 'don' || card.colors.length > 0, { message: 'falta el color', path: ['colors'] })
  // ADR-027: solo un Leader tiene más de un color. Un dato que lo contradiga debe revisarse.
  .refine((card) => card.category === 'leader' || card.colors.length <= 1, {
    message: 'solo un Leader puede tener varios colores',
    path: ['colors'],
  });

const period = { effectiveFrom: isoDate, effectiveUntil: isoDate.nullable().default(null) };
const ordered = (item: { effectiveFrom: string; effectiveUntil: string | null }) =>
  item.effectiveUntil === null || item.effectiveFrom <= item.effectiveUntil;
const dated = <T extends z.ZodType<{ effectiveFrom: string; effectiveUntil: string | null }>>(schema: T) =>
  schema.refine(ordered, { message: 'effectiveUntil anterior a effectiveFrom', path: ['effectiveUntil'] });

export const formatSnapshotSchema = signed(
  z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    region: text,
    format: z.enum(['standard', 'extra']),
    ...period,
    rotationPolicy: text,
    blockWindow: z.array(z.number().int().positive()).min(1),
    blockExceptions: z.array(dated(z.strictObject({ cardId, treatedAs: blockSchema, ...period }))),
    bans: z.array(dated(z.strictObject({ cardId, ...period }))),
    restrictions: z.array(dated(z.strictObject({ cardId, maxCopies: z.number().int().positive(), ...period }))),
    bannedPairs: z.array(
      dated(
        z.strictObject({
          cards: z.tuple([cardId, cardId]).refine(([a, b]) => a !== b, { message: 'pareja de la misma carta' }),
          ...period,
        }),
      ),
    ),
    notes: z.array(text).default([]),
    verifiedAt: isoDate,
    sources: z.array(sourceSchema).min(1),
    ...review,
  }),
).refine(ordered, { message: 'effectiveUntil anterior a effectiveFrom', path: ['effectiveUntil'] });

const suspensionSchema = dated(
  signed(
    z.strictObject({
      id: z.string().regex(/^[a-z0-9-]+$/),
      target: z.discriminatedUnion('kind', [
        z.strictObject({ kind: z.literal('card'), cardId }),
        z.strictObject({
          kind: z.literal('pair'),
          cardIds: z.tuple([cardId, cardId]).refine(([a, b]) => a !== b, { message: 'pareja de la misma carta' }),
        }),
        z.strictObject({ kind: z.literal('format') }),
      ]),
      reason: text,
      ...period,
      sourceRef: sourceSchema,
      ...review,
    }),
  ),
);

/** Suspensiones de recomendación; se aplican aunque estén en `pending`, porque solo restringen. */
export const safetySnapshotSchema = z
  .strictObject({ updatedAt: isoDate, suspensions: z.array(suspensionSchema) })
  .refine((data) => unique(data.suspensions.map((item) => item.id)), {
    message: 'identificadores repetidos',
    path: ['suspensions'],
  });

const scoreSchema = z.strictObject({ value: z.number().min(0).max(100), evidence: text }).nullable();

export const deckSchema = signed(
  z.strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: text,
    leaderId: cardId,
    entries: z.array(z.strictObject({ cardId, quantity: z.number().int().positive() })).min(1),
    donDeckSize: count.default(10),
    kind: z.enum(['starter', 'built']),
    tags: z.array(z.enum(['starter', 'budget', 'beginner', 'casual', 'themed', 'evolving'])),
    styles: z.array(text),
    theme: text.optional(),
    difficulty: z.number().int().min(1).max(3).nullable(),
    /** Presupuesto en CLP; `null` si no hay fuente fiable. */
    price: z.strictObject({ clp: z.number().int().positive(), sourceRef: sourceSchema }).nullable(),
    releasedAt: isoDate.nullable(),
    /** De dónde salen las cartas y sus cantidades. */
    listSources: z.array(sourceSchema).min(1),
    scoreBreakdown: z.strictObject({
      ease: scoreSchema,
      colorIdentity: scoreSchema,
      affordability: scoreSchema,
      consistency: scoreSchema,
      upgrades: scoreSchema,
    }),
    /** `null` mientras no esté redactada; la revisión de la lista no la cubre. */
    strategy: z
      .strictObject({
        earlyTurns: text,
        mulligan: text,
        combos: z.array(text),
        commonMistakes: z.array(text),
        upgrades: z.array(text),
      })
      .nullable(),
    alternatives: z.array(z.strictObject({ replaces: cardId, with: cardId, note: text })),
    version: z.number().int().positive(),
    reviewedAt: isoDate.optional(),
    ...review,
  }),
)
  .refine((deck) => deck.reviewStatus !== 'reviewed' || !!deck.reviewedAt, {
    message: 'reviewed exige reviewedAt',
    path: ['reviewedAt'],
  })
  .refine((deck) => deck.price !== null || deck.scoreBreakdown.affordability === null, {
    message: 'sin precio con fuente no se puntúa la accesibilidad económica',
    path: ['scoreBreakdown', 'affordability'],
  });

const findingSchema = z.strictObject({
  code: text,
  message: text,
  cardIds: z.array(cardId),
  ruleIds: z.array(z.string()),
});

export const validationSchema = z.strictObject({
  deckId: text,
  snapshotId: text,
  status: z.enum(['valid', 'invalid', 'unknown', 'pending-review']),
  violations: z.array(findingSchema),
  unknowns: z.array(findingSchema),
  pendingReview: z.array(text),
  suspendedBy: z.array(text),
  checkedAt: isoDate,
  nextKnownChange: isoDate.nullable(),
});

export type Color = z.infer<typeof colorSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Product = z.infer<typeof productSchema>;
export type Printing = z.infer<typeof printingSchema>;
export type Card = z.infer<typeof cardSchema>;
export type DeckRule = z.infer<typeof deckRuleSchema>;
export type FormatSnapshot = z.infer<typeof formatSnapshotSchema>;
export type Deck = z.infer<typeof deckSchema>;
export type SafetySnapshot = z.infer<typeof safetySnapshotSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Validation = z.infer<typeof validationSchema>;
