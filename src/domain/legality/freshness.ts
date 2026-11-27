/**
 * Antigüedad de la última comprobación de las fuentes (`plan.md` §9). La fecha efectiva sin
 * snapshot aprobado la cubre el validador, que entonces no devuelve `valid`.
 */
import type { Validation } from './types';

export const WARNING_AFTER_HOURS = 48;
export const EXPIRY_AFTER_HOURS = 7 * 24;

/** `stale`: advertir. `expired`: no afirmar legalidad ni recomendar. */
export type Freshness = 'fresh' | 'stale' | 'expired';

/** `checks`: última comprobación con éxito de cada fuente; `null` si no consta. */
export function freshness(checks: readonly (string | null)[], now: Date): Freshness {
  // Manda la fuente más antigua. Sin dato, o con una fecha ilegible o futura, no se confía.
  const ages = checks.map((check) => (check === null ? NaN : (now.getTime() - Date.parse(check)) / 3_600_000));
  if (!ages.length || ages.some((age) => !(age >= 0))) return 'expired';
  const oldest = Math.max(...ages);
  return oldest > EXPIRY_AFTER_HOURS ? 'expired' : oldest > WARNING_AFTER_HOURS ? 'stale' : 'fresh';
}

/** Solo un resultado `valid` con comprobaciones vigentes se recomienda como Standard. */
export const canRecommend = (validation: Validation | null, state: Freshness) =>
  validation?.status === 'valid' && state !== 'expired';
