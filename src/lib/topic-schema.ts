/** Resúmenes por tema: lectura amena que remite a las reglas numeradas. */
import { z } from 'zod';
import { reviewStatus, ruleId } from './schemas';

const ruleIds = z.array(ruleId).min(1);

export const topicSchema = z.strictObject({
  id: z.string().regex(/^[a-z-]+$/),
  order: z.number().int().positive(),
  icon: z.enum(['trofeo', 'cartas', 'mapa', 'reloj', 'moneda', 'canon', 'escudo', 'destello', 'llave']),
  title: z.string().min(1),
  question: z.string().min(1),
  idea: z.string().min(1),
  steps: z.array(z.strictObject({ title: z.string().min(1), text: z.string().min(1).max(240), ruleIds })).min(2),
  tip: z.string().min(1),
  tipRuleIds: ruleIds,
  lessons: z.array(z.string()).min(1),
  reviewStatus,
});

export type Topic = z.infer<typeof topicSchema>;
