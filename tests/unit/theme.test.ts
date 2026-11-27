import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextTheme } from '../../src/lib/theme';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function tokens(selector: string): Record<string, string> {
  const block = css.split(`${selector} {`)[1]?.split('}')[0];
  if (!block) throw new Error(`sin bloque ${selector}`);
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

describe('tema', () => {
  it('alterna entre claro y oscuro', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });

  describe.each([':root', ":root[data-theme='dark']"])('contraste AA en %s', (selector) => {
    const t = tokens(selector);
    it.each([
      ...['text', 'muted', 'link', 'notice'].flatMap((fg) => [[fg, 'bg', 4.5], [fg, 'surface', 4.5]] as const),
      ['header-text', 'header-bg', 4.5] as const,
      ['accent', 'header-bg', 4.5] as const,
      ['border', 'bg', 3] as const,
      ['border', 'surface', 3] as const,
    ])('%s sobre %s ≥ %f', (fg, bg, minimum) => {
      expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(minimum);
    });
  });
});
