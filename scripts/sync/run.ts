/**
 * Compara las fuentes con los datos del repositorio. Solo informa.
 *
 * Uso: node scripts/sync/run.ts [format|qa|rules|cards ...] [--pdf] [--salida informe.json] [--red]
 * Sin `--red` lee las copias locales de `references/` y no usa la red. `--red` consulta el sitio
 * oficial y requiere la autorización del propietario (ADR-006).
 * Código de salida: 0 sin diferencias, 2 con diferencias, 1 si alguna fuente falló.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { fileCache, memoryCache } from './lib/cache.ts';
import { loadRepository, localCopies } from './lib/repository.ts';
import { DEFAULT_POLICY } from './lib/request.ts';
import { AREAS, exitCode, runSync, summary, type Area } from './lib/sync.ts';
import { localTransport, networkTransport, throttled } from './lib/transport.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { red: { type: 'boolean', default: false }, pdf: { type: 'boolean', default: false }, salida: { type: 'string' } },
});
const unknown = positionals.filter((name) => !AREAS.includes(name as Area));
if (unknown.length) throw new Error(`Área desconocida: ${unknown.join(', ')}. Disponibles: ${AREAS.join(', ')}`);

const root = new URL('../../', import.meta.url);
const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const report = await runSync(loadRepository(root), {
  areas: positionals.length ? (positionals as Area[]) : AREAS,
  pdf: values.pdf,
  policy: { ...DEFAULT_POLICY, allowedHosts: ['en.onepiece-cardgame.com'] },
  deps: {
    cache: values.red ? fileCache(fileURLToPath(new URL('references/cache/sync/', root))) : memoryCache(),
    transport: values.red
      ? throttled(networkTransport, 3_000, { now: Date.now, sleep })
      : localTransport(localCopies(root)),
    now: () => new Date(),
    sleep,
  },
});

const mode = values.red ? 'red' : 'copias-locales';
if (values.salida) {
  writeFileSync(resolve(values.salida), `${JSON.stringify({ mode, ranAt: new Date().toISOString(), ...report }, null, 2)}\n`);
}
console.log(values.red ? 'Consulta al sitio oficial.' : 'Copias locales: no comprueba la vigencia actual de las fuentes.');
console.log(summary(report));
process.exitCode = exitCode(report);
