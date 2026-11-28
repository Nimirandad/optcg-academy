/** Partida ficticia para practicar la secuencia de turnos. */
import { createGame } from '../../domain/game/state';
import type { GameState, PlayerId } from '../../domain/game/types';
import { officialCombatCards as real } from '../combat/official';
import { cards, pile } from '../shared/cards';

const deck = pile([cards.grumete, cards.vigia, cards.veloz, cards.maniobra, cards.puerto, cards.mensaje], 50);

export const newGame = (first: PlayerId): GameState =>
  createGame(
    [
      { name: 'Jugador A', leader: cards.capitana, deck },
      { name: 'Jugador B', leader: cards.almirante, deck },
    ],
    first,
  );

/** Reservas preparadas para aprender el turno con cartas reales. */
export const trainingTurn = (first: PlayerId): GameState => createGame([
  { name: 'Jugador A', leader: real.zoro, deck: pile([real.kawamatsu], 50) },
  { name: 'Jugador B', leader: real.kuzan, deck: pile([real.jango, real.zephyr], 50) },
], first);
