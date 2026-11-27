/** Construcción y consulta del estado. */
import type { Card, CardDef, FieldCard, GameState, Phase, PlayerId, PlayerState } from './types';

export const MAX_CHARACTERS = 5;

export const other = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0);

export const activePlayer = (state: Pick<GameState, 'first' | 'turn'>): PlayerId =>
  state.turn % 2 === 1 ? state.first : other(state.first);

/** Turnos 1 y 2: el primero de cada persona. */
export const isFirstTurn = (state: Pick<GameState, 'turn'>): boolean => state.turn <= 2;

export const fieldCards = (player: PlayerState): FieldCard[] => [
  player.leader,
  ...player.characters,
  ...(player.stage ? [player.stage] : []),
];

export function findOnField(state: GameState, uid: string): { player: PlayerId; field: FieldCard } | null {
  for (const player of [0, 1] as const) {
    const field = fieldCards(state.players[player]).find((item) => item.card.uid === uid);
    if (field) return { player, field };
  }
  return null;
}

/** Poder actual: base, DON!! (solo en el turno propio), efectos del turno y Counter. */
export function powerOf(state: GameState, uid: string): number {
  const found = findOnField(state, uid);
  if (!found) return 0;
  const { player, field } = found;
  const don = player === activePlayer(state) ? field.don * 1000 : 0;
  return (field.card.power ?? 0) + don + field.turnPower + (state.battle?.bonus[uid] ?? 0);
}

export interface FieldSpec {
  card: CardDef;
  uid?: string;
  rested?: boolean;
  don?: number;
  playedThisTurn?: boolean;
}

export interface PlayerSpec {
  name: string;
  leader: FieldSpec;
  characters?: readonly FieldSpec[];
  stage?: FieldSpec;
  hand?: readonly CardDef[];
  deck?: readonly CardDef[];
  life?: readonly CardDef[];
  donDeck?: number;
  donActive?: number;
  donRested?: number;
}

export interface StateSpec {
  players: readonly [PlayerSpec, PlayerSpec];
  first?: PlayerId;
  turn?: number;
  phase?: Phase;
}

/** Crea una situación de práctica. Los identificadores son deterministas. */
export function createState(spec: StateSpec): GameState {
  const turn = spec.turn ?? 1;
  const player = (data: PlayerSpec, id: PlayerId): PlayerState => {
    const cards = (list: readonly CardDef[] | undefined, zone: string): Card[] =>
      (list ?? []).map((card, index) => ({ ...card, uid: `${id}-${zone}${index}` }));
    const onField = (item: FieldSpec, fallback: string): FieldCard => ({
      card: { ...item.card, uid: item.uid ?? `${id}-${fallback}` },
      rested: item.rested ?? false,
      don: item.don ?? 0,
      playedOnTurn: item.playedThisTurn ? turn : null,
      turnPower: 0,
    });
    return {
      name: data.name,
      leader: onField(data.leader, 'leader'),
      characters: (data.characters ?? []).map((item, index) => onField(item, `char${index}`)),
      stage: data.stage ? onField(data.stage, 'stage') : null,
      hand: cards(data.hand, 'hand'),
      deck: cards(data.deck, 'deck'),
      trash: [],
      life: cards(data.life, 'life'),
      donDeck: data.donDeck ?? 10,
      donActive: data.donActive ?? 0,
      donRested: data.donRested ?? 0,
    };
  };
  return {
    players: [player(spec.players[0], 0), player(spec.players[1], 1)],
    first: spec.first ?? 0,
    turn,
    phase: spec.phase ?? 'main',
    battle: null,
    result: null,
    used: [],
    log: [],
  };
}

export interface GameSetup {
  name: string;
  leader: CardDef;
  /** Mazo ya ordenado; la primera carta es la superior. No se baraja. */
  deck: readonly CardDef[];
}

/** Partida preparada (5 cartas en mano y Life), en la Refresh Phase del turno 1. */
export function createGame(setups: readonly [GameSetup, GameSetup], first: PlayerId = 0): GameState {
  const spec = (setup: GameSetup): PlayerSpec => {
    const life = setup.leader.life ?? 0;
    return {
      name: setup.name,
      leader: { card: setup.leader },
      hand: setup.deck.slice(0, 5),
      // 5-2-1-7: la carta superior del mazo queda abajo en Life.
      life: setup.deck.slice(5, 5 + life).reverse(),
      deck: setup.deck.slice(5 + life),
    };
  };
  return createState({ players: [spec(setups[0]), spec(setups[1])], first, phase: 'refresh' });
}
