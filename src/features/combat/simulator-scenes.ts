import { createState } from '../../domain/game/state';
import type { CardDef } from '../../domain/game/types';
import { officialCombatCards as real } from './official';
import type { Choice, Scene } from './scenes';

const idle = () => null;
const field = (card: CardDef, rested = false) => ({ card, uid: card.id, rested });
const choice = (id: string, label: string, action: Choice['action'], card?: string): Choice => ({ id, label, action, card });

const kawamatsu = real.kawamatsu.id;
const zephyr = real.zephyr.id;

const combat: Scene = {
  id: 'sim-objetivo',
  title: 'Un objetivo girado',
  mission: 'Ataca con Kawamatsu y haz K.O. a un Character rival.',
  sources: [569032, 569033],
  hint: 'Zephyr está Rested y Jango está Active. Toca el objetivo y sigue los pasos de la batalla.',
  ruleIds: ['7-1-1-2', '7-1-2', '7-1-3', '7-1-4-1-2'],
  create: () => createState({ turn: 3, players: [
    { name: 'Tú', leader: { card: real.zoro }, characters: [field(real.kawamatsu)], deck: [real.kawamatsu], life: [real.kawamatsu] },
    { name: 'Rival', leader: { card: real.kuzan }, characters: [field(real.jango), field(real.zephyr, true)], life: [real.jango], deck: [real.jango] },
  ] }),
  choices: (state) => {
    switch (state.battle?.step) {
      case 'block': return [choice('bloqueo', 'Pasar bloqueo', { type: 'skip-block' })];
      case 'counter': return [choice('daño', 'Resolver daño', { type: 'resolve' })];
      default: return [
        choice('zephyr', 'Atacar a Zephyr', { type: 'attack', attacker: kawamatsu, target: zephyr }, zephyr),
        choice('jango', 'Atacar a Jango', { type: 'attack', attacker: kawamatsu, target: real.jango.id }, real.jango.id),
        choice('leader', 'Atacar a Kuzan', { type: 'attack', attacker: kawamatsu, target: '1-leader' }, '1-leader'),
      ];
    }
  },
  auto: idle,
  goal: (state) => state.players[1].trash.some((card) => card.id === zephyr),
  win: 'Zephyr fue al Trash. La mesa muestra qué carta queda en campo.',
  retry: 'La misión pedía un K.O. a un Character. Prueba con la carta girada.',
};

const turnSteps = [
  { id: 'refresh', label: 'Refresh' }, { id: 'draw', label: 'Draw' },
  { id: 'don', label: 'DON!!' }, { id: 'main', label: 'Main' }, { id: 'end', label: 'End' },
];

const turns: Scene = {
  id: 'sim-turno',
  title: 'De Refresh a End Phase',
  mission: 'Es tu segundo turno. Endereza a Jinbe, roba una carta y añade dos DON!! antes de jugar.',
  sources: [569031, 569033],
  hint: 'En Main puedes jugar a Nico Robin por 3 DON!!, asignar un DON!! a tu Leader o hacer ambas cosas. Solo en el primer turno de quien empieza se omite el robo y se añade un solo DON!!.',
  ruleIds: ['6-2-3', '6-2-4', '6-3-1', '6-4-1', '6-5-3-1', '6-5-5-1', '6-6'],
  steps: turnSteps,
  step: (state) => state.turn === 2 ? 'refresh' : state.phase,
  create: () => createState({ turn: 2, phase: 'end', players: [
    {
      name: 'Tú', leader: { card: real.luffy }, characters: [{ ...field(real.jinbe, true), don: 1 }],
      hand: [real.jinbe], deck: [real.robin, real.jinbe, real.robin],
      life: [real.jinbe], donDeck: 8, donRested: 1,
    },
    { name: 'Rival', leader: { card: real.kuzan }, deck: [real.jango], life: [real.jango] },
  ] }),
  choices: (state) => {
    if (state.turn === 2) return [choice('refresh', 'Enderezar cartas · Refresh', { type: 'advance' })];
    if (state.phase === 'refresh') return [choice('draw', 'Robar 1 carta', { type: 'advance' })];
    if (state.phase === 'draw') return [choice('don-phase', 'Añadir 2 DON!!', { type: 'advance' })];
    if (state.phase === 'don') return [choice('main', 'Entrar a Main Phase', { type: 'advance' })];

    const player = state.players[0];
    const actions = player.hand.map(({ uid, name }) => choice(uid, `Jugar ${name}`, { type: 'play', uid }, uid));
    if (player.donActive > 0) actions.unshift(choice('assign', 'Asignar DON!! al Leader', { type: 'attach', uid: '0-leader' }, '0-leader'));
    if (player.leader.don > 0 || player.characters.length > 1) {
      actions.push(choice('end', 'Terminar el turno', { type: 'advance' }));
    }
    return actions;
  },
  auto: idle,
  complete: (state) => state.turn === 3 && state.phase === 'end',
  goal: () => true,
  win: 'Completaste el turno. Repite el ejercicio para probar qué cambia al jugar una carta o asignar DON!! en otro orden.',
  retry: '',
};

const playmat: Scene = {
  id: 'sim-jugar',
  title: 'De la mano al campo',
  mission: 'Toca a Nico Robin en tu mano para pagar su coste y jugarla.',
  sources: [569031, 569033],
  hint: 'Nico Robin cuesta 3. Los DON!! usados para pagar se giran en la zona de coste.',
  ruleIds: ['3-7', '6-5-3-1', '2-7-2'],
  steps: [{ id: 'hand', label: 'Mano' }, { id: 'field', label: 'Campo' }],
  step: (state) => state.players[0].characters.length ? 'field' : 'hand',
  create: () => createState({ turn: 3, players: [
    { name: 'Tú', leader: { card: real.luffy }, hand: [real.robin, real.jinbe], deck: [real.robin], life: [real.jinbe], donActive: 3 },
    { name: 'Rival', leader: { card: real.kuzan }, deck: [real.jango], life: [real.jango] },
  ] }),
  choices: (state) => state.players[0].hand.map(({ uid, name }) =>
    choice(uid, `Jugar ${name}`, { type: 'play', uid }, uid)),
  auto: idle,
  complete: (state) => state.players[0].characters.some((item) => item.card.id === real.robin.id),
  goal: () => true,
  win: 'Nico Robin pasó de tu mano al campo. Los 3 DON!! quedaron Rested.',
  retry: '',
};

// Efecto de ST21-001, cotejado en la lista de Bandai de ST-31 el 2026-11-27.
const luffyEffect = {
  id: 'dar-don-rested',
  text: 'Puedes asignar hasta dos DON!! Rested de tu zona de coste a uno de tus Characters.',
  donRequired: 1,
  oncePerTurn: true,
  result: { giveRestedDonToCharacter: 2 },
} satisfies NonNullable<CardDef['effects']>[number];

const effects: Scene = {
  id: 'sim-activar',
  title: 'Activa el efecto de Luffy',
  mission: 'Asigna 1 DON!! Active a tu Leader y usa su efecto para darle los 2 DON!! Rested a Jinbe.',
  sources: [569031, 569033],
  hint: 'El DON!! en Luffy es una condición, así que se queda asignado. Jinbe recibe los DON!! Rested de la zona de coste. Solo puedes activar este efecto una vez por turno.',
  ruleIds: ['8-3-2-3', '8-4-1-5', '10-2-2-1', '10-2-13-1'],
  steps: [{ id: 'assign', label: 'Condición' }, { id: 'activate', label: 'Activación' }, { id: 'resolve', label: 'Resolución' }],
  step: (state) => state.players[0].characters[0]?.don ? 'resolve' : state.players[0].leader.don ? 'activate' : 'assign',
  create: () => createState({ turn: 3, players: [
    { name: 'Tú', leader: { card: { ...real.luffy, effects: [luffyEffect] } }, characters: [field(real.jinbe)],
      deck: [real.robin], life: [real.jinbe], donDeck: 7, donActive: 1, donRested: 2 },
    { name: 'Rival', leader: { card: real.kuzan }, deck: [real.jango], life: [real.jango] },
  ] }),
  choices: (state) => {
    const leader = state.players[0].leader.card.uid;
    const activate = choice('activar', 'Activar efecto de Luffy y dar 2 DON!! a Jinbe', {
      type: 'activate', uid: leader, effectId: luffyEffect.id, giveRestedDon: { target: real.jinbe.id, count: 2 },
    }, real.jinbe.id);
    return state.players[0].leader.don
      ? [activate]
      : [choice('asignar', 'Asignar 1 DON!! al Leader', { type: 'attach', uid: leader }, leader), activate];
  },
  auto: idle,
  complete: (state) => state.players[0].characters[0]?.don === 2,
  goal: () => true,
  win: 'Los dos DON!! Rested salieron de la zona de coste y quedaron asignados a Jinbe. Luffy conservó el suyo.',
  retry: '',
};

export const simulatorScenes = { combate: [combat], turnos: [turns], playmat: [playmat], efectos: [effects] };
