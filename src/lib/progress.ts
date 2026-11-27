/** Progreso de la academia. TypeScript puro: el almacenamiento se inyecta. */

export const PROGRESS_KEY = 'optcg:progress';
export const PROGRESS_VERSION = 1;

export interface LessonProgress {
  completedAt: string;
  /** Mejor resultado obtenido. */
  correct: number;
  total: number;
  attempts: number;
}

export interface Progress {
  version: typeof PROGRESS_VERSION;
  lessons: Readonly<Record<string, LessonProgress>>;
}

/** `corrupt`: ilegible; `future`: escrito por una versión más nueva; `blocked`: sin acceso. */
export type ProgressIssue = 'corrupt' | 'future' | 'blocked';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const emptyProgress = (): Progress => ({ version: PROGRESS_VERSION, lessons: {} });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

function isLesson(value: unknown): value is LessonProgress {
  return (
    isRecord(value) &&
    typeof value.completedAt === 'string' &&
    isCount(value.correct) &&
    isCount(value.total) &&
    isCount(value.attempts) &&
    value.correct <= value.total
  );
}

/** Cada migración convierte la versión indicada en la siguiente. */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  // Versión 0: solo una lista de lecciones completadas, sin resultados.
  0: (data) => ({
    version: 1,
    lessons: Object.fromEntries(
      (Array.isArray(data.completed) ? data.completed : [])
        .filter((id): id is string => typeof id === 'string')
        .map((id) => [id, { completedAt: '', correct: 0, total: 0, attempts: 1 }]),
    ),
  }),
};

export function parseProgress(raw: string | null): { progress: Progress; issue?: ProgressIssue } {
  if (raw === null) return { progress: emptyProgress() };
  const corrupt = { progress: emptyProgress(), issue: 'corrupt' as const };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return corrupt;
  }
  if (!isRecord(data) || !isCount(data.version)) return corrupt;
  if (data.version > PROGRESS_VERSION) return { progress: emptyProgress(), issue: 'future' };
  let current = data;
  while ((current.version as number) < PROGRESS_VERSION) current = migrations[current.version as number](current);
  if (!isRecord(current.lessons)) return corrupt;
  const entries = Object.entries(current.lessons);
  const valid = entries.filter((entry): entry is [string, LessonProgress] => isLesson(entry[1]));
  return {
    progress: { version: PROGRESS_VERSION, lessons: Object.fromEntries(valid) },
    ...(valid.length < entries.length && { issue: 'corrupt' as const }),
  };
}

/** Devuelve un progreso nuevo; conserva el mejor resultado. */
export function recordAttempt(
  progress: Progress,
  lessonId: string,
  result: { correct: number; total: number },
  now: string,
): Progress {
  const previous = progress.lessons[lessonId];
  const better = !previous || result.correct / (result.total || 1) >= previous.correct / (previous.total || 1);
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        completedAt: now,
        correct: better ? result.correct : previous.correct,
        total: better ? result.total : previous.total,
        attempts: (previous?.attempts ?? 0) + 1,
      },
    },
  };
}

/** `storage` es una función porque acceder a `localStorage` puede lanzar un error. */
export function loadProgress(storage: () => StorageLike): { progress: Progress; issue?: ProgressIssue } {
  try {
    return parseProgress(storage().getItem(PROGRESS_KEY));
  } catch {
    return { progress: emptyProgress(), issue: 'blocked' };
  }
}

/** Guarda sin pisar datos de una versión futura; respalda los ilegibles. */
export function saveAttempt(
  storage: () => StorageLike,
  lessonId: string,
  result: { correct: number; total: number },
  now: string,
): { saved: boolean; issue?: ProgressIssue } {
  const { progress, issue } = loadProgress(storage);
  if (issue === 'future' || issue === 'blocked') return { saved: false, issue };
  try {
    const target = storage();
    const raw = target.getItem(PROGRESS_KEY);
    if (issue === 'corrupt' && raw !== null) target.setItem(`${PROGRESS_KEY}:backup`, raw);
    target.setItem(PROGRESS_KEY, JSON.stringify(recordAttempt(progress, lessonId, result, now)));
    return { saved: true, issue };
  } catch {
    return { saved: false, issue: 'blocked' };
  }
}

/** Borrado pedido por la persona: elimina también el respaldo. */
export function clearProgress(storage: () => StorageLike): boolean {
  try {
    storage().removeItem(PROGRESS_KEY);
    storage().removeItem(`${PROGRESS_KEY}:backup`);
    return true;
  } catch {
    return false;
  }
}
