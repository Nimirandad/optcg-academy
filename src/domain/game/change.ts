/** Cambios inmutables compartidos por las acciones. */
import { activePlayer, other } from './state';
import type { ActionResult, Card, FieldCard, GameState, LogEntry, PlayerId, PlayerState } from './types';

export const fail = (message: string, ...ruleIds: string[]): ActionResult => ({
  ok: false,
  error: { message, ruleIds },
});

export const log = (state: GameState, text: string, ...ruleIds: string[]): GameState => {
  const entry: LogEntry = { text, ruleIds };
  return { ...state, log: [...state.log, entry] };
};

export function setPlayer(state: GameState, id: PlayerId, change: Partial<PlayerState>): GameState {
  const next = { ...state.players[id], ...change };
  return { ...state, players: id === 0 ? [next, state.players[1]] : [state.players[0], next] };
}

export function setField(state: GameState, uid: string, change: Partial<FieldCard>): GameState {
  for (const id of [0, 1] as const) {
    const player = state.players[id];
    const apply = (item: FieldCard) => (item.card.uid === uid ? { ...item, ...change } : item);
    if (player.leader.card.uid === uid) return setPlayer(state, id, { leader: apply(player.leader) });
    if (player.stage?.card.uid === uid) return setPlayer(state, id, { stage: apply(player.stage) });
    if (player.characters.some((item) => item.card.uid === uid)) {
      return setPlayer(state, id, { characters: player.characters.map(apply) });
    }
  }
  return state;
}

/** Un Character o Stage deja el campo: va al Trash y sus DON!! vuelven Rested. */
export function leaveField(state: GameState, id: PlayerId, uid: string): GameState {
  const player = state.players[id];
  const leaving = [...player.characters, player.stage].find((item) => item?.card.uid === uid);
  if (!leaving) return state;
  const next = setPlayer(state, id, {
    characters: player.characters.filter((item) => item.card.uid !== uid),
    stage: player.stage?.card.uid === uid ? null : player.stage,
    trash: [leaving.card, ...player.trash],
    donRested: player.donRested + leaving.don,
  });
  // 10-2-13-4: si vuelve al campo se trata como una carta nueva.
  return { ...next, used: next.used.filter((key) => !key.startsWith(`${uid}:`)) };
}

export function draw(state: GameState, id: PlayerId, amount: number): GameState {
  const player = state.players[id];
  const cards: readonly Card[] = player.deck.slice(0, amount);
  if (!cards.length) return state;
  return setPlayer(state, id, { deck: player.deck.slice(cards.length), hand: [...player.hand, ...cards] });
}

/** Procesamiento de reglas: derrota por mazo vacío (la de daño se resuelve en la batalla). */
export function processRules(state: GameState): GameState {
  if (state.result) return state;
  const turnPlayer = activePlayer(state);
  const losers = [turnPlayer, other(turnPlayer)].filter((id) => state.players[id].deck.length === 0);
  if (!losers.length) return state;
  const names = losers.map((id) => state.players[id].name).join(' y ');
  const reason = `${names}: 0 cartas en el mazo.`;
  return log({ ...state, battle: null, result: { losers, reason } }, `Derrota. ${reason}`, '1-2-1-1-2', '9-2-1-2');
}
