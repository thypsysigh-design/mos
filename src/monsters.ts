import data from './data/monsters.json';
import { locale } from './localization';
import type { ItemId } from './items';
export type MonsterDrop = { item: ItemId; probability: number };
export type Monster = { names: Record<string,string>; kind: string; attack:number; hp:number; level:number; minLevel:number; maxLevel:number; damageType:'physical'|'magic'; physicalDefense:number; magicDefense:number; drops:MonsterDrop[] };
export const monsters = data as Record<string,Monster>;
export function eligibleMonsters(level:number, boss:boolean) {
  return Object.entries(monsters).filter(([,m])=>m.kind===(boss?'boss':'normal') && m.minLevel<=level && level<=m.maxLevel);
}
export function monsterName(monster:Monster) { return `${monster.names[locale] || monster.names.ko} · Lv.${monster.level}`; }
export function rollMonsterDrop(drops:MonsterDrop[], roll:number):ItemId|null {
  let total=0; for(const drop of drops) { total+=drop.probability; if(roll<total) return drop.item; } return null;
}
