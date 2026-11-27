/** Única puerta de entrada: aplica una acción y devuelve un estado nuevo o el motivo del rechazo. */
import { attack, block, counter, resolve, skipBlock, trigger } from './battle';
import { fail, log, processRules } from './change';
import { activate } from './effects';
import { other } from './state';
import { advance, attach, play } from './turns';
import type { Action, ActionResult, GameState } from './types';

export function apply(state: GameState, action: Action): ActionResult {
  if (state.result) return fail('La partida ya terminó.', '1-2-1');
  switch (action.type) {
    case 'advance': {
      const result = advance(state);
      return result.ok ? { ok: true, state: processRules(result.state) } : result;
    }
    case 'play':
      return play(state, action.uid, action.replace);
    case 'attach':
      return attach(state, action.uid);
    case 'activate':
      return activate(state, action);
    case 'attack':
      return attack(state, action.attacker, action.target);
    case 'block':
      return block(state, action.uid);
    case 'skip-block':
      return skipBlock(state);
    case 'counter':
      return counter(state, action.uid, action.target);
    case 'resolve':
      return resolve(state);
    case 'trigger':
      return trigger(state, action.activate);
    case 'concede': {
      const reason = `${state.players[action.player].name} concede; gana ${state.players[other(action.player)].name}.`;
      const next = { ...state, battle: null, result: { losers: [action.player], reason } };
      return { ok: true, state: log(next, reason, '1-2-3') };
    }
  }
}

/** Aplica una secuencia; lanza si alguna acción es ilegal. Para preparar escenarios y pruebas. */
export function run(state: GameState, actions: readonly Action[]): GameState {
  return actions.reduce((current, action) => {
    const result = apply(current, action);
    if (!result.ok) throw new Error(`${action.type}: ${result.error.message}`);
    return result.state;
  }, state);
}
