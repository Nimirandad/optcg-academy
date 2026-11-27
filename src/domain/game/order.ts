/** Orden de resolución (8-6-1) y de efectos de reemplazo (8-1-3-4). No hay una pila. */
import { other } from './state';
import type { LogEntry, PlayerId, RuleError } from './types';

export interface PendingEffect {
  id: string;
  owner: PlayerId;
  label: string;
  /** Efectos cuyo momento se cumple al resolver este. */
  triggers?: readonly PendingEffect[];
}

export interface OrderState {
  turnPlayer: PlayerId;
  /** Efectos pendientes; cada tanda reúne los que cumplieron su momento durante la anterior. */
  waves: readonly (readonly PendingEffect[])[];
  resolved: readonly string[];
  log: readonly LogEntry[];
}

export type Step<T> = { ok: true; state: T } | { ok: false; error: RuleError };

export const createOrder = (turnPlayer: PlayerId, pending: readonly PendingEffect[]): OrderState => ({
  turnPlayer,
  waves: pending.length ? [pending] : [],
  resolved: [],
  log: [],
});

/** Efectos que pueden resolverse ahora: los de la persona del turno de la tanda más antigua. */
export function eligible(state: OrderState): readonly PendingEffect[] {
  const wave = state.waves[0] ?? [];
  const own = wave.filter((effect) => effect.owner === state.turnPlayer);
  return own.length ? own : wave.filter((effect) => effect.owner === other(state.turnPlayer));
}

export function resolvePending(state: OrderState, id: string): Step<OrderState> {
  const effect = eligible(state).find((item) => item.id === id);
  if (!effect) {
    return {
      ok: false,
      error: {
        message: 'Todavía no le toca: primero se resuelven los pendientes anteriores, empezando por la persona del turno.',
        ruleIds: ['8-6-1', '8-6-1-1'],
      },
    };
  }
  const [wave = [], ...later] = state.waves;
  const rest = wave.filter((item) => item.id !== id);
  const waves = [...(rest.length ? [rest] : []), ...later];
  // Los recién activados esperan a que termine todo lo que ya estaba pendiente.
  if (effect.triggers?.length) waves.push(effect.triggers);
  const added = effect.triggers?.map((item) => item.label).join(', ');
  const text = `Se resuelve ${effect.label}.${added ? ` Queda pendiente: ${added}.` : ''}`;
  return {
    ok: true,
    state: {
      ...state,
      waves,
      resolved: [...state.resolved, id],
      log: [...state.log, { text, ruleIds: added ? ['8-6-1', '8-6-3'] : ['8-6-1'] }],
    },
  };
}

export interface Replacement {
  id: string;
  owner: PlayerId;
  label: string;
  /** Lo que ocurre en lugar del proceso original. */
  instead: string;
  /** Falso si no se puede hacer lo que indica «instead». */
  possible: boolean;
}

export interface ReplacementState {
  turnPlayer: PlayerId;
  /** Proceso que se quiere reemplazar. */
  process: string;
  queue: readonly Replacement[];
  /** Resultado final; `null` mientras queden decisiones. */
  outcome: string | null;
  log: readonly LogEntry[];
}

/**
 * Ordena primero los de la persona del turno y después los del rival.
 * No modela la prioridad de «la carta que generó el reemplazo» (observación sobre 8-1-3-4-2).
 */
export function createReplacement(turnPlayer: PlayerId, process: string, options: readonly Replacement[]): ReplacementState {
  const queue = [turnPlayer, other(turnPlayer)].flatMap((id) => options.filter((option) => option.owner === id));
  return advanceQueue({ turnPlayer, process, queue, outcome: null, log: [] });
}

/** Descarta los reemplazos imposibles y cierra el proceso si no queda ninguno. */
function advanceQueue(state: ReplacementState): ReplacementState {
  let { queue, log } = state;
  while (queue[0] && !queue[0].possible) {
    log = [...log, { text: `${queue[0].label} no puede aplicarse: no es posible hacer lo que indica.`, ruleIds: ['8-1-3-4-5'] }];
    queue = queue.slice(1);
  }
  if (queue.length) return { ...state, queue, log };
  const outcome = `Sin reemplazo: ${state.process}.`;
  return { ...state, queue, outcome, log: [...log, { text: outcome, ruleIds: ['8-1-3-4-1'] }] };
}

export function decide(state: ReplacementState, apply: boolean): Step<ReplacementState> {
  const [current, ...queue] = state.queue;
  if (state.outcome || !current) {
    return { ok: false, error: { message: 'Ya no queda ninguna decisión.', ruleIds: ['8-1-3-4'] } };
  }
  if (apply) {
    const outcome = `En lugar de «${state.process}»: ${current.instead}.`;
    return {
      ok: true,
      state: {
        ...state,
        queue: [],
        outcome,
        log: [...state.log, { text: `${current.label} se aplica. ${outcome}`, ruleIds: ['8-1-3-4-4', '8-1-3-4-7'] }],
      },
    };
  }
  const declined: LogEntry = { text: `${current.label} no se usa y no se resuelve.`, ruleIds: ['8-1-3-4-1'] };
  return { ok: true, state: advanceQueue({ ...state, queue, log: [...state.log, declined] }) };
}
