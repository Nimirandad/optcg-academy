/** Cartas ficticias, inventadas para practicar. No corresponden a ningún producto oficial. */
import type { CardDef } from '../../domain/game/types';

const leader = (id: string, name: string, extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name,
  kind: 'leader',
  power: 5000,
  life: 5,
  ...extra,
});

const character = (id: string, name: string, cost: number, power: number, extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name,
  kind: 'character',
  cost,
  power,
  ...extra,
});

export const cards = {
  capitana: leader('capitana', 'Capitana de práctica'),
  almirante: leader('almirante', 'Almirante de práctica'),
  grumete: character('grumete', 'Grumete', 1, 3000, { counter: 1000 }),
  vigia: character('vigia', 'Vigía', 2, 4000, { counter: 2000 }),
  artillero: character('artillero', 'Artillero', 4, 6000),
  escudo: character('escudo', 'Escudera', 2, 3000, { keywords: ['blocker'] }),
  doble: character('doble', 'Espadachina doble', 4, 5000, { keywords: ['double-attack'] }),
  desterrador: character('desterrador', 'Desterrador', 3, 5000, { keywords: ['banish'] }),
  sombra: character('sombra', 'Sombra', 3, 5000, { keywords: ['unblockable'] }),
  veloz: character('veloz', 'Corredora', 3, 4000, { keywords: ['rush'] }),
  cazador: character('cazador', 'Cazador', 3, 5000, { keywords: ['rush-character'] }),
  mensaje: character('mensaje', 'Mensajero', 2, 2000, { counter: 1000, trigger: { draw: 1 } }),
  maniobra: { id: 'maniobra', name: 'Maniobra evasiva (Event)', kind: 'event', cost: 1, counterEvent: 4000 },
  puerto: { id: 'puerto', name: 'Puerto de práctica (Stage)', kind: 'stage', cost: 1 },
  faro: { id: 'faro', name: 'Faro de práctica (Stage)', kind: 'stage', cost: 2 },
  cronista: character('cronista', 'Cronista', 2, 3000, {
    effects: [
      { id: 'anotar', text: '[DON!! x1] [Activate: Main] ① : roba 1 carta.', donRequired: 1, restDon: 1, result: { draw: 1 } },
    ],
  }),
  tambor: character('tambor', 'Tamborilera', 2, 3000, {
    effects: [
      {
        id: 'redoble',
        text: '[Activate: Main] [Once Per Turn] ① : esta carta gana +2000 durante este turno.',
        oncePerTurn: true,
        restDon: 1,
        result: { power: 2000 },
      },
    ],
  }),
  alquimista: character('alquimista', 'Alquimista', 3, 4000, {
    effects: [
      {
        id: 'canje',
        text: '[Activate: Main] DON!! −2, descarta 1 carta de tu mano: roba 2 cartas.',
        donMinus: 2,
        trashFromHand: 1,
        result: { draw: 2 },
      },
    ],
  }),
} satisfies Record<string, CardDef>;

/** Repite una lista hasta completar la cantidad pedida. */
export const pile = (list: readonly CardDef[], size: number): CardDef[] =>
  Array.from({ length: size }, (_, index) => list[index % list.length]!);

export const keywordNames: Record<string, string> = {
  rush: '[Rush]',
  'rush-character': '[Rush: Character]',
  'double-attack': '[Double Attack]',
  banish: '[Banish]',
  blocker: '[Blocker]',
  unblockable: '[Unblockable]',
};

/** Resumen de una carta en texto. */
export function describe(card: CardDef): string {
  const parts: string[] = [];
  if (card.cost !== undefined) parts.push(`coste ${card.cost}`);
  if (card.power !== undefined) parts.push(`poder base ${card.power}`);
  if (card.counter) parts.push(`Counter +${card.counter}`);
  if (card.counterEvent) parts.push(`[Counter] +${card.counterEvent}`);
  if (card.trigger) parts.push(`[Trigger] roba ${card.trigger.draw}`);
  parts.push(...(card.keywords ?? []).map((keyword) => keywordNames[keyword]!));
  return parts.join(', ');
}
