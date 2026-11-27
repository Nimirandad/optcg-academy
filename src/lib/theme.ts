export type Theme = 'light' | 'dark';

export const THEME_KEY = 'optcg:theme:v1';

export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
