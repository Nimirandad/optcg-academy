/**
 * Utilidades para leer páginas guardadas sin ejecutar nada. Los extractores que las usan
 * deben fallar ante una estructura inesperada: una lista vacía nunca significa «no hay».
 */
export const SITE = 'https://en.onepiece-cardgame.com';

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Texto visible de un fragmento, sin etiquetas. */
export const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[\da-f]+|\w+);/gi, (all, name: string) =>
      name[0] === '#' ? String.fromCodePoint(Number(name[1] === 'x' ? `0${name.slice(1)}` : name.slice(1))) : (entities[name] ?? all),
    )
    .trim();

export const decode = (body: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(body);

export function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Falta ${what}`);
  return value;
}

/** Contenido principal, sin comentarios: pueden conservar datos antiguos. */
export function mainOf(body: Uint8Array): string {
  const html = decode(body).replace(/<!--.*?-->/gs, '');
  return required(/<main class="mainCol">(.*?)<\/main>/s.exec(html)?.[1], 'el contenido principal');
}

export const cardNumbers = (value: string): string[] => value.match(/\b(?:OP\d\d|ST\d\d|EB\d\d|PRB\d\d|P)-\d{3}\b/g) ?? [];

/** Cartas nombradas en el HTML. Cada etiqueta separa palabras: `2023<br>OP01-002` son dos. */
export const namedCards = (html: string) => cardNumbers(text(html.replaceAll('<', ' <')));

export const absolute = (href: string, base = `${SITE}/`) => new URL(href.replaceAll('&amp;', '&'), base).href;

export const hrefs = (html: string, base?: string) =>
  [...html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)].map((match) => absolute(match[1]!, base));

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** `March 31, 2029` → `2029-03-31`. */
export function isoDate(value: string): string {
  const [, month = '', day = '', year = ''] = required(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/.exec(value.trim()), `una fecha en «${value}»`);
  const index = months.indexOf(month) + 1;
  if (index === 0) throw new Error(`Mes desconocido: ${month}`);
  return `${year}-${String(index).padStart(2, '0')}-${day.padStart(2, '0')}`;
}
