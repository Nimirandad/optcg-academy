/**
 * Un adaptador describe una fuente y cómo extraer sus datos. `runAdapter` la consulta,
 * valida el resultado y lo compara con la última respuesta válida. Ante cualquier fallo
 * la caché queda intacta. Todo dato obtenido queda en `pending`.
 */
import type { z } from 'zod';
import type { Source } from '../../../src/lib/deck-schemas.ts';
import type { CacheEntry, CacheMeta, SourceCache } from './cache.ts';
import { dataHash, sha256 } from './hash.ts';
import { requestSource, SourceError, type RequestDeps, type RequestPolicy } from './request.ts';

export interface SourceAdapter<T> {
  id: string;
  url: string;
  /** Cambiarla al modificar `parse`: obliga a descargar y extraer de nuevo. */
  parserVersion: string;
  /** Tipos de contenido aceptados, sin parámetros (p. ej. `text/html`). */
  contentTypes: readonly string[];
  /** Función pura: extrae datos del cuerpo sin ejecutarlo. */
  parse(body: Uint8Array): unknown;
  schema: z.ZodType<T>;
}

export interface AdapterDeps extends RequestDeps {
  cache: SourceCache;
}

/**
 * Respecto de la última respuesta válida en caché: `new` no había, `data` cambiaron los datos,
 * `content` cambió el cuerpo pero no los datos, `none` sin cambios.
 */
export type Change = 'new' | 'data' | 'content' | 'none';

export type AdapterResult<T> =
  | {
      ok: true;
      id: string;
      change: Change;
      data: T;
      dataHash: string;
      source: Source;
      checkedAt: string;
      attempts: number;
    }
  | {
      ok: false;
      id: string;
      error: { kind: SourceError['kind']; message: string; status: number | undefined };
      attempts: number;
      /** Última comprobación válida, para mostrar su antigüedad. */
      previous: CacheMeta | null;
    };

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function extract<T>(adapter: SourceAdapter<T>, body: Uint8Array): T {
  let raw: unknown;
  try {
    // Copia: un `parse` que altere los bytes no debe afectar a la huella ni a la caché.
    raw = adapter.parse(body.slice());
  } catch (error) {
    throw new SourceError('parse', `No se pudo extraer: ${message(error)}`, { cause: error });
  }
  const result = adapter.schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`);
    throw new SourceError('schema', `Datos no válidos: ${issues.slice(0, 5).join('; ')}`);
  }
  return result.data;
}

export async function runAdapter<T>(
  adapter: SourceAdapter<T>,
  policy: RequestPolicy,
  deps: AdapterDeps,
): Promise<AdapterResult<T>> {
  const key = sha256(`${adapter.id}\n${adapter.url}`);
  let previous: CacheEntry | null = null;
  let attempts = 0;
  const cacheError = (error: unknown) => new SourceError('cache', `Caché: ${message(error)}`, { cause: error });

  try {
    previous = await deps.cache.get(key).catch((error) => Promise.reject(cacheError(error)));

    // Sin petición condicional si cambió el extractor: hace falta aceptar un cuerpo nuevo.
    const headers: Record<string, string> = {};
    if (previous && previous.meta.parserVersion === adapter.parserVersion) {
      if (previous.meta.etag) headers['if-none-match'] = previous.meta.etag;
      if (previous.meta.lastModified) headers['if-modified-since'] = previous.meta.lastModified;
    }

    const response = await requestSource(adapter.url, headers, policy, deps);
    attempts = response.attempts;

    let fresh: Pick<CacheMeta, 'contentType' | 'etag' | 'lastModified'>;
    let body: Uint8Array;
    if (response.notModified) {
      // Solo hay 304 tras enviar validadores, que salen de `previous`.
      const cached = previous!;
      body = cached.body;
      fresh = cached.meta;
    } else {
      const type = response.contentType?.split(';')[0]!.trim().toLowerCase() ?? '';
      if (!adapter.contentTypes.includes(type)) {
        throw new SourceError('content-type', `Tipo de contenido inesperado: ${type || 'sin declarar'}`);
      }
      body = response.body;
      fresh = response;
    }

    const data = extract(adapter, body);
    const hashes = { hash: sha256(body), dataHash: dataHash(data) };
    const checkedAt = deps.now().toISOString();
    const retrievedAt = previous?.meta.hash === hashes.hash ? previous.meta.retrievedAt : checkedAt;
    const change: Change = !previous
      ? 'new'
      : previous.meta.dataHash !== hashes.dataHash
        ? 'data'
        : previous.meta.hash !== hashes.hash
          ? 'content'
          : 'none';

    const meta: CacheMeta = {
      url: adapter.url,
      ...hashes,
      parserVersion: adapter.parserVersion,
      contentType: fresh.contentType,
      etag: fresh.etag,
      lastModified: fresh.lastModified,
      retrievedAt,
      checkedAt,
    };
    await deps.cache.put(key, { meta, body }).catch((error) => Promise.reject(cacheError(error)));

    return {
      ok: true,
      id: adapter.id,
      change,
      data,
      dataHash: hashes.dataHash,
      source: {
        url: adapter.url,
        retrievedAt: retrievedAt.slice(0, 10),
        hash: hashes.hash,
        parserVersion: adapter.parserVersion,
        reviewStatus: 'pending',
      },
      checkedAt,
      attempts,
    };
  } catch (error) {
    // Un error que no sea de la fuente es un fallo de programación y debe verse.
    if (!(error instanceof SourceError)) throw error;
    return {
      ok: false,
      id: adapter.id,
      error: { kind: error.kind, message: error.message, status: error.status },
      attempts: attempts || error.attempts,
      previous: previous?.meta ?? null,
    };
  }
}
