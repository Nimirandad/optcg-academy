/** Activación de efectos [Activate: Main]: condiciones, costes y [Once Per Turn]. */
import { draw, fail, log, processRules, setField, setPlayer } from './change';
import { requireMain } from './turns';
import { activePlayer } from './state';
import type { Action, ActionResult, GameState } from './types';

type Activate = Extract<Action, { type: 'activate' }>;

export function activate(state: GameState, { uid, effectId, discard = [], donFrom = [], giveRestedDon }: Activate): ActionResult {
  const blocked = requireMain(state, '8-1-3-2', '10-2-2-1');
  if (blocked) return blocked;
  const id = activePlayer(state);
  const player = state.players[id];
  const source = [player.leader, ...player.characters, player.stage].find((item) => item?.card.uid === uid);
  const effect = source?.card.effects?.find((item) => item.id === effectId);
  if (!source || !effect) return fail('Ese efecto no pertenece a una carta de tu campo.', '8-4-3');

  // Condiciones antes que costes: si no se cumplen, no se paga nada.
  const key = `${uid}:${effectId}`;
  if (effect.oncePerTurn && state.used.includes(key)) {
    return fail('[Once Per Turn]: esta carta ya usó el efecto este turno y no puede volver a pagarlo.', '10-2-13-3');
  }
  if (effect.donRequired && source.don < effect.donRequired) {
    return fail(
      `[DON!! x${effect.donRequired}]: necesita ${effect.donRequired} DON!! asignados y tiene ${source.don}.`,
      '8-3-2-3',
      '8-4-1-1',
    );
  }

  // El coste se comprueba entero: si falta una parte, no se paga ninguna.
  const rest = effect.restDon ?? 0;
  if (player.donActive < rest) {
    return fail(`El coste pide ${rest} DON!! Active y hay ${player.donActive}. No se paga nada.`, '8-3-1-5', '8-3-1-3');
  }
  const chosen = new Set(discard);
  const cards = player.hand.filter((card) => chosen.has(card.uid));
  const wanted = effect.trashFromHand ?? 0;
  if (cards.length !== wanted || discard.length !== wanted) {
    return fail(`El coste pide descartar exactamente ${wanted} carta(s) de tu mano. No se paga nada.`, '8-3-1-3', '10-2-14-1');
  }
  const minus = effect.donMinus ?? 0;
  if (donFrom.length !== minus) {
    return fail(`DON!! −${minus}: elige exactamente ${minus} DON!! de tu campo. No se paga nada.`, '8-3-1-6', '8-3-1-3');
  }

  let next = setPlayer(state, id, {
    donActive: player.donActive - rest,
    donRested: player.donRested + rest,
    hand: player.hand.filter((card) => !chosen.has(card.uid)),
    trash: [...cards, ...player.trash],
  });
  for (const from of donFrom) {
    const now = next.players[id];
    if (from === 'cost-active' && now.donActive > 0) next = setPlayer(next, id, { donActive: now.donActive - 1 });
    else if (from === 'cost-rested' && now.donRested > 0) next = setPlayer(next, id, { donRested: now.donRested - 1 });
    else {
      const card = [now.leader, ...now.characters].find((item) => item.card.uid === from);
      if (!card || card.don < 1) return fail('No hay un DON!! que devolver en ese lugar. No se paga nada.', '8-3-1-6');
      next = setField(next, from, { don: card.don - 1 });
    }
    next = setPlayer(next, id, { donDeck: next.players[id].donDeck + 1 });
  }

  if (giveRestedDon) {
    const { target, count } = giveRestedDon;
    const current = next.players[id];
    const character = current.characters.find((item) => item.card.uid === target);
    if (!effect.result.giveRestedDonToCharacter || !character || !Number.isInteger(count) ||
        count < 1 || count > effect.result.giveRestedDonToCharacter || count > current.donRested) {
      return fail('Selecciona un Character propio y una cantidad válida de DON!! Rested.', '8-4-1-5');
    }
    next = setField(next, target, { don: character.don + count });
    next = setPlayer(next, id, { donRested: current.donRested - count });
  }
  if (effect.result.draw) next = draw(next, id, effect.result.draw);
  if (effect.result.power) {
    const current = [next.players[id].leader, ...next.players[id].characters].find((item) => item.card.uid === uid);
    if (current) next = setField(next, uid, { turnPower: current.turnPower + effect.result.power });
  }
  if (effect.oncePerTurn) next = { ...next, used: [...next.used, key] };
  const resolution = effect.result.giveRestedDonToCharacter
    ? 'se activa y se resuelve el efecto'
    : 'se pagan los costes, el efecto se activa y se resuelve';
  next = log(
    next,
    `${source.card.name}: ${resolution}. ${effect.text}`,
    '8-4-1-3',
    '8-4-1-5',
    ...(effect.oncePerTurn ? ['10-2-13-1'] : []),
  );
  return { ok: true, state: processRules(next) };
}
