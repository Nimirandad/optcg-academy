import { createHash } from 'node:crypto';

export const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

/** Huella de datos JSON que no depende del orden de las claves; el de las listas sí cuenta. */
export function dataHash(data: unknown): string {
  const sorted = (_key: string, value: unknown) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)))
      : value;
  return sha256(JSON.stringify(data, sorted));
}
