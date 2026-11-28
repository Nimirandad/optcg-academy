/** Retos guiados de combate. Las reglas las aplica el motor; aquí solo hay situaciones y textos. */
import { run } from '../../domain/game/reducer';
import { createState, findOnField, powerOf, type PlayerSpec } from '../../domain/game/state';
import type { Action, CardDef, GameState } from '../../domain/game/types';
import { pile } from '../shared/cards';
import { officialCombatCards as real } from './official';

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
  sources?: readonly [number, number];
  complete?: (state: GameState) => boolean;
  steps?: { id: string; label: string }[];
  step?: (state: GameState) => string;
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

const on = (card: CardDef, rested = false) => ({ card, uid: card.id, rested });

function player(name: string, leader: CardDef, reserves: CardDef, field: Partial<PlayerSpec> = {}): PlayerSpec {
  return {
    name,
    leader: { card: leader },
    deck: pile([reserves], 5),
    life: pile([reserves], 3),
    donDeck: 6,
    donActive: 0,
    ...field,
  };
}

const table = (first: 0 | 1, mine: PlayerSpec, theirs: PlayerSpec) =>
  createState({ turn: 3, first, players: [mine, theirs] });

const green = (name: string, field?: Partial<PlayerSpec>) => player(name, real.zoro, real.kawamatsu, field);
const blue = (name: string, field?: Partial<PlayerSpec>) => player(name, real.kuzan, real.jango, field);
const red = (name: string, field?: Partial<PlayerSpec>) => player(name, real.luffy, real.jinbe, field);

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
    mission: 'Ataca a Kuzan con Roronoa Zoro.',
    sources: [569032, 569033],
    hint: 'Ambos Leaders tienen 5000 de poder. ¿Quién gana un empate?',
    ruleIds: ['7-1-1', '7-1-4-1', '4-6-2-1'],
    create: () => table(you, green('Tú'), blue('Rival')),
    choices: (state) => (state.battle || battleOver(state) ? [] : [attack('0-leader', '1-leader', 'Atacar al Líder rival')]),
    auto: rivalPasses,
    goal: (state) => state.players[rival].life.length === 2,
    win: '¡Impacto! Con el mismo poder gana quien ataca. El rival pasa una carta de Life a su mano.',
    retry: 'El Líder rival no recibió daño.',
  },
  {
    id: 'don',
    title: 'Súmale fuerza',
    mission: 'Nico Robin tiene 4000. Asigna el DON!! disponible y ataca a Kuzan.',
    sources: [569031, 569033],
    hint: 'Cada DON!! asignado suma 1000 durante tu turno.',
    ruleIds: ['6-5-5', '7-1-4-2'],
    create: () => table(you, red('Tú', { characters: [on(real.robin)], donActive: 1 }), blue('Rival')),
    choices: (state) => {
      if (state.battle || battleOver(state)) return [];
      const give: Choice[] = state.players[you].donActive
        ? [{ id: 'don', label: 'Dar 1 DON!! a Nico Robin', action: { type: 'attach', uid: real.robin.id }, card: real.robin.id }]
        : [];
      return [...give, attack(real.robin.id, '1-leader', 'Atacar al Líder rival')];
    },
    auto: rivalPasses,
    goal: (state) => state.players[rival].life.length === 2,
    win: '¡Lo lograste! Con DON!! Nico Robin alcanzó el poder del Líder y el empate le favoreció.',
    retry: 'El ataque falló: tenía menos poder. Nico Robin sigue en la mesa, pero quedó Rested.',
  },
  {
    id: 'objetivo',
    title: 'Elige tu objetivo',
    mission: 'Haz K.O. a un personaje rival con Kawamatsu.',
    sources: [569032, 569033],
    hint: 'No todos los personajes se pueden atacar. Fíjate en cuál está girado.',
    ruleIds: ['7-1-1-2', '7-1-4-1-2'],
    create: () =>
      table(you, green('Tú', { characters: [on(real.kawamatsu)] }), blue('Rival', { characters: [on(real.zephyr, true), on(real.jango)] })),
    choices: (state) =>
      state.battle || battleOver(state)
        ? []
        : [
            attack(real.kawamatsu.id, real.zephyr.id, 'Atacar a Zephyr'),
            attack(real.kawamatsu.id, real.jango.id, 'Atacar a Jango'),
            attack(real.kawamatsu.id, '1-leader', 'Atacar al Líder'),
          ],
    auto: rivalPasses,
    goal: (state) => !findOnField(state, real.zephyr.id),
    win: '¡K.O.! A un personaje solo se le ataca si está Rested (girado).',
    retry: 'Dañaste al Líder, pero la misión era hacer K.O. a un personaje.',
  },
  {
    id: 'blocker',
    title: '¡Bloquea!',
    mission: 'Kawamatsu ataca a tu Luffy. Protege tus cartas de Life.',
    sources: [569031, 569032],
    hint: 'Jinbe tiene [Blocker]: puede ponerse en medio.',
    ruleIds: ['7-1-2', '10-1-4-1'],
    create: () =>
      run(table(rival, red('Tú', { characters: [on(real.jinbe)] }), green('Rival', { characters: [on(real.kawamatsu)] })), [
        { type: 'attack', attacker: real.kawamatsu.id, target: '0-leader' },
      ]),
    choices: (state) =>
      state.battle?.step === 'block'
        ? [
            { id: 'bloquear', label: 'Bloquear con Jinbe', action: { type: 'block', uid: real.jinbe.id }, card: real.jinbe.id },
            { id: 'pasar', label: 'No bloquear', action: { type: 'skip-block' } },
          ]
        : [],
    auto: (state) => (state.battle?.step === 'counter' ? { type: 'resolve' } : null),
    goal: (state) => state.players[you].life.length === 3,
    win: '¡Bien defendido! Jinbe recibió el ataque y tus 3 cartas de Life siguen intactas.',
    retry: 'Recibiste 1 de daño. A veces conviene, pero esta misión pedía proteger tus Life.',
  },
  {
    id: 'counter',
    title: 'Contraataca con Counter',
    mission: 'Kawamatsu ataca con 6000 y tu Kuzan tiene 5000. Evita el daño.',
    sources: [569033, 569032],
    hint: 'Empatar no basta: tu poder debe superar al del ataque.',
    ruleIds: ['7-1-3', '7-1-4-2'],
    create: () =>
      run(table(rival, blue('Tú', { hand: [real.jango, real.zephyr] }), green('Rival', { characters: [on(real.kawamatsu)] })), [
        { type: 'attack', attacker: real.kawamatsu.id, target: '0-leader' },
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
  (scene.complete?.(state) ?? battleOver(state)) ? (scene.goal(state) ? 'win' : 'retry') : null;

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
