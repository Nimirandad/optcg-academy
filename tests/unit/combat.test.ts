/** Los retos de combate se pueden superar y fallar según las reglas del motor. */
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/domain/game/reducer.ts';
import type { GameState } from '../../src/domain/game/types.ts';
import { scenes, verdict, type Scene } from '../../src/features/combat/scenes.ts';
import rules from '../../docs/coverage/rules-inventory.json';

/** Ejecuta las elecciones indicadas y las respuestas automáticas, como la interfaz. */
function play(scene: Scene, picks: string[]): GameState {
  let state = scene.create();
  const act = (action: Parameters<typeof apply>[1]) => {
    const result = apply(state, action);
    expect(result.ok, `${scene.id}: ${action.type}`).toBe(true);
    if (result.ok) state = result.state;
    for (let next = scene.auto(state); next; next = scene.auto(state)) act(next);
  };
  for (let next = scene.auto(state); next; next = scene.auto(state)) act(next);
  for (const id of picks) {
    const choice = scene.choices(state).find((item) => item.id === id);
    expect(choice, `${scene.id}: ${id}`).toBeDefined();
    act(choice!.action);
  }
  return state;
}

const paths: Record<string, { win: string[]; retry: string[] | null }> = {
  'primer-ataque': { win: ['atacar-1-leader'], retry: null },
  don: { win: ['don', 'atacar-1-leader'], retry: ['atacar-1-leader'] },
  objetivo: { win: ['atacar-OP12-046'], retry: ['atacar-1-leader'] },
  blocker: { win: ['bloquear'], retry: ['pasar'] },
  counter: { win: ['counter-0-hand1', 'resolver'], retry: ['counter-0-hand0', 'resolver'] },
};

describe('retos de combate', () => {
  it.each(scenes)('$id: se puede superar y fallar', (scene) => {
    const path = paths[scene.id]!;
    expect(verdict(scene, scene.create())).toBeNull();
    expect(verdict(scene, play(scene, path.win))).toBe('win');
    if (path.retry) expect(verdict(scene, play(scene, path.retry))).toBe('retry');
  });

  it('atacar a un personaje Active se rechaza con su regla', () => {
    const scene = scenes.find((item) => item.id === 'objetivo')!;
    const choice = scene.choices(scene.create()).find((item) => item.id === 'atacar-OP12-045')!;
    expect(apply(scene.create(), choice.action)).toMatchObject({ ok: false, error: { ruleIds: ['7-1-1-2'] } });
  });

  it('las reglas citadas existen', () => {
    const ids = new Set(rules.rules.map((rule) => rule.ruleId));
    for (const scene of scenes) for (const id of scene.ruleIds) expect(ids).toContain(id);
  });
});
