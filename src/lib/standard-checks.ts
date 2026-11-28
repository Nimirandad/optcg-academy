import report from '../../docs/sources/informe-sync-2026-11-27.json' with { type: 'json' };

/** Evidencia versionada de la última comparación completa aceptada (ADR-037). */
export const standardChecks = report.mode === 'red' && !report.findings.length
  ? report.sources.map((source) => source.ok ? source.checkedAt : null)
  : [];

const timestamps = standardChecks.map((check) => check ? Date.parse(check) : NaN);
export const oldestStandardCheck = timestamps.length && timestamps.every(Number.isFinite)
  ? new Date(Math.min(...timestamps)).toISOString()
  : null;
