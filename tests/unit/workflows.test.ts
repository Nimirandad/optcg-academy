/** Los workflows de sincronización solo se lanzan a mano y apenas pueden escribir (ADR-038, ADR-040). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (area: string) => readFileSync(`.github/workflows/sync-${area}.yml`, 'utf8').replace(/^\s*#.*\n/gm, '');
/** Contenido indentado bajo una clave que está a `indent` espacios. */
const block = (text: string, key: string, indent = 0) =>
  new RegExp(`^ {${indent}}${key}:\\n((?:(?: {${indent + 1},}.*)?\\n)*)`, 'm').exec(text)?.[1] ?? '';

describe.each(['cards', 'qa', 'rules', 'format'])('sync-%s.yml', (area) => {
  const text = read(area);
  const compare = block(text, 'comparar', 2);
  const notify = block(text, 'avisar', 2);

  it('solo tiene disparo manual', () => {
    expect(block(text, 'on').match(/^ {2}\S.*$/gm)).toEqual(['  workflow_dispatch:']);
  });

  it('solo el aviso escribe, y solo incidencias', () => {
    expect(block(text, 'permissions').trim()).toBe('contents: read');
    expect(block(notify, 'permissions', 4).trim()).toBe('issues: write');
    expect(text.match(/permissions:/g)).toHaveLength(2);
    expect(text.match(/: write/g)).toHaveLength(1);
  });

  it('el trabajo que escribe no ejecuta código del repositorio ni acciones', () => {
    expect(notify).not.toMatch(/uses:|\bnpm\b|\bnode\b|checkout/);
    // Los datos llegan por variables de entorno, nunca interpolados en el script.
    expect(notify.split('run: |')[1]).not.toContain('${{');
  });

  it('comparte el grupo que impide consultas simultáneas', () => {
    expect(block(text, 'concurrency')).toContain('group: sync-fuentes');
  });

  it('ejecuta su área y avisa solo si falla', () => {
    expect(compare).toContain(`node scripts/sync/run.ts ${area} --red`);
    expect(notify).toContain("if: ${{ always() && needs.comparar.result == 'failure' }}");
  });
});
