/** Escenarios de combate con cartas ficticias. */
import { createState, type PlayerSpec } from '../../domain/game/state';
import { apply } from '../../domain/game/reducer';
import type { ActionResult, CardDef, GameState } from '../../domain/game/types';
import { officialCombatCards as real } from '../combat/official';
import { cards, pile } from '../shared/cards';

export interface Scenario {
  id: string;
  title: string;
  goal: string;
  /** Atacante y objetivo propuestos. */
  attacker: string;
  target: string;
  create: () => GameState;
}

const deck = pile([cards.grumete, cards.vigia, cards.artillero], 8);

/** Turno 3: ya se puede atacar. Ataca la persona A. */
function table(attacking: Partial<PlayerSpec> = {}, defending: Partial<PlayerSpec> = {}): GameState {
  const player = (name: string, leader: CardDef, extra: Partial<PlayerSpec>): PlayerSpec => ({
    name,
    leader: { card: leader },
    deck,
    life: pile([cards.artillero], 3),
    donDeck: 6,
    donActive: 3,
    ...extra,
  });
  return createState({
    turn: 3,
    players: [player('Jugador A', cards.capitana, attacking), player('Jugador B', cards.almirante, defending)],
  });
}

const with_ = (card: CardDef, extra: { rested?: boolean; don?: number; playedThisTurn?: boolean } = {}) => ({
  card,
  uid: card.id,
  ...extra,
});

export const scenarios: readonly Scenario[] = [
  {
    id: 'empate',
    title: 'Empate de poder',
    goal: 'Atacante y objetivo tienen el mismo poder: observa quién gana.',
    attacker: '0-leader',
    target: '1-leader',
    create: () => table(
      { leader: { card: real.zoro }, deck: [real.kawamatsu], life: pile([real.kawamatsu], 3) },
      { leader: { card: real.kuzan }, deck: [real.jango], life: pile([real.jango], 3) },
    ),
  },
  {
    id: 'fallido',
    title: 'Ataque que falla',
    goal: 'El atacante tiene menos poder: comprueba qué le ocurre.',
    attacker: 'grumete',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.grumete)] }),
  },
  {
    id: 'ko',
    title: 'K.O. a un Character',
    goal: 'Ataca un Character Rested. Su DON!! asignado no suma fuera de su turno.',
    attacker: 'artillero',
    target: 'vigia',
    create: () => table({ characters: [with_(cards.artillero)] }, { characters: [with_(cards.vigia, { rested: true, don: 2 })] }),
  },
  {
    id: 'don',
    title: 'Asignar DON!! para alcanzar el objetivo',
    goal: 'El atacante no llega por sí solo: asigna DON!! antes de declarar.',
    attacker: 'vigia',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.vigia)] }),
  },
  {
    id: 'sin-vida',
    title: 'Daño con 0 cartas de Life',
    goal: 'El Leader rival no tiene Life: un ataque que dañe termina la partida.',
    attacker: '0-leader',
    target: '1-leader',
    create: () => table({}, { life: [] }),
  },
  {
    id: 'blocker',
    title: '[Blocker]',
    goal: 'Quien defiende puede cambiar el objetivo del ataque.',
    attacker: 'artillero',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.artillero)] }, { characters: [with_(cards.escudo)] }),
  },
  {
    id: 'unblockable',
    title: '[Unblockable]',
    goal: 'Intenta bloquear un ataque que no se puede bloquear.',
    attacker: 'sombra',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.sombra)] }, { characters: [with_(cards.escudo)] }),
  },
  {
    id: 'counter',
    title: 'Counter con Character y con Event',
    goal: 'Sube el poder de quien defiende hasta superar al atacante.',
    attacker: 'artillero',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.artillero)] }, { hand: [cards.vigia, cards.maniobra] }),
  },
  {
    id: 'double-attack',
    title: '[Double Attack]',
    goal: 'Un ataque que causa 2 de daño.',
    attacker: 'doble',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.doble)] }),
  },
  {
    id: 'double-attack-una-vida',
    title: '[Double Attack] contra 1 de Life',
    goal: 'Comprueba si 2 de daño bastan para ganar cuando queda 1 carta de Life.',
    attacker: 'doble',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.doble)] }, { life: [cards.artillero] }),
  },
  {
    id: 'trigger',
    title: '[Trigger] al recibir daño',
    goal: 'Quien defiende decide si revela el [Trigger] o guarda la carta.',
    attacker: '0-leader',
    target: '1-leader',
    create: () => table({}, { life: [cards.mensaje, cards.artillero] }),
  },
  {
    id: 'banish',
    title: '[Banish]',
    goal: 'La carta de Life va al Trash y su [Trigger] no se activa.',
    attacker: 'desterrador',
    target: '1-leader',
    create: () => table({ characters: [with_(cards.desterrador)] }, { life: [cards.mensaje, cards.artillero] }),
  },
  {
    id: 'rush-character',
    title: '[Rush: Character] el turno en que se juega',
    goal: 'Prueba a atacar al Leader y después a un Character.',
    attacker: 'cazador',
    target: '1-leader',
    create: () =>
      table(
        { characters: [with_(cards.cazador, { playedThisTurn: true })] },
        { characters: [with_(cards.grumete, { rested: true })] },
      ),
  },
];

export interface AttackChoice {
  attacker: string;
  target: string;
  /** DON!! que se asignan al atacante antes de declarar. */
  don: number;
  /** Poder base elegido; si falta, se usa el de la carta. */
  attackerPower?: number;
  targetPower?: number;
}

/** Cambia el poder base de una carta del campo para explorar un caso. */
function withPower(state: GameState, uid: string, power: number | undefined): GameState {
  if (power === undefined || !Number.isInteger(power)) return state;
  const players = state.players.map((player) => {
    const set = <T extends { card: { uid: string } }>(item: T): T =>
      item.card.uid === uid ? { ...item, card: { ...item.card, power } } : item;
    return { ...player, leader: set(player.leader), characters: player.characters.map(set) };
  });
  return { ...state, players: [players[0]!, players[1]!] };
}

/** Asigna los DON!! y declara el ataque. Si algo no es legal, no se aplica nada. */
export function declareAttack(initial: GameState, choice: AttackChoice): ActionResult {
  let state = withPower(withPower(initial, choice.attacker, choice.attackerPower), choice.target, choice.targetPower);
  for (let i = 0; i < choice.don; i++) {
    const result = apply(state, { type: 'attach', uid: choice.attacker });
    if (!result.ok) return result;
    state = result.state;
  }
  return apply(state, { type: 'attack', attacker: choice.attacker, target: choice.target });
}
