/**
 * Caché de la última respuesta válida de cada fuente. El cuerpo es contenido de terceros:
 * la caché en disco debe quedar en una carpeta ignorada por Git (ADR-006).
 */
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { sha256 } from './hash.ts';

const digest = z.string().regex(/^[0-9a-f]{64}$/);

const metaSchema = z.strictObject({
  url: z.url(),
  /** Huella del cuerpo. */
  hash: digest,
  /** Huella de los datos extraídos y validados. */
  dataHash: digest,
  parserVersion: z.string().min(1),
  contentType: z.string().nullable(),
  etag: z.string().nullable(),
  lastModified: z.string().nullable(),
  /** Primera descarga de este contenido. */
  retrievedAt: z.iso.datetime(),
  /** Última comprobación con éxito (`plan.md` §9). */
  checkedAt: z.iso.datetime(),
});

export type CacheMeta = z.infer<typeof metaSchema>;
export interface CacheEntry {
  meta: CacheMeta;
  body: Uint8Array;
}

export interface SourceCache {
  /** `null` si no hay entrada o está dañada. */
  get(key: string): Promise<CacheEntry | null>;
  put(key: string, entry: CacheEntry): Promise<void>;
}

export function memoryCache(): SourceCache {
  const entries = new Map<string, CacheEntry>();
  return {
    get: async (key) => structuredClone(entries.get(key) ?? null),
    put: async (key, entry) => void entries.set(key, structuredClone(entry)),
  };
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

/**
 * `<clave>.json` apunta a `<clave>.<huella>.bin`. El cuerpo se escribe antes que el índice,
 * así una escritura interrumpida conserva la entrada anterior.
 */
export function fileCache(directory: string): SourceCache {
  const safe = (key: string) => {
    if (!/^[0-9a-f]{64}$/.test(key)) throw new Error(`Clave de caché no válida: ${key}`);
    return key;
  };
  const write = async (name: string, data: string | Uint8Array) => {
    const path = join(directory, name);
    await writeFile(`${path}.tmp`, data);
    await rename(`${path}.tmp`, path);
  };
  return {
    async get(key) {
      try {
        const text = await readFile(join(directory, `${safe(key)}.json`), 'utf8');
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          return null;
        }
        const meta = metaSchema.safeParse(json);
        if (!meta.success) return null;
        const body = new Uint8Array(await readFile(join(directory, `${key}.${meta.data.hash}.bin`)));
        return sha256(body) === meta.data.hash ? { meta: meta.data, body } : null;
      } catch (error) {
        if (missing(error)) return null;
        throw error;
      }
    },
    async put(key, { meta, body }) {
      const checked = metaSchema.parse(meta);
      if (sha256(body) !== checked.hash) throw new Error('La huella no corresponde al cuerpo');
      await mkdir(directory, { recursive: true });
      const name = `${safe(key)}.${checked.hash}.bin`;
      await write(name, body);
      await write(`${key}.json`, `${JSON.stringify(checked, null, 2)}\n`);
      for (const file of await readdir(directory)) {
        if (file.startsWith(`${key}.`) && file.endsWith('.bin') && file !== name) {
          await rm(join(directory, file), { force: true });
        }
      }
    },
  };
}
