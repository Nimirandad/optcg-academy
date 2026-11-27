/** Motor educativo. Todas las cartas son ficticias. */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createOrder, createReplacement, decide, eligible, resolvePending } from '../../src/domain/game/order';
import { apply, run } from '../../src/domain/game/reducer';
import { activePlayer, createGame, createState, powerOf, type PlayerSpec } from '../../src/domain/game/state';
import type { Action, GameState } from '../../src/domain/game/types';
import { declareAttack, scenarios } from '../../src/features/battle/scenarios';
import { effectScenarios } from '../../src/features/effects/scenarios';
import { tables } from '../../src/features/playmat/setup';
import { cards, pile } from '../../src/features/shared/cards';
import { newGame } from '../../src/features/turns/setup';
import { inventory } from '../../src/lib/inventory';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const rules = new Set(inventory.rules.map((rule) => rule.ruleId));
const known = (ids: readonly string[]) => ids.filter((id) => !rules.has(id));

/** Aplica sobre un estado congelado y comprueba que las reglas citadas existan. */
function act(state: GameState, ...actions: Action[]): GameState {
  const next = actions.reduce((current, action) => run(freeze(current), [action]), state);
  expect(known(next.log.flatMap((entry) => entry.ruleIds))).toEqual([]);
  return next;
}

function reject(state: GameState, action: Action, rule: string) {
  const result = apply(freeze(state), action);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error.ruleIds).toContain(rule);
  expect(known(result.error.ruleIds)).toEqual([]);
}

const scenario = (id: string) => scenarios.find((item) => item.id === id)!.create();
const effects = (id: string) => {
  const found = effectScenarios.find((item) => item.id === id)!;
  if (found.kind !== 'game') throw new Error(id);
  return found.create();
};
const attack = (state: GameState, attacker: string, target = '1-leader', ...after: Action[]) =>
  act(state, { type: 'attack', attacker, target }, ...after);
const pass: Action[] = [{ type: 'skip-block' }, { type: 'resolve' }];
const advance: Action = { type: 'advance' };

describe('arquitectura', () => {
  it('el dominio solo importa archivos del propio dominio', () => {
    const files = readdirSync('src/domain', { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    const outside = files.flatMap((file) =>
      [...readFileSync(`src/domain/${file}`, 'utf8').matchAll(/(?:from\s+|import\(\s*|import\s+)['"]([^'"]+)['"]/g)]
        .map((match) => match[1]!)
        .filter((path) => !/^\.\/[\w-]+(\.ts)?$/.test(path))
        .map((path) => `${file}: ${path}`),
    );
    expect(outside).toEqual([]);
  });

  it('es determinista: las mismas acciones producen el mismo estado', () => {
    const play = () => run(newGame(0), [advance, advance, advance, advance, advance]);
    expect(play()).toEqual(play());
  });
});

describe('combate', () => {
  it('el empate favorece al atacante', () => {
    const state = attack(scenario('empate'), '0-leader', '1-leader', ...pass);
    expect(state.players[1].life).toHaveLength(2);
    expect(state.players[1].hand).toHaveLength(1);
    expect(state.battle).toBeNull();
  });

  it('el ataque fallido no daña ni causa K.O. al atacante', () => {
    const state = attack(scenario('fallido'), 'grumete', '1-leader', ...pass);
    expect(state.players[1].life).toHaveLength(3);
    expect(state.players[0].characters).toHaveLength(1);
    expect(state.players[0].characters[0]!.rested).toBe(true);
  });

  it('K.O.: el DON!! del defensor no suma y vuelve Rested', () => {
    const start = scenario('ko');
    expect(powerOf(start, 'vigia')).toBe(4000);
    const state = attack(start, 'artillero', 'vigia', ...pass);
    expect(state.players[1].characters).toEqual([]);
    expect(state.players[1].trash.map((card) => card.id)).toEqual(['vigia']);
    expect(state.players[1].donRested).toBe(2);
  });

  it('el DON!! asignado suma 1000 solo en el turno propio', () => {
    const result = declareAttack(scenario('don'), { attacker: 'vigia', target: '1-leader', don: 1 });
    expect(result.ok && powerOf(result.state, 'vigia')).toBe(5000);
    const later = act(scenario('don'), { type: 'attach', uid: 'vigia' }, advance, advance);
    expect(powerOf(later, 'vigia')).toBe(4000);
  });

  it('el poder base elegido se respeta y un ataque ilegal no gasta DON!!', () => {
    const base = scenario('empate');
    const strong = declareAttack(base, { attacker: '0-leader', target: '1-leader', don: 0, targetPower: 9000 });
    expect(strong.ok && powerOf(strong.state, '1-leader')).toBe(9000);
    const illegal = declareAttack(scenario('rush-character'), { attacker: 'cazador', target: '1-leader', don: 2 });
    expect(illegal.ok).toBe(false);
  });

  it('daño con 0 cartas de Life: se pierde; quedarse sin Life no basta', () => {
    const state = attack(scenario('sin-vida'), '0-leader', '1-leader', ...pass);
    expect(state.result?.losers).toEqual([1]);
    reject(state, advance, '1-2-1');
    const last = createState({
      turn: 3,
      players: [
        { name: 'A', leader: { card: cards.capitana }, deck: [cards.grumete] },
        { name: 'B', leader: { card: cards.almirante }, deck: [cards.grumete], life: [cards.vigia] },
      ],
    });
    expect(attack(last, '0-leader', '1-leader', ...pass).result).toBeNull();
  });

  it('[Blocker] cambia el objetivo una sola vez', () => {
    const state = attack(scenario('blocker'), 'artillero', '1-leader', { type: 'block', uid: 'escudo' });
    expect(state.battle?.target).toBe('escudo');
    reject(state, { type: 'block', uid: 'escudo' }, '7-1-2-1');
    const done = act(state, { type: 'resolve' });
    expect(done.players[1].life).toHaveLength(3);
    expect(done.players[1].characters).toEqual([]);
  });

  it('[Blocker] exige estar Active y no sirve si atacan a esa carta', () => {
    const start = scenario('blocker');
    const rested = {
      ...start,
      players: [
        start.players[0],
        { ...start.players[1], characters: start.players[1].characters.map((item) => ({ ...item, rested: true })) },
      ],
    } as GameState;
    reject(attack(rested, 'artillero'), { type: 'block', uid: 'escudo' }, '10-1-4-1');
    reject(attack(rested, 'artillero', 'escudo'), { type: 'block', uid: 'escudo' }, '10-1-4-1');
  });

  it('[Unblockable] impide bloquear', () => {
    reject(attack(scenario('unblockable'), 'sombra'), { type: 'block', uid: 'escudo' }, '10-1-7-1');
  });

  it('Counter con Character y Event: solo dura la batalla', () => {
    let state = attack(scenario('counter'), 'artillero', '1-leader', { type: 'skip-block' });
    for (const uid of ['1-hand0', '1-hand1']) state = act(state, { type: 'counter', uid, target: '1-leader' });
    expect(powerOf(state, '1-leader')).toBe(11000);
    expect(state.players[1].donRested).toBe(1);
    state = act(state, { type: 'resolve' });
    expect(powerOf(state, '1-leader')).toBe(5000);
    expect(state.players[1].life).toHaveLength(3);
    expect(state.players[1].trash).toHaveLength(2);
  });

  it('un Counter de Event sin DON!! se rechaza', () => {
    const start = scenario('counter');
    const broke = { ...start, players: [start.players[0], { ...start.players[1], donActive: 0 }] } as GameState;
    const state = attack(broke, 'artillero', '1-leader', { type: 'skip-block' });
    reject(state, { type: 'counter', uid: '1-hand1', target: '1-leader' }, '7-1-3-1-2');
  });

  it('[Double Attack] quita 2 de Life', () => {
    const state = attack(scenario('double-attack'), 'doble', '1-leader', ...pass);
    expect(state.players[1].life).toHaveLength(1);
    expect(state.players[1].hand).toHaveLength(2);
  });

  it('[Double Attack] contra 1 de Life no gana (Q&A rules-p6-1)', () => {
    const state = attack(scenario('double-attack-una-vida'), 'doble', '1-leader', ...pass);
    expect(state.result).toBeNull();
    expect(state.players[1].life).toEqual([]);
    expect(state.battle).toBeNull();
  });

  it('[Banish] manda la carta al Trash sin [Trigger]', () => {
    const state = attack(scenario('banish'), 'desterrador', '1-leader', ...pass);
    expect(state.battle).toBeNull();
    expect(state.players[1].trash.map((card) => card.id)).toEqual(['mensaje']);
    expect(state.players[1].hand).toEqual([]);
  });

  it('[Trigger] es opcional', () => {
    const pending = attack(scenario('trigger'), '0-leader', '1-leader', ...pass);
    expect(pending.battle?.step).toBe('trigger');
    reject(pending, advance, '7-1');
    const used = act(pending, { type: 'trigger', activate: true });
    expect(used.players[1].trash.map((card) => card.id)).toEqual(['mensaje']);
    expect(used.players[1].hand.map((card) => card.id)).toEqual(['grumete']);
    const kept = act(pending, { type: 'trigger', activate: false });
    expect(kept.players[1].hand.map((card) => card.id)).toEqual(['mensaje']);
    expect(kept.players[1].trash).toEqual([]);
  });

  it('[Trigger] que vacía el mazo causa la derrota', () => {
    const start = scenario('trigger');
    const short = { ...start, players: [start.players[0], { ...start.players[1], deck: start.players[1].deck.slice(0, 1) }] } as GameState;
    const state = attack(short, '0-leader', '1-leader', ...pass, { type: 'trigger', activate: true });
    expect(state.result?.losers).toEqual([1]);
  });

  it('con [Double Attack], el daño sigue después de un [Trigger]', () => {
    const start = scenario('double-attack');
    const withTrigger = {
      ...start,
      players: [start.players[0], { ...start.players[1], life: [{ ...cards.mensaje, uid: 'x' }, ...start.players[1].life] }],
    } as GameState;
    const state = attack(withTrigger, 'doble', '1-leader', ...pass, { type: 'trigger', activate: false });
    expect(state.players[1].life).toHaveLength(2);
    expect(state.battle).toBeNull();
  });

  it('[Rush: Character] ataca Characters, no al Leader', () => {
    const state = scenario('rush-character');
    reject(state, { type: 'attack', attacker: 'cazador', target: '1-leader' }, '10-1-6-1');
    expect(attack(state, 'cazador', 'grumete', ...pass).players[1].characters).toEqual([]);
  });

  it('rechaza atacar Characters Active y atacar con cartas Rested', () => {
    reject(scenario('blocker'), { type: 'attack', attacker: 'artillero', target: 'escudo' }, '7-1-1-2');
    const after = attack(scenario('empate'), '0-leader', '1-leader', ...pass);
    reject(after, { type: 'attack', attacker: '0-leader', target: '1-leader' }, '7-1-1-1');
  });

  it('sin batalla abierta, los pasos de combate se rechazan', () => {
    const state = scenario('empate');
    reject(state, { type: 'resolve' }, '7-1-4');
    reject(state, { type: 'skip-block' }, '7-1-2');
    reject(state, { type: 'trigger', activate: true }, '10-1-5-1');
  });
});

describe('turnos', () => {
  const toMain = [advance, advance, advance];
  const nextTurn = [advance, advance, advance, advance, advance];

  it('prepara la partida: 5 en mano y Life desde la parte superior', () => {
    const deck = [cards.grumete, cards.grumete, cards.grumete, cards.grumete, cards.grumete, cards.vigia, ...pile([cards.escudo], 8)];
    const game = createGame([
      { name: 'A', leader: cards.capitana, deck },
      { name: 'B', leader: cards.almirante, deck },
    ]);
    expect(game.players[0].hand).toHaveLength(5);
    expect(game.players[0].life).toHaveLength(5);
    expect(game.players[0].life.at(-1)!.id).toBe('vigia');
    expect(game.players[0].deck).toHaveLength(4);
  });

  it('primer turno: sin robo, 1 DON!! y sin atacar', () => {
    const state = act(newGame(0), ...toMain);
    expect(state.players[0].hand).toHaveLength(5);
    expect(state.players[0].donActive).toBe(1);
    reject(state, { type: 'attack', attacker: '0-leader', target: '1-leader' }, '6-5-6-1');
  });

  it('segunda persona: roba, recibe 2 DON!! y tampoco ataca', () => {
    const state = act(newGame(0), ...nextTurn, ...toMain);
    expect(activePlayer(state)).toBe(1);
    expect(state.players[1].hand).toHaveLength(6);
    expect(state.players[1].donActive).toBe(2);
    reject(state, { type: 'attack', attacker: '1-leader', target: '0-leader' }, '6-5-6-1');
    const third = act(state, ...nextTurn);
    expect(attack(third, '0-leader', '1-leader').battle).not.toBeNull();
  });

  it('puede empezar la otra persona', () => {
    expect(activePlayer(newGame(1))).toBe(1);
  });

  it.each([
    [1, 1, '6-4-2'],
    [0, 0, '6-4-3'],
  ])('DON!! deck con %i carta(s)', (donDeck, added, rule) => {
    const player: PlayerSpec = { name: 'A', leader: { card: cards.capitana }, deck: pile([cards.grumete], 3), donDeck };
    const state = act(createState({ turn: 3, phase: 'draw', players: [player, player] }), advance);
    expect(state.players[0].donActive).toBe(added);
    expect(state.players[0].donDeck).toBe(0);
    expect(state.log.at(-1)!.ruleIds).toEqual([rule]);
  });

  it('Refresh devuelve el DON!! asignado y reactiva todo', () => {
    let state = act(newGame(0), ...toMain, { type: 'attach', uid: '0-leader' });
    expect(state.players[0].donActive).toBe(0);
    state = act(state, ...nextTurn, ...nextTurn.slice(0, 2));
    expect(state.turn).toBe(3);
    expect(state.players[0].leader.don).toBe(0);
    expect(state.players[0].donActive).toBe(1);
  });

  it('perder por mazo vacío al robar la última carta', () => {
    const player: PlayerSpec = { name: 'A', leader: { card: cards.capitana }, deck: [cards.grumete] };
    const state = act(createState({ turn: 3, phase: 'refresh', players: [player, player] }), advance);
    expect(state.result?.losers).toEqual([0]);
  });

  it('rechaza acciones fuera de la Main Phase y sin recursos', () => {
    const start = newGame(0);
    reject(start, { type: 'play', uid: '0-hand0' }, '6-5-3-1');
    reject(start, { type: 'attach', uid: '0-leader' }, '6-5-5-1');
    const main = act(start, ...toMain);
    reject(main, { type: 'play', uid: '0-hand2' }, '6-5-3-1');
    reject(main, { type: 'play', uid: '0-hand3' }, '10-2-4-1');
    reject(main, { type: 'play', uid: 'no-existe' }, '6-5-3-1');
    reject(act(main, { type: 'attach', uid: '0-leader' }), { type: 'attach', uid: '0-leader' }, '6-5-5-1');
  });

  it('conceder termina la partida', () => {
    expect(act(newGame(0), { type: 'concede', player: 0 }).result?.losers).toEqual([0]);
  });
});

describe('límites del campo', () => {
  const table = () => tables[1].create();

  it('con 5 Characters exige elegir reemplazo, que no es K.O.', () => {
    const state = table();
    reject(state, { type: 'play', uid: '0-hand0' }, '3-7-6-1');
    const old = state.players[0].characters[0]!.card.uid;
    const next = act(state, { type: 'play', uid: '0-hand0', replace: old });
    expect(next.players[0].characters).toHaveLength(5);
    expect(next.players[0].trash.map((card) => card.uid)).toEqual([old]);
    expect(next.log.some((entry) => entry.text.includes('No es un K.O.'))).toBe(true);
    expect(next.log.flatMap((entry) => entry.ruleIds)).not.toContain('10-2-1-1');
  });

  it('solo cabe un Stage: el anterior va al Trash', () => {
    const next = act(table(), { type: 'play', uid: '0-hand1' });
    expect(next.players[0].stage!.card.id).toBe('faro');
    expect(next.players[0].trash.map((card) => card.id)).toEqual(['puerto']);
  });

  it('no permite reemplazar con hueco libre', () => {
    const state = act(newGame(0), advance, advance, advance);
    reject(state, { type: 'play', uid: '0-hand0', replace: '0-leader' }, '3-7-6-1');
  });
});

describe('efectos', () => {
  const use = (uid: string, effectId: string, extra: Partial<Extract<Action, { type: 'activate' }>> = {}): Action => ({
    type: 'activate',
    uid,
    effectId,
    ...extra,
  });

  it('condición [DON!! x1] antes de pagar el coste', () => {
    const state = effects('condiciones');
    reject(state, use('cronista-1', 'anotar'), '8-3-2-3');
    const next = act(state, { type: 'attach', uid: 'cronista-1' }, use('cronista-1', 'anotar'));
    expect(next.players[0].hand).toHaveLength(3);
    expect(next.players[0]).toMatchObject({ donActive: 1, donRested: 2 });
  });

  it('[Once Per Turn] es por carta y se renueva cada turno', () => {
    const once = act(effects('una-vez'), use('tambor-1', 'redoble'));
    reject(once, use('tambor-1', 'redoble'), '10-2-13-3');
    const both = act(once, use('tambor-2', 'redoble'));
    expect(powerOf(both, 'tambor-2')).toBe(5000);
    const rivalTurn = act(both, advance);
    expect(powerOf(rivalTurn, 'tambor-1')).toBe(3000);
    const mine = act(rivalTurn, ...Array<Action>(9).fill(advance));
    expect(mine.turn).toBe(5);
    expect(act(mine, use('tambor-1', 'redoble')).used).toEqual(['tambor-1:redoble']);
  });

  it('DON!! −X y descarte: todo o nada', () => {
    const state = effects('don-menos');
    const discard = ['0-hand0'];
    reject(state, use('alquimista-1', 'canje', { discard }), '8-3-1-6');
    reject(state, use('alquimista-1', 'canje', { discard, donFrom: ['cost-active', 'alquimista-1'] }), '8-3-1-6');
    reject(state, use('alquimista-1', 'canje', { donFrom: ['cost-active', 'cost-rested'] }), '8-3-1-3');
    const next = act(state, use('alquimista-1', 'canje', { discard, donFrom: ['cost-active', 'cost-rested'] }));
    expect(next.players[0]).toMatchObject({ donActive: 2, donRested: 0, donDeck: 7 });
    expect(next.players[0].hand).toHaveLength(3);
  });

  it('solo en la Main Phase y fuera de batalla', () => {
    reject(act(effects('una-vez'), advance), use('tambor-1', 'redoble'), '10-2-2-1');
    const fighting = attack(effects('una-vez'), 'tambor-1', '1-leader');
    reject(fighting, use('tambor-2', 'redoble'), '10-2-2-1');
  });

  it('orden: persona del turno, rival y después lo recién activado', () => {
    const found = effectScenarios.find((item) => item.id === 'simultaneos')!;
    if (found.kind !== 'order') throw new Error();
    let order = createOrder(found.turnPlayer, found.pending);
    expect(resolvePending(order, 'b').ok).toBe(false);
    for (const expected of ['a', 'b', 'c']) {
      expect(eligible(order).map((effect) => effect.id)).toEqual([expected]);
      const result = resolvePending(freeze(order), expected);
      if (!result.ok) throw new Error();
      order = result.state;
    }
    expect(order.waves).toEqual([]);
    expect(known(order.log.flatMap((entry) => entry.ruleIds))).toEqual([]);
  });

  it('lo que nace al resolver A espera a B', () => {
    const found = effectScenarios.find((item) => item.id === 'dos-propios')!;
    if (found.kind !== 'order') throw new Error();
    const first = resolvePending(createOrder(0, found.pending), 'a');
    if (!first.ok) throw new Error();
    expect(resolvePending(first.state, 'c').ok).toBe(false);
    expect(eligible(first.state).map((effect) => effect.id)).toEqual(['b']);
  });

  const replacement = (id: string) => {
    const found = effectScenarios.find((item) => item.id === id)!;
    if (found.kind !== 'replacement') throw new Error(id);
    return createReplacement(found.turnPlayer, found.process, found.options);
  };

  it('reemplazo: primero la persona del turno; declinar pasa al rival', () => {
    const start = replacement('reemplazo');
    expect(start.queue.map((item) => item.id)).toEqual(['propio', 'rival']);
    const applied = decide(freeze(start), true);
    expect(applied.ok && applied.state.queue).toEqual([]);
    const declined = decide(start, false);
    if (!declined.ok) throw new Error();
    const none = decide(declined.state, false);
    if (!none.ok) throw new Error();
    expect(none.state.outcome).toContain('Sin reemplazo');
    expect(decide(none.state, true).ok).toBe(false);
    expect(known(none.state.log.flatMap((entry) => entry.ruleIds))).toEqual([]);
  });

  it('un reemplazo imposible no se ofrece', () => {
    const start = replacement('reemplazo-imposible');
    expect(start.queue.map((item) => item.id)).toEqual(['rival']);
    expect(start.log[0]!.ruleIds).toEqual(['8-1-3-4-5']);
  });
});

describe('escenarios', () => {
  it('cada ataque propuesto es válido, salvo el que ilustra [Rush: Character]', () => {
    for (const item of scenarios) {
      const result = apply(item.create(), { type: 'attack', attacker: item.attacker, target: item.target });
      expect(result.ok, item.id).toBe(item.id !== 'rush-character');
    }
  });

  it('identificadores únicos en cada situación', () => {
    const states = [...scenarios.map((item) => item.create()), ...tables.map((item) => item.create())];
    for (const state of states) {
      const ids = state.players.flatMap((p) =>
        [p.leader, ...p.characters, ...(p.stage ? [p.stage] : [])]
          .map((item) => item.card.uid)
          .concat([...p.hand, ...p.deck, ...p.life].map((card) => card.uid)),
      );
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
