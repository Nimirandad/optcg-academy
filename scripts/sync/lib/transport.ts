import { readFile } from 'node:fs/promises';
import type { Transport } from './request.ts';

/**
 * Único código que abre conexiones. Solo se usa con la opción `--red`, que requiere la
 * autorización del propietario (ADR-006). No añade datos identificativos a la petición.
 */
export const networkTransport: Transport = ({ url, headers, signal }) =>
  fetch(url, { headers, signal, redirect: 'manual' });

/**
 * Separa el inicio de dos peticiones, reintentos incluidos. La espera cuenta dentro del
 * timeout del intento, así que el intervalo debe ser bastante menor.
 */
export function throttled(
  transport: Transport,
  intervalMs: number,
  clock: { now: () => number; sleep: (ms: number) => Promise<void> },
): Transport {
  let next = 0;
  return async (request) => {
    const start = Math.max(clock.now(), next);
    next = start + intervalMs;
    if (start > clock.now()) await clock.sleep(start - clock.now());
    return transport(request);
  };
}

/** Sirve copias guardadas: URL → archivo. Una URL sin copia responde 404. */
export function localTransport(files: ReadonlyMap<string, URL>): Transport {
  return async ({ url }) => {
    const file = files.get(url);
    if (!file) return new Response(null, { status: 404 });
    try {
      const type = file.pathname.endsWith('.pdf') ? 'application/pdf' : 'text/html';
      return new Response(new Uint8Array(await readFile(file)), { headers: { 'content-type': type } });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return new Response(null, { status: 404 });
    }
  };
}
