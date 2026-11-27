/** Fases del turno y acciones de la Main Phase. */
import { draw, fail, leaveField, log, setField, setPlayer } from './change';
import { MAX_CHARACTERS, activePlayer, fieldCards, findOnField } from './state';
import type { ActionResult, FieldCard, GameState, Phase } from './types';

export const phaseNames: Record<Phase, string> = {
  refresh: 'Refresh Phase',
  draw: 'Draw Phase',
  don: 'DON!! Phase',
  main: 'Main Phase',
  end: 'End Phase',
};

function refresh(state: GameState): GameState {
  const id = activePlayer(state);
  const player = state.players[id];
  const given = fieldCards(player).reduce((total, item) => total + item.don, 0);
  const ready = (item: FieldCard): FieldCard => ({ ...item, rested: false, don: 0 });
  const next = setPlayer(state, id, {
    leader: ready(player.leader),
    characters: player.characters.map(ready),
    stage: player.stage && ready(player.stage),
    donActive: player.donActive + player.donRested + given,
    donRested: 0,
  });
  return log(
    next,
    `Turno ${next.turn}, ${player.name}. Refresh Phase: vuelven ${given} DON!! asignados y todo queda Active.`,
    '6-2-3',
    '6-2-4',
  );
}

function drawPhase(state: GameState): GameState {
  const id = activePlayer(state);
  const { name } = state.players[id];
  if (state.turn === 1) return log(state, `Draw Phase: ${name} va primero y no roba en su primer turno.`, '6-3-1');
  return log(draw(state, id, 1), `Draw Phase: ${name} roba 1 carta.`, '6-3-1');
}

function donPhase(state: GameState): GameState {
  const id = activePlayer(state);
  const player = state.players[id];
  const wanted = state.turn === 1 ? 1 : 2;
  const added = Math.min(wanted, player.donDeck);
  const rules = added === 0 ? ['6-4-3'] : added < wanted ? ['6-4-2'] : ['6-4-1'];
  const next = setPlayer(state, id, { donDeck: player.donDeck - added, donActive: player.donActive + added });
  return log(next, `DON!! Phase: ${player.name} añade ${added} DON!! a su zona de coste.`, ...rules);
}

export function advance(state: GameState): ActionResult {
  if (state.battle) return fail('Termina la batalla antes de cambiar de fase.', '7-1');
  const done = (next: GameState): ActionResult => ({ ok: true, state: next });
  switch (state.phase) {
    case 'refresh':
      return done(drawPhase({ ...state, phase: 'draw' }));
    case 'draw':
      return done(donPhase({ ...state, phase: 'don' }));
    case 'don':
      return done(log({ ...state, phase: 'main' }, 'Comienza la Main Phase.', '6-5-2'));
    case 'main': {
      let next: GameState = { ...state, phase: 'end' };
      for (const id of [0, 1] as const) {
        for (const item of fieldCards(next.players[id])) next = setField(next, item.card.uid, { turnPower: 0 });
      }
      return done(log(next, 'End Phase: vencen los efectos que duran este turno.', '6-5-2-1', '6-6-1-3'));
    }
    case 'end':
      return done(refresh({ ...state, turn: state.turn + 1, phase: 'refresh', used: [] }));
  }
}

/** Solo la persona del turno actúa, en su Main Phase y fuera de batalla. */
export function requireMain(state: GameState, ...ruleIds: string[]): ActionResult | null {
  if (state.battle) return fail('No se puede hacer durante una batalla.', ...ruleIds);
  if (state.phase !== 'main') {
    return fail(`Solo se puede hacer en la Main Phase; ahora es la ${phaseNames[state.phase]}.`, ...ruleIds);
  }
  return null;
}

export function play(state: GameState, uid: string, replace?: string): ActionResult {
  const blocked = requireMain(state, '6-5-3-1');
  if (blocked) return blocked;
  const id = activePlayer(state);
  const player = state.players[id];
  const card = player.hand.find((item) => item.uid === uid);
  if (!card) return fail(`Esa carta no está en la mano de ${player.name}.`, '6-5-3-1');
  if (card.kind === 'event') {
    return fail('Este simulador solo usa Events [Counter], durante el Counter Step de un ataque rival.', '10-2-4-1');
  }
  if (card.kind === 'leader') return fail('Un Leader no se juega desde la mano.', '3-6-3');
  const cost = card.cost ?? 0;
  if (player.donActive < cost) {
    return fail(`Faltan DON!! Active: cuesta ${cost} y hay ${player.donActive}.`, '6-5-3-1');
  }
  const full = card.kind === 'character' && player.characters.length >= MAX_CHARACTERS;
  if (full && !player.characters.some((item) => item.card.uid === replace)) {
    return fail('Ya tienes 5 Characters: elige cuál mandar al Trash para jugar el nuevo.', '3-7-6-1');
  }
  if (!full && replace) return fail('Solo se reemplaza un Character cuando ya tienes 5.', '3-7-6-1');

  let next = setPlayer(state, id, { donActive: player.donActive - cost, donRested: player.donRested + cost });
  const out = card.kind === 'stage' ? player.stage?.card.uid : replace;
  if (out) {
    const name = findOnField(next, out)!.field.card.name;
    next = log(
      leaveField(next, id, out),
      `${name} va al Trash para respetar el límite. No es un K.O.`,
      card.kind === 'stage' ? '3-8-5-1' : '3-7-6-1-1',
    );
  }
  const entering: FieldCard = { card, rested: false, don: 0, playedOnTurn: state.turn, turnPower: 0 };
  const current = next.players[id];
  next = setPlayer(next, id, {
    hand: current.hand.filter((item) => item.uid !== uid),
    ...(card.kind === 'stage' ? { stage: entering } : { characters: [...current.characters, entering] }),
  });
  return {
    ok: true,
    state: log(next, `${player.name} juega ${card.name} pagando ${cost} DON!!.`, card.kind === 'stage' ? '3-8-3' : '3-7-3'),
  };
}

export function attach(state: GameState, uid: string): ActionResult {
  const blocked = requireMain(state, '6-5-5-1');
  if (blocked) return blocked;
  const id = activePlayer(state);
  const player = state.players[id];
  const target = [player.leader, ...player.characters].find((item) => item.card.uid === uid);
  if (!target) return fail('Solo puedes asignar DON!! a tu Leader o a tus Characters.', '6-5-5-1');
  if (player.donActive < 1) return fail('No quedan DON!! Active en tu zona de coste.', '6-5-5-1');
  const next = setField(setPlayer(state, id, { donActive: player.donActive - 1 }), uid, { don: target.don + 1 });
  return {
    ok: true,
    state: log(next, `${target.card.name} recibe 1 DON!!: +1000 durante el turno propio.`, '6-5-5-1', '6-5-5-2'),
  };
}
