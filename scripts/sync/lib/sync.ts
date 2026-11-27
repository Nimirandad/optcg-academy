/**
 * Consulta las fuentes de cada área y las compara con los datos del repositorio. Solo informa:
 * no escribe datos ni cambia estados de revisión. Una fuente que falla no genera diferencias.
 */
import { z } from 'zod';
import type { Card, FormatSnapshot, Product } from '../../../src/lib/deck-schemas.ts';
import { compareCards, compareProductList, productAdapter, productListAdapter, seriesAdapter, type ProductList, type Series } from '../sources/cards.ts';
import { blocksAdapter, compareBlocks, compareRestrictions, compareRotation, restrictionAdapter, rotationAdapter, ARCHIVE_URL, type Registry } from '../sources/format.ts';
import { compareDocuments, faqAdapter, pdfAdapter } from '../sources/qa.ts';
import { compareErrata, compareRulesPage, errataAdapter, rulesAdapter, type Errata, type RulesPage } from '../sources/rules.ts';
import { runAdapter, type AdapterDeps, type AdapterResult, type SourceAdapter } from './adapter.ts';
import type { Finding } from './finding.ts';
import { sha256 } from './hash.ts';
import { decode } from './html.ts';
import type { RequestPolicy } from './request.ts';

export const AREAS = ['format', 'qa', 'rules', 'cards'] as const;
export type Area = (typeof AREAS)[number];

/** Última extracción aceptada de lo que el repositorio no guarda en otra parte. */
export interface Baseline {
  rules: RulesPage;
  errata: Errata;
  products: ProductList;
  series: string[];
  /** Avisos enlazados desde la lista de prohibidas. */
  restrictionNotices: string[];
  /** Huella de la página de historial de prohibidas. */
  archiveHash: string;
}

export interface Repository {
  snapshots: FormatSnapshot[];
  registry: Registry;
  documents: { sourceUrl: string; sha256: string }[];
  rulebook: { url: string; sha256: string };
  errataNotices: string[];
  cards: Card[];
  products: Product[];
  baseline: Baseline | null;
}

export interface SourceStatus {
  id: string;
  url: string;
  ok: boolean;
  /** Respecto de la caché; las diferencias con el repositorio van en `findings`. */
  change?: string;
  error?: string;
  /** Última comprobación con éxito, si se conoce. */
  checkedAt: string | null;
}

export interface Report {
  sources: SourceStatus[];
  findings: Finding[];
  notes: string[];
}

export interface SyncOptions {
  areas: readonly Area[];
  /** Descargar también los PDF para comparar sus huellas. */
  pdf: boolean;
  policy: RequestPolicy;
  deps: AdapterDeps;
}

export async function runSync(repo: Repository, { areas, pdf, policy, deps }: SyncOptions): Promise<Report> {
  const report: Report = { sources: [], findings: [], notes: [] };

  async function read<T>(adapter: SourceAdapter<T>): Promise<Extract<AdapterResult<T>, { ok: true }> | null> {
    const result = await runAdapter(adapter, policy, deps);
    report.sources.push(
      result.ok
        ? { id: result.id, url: adapter.url, ok: true, change: result.change, checkedAt: result.checkedAt }
        : {
            id: result.id,
            url: adapter.url,
            ok: false,
            error: `${result.error.kind}: ${result.error.message}`,
            checkedAt: result.previous?.checkedAt ?? null,
          },
    );
    return result.ok ? result : null;
  }

  /** Aviso cuando cambian los bytes de una página registrada como fuente de un snapshot. */
  const pageHash = (url: string, hash: string | undefined) => {
    const recorded = repo.snapshots.flatMap((s) => s.sources).find((source) => source.url === url && source.hash);
    const expected = recorded?.hash ?? (url === ARCHIVE_URL ? repo.baseline?.archiveHash : undefined);
    if (expected && hash !== expected) {
      report.findings.push({ area: 'format', severity: 'legality', code: 'page', message: 'La página cambió desde su revisión', url });
    }
  };

  const noBaseline = (what: string) => report.notes.push(`Sin línea base: no se comparó ${what}.`);

  if (areas.includes('format')) {
    const restriction = await read(restrictionAdapter);
    if (restriction) {
      const known = repo.baseline?.restrictionNotices ?? [];
      report.findings.push(...compareRestrictions(restriction.data, repo.snapshots, repo.registry, known));
      pageHash(restriction.source.url, restriction.source.hash);
    }
    const blocks = await read(blocksAdapter);
    if (blocks) {
      report.findings.push(...compareBlocks(blocks.data, repo.snapshots));
      pageHash(blocks.source.url, blocks.source.hash);
    }
    const rotation = await read(rotationAdapter);
    if (rotation) {
      report.findings.push(...compareRotation(rotation.data, repo.snapshots));
      pageHash(rotation.source.url, rotation.source.hash);
    }
    const archive = await read<{ hash: string }>({
      id: 'format-archive',
      url: ARCHIVE_URL,
      parserVersion: 'archive-1',
      contentTypes: ['text/html'],
      schema: z.strictObject({ hash: z.string() }),
      parse: (body) => {
        if (!decode(body).includes('History of Banned/Restricted Cards')) throw new Error('No es el historial');
        return { hash: sha256(body) };
      },
    });
    if (archive) pageHash(ARCHIVE_URL, archive.data.hash);
    report.notes.push('Las listas se comparan por número de carta; las fechas efectivas de cada entrada se revisan a mano.');
  }

  if (areas.includes('qa')) {
    const list = await read(faqAdapter);
    if (list) {
      report.findings.push(...compareDocuments(list.data.documents, repo.documents.map((item) => item.sourceUrl)));
      if (pdf) {
        for (const url of list.data.documents) {
          const known = repo.documents.find((item) => item.sourceUrl === url);
          if (!known) continue;
          const file = await read(pdfAdapter(url));
          if (file && file.data.sha256 !== known.sha256) {
            report.findings.push({ area: 'qa', severity: 'content', code: 'hash', message: 'El PDF cambió sin cambiar de URL', url });
          }
        }
      }
    }
    report.notes.push('Las preguntas de un documento cambiado se extraen a mano en macOS (extract-qa.swift).');
  }

  if (areas.includes('rules')) {
    const page = await read(rulesAdapter);
    if (page) {
      const known = [...(repo.baseline?.rules.notices ?? []), ...repo.errataNotices];
      if (!repo.baseline) noBaseline('los avisos de reglas');
      report.findings.push(
        ...compareRulesPage(page.data, repo.rulebook.url, repo.baseline ? known : page.data.notices),
      );
    }
    const errata = await read(errataAdapter);
    if (errata) {
      if (repo.baseline) report.findings.push(...compareErrata(errata.data, repo.baseline.errata));
      else noBaseline('las erratas');
    }
    if (pdf) {
      const file = await read(pdfAdapter(repo.rulebook.url));
      if (file && file.data.sha256 !== repo.rulebook.sha256) {
        report.findings.push({ area: 'rules', severity: 'legality', code: 'hash', message: 'El PDF del reglamento cambió', url: repo.rulebook.url });
      }
    }
  }

  if (areas.includes('cards')) {
    const queue = [...(repo.baseline?.series ?? [])];
    if (!queue.length) noBaseline('las series de cartas (no se consultó ninguna)');
    const seen = new Set(queue);
    const printings: Series['printings'] = [];
    let complete = queue.length > 0;
    // La cola crece si una página anuncia series que no estaban en la línea base.
    for (const series of queue) {
      const result = await read(seriesAdapter(series));
      if (!result) {
        complete = false;
        continue;
      }
      printings.push(...result.data.printings);
      for (const other of result.data.series) {
        if (seen.has(other)) continue;
        seen.add(other);
        queue.push(other);
        report.findings.push({ area: 'cards', severity: 'content', code: 'series', message: `Serie nueva: ${other}`, url: seriesAdapter(other).url });
      }
    }
    report.findings.push(...compareCards(printings, repo.cards, complete));
    if (!complete) report.notes.push('Lista de cartas incompleta: no se comprobaron retiradas.');
    const list = await read(productListAdapter);
    if (list) {
      if (repo.baseline) report.findings.push(...compareProductList(list.data, repo.products, repo.baseline.products));
      else noBaseline('el listado de productos');
      report.notes.push('Del listado de productos solo se lee la primera página.');
    }
    for (const product of repo.products) {
      const page = await read(productAdapter(product.sourceRef.url));
      if (page && page.data.releaseDate !== product.releaseDate) {
        report.findings.push({ area: 'cards', severity: 'legality', code: 'date', message: `${product.id}: fecha publicada ${page.data.releaseDate}`, url: product.sourceRef.url });
      }
    }
  }

  return report;
}

/** 1: alguna fuente falló; 2: hay diferencias; 0: sin cambios. */
export const exitCode = (report: Report) =>
  report.sources.some((source) => !source.ok) ? 1 : report.findings.length ? 2 : 0;

export function summary(report: Report): string {
  const failed = report.sources.filter((source) => !source.ok);
  return [
    `Fuentes: ${report.sources.length - failed.length} de ${report.sources.length} comprobadas.`,
    ...failed.map(
      (source) => `  FALLO ${source.id} · ${source.error} · última comprobación válida: ${source.checkedAt ?? 'desconocida'}`,
    ),
    `Diferencias: ${report.findings.length}.`,
    ...report.findings.map((item) => `  [${item.severity}] ${item.area}: ${item.message} · ${item.url}`),
    ...report.notes.map((note) => `Nota: ${note}`),
  ].join('\n');
}
