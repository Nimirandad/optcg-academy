/** Partida ficticia para practicar la secuencia de turnos. */
import { createGame } from '../../domain/game/state';
import type { GameState, PlayerId } from '../../domain/game/types';
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
