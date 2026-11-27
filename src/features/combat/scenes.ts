/** Retos guiados de combate. Las reglas las aplica el motor; aquí solo hay situaciones y textos. */
import { run } from '../../domain/game/reducer';
import { createState, findOnField, powerOf, type PlayerSpec } from '../../domain/game/state';
import type { Action, CardDef, GameState } from '../../domain/game/types';
import { cards, pile } from '../shared/cards';

export interface Choice {
  id: string;
  label: string;
  action: Action;
  /** Carta de la mesa o de la mano que también ejecuta la acción al tocarla. */
  card?: string;
}

export interface Scene {
  id: string;
  title: string;
  mission: string;
  hint: string;
  ruleIds: string[];
  create: () => GameState;
  choices: (state: GameState) => Choice[];
  /** Acción que se aplica sola tras una pausa, si corresponde. */
  auto: (state: GameState) => Action | null;
  goal: (state: GameState) => boolean;
  win: string;
  retry: string;
}

const you = 0;
const rival = 1;

function table(first: 0 | 1, mine: Partial<PlayerSpec> = {}, theirs: Partial<PlayerSpec> = {}): GameState {
  const player = (name: string, leader: CardDef, extra: Partial<PlayerSpec>): PlayerSpec => ({
    name,
    leader: { card: leader },
    deck: pile([cards.grumete], 5),
    life: pile([cards.artillero], 3),
    donDeck: 6,
    donActive: 0,
    ...extra,
  });
  return createState({
    turn: 3,
    first,
    players: [
      player('Tú', { ...cards.capitana, name: 'Tu capitana' }, mine),
      player('Rival', { ...cards.almirante, name: 'Líder rival' }, theirs),
    ],
  });
}

const on = (card: CardDef, rested = false) => ({ card, uid: card.id, rested });

export const battleOver = (state: GameState) => state.log.some((entry) => entry.text.startsWith('End of the Battle'));

/** Cuando atacas tú, el rival no responde: la batalla avanza sola. */
const rivalPasses = (state: GameState): Action | null =>
  state.battle?.step === 'block' ? { type: 'skip-block' } : state.battle?.step === 'counter' ? { type: 'resolve' } : null;

const attack = (attacker: string, target: string, label: string): Choice => ({
  id: `atacar-${target}`,
  label,
  action: { type: 'attack', attacker, target },
  card: target,
});

export const scenes: Scene[] = [
  {
    id: 'primer-ataque',
    title: 'Tu primer ataque',
    mission: 'Ataca al Líder rival con tu capitana.',
    hint: 'Las dos tienen 5000 de poder. ¿Quién gana un empate?',
    ruleIds: ['7-1-1', '7-1-4-1', '4-6-2-1'],
    create: () => table(you),
    choices: (state) => (state.battle || battleOver(state) ? [] : [attack('0-leader', '1-leader', 'Atacar al Líder rival')]),
    auto: rivalPasses,
    goal: (state) => state.players[rival].life.length === 2,
    win: '¡Impacto! Con el mismo poder gana quien ataca. El rival pasa una carta de Life a su mano.',
    retry: 'El Líder rival no recibió daño.',
  },
  {
    id: 'don',
    title: 'Súmale fuerza',
    mission: 'Tu Vigía tiene 4000. Consigue que dañe al Líder rival.',
    hint: 'Cada DON!! asignado suma 1000 durante tu turno.',
    ruleIds: ['6-5-5', '7-1-4-2'],
    create: () => table(you, { characters: [on(cards.vigia)], donActive: 2 }),
    choices: (state) => {
      if (state.battle || battleOver(state)) return [];
      const give: Choice[] = state.players[you].donActive
        ? [{ id: 'don', label: 'Dar 1 DON!! al Vigía', action: { type: 'attach', uid: 'vigia' }, card: 'vigia' }]
        : [];
      return [...give, attack('vigia', '1-leader', 'Atacar al Líder rival')];
    },
    auto: rivalPasses,
    goal: (state) => state.players[rival].life.length === 2,
    win: '¡Lo lograste! Con DON!! el Vigía alcanzó el poder del Líder y el empate le favoreció.',
    retry: 'El ataque falló: tenía menos poder. Tu Vigía sigue en la mesa, pero quedó Rested.',
  },
  {
    id: 'objetivo',
    title: 'Elige tu objetivo',
    mission: 'Haz K.O. a un personaje rival.',
    hint: 'No todos los personajes se pueden atacar. Fíjate en cuál está girado.',
    ruleIds: ['7-1-1-2', '7-1-4-1-2'],
    create: () =>
      table(you, { characters: [on(cards.artillero)] }, { characters: [on(cards.vigia, true), on(cards.grumete)] }),
    choices: (state) =>
      state.battle || battleOver(state)
        ? []
        : [
            attack('artillero', 'vigia', 'Atacar al Vigía'),
            attack('artillero', 'grumete', 'Atacar al Grumete'),
            attack('artillero', '1-leader', 'Atacar al Líder'),
          ],
    auto: rivalPasses,
    goal: (state) => !findOnField(state, 'vigia'),
    win: '¡K.O.! A un personaje solo se le ataca si está Rested (girado).',
    retry: 'Dañaste al Líder, pero la misión era hacer K.O. a un personaje.',
  },
  {
    id: 'blocker',
    title: '¡Bloquea!',
    mission: 'El Artillero rival va contra tu capitana. Protege tus cartas de Life.',
    hint: 'La Escudera tiene [Blocker]: puede ponerse en medio.',
    ruleIds: ['7-1-2', '10-1-4-1'],
    create: () =>
      run(table(rival, { characters: [on(cards.escudo)] }, { characters: [on(cards.artillero)] }), [
        { type: 'attack', attacker: 'artillero', target: '0-leader' },
      ]),
    choices: (state) =>
      state.battle?.step === 'block'
        ? [
            { id: 'bloquear', label: 'Bloquear con la Escudera', action: { type: 'block', uid: 'escudo' }, card: 'escudo' },
            { id: 'pasar', label: 'No bloquear', action: { type: 'skip-block' } },
          ]
        : [],
    auto: (state) => (state.battle?.step === 'counter' ? { type: 'resolve' } : null),
    goal: (state) => state.players[you].life.length === 3,
    win: '¡Bien defendido! La Escudera recibió el ataque y tus 3 cartas de Life siguen intactas.',
    retry: 'Recibiste 1 de daño. A veces conviene, pero esta misión pedía proteger tus Life.',
  },
  {
    id: 'counter',
    title: 'Contraataca con Counter',
    mission: 'El ataque tiene 6000 y tu capitana 5000. Evita el daño.',
    hint: 'Empatar no basta: tu poder debe superar al del ataque.',
    ruleIds: ['7-1-3', '7-1-4-2'],
    create: () =>
      run(table(rival, { hand: [cards.grumete, cards.vigia] }, { characters: [on(cards.artillero)] }), [
        { type: 'attack', attacker: 'artillero', target: '0-leader' },
        { type: 'skip-block' },
      ]),
    choices: (state) =>
      state.battle?.step === 'counter'
        ? [
            ...state.players[you].hand.map((card): Choice => ({
              id: `counter-${card.uid}`,
              label: `Usar ${card.name} (+${card.counter})`,
              action: { type: 'counter', uid: card.uid, target: '0-leader' },
              card: card.uid,
            })),
            { id: 'resolver', label: 'Resolver el ataque', action: { type: 'resolve' } },
          ]
        : [],
    auto: () => null,
    goal: (state) => state.players[you].life.length === 3,
    win: '¡Defensa perfecta! Superaste el poder del ataque, así que no hubo daño.',
    retry: 'Recibiste daño: tu poder no superó al del ataque.',
  },
];

/** `null` mientras la batalla del reto no haya terminado. */
export const verdict = (scene: Scene, state: GameState): 'win' | 'retry' | null =>
  battleOver(state) ? (scene.goal(state) ? 'win' : 'retry') : null;

export interface Clash {
  attacker: string;
  target: string;
  attack: number;
  defense: number;
}

/** Marcador de la batalla en curso. */
export function clashOf(state: GameState): Clash | null {
  if (!state.battle) return null;
  const { attacker, target } = state.battle;
  return { attacker, target, attack: powerOf(state, attacker), defense: powerOf(state, target) };
}
