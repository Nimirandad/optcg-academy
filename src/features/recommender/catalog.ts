import { cardSchema, deckSchema, productSchema } from '../../lib/deck-schemas';
import deckData from '../../data/decks/starter-decks.json';
import products from '../../data/products/starter-decks.json';
import references from '../../data/catalog/reference-lists.json';
import teach from '../../data/catalog/st-27.json';
import { colorProfiles } from './colors';

const sets = import.meta.glob<{ default: unknown }>('../../data/cards/*.json', { eager: true });
const lookup = new Map(Object.entries(references));
export const exportList = (list: { leaderId: string; entries: { cardId: string; quantity: number }[] }) =>
  [`1x${list.leaderId}`, ...list.entries.map(({ cardId, quantity }) => `${quantity}x${cardId}`)].join('\n');
const decks = new Map(deckSchema.array().parse(deckData).map((deck) => [deck.id, deck]));
const displayed = [
  ...products.map((product) => product.id === 'ST-35' ? productSchema.parse(teach.product) : product),
  ...products.filter(({ id }) => id === 'ST-35'),
];
export const lists = displayed.map((product) => {
  const path = `../../data/cards/${product.id.toLowerCase()}.json`;
  const cards = cardSchema.array().parse(product.id === 'ST-27' ? teach.cards : sets[path]?.default);
  const deck = decks.get(product.id.toLowerCase());
  const leader = cards.find(({ category }) => category === 'leader')!;
  const reference = lookup.get(product.id.toLowerCase());
  const list = deck ?? reference;
  const quantities = new Map(list?.entries.map(({ cardId, quantity }) => [cardId, quantity]));
  const exportText = list && exportList(list);
  const leaderList = lookup.get(leader.number);
  const color = leader.colors[0];
  const profile = colorProfiles.find(({ id }) => id === color);
  if (!profile) throw new Error(`Perfil de color desconocido para ${product.id}`);
  const anchor = product.id === 'ST-35' ? 'mazo-st-35' : `mazo-${profile.id}`;
  return { anchor, product, cards: [leader, ...cards.filter((card) => card !== leader)], leader, profile, deck, reference, leaderList, quantities, exportText };
});
