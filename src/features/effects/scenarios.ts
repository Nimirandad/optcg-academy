/** Escenarios guiados de efectos, con cartas ficticias. */
import { createState } from '../../domain/game/state';
import type { PendingEffect, Replacement } from '../../domain/game/order';
import type { GameState, PlayerId } from '../../domain/game/types';
import { cards, pile } from '../shared/cards';

interface Common {
  id: string;
  title: string;
  goal: string;
}

export type EffectScenario = Common &
  (
    | { kind: 'game'; create: () => GameState }
    | { kind: 'order'; turnPlayer: PlayerId; pending: readonly PendingEffect[] }
    | { kind: 'replacement'; turnPlayer: PlayerId; process: string; options: readonly Replacement[]; note?: string }
  );

export const playerNames = ['Jugador A (turno)', 'Jugador B'] as const;

const field = (list: (typeof cards.cronista)[]): GameState =>
  createState({
    turn: 3,
    players: [
      {
        name: 'Jugador A',
        leader: { card: cards.capitana },
        characters: list.map((card, index) => ({ card, uid: `${card.id}-${index + 1}` })),
        hand: [cards.grumete, cards.vigia],
        deck: pile([cards.artillero, cards.grumete], 20),
        donDeck: 5,
        donActive: 3,
        donRested: 1,
      },
      { name: 'Jugador B', leader: { card: cards.almirante }, deck: pile([cards.grumete], 20) },
    ],
  });

export const effectScenarios: readonly EffectScenario[] = [
  {
    id: 'condiciones',
    kind: 'game',
    title: 'Condiciones y costes',
    goal: 'Activa el efecto sin DON!! asignado y observa qué falta. Luego cumple la condición.',
    create: () => field([cards.cronista]),
  },
  {
    id: 'una-vez',
    kind: 'game',
    title: '[Once Per Turn] con dos copias',
    goal: 'Usa el efecto dos veces con la misma carta y después con la otra copia. Avanza hasta tu próximo turno.',
    create: () => field([cards.tambor, cards.tambor]),
  },
  {
    id: 'don-menos',
    kind: 'game',
    title: 'DON!! −X y descarte como coste',
    goal: 'El coste se paga entero o no se paga. Elige de dónde salen los DON!! y qué carta descartas.',
    create: () => field([cards.alquimista]),
  },
  {
    id: 'simultaneos',
    kind: 'order',
    title: 'Efectos simultáneos de ambas personas',
    goal: 'Elige el orden de resolución. No hay una pila: lo nuevo espera a lo que ya estaba pendiente.',
    turnPlayer: 0,
    pending: [
      {
        id: 'a',
        owner: 0,
        label: 'el efecto A (Jugador A)',
        triggers: [{ id: 'c', owner: 0, label: 'el efecto C (Jugador A)' }],
      },
      { id: 'b', owner: 1, label: 'el efecto B (Jugador B)' },
    ],
  },
  {
    id: 'dos-propios',
    kind: 'order',
    title: 'Dos efectos propios y uno que nace al resolver',
    goal: 'A y B esperan a la vez; resolver A activa C. Comprueba cuándo le toca a C.',
    turnPlayer: 0,
    pending: [
      {
        id: 'a',
        owner: 0,
        label: 'el efecto A',
        triggers: [{ id: 'c', owner: 0, label: 'el efecto C' }],
      },
      { id: 'b', owner: 0, label: 'el efecto B' },
    ],
  },
  {
    id: 'reemplazo',
    kind: 'replacement',
    title: 'Dos efectos de reemplazo',
    goal: 'Ambas personas tienen un «instead» para el mismo K.O. Decide en orden.',
    turnPlayer: 0,
    process: 'el Vigía sufre K.O.',
    note: 'No se modela la prioridad de la carta que generó el reemplazo: la redacción de 8-1-3-4-2 tiene una observación abierta.',
    options: [
      { id: 'rival', owner: 1, label: 'El reemplazo del Jugador B', instead: 'el Vigía queda Rested', possible: true },
      { id: 'propio', owner: 0, label: 'El reemplazo del Jugador A', instead: 'se descarta 1 carta de la mano', possible: true },
    ],
  },
  {
    id: 'reemplazo-imposible',
    kind: 'replacement',
    title: 'Un reemplazo que no se puede cumplir',
    goal: 'El primer reemplazo pide algo imposible: observa qué ocurre.',
    turnPlayer: 0,
    process: 'el Vigía sufre K.O.',
    options: [
      {
        id: 'imposible',
        owner: 0,
        label: 'El reemplazo del Jugador A (descartar 1 carta con la mano vacía)',
        instead: 'se descarta 1 carta de la mano',
        possible: false,
      },
      { id: 'rival', owner: 1, label: 'El reemplazo del Jugador B', instead: 'el Vigía queda Rested', possible: true },
    ],
  },
];
