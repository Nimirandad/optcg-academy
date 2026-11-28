import { setField } from '../../domain/game/change';
import { run } from '../../domain/game/reducer';
import { createState } from '../../domain/game/state';
import { officialCombatCards as real } from './official';
import type { Choice, Scene } from './scenes';

const pass = { id: 'resolver', label: 'Resolver el ataque', action: { type: 'resolve' } } satisfies Choice;
const skipBlock = { id: 'pasar', label: 'No bloquear', action: { type: 'skip-block' } } satisfies Choice;
const idle = () => null;

export const caseScenes: Record<string, Scene & { mode: string; icon: string }> = {
  'mazo-vacio': {
    id: 'mazo-vacio',
    mode: 'turnos',
    icon: 'cartas',
    title: 'El último robo',
    mission: 'Tu mazo tiene una sola carta. Roba y observa qué ocurre.',
    hint: 'Mira el contador del mazo después de robar.',
    sources: [569031, 569033],
    ruleIds: ['1-2-1-1-2', '1-2-2', '9-1-2'],
    steps: [{ id: 'draw', label: 'Robo' }, { id: 'rules', label: 'Procesamiento de reglas' }],
    step: (state) => state.result ? 'rules' : 'draw',
    create: () => createState({ turn: 3, phase: 'refresh', players: [
      { name: 'Tú', leader: { card: real.luffy }, deck: [real.robin], life: [real.jinbe] },
      { name: 'Rival', leader: { card: real.kuzan }, deck: [real.jango], life: [real.jango] },
    ] }),
    choices: () => [{ id: 'robar', label: 'Robar la última carta', action: { type: 'advance' } }],
    auto: idle,
    complete: (state) => state.result !== null,
    goal: (state) => state.result?.losers.includes(0) ?? false,
    win: 'Nico Robin llegó a tu mano. Al quedar tu mazo vacío, la partida termina y pierdes de inmediato.',
    retry: '',
  },
  'bloqueo-y-counter': {
    id: 'bloqueo-y-counter',
    mode: 'combate',
    icon: 'escudo',
    title: 'Bloqueo y Counter',
    mission: 'Protege a Luffy del ataque de Kawamatsu y deja a Jinbe en el campo.',
    hint: 'Después de bloquear, compara el poder de Jinbe con el ataque y revisa el Counter de tu mano.',
    sources: [569031, 569032],
    ruleIds: ['10-1-4-1', '7-1-3-1-1', '7-1-4-1-2'],
    create: () => run(createState({ first: 1, turn: 3, players: [
      { name: 'Tú', leader: { card: real.luffy }, characters: [{ card: real.jinbe, uid: real.jinbe.id }],
        hand: [real.robin], deck: [real.jinbe], life: [real.robin] },
      { name: 'Rival', leader: { card: real.zoro }, characters: [{ card: real.kawamatsu, uid: real.kawamatsu.id }],
        deck: [real.kawamatsu], life: [real.kawamatsu] },
    ] }), [{ type: 'attack', attacker: real.kawamatsu.id, target: '0-leader' }]),
    choices: (state) => {
      const battle = state.battle;
      if (battle?.step === 'block') return [
        { id: 'bloquear', label: 'Bloquear con Jinbe', action: { type: 'block', uid: real.jinbe.id }, card: real.jinbe.id },
        skipBlock,
      ];
      if (battle?.step !== 'counter') return [];
      return [
        ...state.players[0].hand.map((card): Choice => ({
          id: card.uid,
          label: `Usar ${card.name} (+${card.counter})`,
          action: { type: 'counter', uid: card.uid, target: battle.target },
          card: card.uid,
        })),
        pass,
      ];
    },
    auto: idle,
    goal: (state) => state.players[0].life.length === 1 && state.players[0].characters.length === 1,
    win: 'Jinbe cambió el objetivo del ataque y llegó a 7000 con el Counter de Nico Robin. Conservaste a Jinbe y tu carta de Vida.',
    retry: 'Para conservar a Jinbe y tu Vida, bloquea primero y luego usa el Counter de tu mano.',
  },
  'poder-negativo': {
    id: 'poder-negativo',
    mode: 'combate',
    icon: 'trofeo',
    title: 'Duelo en negativo',
    mission: 'Kawamatsu y Zephyr ya tienen reducciones de poder. Ataca a Zephyr y observa cómo se resuelve el empate a −2000.',
    hint: 'Se compara el poder actual de ambas cartas, incluso cuando es negativo.',
    sources: [569032, 569033],
    ruleIds: ['1-3-6-1-1', '7-1-4-1', '7-1-4-1-2'],
    create: () => {
      const state = createState({ turn: 3, players: [
        { name: 'Tú', leader: { card: real.zoro }, characters: [{ card: real.kawamatsu, uid: real.kawamatsu.id }],
          deck: [real.kawamatsu], life: [real.kawamatsu] },
        { name: 'Rival', leader: { card: real.kuzan }, characters: [{ card: real.zephyr, uid: real.zephyr.id, rested: true }],
          deck: [real.jango], life: [real.jango] },
      ] });
      return setField(setField(state, real.kawamatsu.id, { turnPower: -8000 }), real.zephyr.id, { turnPower: -7000 });
    },
    choices: (state) => {
      if (state.battle?.step === 'counter') return [pass];
      if (state.battle) return [];
      return [{ id: 'atacar', label: 'Atacar a Zephyr', action: { type: 'attack', attacker: real.kawamatsu.id, target: real.zephyr.id }, card: real.zephyr.id }];
    },
    auto: (state) => state.battle?.step === 'block' ? skipBlock.action : null,
    goal: (state) => state.players[1].trash.some((card) => card.id === real.zephyr.id),
    win: 'Zephyr fue al Trash. A igual poder, el atacante gana la comparación, incluso con −2000.',
    retry: '',
  },
};
