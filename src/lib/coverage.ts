import { qaIndexSchema, qaNotesSchema, ruleChapterSchema, type RuleText } from './schemas.ts';

export type IssueCode =
  | 'invalid-schema'
  | 'version-mismatch'
  | 'missing'
  | 'duplicate'
  | 'unknown-id'
  | 'wrong-chapter'
  | 'broken-ref'
  | 'orphan-parent'
  | 'stale-source';

export interface Issue {
  code: IssueCode;
  message: string;
}

export interface CoverageInput {
  inventory: {
    source: { version: string };
    rules: { ruleId: string; parentId: string | null; chapter: number }[];
  };
  chapters: { file: string; data: unknown }[];
  /** Referencias a reglas desde otro contenido (glosario, lecciones). */
  references: { from: string; ruleId: string }[];
}

/** IDs de regla citados dentro de un texto; los capítulos sueltos ("3") no se detectan. */
export const RULE_ID_IN_TEXT = /(?<![\w-])\d{1,2}(?:-\d{1,2}){1,6}(?![\w-])/g;

export function validateCoverage({ inventory, chapters, references }: CoverageInput) {
  const issues: Issue[] = [];
  const report = (code: IssueCode, message: string) => issues.push({ code, message });
  const known = new Map(inventory.rules.map((rule) => [rule.ruleId, rule]));
  const covered = new Map<string, RuleText & { file: string }>();

  for (const rule of inventory.rules) {
    if (rule.parentId && !known.has(rule.parentId)) report('orphan-parent', `${rule.ruleId}: padre ${rule.parentId} inexistente`);
  }

  for (const { file, data } of chapters) {
    const parsed = ruleChapterSchema.safeParse(data);
    if (!parsed.success) {
      for (const error of parsed.error.issues) report('invalid-schema', `${file} ${error.path.join('.')}: ${error.message}`);
      continue;
    }
    const { chapter, sourceVersion, rules } = parsed.data;
    if (sourceVersion !== inventory.source.version) {
      report('version-mismatch', `${file}: versión ${sourceVersion}, inventario ${inventory.source.version}`);
    }
    for (const rule of rules) {
      const entry = known.get(rule.id);
      if (!entry) report('unknown-id', `${file}: ${rule.id} no está en el inventario`);
      else if (entry.chapter !== chapter) report('wrong-chapter', `${file}: ${rule.id} pertenece al capítulo ${entry.chapter}`);
      if (covered.has(rule.id)) report('duplicate', `${file}: ${rule.id} repetido`);
      else covered.set(rule.id, { ...rule, file });
      const text = [rule.explanation, rule.example, rule.tip].join(' ');
      for (const target of new Set([...rule.relatedIds, ...(text.match(RULE_ID_IN_TEXT) ?? [])])) {
        if (!known.has(target)) report('broken-ref', `${file}: ${rule.id} cita ${target}, que no existe`);
      }
    }
  }

  for (const { from, ruleId } of references) {
    if (!known.has(ruleId)) report('broken-ref', `${from} cita ${ruleId}, que no existe`);
  }
  for (const id of known.keys()) {
    if (!covered.has(id)) report('missing', `${id}: sin explicación`);
  }

  return { issues, covered };
}

export interface QaInput {
  ruleIds: Set<string>;
  index: unknown;
  notes: { file: string; data: unknown }[];
}

/** Cruza las explicaciones de Q&A con el índice de documentos oficiales. */
export function validateQa({ ruleIds, index, notes }: QaInput) {
  const issues: Issue[] = [];
  const report = (code: IssueCode, message: string) => issues.push({ code, message });
  const stats = { documents: 0, questions: 0, explained: 0, reviewed: 0, conflicts: 0 };

  const parsedIndex = qaIndexSchema.safeParse(index);
  if (!parsedIndex.success) {
    for (const error of parsedIndex.error.issues) report('invalid-schema', `índice ${error.path.join('.')}: ${error.message}`);
    return { issues, stats };
  }
  const questions = new Map<string, { hash: string; document: string }>();
  for (const document of parsedIndex.data.documents) {
    stats.documents += 1;
    for (const question of document.questions) {
      if (questions.has(question.id)) report('duplicate', `índice: ${question.id} repetido`);
      questions.set(question.id, { hash: question.hash, document: document.slug });
    }
  }
  stats.questions = questions.size;

  const explained = new Set<string>();
  for (const { file, data } of notes) {
    const parsed = qaNotesSchema.safeParse(data);
    if (!parsed.success) {
      for (const error of parsed.error.issues) report('invalid-schema', `${file} ${error.path.join('.')}: ${error.message}`);
      continue;
    }
    for (const entry of parsed.data.entries) {
      const source = questions.get(entry.id);
      if (!source || source.document !== parsed.data.document) {
        report('unknown-id', `${file}: ${entry.id} no está en el documento ${parsed.data.document}`);
        continue;
      }
      if (explained.has(entry.id)) report('duplicate', `${file}: ${entry.id} repetido`);
      explained.add(entry.id);
      if (source.hash !== entry.sourceHash && entry.reviewStatus !== 'superseded') {
        report('stale-source', `${file}: la fuente de ${entry.id} cambió; revisar la explicación`);
      }
      for (const id of entry.ruleIds) if (!ruleIds.has(id)) report('broken-ref', `${file}: ${entry.id} cita ${id}, que no existe`);
      if (entry.reviewStatus === 'reviewed') stats.reviewed += 1;
      if (entry.reviewStatus === 'conflict') stats.conflicts += 1;
    }
  }
  stats.explained = explained.size;
  return { issues, stats };
}
