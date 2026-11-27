const RULE_ID = /^\d{1,2}(-\d{1,2}){0,6}$/;

/** Acepta `1-3-5-1` y las formas con puntos (`8.4.`); devuelve el ID canónico o `null`. */
export function normalizeRuleId(input: string): string | null {
  const id = input.trim().replace(/\.+$/, '').replace(/\./g, '-');
  return RULE_ID.test(id) ? id : null;
}

export function ruleAnchor(ruleId: string): string {
  return `regla-${ruleId}`;
}

/** Ruta interna (sin base) de una regla. */
export function rulePath(ruleId: string): string {
  const chapter = ruleId.split('-')[0];
  return `reglas/${chapter}/#${ruleAnchor(ruleId)}`;
}
