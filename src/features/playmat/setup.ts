/** Mesas ficticias para el playmat. */
import { createGame, createState, type PlayerSpec } from '../../domain/game/state';
import { run } from '../../domain/game/reducer';
import type { CardDef, GameState } from '../../domain/game/types';
import { officialCombatCards as real } from '../combat/official';
import { cards, pile } from '../shared/cards';

const deck = pile(
  [cards.grumete, cards.escudo, cards.vigia, cards.veloz, cards.maniobra, cards.puerto, cards.artillero, cards.mensaje],
  50,
);

/** Mesa avanzada: la persona A tiene 5 Characters y un Stage para probar los límites. */
function advanced(): GameState {
  const player = (name: string, leader: CardDef, extra: Partial<PlayerSpec>): PlayerSpec => ({
    name,
    leader: { card: leader },
    deck: deck.slice(0, 20),
    life: pile([cards.mensaje, cards.artillero], 4),
    donDeck: 4,
    donActive: 6,
    ...extra,
  });
  return createState({
    turn: 5,
    players: [
      player('Jugador A', cards.capitana, {
        characters: [cards.grumete, cards.vigia, cards.artillero, cards.escudo, cards.doble].map((card) => ({ card })),
        stage: { card: cards.puerto },
        hand: [cards.veloz, cards.faro, cards.sombra],
      }),
      player('Jugador B', cards.almirante, {
        characters: [{ card: cards.escudo }, { card: cards.vigia, rested: true }],
        hand: [cards.grumete, cards.maniobra],
      }),
    ],
  });
}

export const tables = [
  {
    id: 'nueva',
    title: 'Partida desde el turno 1',
    create: (): GameState =>
      run(
        createGame([
          { name: 'Jugador A', leader: cards.capitana, deck },
          { name: 'Jugador B', leader: cards.almirante, deck },
        ]),
        [{ type: 'advance' }, { type: 'advance' }, { type: 'advance' }],
      ),
  },
  { id: 'avanzada', title: 'Mesa avanzada (límites del campo)', create: advanced },
  {
    id: 'oficial',
    title: 'Mesa de práctica con cartas reales',
    create: (): GameState => createState({
      turn: 5,
      players: [
        { name: 'Jugador A', leader: { card: real.zoro }, characters: [{ card: real.kawamatsu }],
          hand: [real.kawamatsu], deck: pile([real.kawamatsu], 8), life: pile([real.kawamatsu], 3), donActive: 5, donDeck: 5 },
        { name: 'Jugador B', leader: { card: real.kuzan }, characters: [{ card: real.jango, rested: true }],
          hand: [real.jango], deck: pile([real.jango], 8), life: pile([real.jango], 3), donActive: 4, donDeck: 6 },
      ],
    }),
  },
] as const;
