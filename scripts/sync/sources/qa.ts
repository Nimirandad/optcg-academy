/** Listado de documentos de Q&A y huella de cada PDF. No se extrae texto. */
import { z } from 'zod';
import type { SourceAdapter } from '../lib/adapter.ts';
import type { Finding } from '../lib/finding.ts';
import { absolute, mainOf, SITE } from '../lib/html.ts';
import { sha256 } from '../lib/hash.ts';

export const FAQ_URL = `${SITE}/rules/faq/`;

export const faqAdapter: SourceAdapter<{ documents: string[] }> = {
  id: 'qa-list',
  url: FAQ_URL,
  parserVersion: 'qa-1',
  contentTypes: ['text/html'],
  schema: z.strictObject({ documents: z.array(z.url()).min(1) }),
  parse(body) {
    const main = mainOf(body);
    if (main.split('id="faqPdf"').length !== 2) throw new Error('No se identifica el listado de documentos');
    // El Q&A de reglas generales se enlaza fuera del listado por set.
    const links = [...main.matchAll(/href="([^"]+\.pdf(?:\?[^"]*)?)"/g)].map((match) => absolute(match[1]!, FAQ_URL));
    return { documents: [...new Set(links)] };
  },
};

export const pdfAdapter = (url: string): SourceAdapter<{ sha256: string }> => ({
  id: `pdf ${new URL(url).pathname}`,
  url,
  parserVersion: 'pdf-1',
  contentTypes: ['application/pdf'],
  schema: z.strictObject({ sha256: z.string() }),
  parse(body) {
    if (new TextDecoder().decode(body.subarray(0, 5)) !== '%PDF-') throw new Error('No es un PDF');
    return { sha256: sha256(body) };
  },
});

/** El nombre de archivo identifica el documento; la consulta (`?fecha`), su versión. */
export function compareDocuments(published: string[], recorded: string[]): Finding[] {
  const byPath = (urls: string[]) => new Map(urls.map((url) => [new URL(url).pathname, url]));
  const now = byPath(published);
  const before = byPath(recorded);
  const finding = (code: string, message: string, url: string): Finding => ({
    area: 'qa',
    severity: 'content',
    code,
    message,
    url,
  });
  return [
    ...[...now].flatMap(([path, url]) => {
      const old = before.get(path);
      if (!old) return [finding('added', `Documento nuevo: ${path}`, url)];
      return old === url ? [] : [finding('updated', `Documento con otra versión: ${path}`, url)];
    }),
    ...[...before]
      .filter(([path]) => !now.has(path))
      .map(([path, url]) => finding('removed', `Documento que ya no figura: ${path}`, url)),
  ];
}
