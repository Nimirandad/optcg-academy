/** Extractores y comparaciones de T6.2 con páginas y datos ficticios; sin red. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryCache } from '../../scripts/sync/lib/cache.ts';
import type { SourceAdapter } from '../../scripts/sync/lib/adapter.ts';
import { sha256 } from '../../scripts/sync/lib/hash.ts';
import { DEFAULT_POLICY, type Transport } from '../../scripts/sync/lib/request.ts';
import { exitCode, runSync, summary, type Repository } from '../../scripts/sync/lib/sync.ts';
import { localTransport, throttled } from '../../scripts/sync/lib/transport.ts';
import {
  compareCards,
  compareProductList,
  productAdapter,
  productListAdapter,
  seriesAdapter,
  seriesUrl,
} from '../../scripts/sync/sources/cards.ts';
import {
  BLOCKS_URL,
  blocksAdapter,
  compareBlocks,
  compareRestrictions,
  compareRotation,
  RESTRICTION_URL,
  restrictionAdapter,
  ROTATION_URL,
  rotationAdapter,
} from '../../scripts/sync/sources/format.ts';
import { compareDocuments, FAQ_URL, faqAdapter, pdfAdapter } from '../../scripts/sync/sources/qa.ts';
import { compareErrata, compareRulesPage, errataAdapter, rulesAdapter } from '../../scripts/sync/sources/rules.ts';
import { cardSchema, formatSnapshotSchema, productSchema } from '../../src/lib/deck-schemas.ts';
import * as pages from '../fixtures/sources/pages.fictitious.ts';

const SITE = 'https://en.onepiece-cardgame.com';
const bytes = (value: string) => new TextEncoder().encode(value);
const extract = <T>(adapter: SourceAdapter<T>, html: string) => adapter.schema.parse(adapter.parse(bytes(html)));
const codes = (findings: { code: string }[]) => findings.map((item) => item.code);

const sourceRef = { url: `${SITE}/ficticio`, retrievedAt: '2026-01-01', parserVersion: 'ficticio', reviewStatus: 'pending' };
const dated = { effectiveFrom: '2026-04-01', effectiveUntil: null };
const snapshot = formatSnapshotSchema.parse({
  id: 'ficticio',
  region: 'ficticia',
  format: 'standard',
  effectiveFrom: '2026-04-01',
  effectiveUntil: '2027-03-31',
  rotationPolicy: 'Ficticia',
  blockWindow: [2, 3, 4, 5],
  blockExceptions: [
    { cardId: 'OP99-010', treatedAs: 'X', ...dated },
    { cardId: 'OP99-011', treatedAs: 'X', ...dated },
    { cardId: 'OP99-020', treatedAs: 4, effectiveFrom: '2026-04-01', effectiveUntil: '2029-03-31' },
  ],
  bans: [{ cardId: 'OP99-001', ...dated }],
  restrictions: [],
  bannedPairs: [{ cards: ['OP99-003', 'OP99-002'], ...dated }],
  verifiedAt: '2026-04-01',
  reviewStatus: 'pending',
  sources: [{ ...sourceRef, url: `${SITE}/news/aviso-ficticio.html` }],
});
const registry = { banned: [{ cardId: 'OP99-001' }], pairs: [{ cards: ['OP99-002', 'OP99-003'] }] };

const card = cardSchema.parse({
  canonicalId: 'OP99-050',
  number: 'OP99-050',
  name: 'Ficticia',
  category: 'character',
  colors: ['red'],
  power: null,
  cost: 2,
  life: null,
  counter: null,
  printings: [
    { id: 'OP99-050', cardId: 'OP99-050', productId: 'OP-99', blockSymbol: 3, region: 'ficticia', releaseDate: null, sourceRef },
  ],
  printingsComplete: true,
  deckRules: [],
  sourceRef,
  reviewStatus: 'pending',
});

beforeEach(() => {
  vi.stubGlobal('fetch', () => {
    throw new Error('Las pruebas no usan la red');
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('prohibidas', () => {
  const read = (options?: Parameters<typeof pages.restrictionPage>[0]) =>
    extract(restrictionAdapter, pages.restrictionPage(options));

  it('sin diferencias no informa nada', () => {
    expect(compareRestrictions(read(), [snapshot], registry)).toEqual([]);
  });

  it('detecta altas, retiradas, cartas citadas y avisos nuevos', () => {
    const data = read({
      banned: ['OP99-004'],
      extra: '<p>Próximamente<br>OP99-005</p>',
      notice: 'aviso-nuevo-ficticio.html',
    });
    const findings = compareRestrictions(data, [snapshot], registry);
    expect(codes(findings).sort()).toEqual(['added', 'added', 'mentioned', 'mentioned', 'notice', 'removed', 'removed']);
    expect(findings.every((item) => item.severity === 'legality')).toBe(true);
  });

  it('ignora el contenido comentado', () => {
    expect(read({ extra: '<!-- OP99-090 -->' }).mentioned).not.toContain('OP99-090');
  });

  const outside = pages.restrictionPage().replace('<h4>Restricted Cards', '<p>OP99-007</p><h4>Restricted Cards');

  it.each([
    ['sin lista vigente', '<main class="mainCol"><p>OP99-001</p></main>', 'lista vigente'],
    ['sin contenido principal', '<p>vacío</p>', 'contenido principal'],
    ['con lista vacía', pages.restrictionPage({ banned: [] }), 'expected array'],
    ['con cartas restringidas', pages.restrictionPage({ restricted: '<ul><li>OP99-006</li></ul>' }), 'restringidas'],
    ['con una pareja de tres', pages.restrictionPage({ pairs: [['OP99-002', 'OP99-003', 'OP99-004']] }), 'dos cartas'],
    ['con una carta fuera de las listas', outside, 'fuera de la lista'],
  ])('falla %s', (_name, html, reason) => {
    expect(() => extract(restrictionAdapter, html)).toThrow(reason);
  });
});

describe('bloques y rotación', () => {
  it('lee las excepciones y no cuenta el pie de página', () => {
    const data = extract(blocksAdapter, pages.blocksPage());
    expect(data).toMatchObject({ x: ['OP99-010', 'OP99-011'], four: ['OP99-020'], fourUntil: '2029-03-31' });
    expect(compareBlocks(data, [snapshot])).toEqual([]);
    expect(codes(compareBlocks({ ...data, x: ['OP99-010'], fourUntil: '2028-03-31' }, [snapshot]))).toEqual([
      'removed',
      'period',
    ]);
  });

  it('falla ante un apartado desconocido con cartas', () => {
    const html = pages.blocksPage({ extra: '<h3>Block Number ⑤</h3><ul><li>OP99-060</li></ul>' });
    expect(() => extract(blocksAdapter, html)).toThrow('inesperado');
  });

  it('compara solo el apartado Standard', () => {
    const data = extract(rotationAdapter, pages.rotationPage());
    expect(data.periods).toHaveLength(2);
    expect(data.periods[0]!.blocks).toEqual([2, 3, 4, 5]);
    // El periodo de 2027 no tiene snapshot ficticio.
    expect(compareRotation(data, [snapshot])).toHaveLength(1);
    expect(compareRotation(extract(rotationAdapter, pages.rotationPage('⑥')), [snapshot])).toHaveLength(2);
    expect(() => extract(rotationAdapter, '<main class="mainCol">STANDARD REGULATION</main>')).toThrow();
  });
});

describe('Q&A y reglamento', () => {
  it('distingue documentos nuevos, actualizados y retirados', () => {
    const { documents } = extract(faqAdapter, pages.faqPage('qa_a.pdf?2', 'qa_b.pdf?1'));
    expect(documents).toHaveLength(3);
    const recorded = ['qa_ficticio_reglas.pdf?1', 'qa_a.pdf?1', 'qa_c.pdf?1'].map((file) => `${SITE}/pdf/${file}`);
    expect(codes(compareDocuments(documents, recorded))).toEqual(['updated', 'added', 'removed']);
  });

  it('solo acepta PDF', () => {
    const adapter = pdfAdapter(`${SITE}/pdf/ficticio.pdf`);
    expect(extract(adapter, '%PDF-ficticio').sha256).toBe(sha256('%PDF-ficticio'));
    expect(() => extract(adapter, '<html>')).toThrow('PDF');
  });

  it('detecta un reglamento nuevo y avisos desconocidos', () => {
    const data = extract(rulesAdapter, pages.rulesPage({ book: '2' }));
    expect(data.notices).toEqual([`${SITE}/topics/aviso-ficticio.php`]);
    expect(codes(compareRulesPage(data, `${SITE}/pdf/rule_comprehensive.pdf?1`, []))).toEqual(['rulebook', 'notice']);
    expect(compareRulesPage(data, data.rulebook, data.notices)).toEqual([]);
  });

  it('detecta erratas cambiadas sin guardar su texto', () => {
    const base = extract(errataAdapter, pages.errataPage());
    expect(base).toMatchObject({ updatedAt: '2026-01-02', cards: ['OP99-040'] });
    expect(JSON.stringify(base)).not.toContain('texto ficticio');
    expect(compareErrata(base, base)).toEqual([]);
    expect(compareErrata(extract(errataAdapter, pages.errataPage({ body: 'otro' })), base)[0]!.message).toContain('texto');
    expect(compareErrata(extract(errataAdapter, pages.errataPage({ date: 'March 1, 2026' })), base)).toHaveLength(1);
  });
});

describe('cartas y productos', () => {
  const read = (...cards: Parameters<typeof pages.seriesPage>[1][]) =>
    extract(seriesAdapter('1'), pages.seriesPage(['1'], ...cards)).printings;

  it('no informa si los datos coinciden y no altera el repositorio', () => {
    const before = structuredClone(card);
    expect(compareCards(read({}), [card], true)).toEqual([]);
    expect(card).toEqual(before);
  });

  it('detecta bloque, impresión nueva y regla de construcción', () => {
    const printings = read({ block: '4', effect: 'You cannot include ficticio' }, { id: 'OP99-050_p1' });
    const messages = compareCards(printings, [card], true).map((item) => item.message);
    expect(messages).toEqual([
      'OP99-050: impresión nueva OP99-050_p1',
      'OP99-050: OP99-050 difiere en regla de construcción, bloque',
    ]);
  });

  it('solo informa retiradas con la lista completa', () => {
    expect(codes(compareCards([], [card], true))).toEqual(['removed']);
    expect(compareCards([], [card], false)).toEqual([]);
  });

  it('falla si una carta queda sin extraer', () => {
    const html = pages.seriesPage(['1'], {}) + '<dl class="modalCol">sin id</dl>';
    expect(() => extract(seriesAdapter('1'), html)).toThrow('sin extraer');
  });

  it('compara productos y fechas', () => {
    const base = extract(productListAdapter, pages.productsPage({ path: 'a.html', title: 'A [ST-99]', date: '2026-01-01' }));
    const product = productSchema.parse({
      id: 'ST-99',
      kind: 'starter',
      name: 'A',
      region: 'ficticia',
      releaseDate: '2026-01-01',
      sourceRef,
    });
    expect(compareProductList(base, [product], base)).toEqual([]);
    const next = extract(
      productListAdapter,
      pages.productsPage({ path: 'a.html', title: 'A [ST-99]', date: '2026-02-01' }, { path: 'b.html', title: 'B' }),
    );
    expect(codes(compareProductList(next, [product], base))).toEqual(['date', 'added']);
    expect(extract(productAdapter(`${SITE}/a`), 'Release Date <b>March 5, 2027</b>')).toEqual({ releaseDate: '2027-03-05' });
  });
});

describe('ejecución', () => {
  const repo: Repository = {
    snapshots: [snapshot],
    registry,
    documents: [],
    rulebook: { url: `${SITE}/pdf/rule_comprehensive.pdf?20260101`, sha256: sha256('x') },
    errataNotices: [],
    cards: [card],
    products: [],
    baseline: {
      rules: extract(rulesAdapter, pages.rulesPage()),
      errata: extract(errataAdapter, pages.errataPage()),
      products: extract(productListAdapter, pages.productsPage({ path: 'a.html', title: 'A' })),
      series: ['1'],
      restrictionNotices: [],
      archiveHash: sha256('History of Banned/Restricted Cards'),
    },
  };
  const site = (map: Record<string, string>): Transport => async ({ url }) =>
    url in map
      ? new Response(map[url], { headers: { 'content-type': 'text/html' } })
      : new Response(null, { status: 404 });
  const run = (areas: Parameters<typeof runSync>[1]['areas'], transport: Transport) =>
    runSync(repo, {
      areas,
      pdf: false,
      policy: { ...DEFAULT_POLICY, allowedHosts: ['en.onepiece-cardgame.com'] },
      deps: { cache: memoryCache(), transport, now: () => new Date('2026-11-27T00:00:00Z'), sleep: async () => {} },
    });

  it('termina con 2 ante diferencias', async () => {
    const report = await run(
      ['format'],
      site({
        [RESTRICTION_URL]: pages.restrictionPage({ banned: ['OP99-001', 'OP99-004'] }),
        [BLOCKS_URL]: pages.blocksPage(),
        [ROTATION_URL]: pages.rotationPage(),
        [`${SITE}/news/restriction-archive.html`]: 'History of Banned/Restricted Cards',
      }),
    );
    expect(report.sources.every((source) => source.ok)).toBe(true);
    expect(exitCode(report)).toBe(2);
    expect(summary(report)).toContain('OP99-004');
  });

  it('una fuente caída termina con 1 y no se lee como retirada', async () => {
    const report = await run(['format', 'qa', 'cards'], site({}));
    expect(report.findings).toEqual([]);
    expect(exitCode(report)).toBe(1);
    expect(report.sources.find((source) => source.url === FAQ_URL)).toMatchObject({ ok: false, checkedAt: null });
  });

  it('consulta las series nuevas que anuncia la lista', async () => {
    const report = await run(
      ['cards'],
      site({
        [seriesUrl('1')]: pages.seriesPage(['1', '2'], {}),
        [seriesUrl('2')]: pages.seriesPage(['1', '2'], { id: 'OP99-050_p1' }),
        [`${SITE}/products/`]: pages.productsPage({ path: 'a.html', title: 'A' }),
      }),
    );
    expect(codes(report.findings)).toEqual(['series', 'printing']);
    expect(exitCode(report)).toBe(2);
  });

  it('sirve copias locales y responde 404 sin copia', async () => {
    const transport = localTransport(new Map([[FAQ_URL, new URL('file:///no-existe/ficticio.html')]]));
    const signal = new AbortController().signal;
    expect((await transport({ url: FAQ_URL, headers: {}, signal })).status).toBe(404);
    expect((await transport({ url: BLOCKS_URL, headers: {}, signal })).status).toBe(404);
  });

  it('separa las peticiones', async () => {
    let now = 1_000;
    const starts: number[] = [];
    const transport = throttled(
      async () => {
        starts.push(now);
        return new Response('x');
      },
      3_000,
      { now: () => now, sleep: async (ms) => void (now += ms) },
    );
    const request = { url: FAQ_URL, headers: {}, signal: new AbortController().signal };
    await transport(request);
    await transport(request);
    now += 10_000;
    await transport(request);
    expect(starts).toEqual([1_000, 4_000, 14_000]);
  });
});
