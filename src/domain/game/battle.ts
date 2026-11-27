/** Secuencia de combate del capítulo 7. */
import { draw, fail, leaveField, log, processRules, setField, setPlayer } from './change';
import { requireMain } from './turns';
import { activePlayer, findOnField, isFirstTurn, other, powerOf } from './state';
import type { ActionResult, Battle, Card, GameState, Keyword, PlayerId } from './types';

const has = (card: Card, keyword: Keyword) => card.keywords?.includes(keyword) ?? false;
const ok = (state: GameState): ActionResult => ({ ok: true, state: processRules(state) });

export function attack(state: GameState, attackerUid: string, targetUid: string): ActionResult {
  const blocked = requireMain(state, '7-1');
  if (blocked) return blocked;
  if (isFirstTurn(state)) return fail('Nadie puede atacar en su primer turno.', '6-5-6-1');
  const id = activePlayer(state);
  const player = state.players[id];
  const rival = state.players[other(id)];
  const attacker = [player.leader, ...player.characters].find((item) => item.card.uid === attackerUid);
  if (!attacker) return fail('Atacan tu Leader o tus Characters.', '7-1-1-1');
  if (attacker.rested) return fail(`${attacker.card.name} está Rested: para atacar debe estar Active.`, '7-1-1-1');
  const isLeader = rival.leader.card.uid === targetUid;
  const target = isLeader ? rival.leader : rival.characters.find((item) => item.card.uid === targetUid);
  if (!target) return fail('El objetivo debe ser el Leader rival o un Character rival.', '7-1-1-2');
  if (!isLeader && !target.rested) return fail('Solo puedes atacar un Character rival que esté Rested.', '7-1-1-2');
  if (attacker.playedOnTurn === state.turn && !has(attacker.card, 'rush')) {
    if (!has(attacker.card, 'rush-character')) {
      return fail('Un Character no puede atacar el turno en que se jugó.', '3-7-4', '10-1-1-1');
    }
    if (isLeader) return fail('[Rush: Character] no permite atacar al Leader este turno.', '10-1-6-1');
  }
  const battle: Battle = { step: 'block', attacker: attackerUid, target: targetUid, bonus: {}, damageLeft: 0, trigger: null };
  const next = setField({ ...state, battle }, attackerUid, { rested: true });
  return ok(
    log(next, `Attack Step: ${attacker.card.name} queda Rested y ataca a ${target.card.name}.`, '7-1-1-1', '7-1-1-2'),
  );
}

/** La batalla en curso, si está en el paso indicado. */
function step(state: GameState, wanted: Battle['step']): { battle: Battle; defender: PlayerId } | null {
  return state.battle?.step === wanted ? { battle: state.battle, defender: other(activePlayer(state)) } : null;
}

export function block(state: GameState, uid: string): ActionResult {
  const current = step(state, 'block');
  if (!current) return fail('Solo se puede bloquear en el Block Step.', '7-1-2-1');
  const { battle, defender } = current;
  const player = state.players[defender];
  const blocker = [player.leader, ...player.characters].find((item) => item.card.uid === uid);
  if (!blocker || !has(blocker.card, 'blocker')) return fail('Esa carta no tiene [Blocker].', '10-1-4-1');
  if (has(findOnField(state, battle.attacker)!.field.card, 'unblockable')) {
    return fail('El atacante tiene [Unblockable]: no se puede activar [Blocker].', '10-1-7-1');
  }
  if (battle.target === uid) return fail('[Blocker] se usa cuando atacan a otra de tus cartas.', '10-1-4-1');
  if (blocker.rested) return fail('Para bloquear hay que poner la carta Rested: debe estar Active.', '10-1-4-1');
  const next = setField({ ...state, battle: { ...battle, target: uid, step: 'counter' } }, uid, { rested: true });
  return ok(
    log(next, `Block Step: ${blocker.card.name} activa [Blocker] y pasa a ser el objetivo.`, '7-1-2-1', '10-1-4-1'),
  );
}

export function skipBlock(state: GameState): ActionResult {
  const current = step(state, 'block');
  if (!current) return fail('No hay un Block Step abierto.', '7-1-2');
  return ok(log({ ...state, battle: { ...current.battle, step: 'counter' } }, 'Block Step: no se bloquea.', '7-1-2-1'));
}

export function counter(state: GameState, uid: string, targetUid: string): ActionResult {
  const current = step(state, 'counter');
  if (!current) return fail('Los Counters se usan en el Counter Step.', '7-1-3-1');
  const { battle, defender } = current;
  const player = state.players[defender];
  const card = player.hand.find((item) => item.uid === uid);
  if (!card) return fail('Esa carta no está en la mano de quien defiende.', '7-1-3-1');
  const target = [player.leader, ...player.characters].find((item) => item.card.uid === targetUid);
  if (!target) return fail('El Counter sube el poder de tu Leader o de uno de tus Characters.', '7-1-3-1-1');
  const event = card.kind === 'event';
  const value = (event ? card.counterEvent : card.kind === 'character' ? card.counter : 0) ?? 0;
  if (!value) return fail('Esa carta no tiene Counter.', '7-1-3-1-1', '7-1-3-1-2');
  const cost = event ? (card.cost ?? 0) : 0;
  if (player.donActive < cost) {
    return fail(`Faltan DON!! Active: el Event cuesta ${cost} y hay ${player.donActive}.`, '7-1-3-1-2');
  }
  const paid = setPlayer(state, defender, {
    hand: player.hand.filter((item) => item.uid !== uid),
    trash: [card, ...player.trash],
    donActive: player.donActive - cost,
    donRested: player.donRested + cost,
  });
  const bonus = { ...battle.bonus, [targetUid]: (battle.bonus[targetUid] ?? 0) + value };
  return ok(
    log(
      { ...paid, battle: { ...battle, bonus } },
      `Counter Step: ${card.name} va al Trash y ${target.card.name} gana +${value} durante esta batalla.`,
      event ? '7-1-3-1-2' : '7-1-3-1-1',
    ),
  );
}

const endBattle = (state: GameState): GameState =>
  log({ ...state, battle: null }, 'End of the Battle: vencen los efectos «during this battle».', '7-1-5-1', '7-1-5-5');

/** Procesa los puntos de daño pendientes; se detiene ante un [Trigger]. */
function dealDamage(state: GameState): GameState {
  let next = state;
  while (next.battle && next.battle.damageLeft > 0) {
    const battle = next.battle;
    const id = other(activePlayer(next));
    const player = next.players[id];
    const [card, ...life] = player.life;
    // La derrota se determina al empezar el daño (Q&A rules-p6-1): quedarse sin Life a mitad no la provoca.
    if (!card) {
      next = log(next, `${player.name} ya no tiene Life: el daño restante no le hace perder.`, '7-1-4-1-1-1');
      break;
    }
    const left = battle.damageLeft - 1;
    const attacker = findOnField(next, battle.attacker)!.field.card;
    if (has(attacker, 'banish')) {
      next = setPlayer(next, id, { life, trash: [card, ...player.trash] });
      next = log(next, `[Banish]: ${card.name} va de Life al Trash, sin [Trigger].`, '10-1-3-1');
    } else if (card.trigger) {
      next = setPlayer(next, id, { life });
      return log(
        { ...next, battle: { ...battle, step: 'trigger', damageLeft: left, trigger: card } },
        `${player.name} toma de Life una carta con [Trigger] y decide si la revela.`,
        '10-1-5-1',
        '8-6-2-1',
      );
    } else {
      next = setPlayer(next, id, { life, hand: [...player.hand, card] });
      next = log(next, `1 de daño: ${player.name} pasa la carta superior de Life a su mano.`, '4-6-2-1');
    }
    next = { ...next, battle: { ...next.battle!, damageLeft: left } };
  }
  return endBattle(next);
}

/** Cierra el Counter Step y resuelve el Damage Step. */
export function resolve(state: GameState): ActionResult {
  const current = step(state, 'counter');
  if (!current) return fail('Primero hay que pasar por el Block Step y el Counter Step.', '7-1-4');
  const { battle, defender } = current;
  const attacker = findOnField(state, battle.attacker)!.field;
  const target = findOnField(state, battle.target)!.field;
  const attack = powerOf(state, battle.attacker);
  const defense = powerOf(state, battle.target);
  const compare = `Damage Step: ${attacker.card.name} ${attack} contra ${target.card.name} ${defense} (diferencia ${attack - defense}).`;
  if (attack < defense) {
    const next = log(state, `${compare} El ataque falla; el atacante no sufre K.O.`, '7-1-4-2');
    return ok(endBattle(next));
  }
  let next = log(state, `${compare} Con igual o más poder gana quien ataca.`, '7-1-4-1');
  const player = next.players[defender];
  if (player.leader.card.uid !== battle.target) {
    next = log(leaveField(next, defender, battle.target), `${target.card.name} sufre K.O.`, '7-1-4-1-2', '10-2-1-1');
    return ok(endBattle(next));
  }
  if (player.life.length === 0) {
    const reason = `${player.name} recibe daño con 0 cartas de Life.`;
    return ok(
      log(
        { ...next, battle: null, result: { losers: [defender], reason } },
        `Derrota. ${reason}`,
        '7-1-4-1-1-1',
        '9-2-1-1',
      ),
    );
  }
  const damage = has(attacker.card, 'double-attack') ? 2 : 1;
  next = log(
    { ...next, battle: { ...battle, damageLeft: damage } },
    `El Leader recibe ${damage} de daño.`,
    ...(damage === 2 ? ['10-1-2-1', '7-1-4-1-1-3'] : ['7-1-4-1-1']),
  );
  return ok(dealDamage(next));
}

export function trigger(state: GameState, activate: boolean): ActionResult {
  const current = step(state, 'trigger');
  if (!current?.battle.trigger) return fail('No hay ningún [Trigger] pendiente.', '10-1-5-1');
  const { battle, defender } = current;
  const card = battle.trigger!;
  const player = state.players[defender];
  let next: GameState = { ...state, battle: { ...battle, trigger: null, step: 'counter' } };
  if (activate) {
    // Mientras se resuelve, la carta no está en ninguna zona; después va al Trash.
    next = draw(next, defender, card.trigger!.draw);
    next = setPlayer(next, defender, { trash: [card, ...next.players[defender].trash] });
    next = log(next, `[Trigger] de ${card.name}: roba ${card.trigger!.draw} y la carta va al Trash.`, '10-1-5-3');
  } else {
    next = setPlayer(next, defender, { hand: [...player.hand, card] });
    next = log(next, 'No se activa el [Trigger]: la carta pasa a la mano sin revelarse.', '10-1-5-2');
  }
  const processed = processRules(next);
  return ok(processed.result ? processed : dealDamage(processed));
}
