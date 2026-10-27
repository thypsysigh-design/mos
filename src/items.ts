import itemData from './data/items.json';
import { locale, textForLocale, type Locale } from './localization';

export type ItemId = 'sword' | 'charm' | 'blade' | 'potion' | 'spirit_potion';
export type ItemData = { kind: 'equipment' | 'consumable'; slot: '' | 'weapon' | 'armor'; effect: 'physical_attack' | 'defense' | 'heal_hp' | 'heal_mp'; amount: number; buy: number; sell: number; names: Record<string, string>; flavors: Record<string, string> };
export type CatalogItem = { name: string; description: string; kind: 'equipment' | 'consumable'; effect: ItemData['effect']; amount: number; buy: number; sell: number };
const effectTexts = { physical_attack: 'items.effect.physical_attack', defense: 'items.effect.defense', heal_hp: 'items.effect.heal_hp', heal_mp: 'items.effect.heal_mp' } as const;
export function createItemCatalog(data: Record<ItemId, ItemData>, language: Locale = locale): Record<ItemId, CatalogItem> {
  return Object.fromEntries(Object.entries(data).map(([id, item]) => {
    const flavor = item.flavors[language] || item.flavors.ko || '';
    return [id, { name: item.names[language] || item.names.ko, description: textForLocale(language, effectTexts[item.effect], { amount: item.amount }) + (flavor ? '\n' + flavor : ''), kind: item.kind, effect: item.effect, amount: item.amount, buy: item.buy, sell: item.sell }];
  })) as Record<ItemId, CatalogItem>;
}
const data = itemData as Record<ItemId, ItemData>;
export const itemCatalog = createItemCatalog(data);
export const equipment = Object.fromEntries(Object.entries(data).filter(([, item]) => item.kind === 'equipment').map(([id, item]) => [id, { name: itemCatalog[id as ItemId].name, description: itemCatalog[id as ItemId].description, slot: item.slot as 'weapon' | 'armor', bonus: item.amount }])) as Record<string, { name: string; description: string; slot: 'weapon' | 'armor'; bonus: number }>;
