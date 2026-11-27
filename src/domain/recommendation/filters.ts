/** Filtros del catálogo (`plan.md` §7) y su forma en parámetros de URL. */
import type { Color } from './types';

export type DeckKind = 'starter' | 'built';

export interface Filters {
  /** El mazo debe incluir todos estos colores. */
  colors?: Color[];
  colorCount?: 'mono' | 'multi';
  maxClp?: number;
  maxDifficulty?: number;
  style?: string;
  kind?: DeckKind;
  theme?: string;
  releasedSince?: string;
}

export interface FilterableDeck {
  /** Colores del Leader. */
  colors: Color[];
  kind: DeckKind;
  styles: string[];
  theme?: string;
  difficulty: number | null;
  price: { clp: number } | null;
  releasedAt: string | null;
}

/** Un dato desconocido no satisface un filtro que dependa de él. */
export function matchesFilters(deck: FilterableDeck, filters: Filters): boolean {
  const { colors, colorCount, maxClp, maxDifficulty, style, kind, theme, releasedSince } = filters;
  return (
    (colors ?? []).every((color) => deck.colors.includes(color)) &&
    (colorCount === undefined || (colorCount === 'mono') === (deck.colors.length === 1)) &&
    (maxClp === undefined || (deck.price !== null && deck.price.clp <= maxClp)) &&
    (maxDifficulty === undefined || (deck.difficulty !== null && deck.difficulty <= maxDifficulty)) &&
    (style === undefined || deck.styles.includes(style)) &&
    (kind === undefined || deck.kind === kind) &&
    (theme === undefined || deck.theme === theme) &&
    (releasedSince === undefined || (deck.releasedAt !== null && deck.releasedAt >= releasedSince))
  );
}

const colorValues: readonly string[] = ['red', 'green', 'blue', 'purple', 'black', 'yellow'] satisfies Color[];

/** Lee los parámetros e ignora los valores no reconocidos. */
export function parseFilters(params: URLSearchParams): Filters {
  const positive = (name: string) => {
    const value = Number(params.get(name));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  const oneOf = <T extends string>(name: string, values: readonly T[]) => values.find((value) => value === params.get(name));
  const date = params.get('desde');
  const colors = [...new Set(params.getAll('color'))].filter((value): value is Color => colorValues.includes(value));
  const filters: Filters = {
    colors: colors.length ? colors : undefined,
    colorCount: oneOf('colores', ['mono', 'multi'] as const),
    maxClp: positive('presupuesto'),
    maxDifficulty: positive('dificultad'),
    style: params.get('estilo') || undefined,
    kind: oneOf('tipo', ['starter', 'built'] as const),
    theme: params.get('tema') || undefined,
    releasedSince: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
  };
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined));
}
