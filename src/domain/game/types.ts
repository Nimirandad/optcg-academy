/** Modelo del motor educativo. TypeScript puro: sin dependencias de framework. */

export type PlayerId = 0 | 1;
export type CardKind = 'leader' | 'character' | 'stage' | 'event';
export type Keyword = 'rush' | 'rush-character' | 'double-attack' | 'banish' | 'blocker' | 'unblockable';
export type Phase = 'refresh' | 'draw' | 'don' | 'main' | 'end';
export type BattleStep = 'block' | 'counter' | 'trigger';

/** Efecto [Activate: Main] de una carta ficticia. */
export interface Effect {
  id: string;
  text: string;
  oncePerTurn?: boolean;
  /** [DON!! xX]: DON!! asignados necesarios. */
  donRequired?: number;
  /** Símbolo ①: DON!! Active que pasan a Rested. */
  restDon?: number;
  /** DON!! −X: DON!! que vuelven al mazo de DON!!. */
  donMinus?: number;
  /** Cartas de la mano que se descartan como coste. */
  trashFromHand?: number;
  result: { draw?: number; power?: number };
}

export interface CardDef {
  id: string;
  name: string;
  kind: CardKind;
  cost?: number;
  power?: number;
  /** Life del Leader. */
  life?: number;
  /** Símbolo Counter de un Character. */
  counter?: number;
  /** Poder que otorga un Event con [Counter]. */
  counterEvent?: number;
  keywords?: readonly Keyword[];
  /** [Trigger] modelado: robar cartas. */
  trigger?: { draw: number };
  effects?: readonly Effect[];
}

export interface Card extends CardDef {
  uid: string;
}

export interface FieldCard {
  card: Card;
  rested: boolean;
  /** DON!! asignados. */
  don: number;
  /** Turno en que se jugó; `null` si ya estaba en el campo. */
  playedOnTurn: number | null;
  /** Cambio de poder que dura hasta el final del turno. */
  turnPower: number;
}

export interface PlayerState {
  name: string;
  leader: FieldCard;
  characters: readonly FieldCard[];
  stage: FieldCard | null;
  hand: readonly Card[];
  /** La primera es la carta superior. */
  deck: readonly Card[];
  trash: readonly Card[];
  /** La primera es la carta superior. */
  life: readonly Card[];
  donDeck: number;
  donActive: number;
  donRested: number;
}

export interface Battle {
  step: BattleStep;
  attacker: string;
  target: string;
  /** Poder sumado «during this battle», por carta. */
  bonus: Readonly<Record<string, number>>;
  /** Puntos de daño sin procesar. */
  damageLeft: number;
  /** Carta de Life con [Trigger] a la espera de decisión. */
  trigger: Card | null;
}

export interface LogEntry {
  text: string;
  ruleIds: readonly string[];
}

export interface Outcome {
  losers: readonly PlayerId[];
  reason: string;
}

export interface GameState {
  players: readonly [PlayerState, PlayerState];
  first: PlayerId;
  turn: number;
  phase: Phase;
  battle: Battle | null;
  result: Outcome | null;
  /** Efectos [Once Per Turn] ya usados este turno (`uid:efecto`). */
  used: readonly string[];
  log: readonly LogEntry[];
}

/** Origen de un DON!! devuelto por DON!! −X: zona de coste o una carta. */
export type DonSource = 'cost-active' | 'cost-rested' | (string & {});

export type Action =
  | { type: 'advance' }
  | { type: 'play'; uid: string; replace?: string }
  | { type: 'attach'; uid: string }
  | { type: 'activate'; uid: string; effectId: string; discard?: readonly string[]; donFrom?: readonly DonSource[] }
  | { type: 'attack'; attacker: string; target: string }
  | { type: 'block'; uid: string }
  | { type: 'skip-block' }
  | { type: 'counter'; uid: string; target: string }
  | { type: 'resolve' }
  | { type: 'trigger'; activate: boolean }
  | { type: 'concede'; player: PlayerId };

export interface RuleError {
  message: string;
  ruleIds: readonly string[];
}

export type ActionResult = { ok: true; state: GameState } | { ok: false; error: RuleError };
