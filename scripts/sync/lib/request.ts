/**
 * Petición a una fuente con timeout, reintentos limitados y tamaño máximo.
 * El transporte se inyecta: este módulo no abre conexiones por sí mismo (ADR-006).
 * La respuesta es un dato; nunca se ejecuta ni se siguen sus instrucciones.
 */
export interface TransportRequest {
  url: string;
  headers: Record<string, string>;
  signal: AbortSignal;
}

/** Debe entregar las redirecciones sin seguirlas (`redirect: 'manual'`). */
export type Transport = (request: TransportRequest) => Promise<Response>;

export type SourceErrorKind =
  | 'blocked-url'
  | 'timeout'
  | 'network'
  | 'http'
  | 'redirect'
  | 'too-large'
  | 'empty'
  | 'content-type'
  | 'parse'
  | 'schema'
  | 'cache';

export class SourceError extends Error {
  readonly kind: SourceErrorKind;
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly retryAfterMs: number | undefined;
  /** Peticiones realizadas hasta el fallo. */
  attempts = 0;

  constructor(
    kind: SourceErrorKind,
    message: string,
    options: { status?: number; retryable?: boolean; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'SourceError';
    this.kind = kind;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
  }
}

export interface RequestPolicy {
  /** Nombres de host exactos que se pueden consultar. */
  allowedHosts: readonly string[];
  /** Plazo de cada intento, incluida la lectura del cuerpo. */
  timeoutMs: number;
  /** Reintentos además del primer intento. */
  retries: number;
  /** Espera antes del primer reintento; se duplica en cada uno. */
  backoffMs: number;
  /** Si la fuente pide esperar más que esto, no se reintenta. */
  maxDelayMs: number;
  maxBytes: number;
}

export const DEFAULT_POLICY: Omit<RequestPolicy, 'allowedHosts'> = {
  timeoutMs: 15_000,
  retries: 2,
  backoffMs: 1_000,
  maxDelayMs: 60_000,
  maxBytes: 10 * 1024 * 1024,
};

export interface RequestDeps {
  transport: Transport;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
}

export type SourceResponse = { attempts: number } & (
  | { notModified: true }
  | {
      notModified: false;
      body: Uint8Array;
      contentType: string | null;
      etag: string | null;
      lastModified: string | null;
    }
);

type Single = SourceResponse extends infer R ? (R extends unknown ? Omit<R, 'attempts'> : never) : never;

function assertAllowed(url: string, allowedHosts: readonly string[]): void {
  const parsed = URL.canParse(url) ? new URL(url) : null;
  const allowed =
    parsed !== null &&
    parsed.protocol === 'https:' &&
    parsed.port === '' &&
    parsed.username === '' &&
    parsed.password === '' &&
    allowedHosts.includes(parsed.hostname);
  if (!allowed) throw new SourceError('blocked-url', `URL no permitida: ${url}`);
}

/** `Retry-After` en segundos o como fecha HTTP. */
function retryAfter(value: string | null, now: Date): number | undefined {
  if (value === null) return undefined;
  if (/^\d+$/.test(value.trim())) return Number(value) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now.getTime());
}

async function readBody(response: Response, maxBytes: number, signal: AbortSignal): Promise<Uint8Array> {
  const tooLarge = () => new SourceError('too-large', `La respuesta supera ${maxBytes} bytes`);
  const reader = response.body?.getReader();
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await reader?.cancel();
    throw tooLarge();
  }
  if (!reader) return new Uint8Array();
  const cancel = () => void reader.cancel().catch(() => {});
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function exchange(
  url: string,
  headers: Record<string, string>,
  policy: RequestPolicy,
  deps: RequestDeps,
  signal: AbortSignal,
): Promise<Single> {
  const response = await deps.transport({ url, headers: { ...headers }, signal });
  const { status } = response;
  if (status === 200) {
    const body = await readBody(response, policy.maxBytes, signal);
    if (body.byteLength === 0) throw new SourceError('empty', 'La respuesta no tiene contenido', { status });
    return {
      notModified: false,
      body,
      contentType: response.headers.get('content-type'),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
    };
  }
  await response.body?.cancel();
  const conditional = 'if-none-match' in headers || 'if-modified-since' in headers;
  if (status === 304 && conditional) return { notModified: true };
  if (status >= 300 && status < 400 && status !== 304) {
    throw new SourceError('redirect', `Redirección ${status} sin seguir: revisar la URL de la fuente`, { status });
  }
  throw new SourceError('http', `Respuesta HTTP ${status}`, {
    status,
    retryable: status === 408 || status === 429 || status >= 500,
    retryAfterMs: retryAfter(response.headers.get('retry-after'), deps.now()),
  });
}

async function attempt(
  url: string,
  headers: Record<string, string>,
  policy: RequestPolicy,
  deps: RequestDeps,
): Promise<Single> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // La carrera cubre también un transporte que ignore la señal.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new SourceError('timeout', `Sin respuesta en ${policy.timeoutMs} ms`, { retryable: true }));
      controller.abort();
    }, policy.timeoutMs);
  });
  try {
    return await Promise.race([exchange(url, headers, policy, deps, controller.signal), deadline]);
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError('network', `Fallo de red: ${error instanceof Error ? error.message : String(error)}`, {
      retryable: true,
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Solo falla con `SourceError`. */
export async function requestSource(
  url: string,
  headers: Record<string, string>,
  policy: RequestPolicy,
  deps: RequestDeps,
): Promise<SourceResponse> {
  assertAllowed(url, policy.allowedHosts);
  for (let attempts = 1; ; attempts += 1) {
    try {
      return { ...(await attempt(url, headers, policy, deps)), attempts };
    } catch (error) {
      const failure = error as SourceError;
      failure.attempts = attempts;
      const delay = failure.retryAfterMs ?? Math.min(policy.backoffMs * 2 ** (attempts - 1), policy.maxDelayMs);
      if (!failure.retryable || attempts > policy.retries || delay > policy.maxDelayMs) throw failure;
      await deps.sleep(delay);
    }
  }
}
