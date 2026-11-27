/**
 * T6.4: simulaciones de prohibición, rotación y fallo de fuente, de la detección a la
 * recomendación. Cartas, páginas, formatos y mazos ficticios; sin red.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryCache } from '../../scripts/sync/lib/cache.ts';
import { DEFAULT_POLICY, type Transport } from '../../scripts/sync/lib/request.ts';
import { exitCode, runSync, type Report, type Repository } from '../../scripts/sync/lib/sync.ts';
import { ARCHIVE_URL, BLOCKS_URL, RESTRICTION_URL, ROTATION_URL } from '../../scripts/sync/sources/format.ts';
import { canRecommend, freshness } from '../../src/domain/legality/freshness.ts';
import { legalityReport } from '../../src/domain/legality/report.ts';
import type { Suspension } from '../../src/domain/legality/types.ts';
import type { FormatSnapshot } from '../../src/lib/deck-schemas.ts';
import { card, cards, deck, FILLERS, snapshot, source } from '../fixtures/decks.fictitious.ts';
import * as pages from '../fixtures/sources/pages.fictitious.ts';

const SITE = 'https://en.onepiece-cardgame.com';
const [TARGET, OLD] = FILLERS as [string, string];
const BAN = 'OP99-090';
const PAIR: [string, string] = ['OP99-091', 'OP99-092'];
const open = { effectiveFrom: '2026-04-01', effectiveUntil: null };

/** Mazo legal hoy; una de sus cartas es de bloque 2 y sale en la rotación. */
const library = cards(card(OLD, {}, 2));

const format = (overrides: Partial<FormatSnapshot> = {}) =>
  snapshot({
    id: 'actual',
    effectiveFrom: '2026-04-01',
    effectiveUntil: '2027-03-31',
    blockWindow: [2, 3, 4, 5],
    blockExceptions: [
      { cardId: 'OP99-080', treatedAs: 'X', ...open },
      { cardId: 'OP99-081', treatedAs: 4, effectiveFrom: '2026-04-01', effectiveUntil: '2029-03-31' },
    ],
    bans: [{ cardId: BAN, ...open }],
    bannedPairs: [{ cards: PAIR, ...open }],
    sources: [{ ...source, url: `${SITE}/news/aviso-ficticio.html` }],
    ...overrides,
  });
const following = (overrides: Partial<FormatSnapshot> = {}) =>
  format({ id: 'siguiente', effectiveFrom: '2027-04-01', effectiveUntil: '2028-03-31', blockWindow: [3, 4, 5, 6], ...overrides });

const published = (banned: string[] = [BAN]): Record<string, string> => ({
  [RESTRICTION_URL]: pages.restrictionPage({ banned, pairs: [PAIR], mention: BAN }),
  [BLOCKS_URL]: pages.blocksPage({ x: ['OP99-080'], four: ['OP99-081'] }),
  [ROTATION_URL]: pages.rotationPage(),
  [ARCHIVE_URL]: 'History of Banned/Restricted Cards',
});

const repository = (snapshots: FormatSnapshot[], banned: string[] = [BAN]): Repository => ({
  snapshots,
  registry: { banned: banned.map((cardId) => ({ cardId })), pairs: [{ cards: PAIR }] },
  documents: [],
  rulebook: { url: `${SITE}/pdf/ficticio.pdf`, sha256: '' },
  errataNotices: [],
  cards: [],
  products: [],
  baseline: null,
});

/** Un sitio simulado cuyo contenido, reloj y caché persisten entre ejecuciones. */
function world(start = '2026-06-01T12:00:00Z') {
  const state = { now: new Date(start), site: published(), down: null as null | (() => Response) };
  const cache = memoryCache();
  const transport: Transport = async ({ url }) => {
    if (state.down) return state.down();
    return new Response(state.site[url], { headers: { 'content-type': 'text/html' } });
  };
  const sync = (repo: Repository) =>
    runSync(repo, {
      areas: ['format'],
      pdf: false,
      policy: { ...DEFAULT_POLICY, allowedHosts: ['en.onepiece-cardgame.com'] },
      deps: { cache, transport, now: () => state.now, sleep: async () => {} },
    });
  return { state, sync };
}

/** Lo que vería quien pide una recomendación Standard ese día. */
function recommended(
  snapshots: FormatSnapshot[],
  date: string,
  {
    suspensions = [] as Suspension[],
    checks = [`${date}T00:00:00Z`] as (string | null)[],
    now = `${date}T12:00:00Z`,
  } = {},
) {
  const [row] = legalityReport({ decks: [deck()], cards: library, snapshots, suspensions }, date).current;
  const state = freshness(checks, new Date(now));
  return { status: row!.validation?.status ?? null, freshness: state, shown: canRecommend(row!.validation, state) };
}

const lastGood = (report: Report) => report.sources.map((item) => item.checkedAt);

beforeEach(() => {
  vi.stubGlobal('fetch', () => {
    throw new Error('Las pruebas no usan la red');
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('simulación de prohibición', () => {
  it('detecta, suspende y aplica la prohibición desde su fecha efectiva', async () => {
    const { state, sync } = world();
    const current = [format(), following()];
    const before = repository(current);
    expect(exitCode(await sync(before))).toBe(0);
    expect(recommended(current, '2026-06-01')).toMatchObject({ status: 'valid', shown: true });

    // 1. La fuente publica una prohibición nueva.
    state.site = published([BAN, TARGET]);
    const original = structuredClone(before);
    const detected = await sync(before);
    expect(exitCode(detected)).toBe(2);
    expect(detected.findings.filter((item) => item.code === 'added' && item.message.includes(TARGET))).toHaveLength(3);
    expect(detected.findings.every((item) => item.severity === 'legality')).toBe(true);
    // La detección no cambia datos ni suspende por sí sola.
    expect(before).toEqual(original);
    expect(recommended(current, '2026-06-01').shown).toBe(true);

    // 2. Una persona publica la suspensión: se deja de recomendar sin declarar el mazo ilegal.
    const suspensions: Suspension[] = [
      { id: 'prohibicion-ficticia', target: { kind: 'card', cardId: TARGET }, effectiveFrom: '2026-06-01', effectiveUntil: null },
    ];
    expect(recommended(current, '2026-06-01', { suspensions })).toMatchObject({ status: 'pending-review', shown: false });

    // 3. Snapshot revisado con la fecha efectiva; la suspensión se retira.
    const bans = [...format().bans, { cardId: TARGET, effectiveFrom: '2026-07-01', effectiveUntil: null }];
    const approved = [format({ bans }), following({ bans })];
    expect(exitCode(await sync(repository(approved, [BAN, TARGET])))).toBe(0);
    expect(recommended(approved, '2026-06-30')).toMatchObject({ status: 'valid', shown: true });
    expect(recommended(approved, '2026-07-01')).toMatchObject({ status: 'invalid', shown: false });
  });
});

describe('simulación de rotación', () => {
  it('sin snapshot siguiente avisa y deja de recomendar al llegar la fecha', async () => {
    const report = await world().sync(repository([format()]));
    expect(report.findings.map((item) => item.message)).toEqual(['Periodo desde 2027-04-01 sin snapshot']);
    const legality = legalityReport({ decks: [deck()], cards: library, snapshots: [format()], suspensions: [] }, '2026-06-01');
    expect(legality.blocks).toEqual(['2027-04-01: sin snapshot aprobado que rija esa fecha.']);
    expect(recommended([format()], '2027-03-31').shown).toBe(true);
    expect(recommended([format()], '2027-04-01')).toMatchObject({ status: null, shown: false });
  });

  it('con un snapshot sin aprobar no recomienda desde la fecha', () => {
    const pending = following({ reviewStatus: 'pending', blockWindow: [2, 3, 4, 5, 6] });
    expect(recommended([format(), pending], '2027-04-01')).toMatchObject({ status: 'pending-review', shown: false });
  });

  it('con el snapshot aprobado anticipa el cambio sin invalidar antes', async () => {
    const snapshots = [format(), following()];
    expect(exitCode(await world().sync(repository(snapshots)))).toBe(0);
    const legality = legalityReport({ decks: [deck()], cards: library, snapshots, suspensions: [] }, '2027-03-31');
    expect(legality.current[0]!.validation).toMatchObject({ status: 'valid', nextKnownChange: '2027-04-01' });
    expect(legality.upcoming[0]!.validation!.violations.map((item) => [item.code, item.cardIds])).toEqual([['rotated', [OLD]]]);
    expect(recommended(snapshots, '2027-03-31').shown).toBe(true);
    expect(recommended(snapshots, '2027-04-01')).toMatchObject({ status: 'invalid', shown: false });
  });
});

describe('simulación de fallo de fuente', () => {
  const FIRST = '2026-06-01T12:00:00.000Z';
  const failures: [string, () => Response, string][] = [
    ['caída del servidor', () => new Response(null, { status: 503 }), 'http'],
    ['cambio de estructura', () => new Response('<main class="mainCol">nuevo diseño</main>', { headers: { 'content-type': 'text/html' } }), 'parse'],
    ['redirección', () => new Response(null, { status: 302 }), 'redirect'],
  ];

  it.each(failures)('ante %s conserva lo último, muestra su antigüedad y caduca', async (_name, down, kind) => {
    const { state, sync } = world(FIRST);
    const repo = repository([format(), following()]);
    const original = structuredClone(repo);
    await sync(repo);
    state.down = down;

    const at = async (now: string) => {
      state.now = new Date(now);
      const report = await sync(repo);
      expect(exitCode(report)).toBe(1);
      expect(report.findings).toEqual([]);
      expect(report.sources.every((item) => item.error?.startsWith(kind))).toBe(true);
      expect(lastGood(report)).toEqual([FIRST, FIRST, FIRST, FIRST]);
      return recommended(repo.snapshots, now.slice(0, 10), { checks: lastGood(report), now });
    };

    expect(await at('2026-06-03T12:00:00Z')).toMatchObject({ freshness: 'fresh', shown: true });
    expect(await at('2026-06-03T13:00:00Z')).toMatchObject({ freshness: 'stale', shown: true });
    expect(await at('2026-06-08T12:00:00Z')).toMatchObject({ freshness: 'stale', shown: true });
    // El mazo sigue siendo `valid` según el último snapshot, pero ya no se recomienda.
    expect(await at('2026-06-08T13:00:00Z')).toMatchObject({ status: 'valid', freshness: 'expired', shown: false });
    expect(repo).toEqual(original);

    state.down = null;
    const recovered = await sync(repo);
    expect(exitCode(recovered)).toBe(0);
    expect(freshness(lastGood(recovered), state.now)).toBe('fresh');
  });

  it('sin ninguna comprobación válida no recomienda', async () => {
    const { state, sync } = world();
    state.down = () => new Response(null, { status: 503 });
    const report = await sync(repository([format()]));
    expect(lastGood(report)).toEqual([null, null, null, null]);
    expect(recommended([format()], '2026-06-01', { checks: lastGood(report) }).shown).toBe(false);
  });

  it('una sola fuente atrasada basta para caducar', async () => {
    const { state, sync } = world(FIRST);
    await sync(repository([format(), following()]));
    state.now = new Date('2026-06-10T12:00:00Z');
    delete state.site[BLOCKS_URL];
    const report = await sync(repository([format(), following()]));
    expect(report.sources.filter((item) => !item.ok).map((item) => item.url)).toEqual([BLOCKS_URL]);
    expect(freshness(lastGood(report), state.now)).toBe('expired');
  });
});

describe('antigüedad', () => {
  const now = new Date('2026-06-10T00:00:00Z');

  it.each([
    ['sin fuentes', []],
    ['sin dato', [null]],
    ['con fecha ilegible', ['ayer']],
    ['con fecha futura', ['2026-06-11T00:00:00Z']],
  ])('caduca %s', (_name, checks) => {
    expect(freshness(checks, now)).toBe('expired');
  });
});
