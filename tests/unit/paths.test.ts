import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/paths';

describe('withBase', () => {
  it.each([
    ['reglas/', '/optcg-academy', '/optcg-academy/reglas/'],
    ['/reglas/', '/optcg-academy/', '/optcg-academy/reglas/'],
    ['', '/optcg-academy', '/optcg-academy/'],
    ['reglas/', '/', '/reglas/'],
  ])('une %j con %j', (path, base, expected) => {
    expect(withBase(path, base)).toBe(expected);
  });
});
