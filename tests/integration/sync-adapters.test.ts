/** Adaptadores de fuentes con datos ficticios y transporte simulado: ninguna prueba usa la red. */
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { sourceSchema } from '../../src/lib/deck-schemas.ts';
import { runAdapter, type SourceAdapter } from '../../scripts/sync/lib/adapter.ts';
import { fileCache, memoryCache, type SourceCache } from '../../scripts/sync/lib/cache.ts';
import { dataHash, sha256 } from '../../scripts/sync/lib/hash.ts';
import {
  DEFAULT_POLICY,
  type RequestPolicy,
  type Transport,
  type TransportRequest,
} from '../../scripts/sync/lib/request.ts';

const fixture = (name: string) => readFile(new URL(`../fixtures/sources/${name}.fictitious.json`, import.meta.url), 'utf8');
const [v1, v1Reordered, v2, changedSchema] = await Promise.all(
  ['lista-v1', 'lista-v1-reordenada', 'lista-v2', 'lista-esquema-cambiado'].map(fixture),
) as [string, string, string, string];

const listSchema = z.strictObject({
  fictitious: z.literal(true),
  items: z.array(z.strictObject({ number: z.string(), block: z.number() })).min(1),
});

const adapter: SourceAdapter<z.infer<typeof listSchema>> = {
  id: 'lista-ficticia',
  url: 'https://fuente.invalid/lista.json',
  parserVersion: 'ficticio-1',
  contentTypes: ['application/json'],
  parse: (body) => JSON.parse(new TextDecoder().decode(body)),
  schema: listSchema,
};

const policy: RequestPolicy = { ...DEFAULT_POLICY, allowedHosts: ['fuente.invalid'] };

type Step = Response | Error | ((request: TransportRequest) => Promise<Response>);
const ok = (body: string, headers: Record<string, string> = {}) =>
  new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
const status = (code: number, headers: Record<string, string> = {}) => new Response(null, { status: code, headers });

/** Transporte que entrega una respuesta por llamada, en orden. */
function harness(cache: SourceCache = memoryCache()) {
  const steps: Step[] = [];
  const requests: TransportRequest[] = [];
  const delays: number[] = [];
  const clock = { now: new Date('2026-11-27T10:00:00Z') };
  const transport: Transport = async (request) => {
    requests.push(request);
    const step = steps.shift();
    if (!step) throw new Error('Petición no prevista');
    if (step instanceof Error) throw step;
    return typeof step === 'function' ? step(request) : step;
  };
  const deps = {
    cache,
    transport,
    now: () => clock.now,
    sleep: async (ms: number) => void delays.push(ms),
  };
  return {
    requests,
    delays,
    clock,
    cache,
    run(next: Step[], options: { adapter?: typeof adapter; policy?: Partial<RequestPolicy> } = {}) {
      steps.push(...next);
      return runAdapter(options.adapter ?? adapter, { ...policy, ...options.policy }, deps);
    },
  };
}

beforeEach(() => {
  // Red de seguridad: si algo intentara salir a la red, la prueba falla.
  vi.stubGlobal('fetch', () => {
    throw new Error('Las pruebas no usan la red');
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('hash', () => {
  it('ignora el orden de las claves, no el de las listas', () => {
    expect(dataHash({ a: 1, b: [1, 2] })).toBe(dataHash({ b: [1, 2], a: 1 }));
    expect(dataHash({ b: [1, 2] })).not.toBe(dataHash({ b: [2, 1] }));
  });
});

describe('detección de cambios', () => {
  it('entrega datos validados con una fuente pendiente de revisión', async () => {
    const result = await harness().run([ok(v1)]);
    expect(result).toMatchObject({ ok: true, change: 'new', attempts: 1, checkedAt: '2026-11-27T10:00:00.000Z' });
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(2);
    expect(result.source).toEqual({
      url: adapter.url,
      retrievedAt: '2026-11-27',
      hash: sha256(v1),
      parserVersion: 'ficticio-1',
      reviewStatus: 'pending',
    });
    expect(sourceSchema.parse(result.source)).toEqual(result.source);
  });

  it('distingue sin cambios, cambio solo de formato y cambio de datos', async () => {
    const h = harness();
    await h.run([ok(v1)]);
    h.clock.now = new Date('2026-11-28T10:00:00Z');
    expect(await h.run([ok(v1)])).toMatchObject({
      change: 'none',
      checkedAt: '2026-11-28T10:00:00.000Z',
      source: { retrievedAt: '2026-11-27' },
    });
    expect(await h.run([ok(v1Reordered)])).toMatchObject({ change: 'content', source: { retrievedAt: '2026-11-28' } });
    expect(await h.run([ok(v2)])).toMatchObject({ change: 'data' });
  });
});

describe('peticiones condicionales', () => {
  const validators = { etag: '"ficticio"', 'last-modified': 'Fri, 27 Nov 2026 09:00:00 GMT' };

  it('envía los validadores y reutiliza la caché ante un 304', async () => {
    const h = harness();
    await h.run([ok(v1, validators)]);
    expect(h.requests[0]!.headers).toEqual({});
    h.clock.now = new Date('2026-11-29T10:00:00Z');
    const result = await h.run([status(304)]);
    expect(h.requests[1]!.headers).toEqual({
      'if-none-match': validators.etag,
      'if-modified-since': validators['last-modified'],
    });
    expect(result).toMatchObject({
      ok: true,
      change: 'none',
      checkedAt: '2026-11-29T10:00:00.000Z',
      source: { retrievedAt: '2026-11-27', hash: sha256(v1) },
    });
    // Los validadores sobreviven a un 304.
    await h.run([status(304)]);
    expect(h.requests[2]!.headers['if-none-match']).toBe(validators.etag);
  });

  it('descarga completa al cambiar la versión del extractor', async () => {
    const h = harness();
    await h.run([ok(v1, validators)]);
    const result = await h.run([ok(v1, validators)], { adapter: { ...adapter, parserVersion: 'ficticio-2' } });
    expect(h.requests[1]!.headers).toEqual({});
    expect(result).toMatchObject({ ok: true, change: 'none', source: { parserVersion: 'ficticio-2' } });
  });

  it('rechaza un 304 que no se pidió', async () => {
    const result = await harness().run([status(304)]);
    expect(result).toMatchObject({ ok: false, error: { kind: 'http', status: 304 }, previous: null });
  });
});

describe('reintentos', () => {
  it('reintenta fallos temporales con espera creciente', async () => {
    const h = harness();
    const result = await h.run([new TypeError('conexión cortada'), status(503), ok(v1)]);
    expect(result).toMatchObject({ ok: true, attempts: 3 });
    expect(h.delays).toEqual([1_000, 2_000]);
  });

  it('se detiene en el límite', async () => {
    const h = harness();
    const result = await h.run([status(500), status(502), status(503)]);
    expect(result).toMatchObject({ ok: false, attempts: 3, error: { kind: 'http', status: 503 } });
    expect(h.requests).toHaveLength(3);
  });

  it.each([403, 404, 410])('no reintenta un %i', async (code) => {
    const h = harness();
    expect(await h.run([status(code)])).toMatchObject({ ok: false, attempts: 1, error: { status: code } });
    expect(h.delays).toEqual([]);
  });

  it('respeta Retry-After en segundos y como fecha', async () => {
    const h = harness();
    await h.run([
      status(429, { 'retry-after': '5' }),
      status(503, { 'retry-after': 'Fri, 27 Nov 2026 10:00:09 GMT' }),
      ok(v1),
    ]);
    expect(h.delays).toEqual([5_000, 9_000]);
  });

  it('abandona si la fuente pide esperar más que el máximo', async () => {
    const h = harness();
    const result = await h.run([status(429, { 'retry-after': '3600' })]);
    expect(result).toMatchObject({ ok: false, attempts: 1 });
    expect(h.delays).toEqual([]);
  });
});

describe('timeout', () => {
  it('corta un intento que no responde, aunque ignore la señal', async () => {
    vi.useFakeTimers();
    const h = harness();
    const silent = () => new Promise<Response>(() => {});
    const pending = h.run([silent, silent], { policy: { timeoutMs: 50, retries: 1 } });
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toMatchObject({ ok: false, attempts: 2, error: { kind: 'timeout' } });
    expect(h.requests.every((request) => request.signal.aborted)).toBe(true);
  });

  it('también cubre un cuerpo que no termina y lo cancela', async () => {
    vi.useFakeTimers();
    let cancelled = false;
    const body = new ReadableStream({ cancel: () => void (cancelled = true) });
    const pending = harness().run([new Response(body)], { policy: { timeoutMs: 50, retries: 0 } });
    await vi.advanceTimersByTimeAsync(50);
    expect(await pending).toMatchObject({ ok: false, error: { kind: 'timeout' } });
    expect(cancelled).toBe(true);
  });
});

describe('respuestas rechazadas', () => {
  it.each([
    ['otro host', 'https://otra.invalid/lista.json'],
    ['sin HTTPS', 'http://fuente.invalid/lista.json'],
    ['con credenciales', 'https://usuario@fuente.invalid/lista.json'],
    ['con otro puerto', 'https://fuente.invalid:8443/lista.json'],
    ['mal formada', 'no es una URL'],
  ])('no consulta una URL %s', async (_name, url) => {
    const h = harness();
    const result = await h.run([], { adapter: { ...adapter, url } });
    expect(result).toMatchObject({ ok: false, attempts: 0, error: { kind: 'blocked-url' } });
    expect(h.requests).toHaveLength(0);
  });

  it.each([
    ['redirect', () => status(302, { location: 'https://otra.invalid/' })],
    ['empty', () => ok('')],
    ['content-type', () => new Response('<html>ficticio</html>', { headers: { 'content-type': 'text/html' } })],
    ['parse', () => ok('{')],
    ['schema', () => ok(changedSchema)],
    ['too-large', () => ok(v1, { 'content-length': '999999999' })],
  ])('informa %s sin reintentar', async (kind, response) => {
    const h = harness();
    expect(await h.run([response()])).toMatchObject({ ok: false, attempts: 1, error: { kind } });
    expect(h.requests).toHaveLength(1);
  });

  it('limita el tamaño aunque no se declare', async () => {
    const result = await harness().run([ok(v1)], { policy: { maxBytes: 10 } });
    expect(result).toMatchObject({ ok: false, error: { kind: 'too-large' } });
  });

  it('trata un cuerpo interrumpido como fallo de red y reintenta', async () => {
    const broken = new Response(new ReadableStream({ start: (c) => c.error(new Error('cortado')) }));
    expect(await harness().run([broken, ok(v1)])).toMatchObject({ ok: true, attempts: 2 });
  });
});

describe('conservación de la última respuesta válida', () => {
  it.each([
    ['fallo de red', () => [new Error('a'), new Error('b'), new Error('c')]],
    ['cambio de esquema', () => [ok(changedSchema)]],
    ['página de error con 200', () => [new Response('x', { headers: { 'content-type': 'text/html' } })]],
  ])('no la reemplaza ante %s', async (_name, failing) => {
    const h = harness();
    await h.run([ok(v1)]);
    h.clock.now = new Date('2026-12-01T10:00:00Z');
    expect(await h.run(failing())).toMatchObject({
      ok: false,
      previous: { hash: sha256(v1), checkedAt: '2026-11-27T10:00:00.000Z' },
    });
    expect(await h.run([ok(v1)])).toMatchObject({ change: 'none' });
  });

  it('no se altera si el extractor modifica los bytes', async () => {
    const destructive = {
      ...adapter,
      parse: (body: Uint8Array) => {
        const data = adapter.parse(body);
        body.fill(0);
        return data;
      },
    };
    const result = await harness().run([ok(v1)], { adapter: destructive });
    expect(result).toMatchObject({ ok: true, source: { hash: sha256(v1) } });
  });

  it('informa un fallo de la caché', async () => {
    const full: SourceCache = { get: async () => null, put: async () => Promise.reject(new Error('disco lleno')) };
    const result = await harness(full).run([ok(v1)]);
    expect(result).toMatchObject({ ok: false, attempts: 1, error: { kind: 'cache' } });
  });
});

describe('caché en disco', () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'cache-ficticia-'));
  });
  afterEach(() => rm(directory, { recursive: true, force: true }));

  it('persiste entre ejecuciones y conserva un solo cuerpo por fuente', async () => {
    await harness(fileCache(directory)).run([ok(v1)]);
    const second = harness(fileCache(directory));
    expect(await second.run([ok(v1)])).toMatchObject({ change: 'none' });
    expect(await second.run([ok(v2)])).toMatchObject({ change: 'data' });
    expect((await readdir(directory)).sort()).toEqual([
      expect.stringMatching(new RegExp(`\\.${sha256(v2)}\\.bin$`)),
      expect.stringMatching(/\.json$/),
    ]);
  });

  it.each([
    ['el cuerpo', '.bin', 'otro contenido'],
    ['el índice', '.json', '{'],
  ])('descarta una entrada con %s dañado', async (_name, extension, content) => {
    const h = harness(fileCache(directory));
    await h.run([ok(v1, { etag: '"ficticio"' })]);
    const file = (await readdir(directory)).find((name) => name.endsWith(extension))!;
    await writeFile(join(directory, file), content);
    expect(await h.run([ok(v1)])).toMatchObject({ ok: true, change: 'new' });
    expect(h.requests[1]!.headers).toEqual({});
  });

  it('rechaza claves que no sean huellas', async () => {
    await expect(fileCache(directory).get('../fuera')).rejects.toThrow('no válida');
  });
});
