export interface Finding {
  area: 'format' | 'qa' | 'rules' | 'cards';
  /** `legality`: puede afectar a qué se puede jugar; revisar con prioridad. */
  severity: 'legality' | 'content';
  code: string;
  message: string;
  url: string;
}

/** Diferencias entre lo publicado en la fuente y lo registrado en el repositorio. */
export function difference(published: Iterable<string>, recorded: Iterable<string>) {
  const a = new Set(published);
  const b = new Set(recorded);
  return { added: [...a].filter((item) => !b.has(item)).sort(), removed: [...b].filter((item) => !a.has(item)).sort() };
}
