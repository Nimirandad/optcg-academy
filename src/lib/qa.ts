import index from '../data/qa/documents.json';
import errataData from '../data/qa/errata.json';
import restrictionsData from '../data/restrictions/standard.json';
import { errataSchema, qaIndexSchema, restrictionsSchema, type QaDocument } from './schemas';

/** Falla el build si los datos no cumplen el esquema. */
export const { documents } = qaIndexSchema.parse(index);
export const errata = errataSchema.parse(errataData);
export const restrictions = restrictionsSchema.parse(restrictionsData);

export function documentTitle({ slug, setCodes }: Pick<QaDocument, 'slug' | 'setCodes'>): string {
  if (slug === 'rules') return 'Reglas generales';
  if (slug === 'promocionales') return 'Cartas promocionales';
  const range = slug.startsWith('st') && setCodes.length > 2;
  return range ? `${setCodes[0]} a ${setCodes.at(-1)}` : setCodes.join(' y ');
}

export const statusLabel = {
  pending: 'Pendiente de revisión',
  reviewed: 'Revisada',
  superseded: 'Reemplazada',
  conflict: 'En conflicto',
} as const;

export const percent = (part: number, total: number) =>
  new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 1 }).format(total ? part / total : 0);
