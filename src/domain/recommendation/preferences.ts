/** Test de preferencias: suma afinidad por color y explica de dónde sale. No es un diagnóstico. */
import type { Color } from './types';

export interface PreferenceOption {
  id: string;
  label: string;
  /** Colores cuya tendencia general coincide con la opción; vacío si no inclina. */
  colors: Color[];
}

export interface PreferenceQuestion {
  id: string;
  prompt: string;
  options: PreferenceOption[];
}

export interface Affinity {
  color: Color;
  points: number;
  /** Respuestas que sumaron a este color. */
  reasons: string[];
}

export interface PreferenceResult {
  /** Colores con algún punto, de mayor a menor; los empates conservan el orden recibido. */
  ranking: Affinity[];
  /** Colores empatados en el primer lugar. */
  top: Color[];
  /** Dos colores sugeridos para combinar, solo si no hay empate que obligue a elegir al azar. */
  pair: [Color, Color] | null;
}

export function evaluatePreferences(
  questions: readonly PreferenceQuestion[],
  answers: Readonly<Record<string, string>>,
  colorOrder: readonly Color[],
): PreferenceResult {
  const ranking: Affinity[] = colorOrder.map((color) => ({ color, points: 0, reasons: [] }));
  for (const question of questions) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (!option) continue;
    for (const entry of ranking.filter((item) => option.colors.includes(item.color))) {
      entry.points += 1;
      entry.reasons.push(option.label);
    }
  }
  const scored = ranking.filter((entry) => entry.points > 0).sort((a, b) => b.points - a.points);
  const [first, second, third] = scored;
  return {
    ranking: scored,
    top: scored.filter((entry) => entry.points === first?.points).map((entry) => entry.color),
    pair: first && second && second.points !== third?.points ? [first.color, second.color] : null,
  };
}
