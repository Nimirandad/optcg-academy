import { describe, expect, it } from 'vitest';
import { normalizeRuleId, rulePath } from '../../src/lib/rules';

describe('identificadores de regla', () => {
  it('conserva el ID canónico y acepta la forma con puntos', () => {
    expect(normalizeRuleId('1-3-5-1')).toBe('1-3-5-1');
    expect(normalizeRuleId(' 8.4. ')).toBe('8-4');
  });

  it('rechaza texto que no es un ID', () => {
    for (const input of ['', 'Blocker', '1-', '1--2', '../1']) expect(normalizeRuleId(input)).toBeNull();
  });

  it('apunta al capítulo y ancla', () => {
    expect(rulePath('10-1-4')).toBe('reglas/10/#regla-10-1-4');
  });
});
