import { t } from './localization';
import { equipment, itemCatalog, type ItemId } from './items';
export { equipment, itemCatalog } from './items';
export type { ItemId } from './items';
export type Role = 'warrior' | 'archer' | 'swordsman' | 'sorcerer' | 'medium' | 'healer';
export type AttackRange = 'melee' | 'ranged' | 'mixed';
export type Stat = 'mu' | 'ji' | 'de' | 'che' | 'un';
export type StatAllocation = Record<Stat, number>;
export const CREATION_POINTS = 15;
export const MAX_LEVEL = 30;
export const LEVEL_STAT_POINTS = 2;
export const MAX_MENTAL = 30;
export const SKILL_MENTAL_COST = 10;
export function experienceForNextLevel(level: number): number | null { return level >= MAX_LEVEL ? null : level * 10; }
export function emptyAllocation(): StatAllocation { return { mu: 0, ji: 0, de: 0, che: 0, un: 0 }; }
export function allocationTotal(allocation: StatAllocation): number { return allocation.mu + allocation.ji + allocation.de + allocation.che + allocation.un; }
export function validAllocation(allocation: StatAllocation): boolean {
  return ['mu', 'ji', 'de', 'che', 'un'].every(key => Number.isInteger(allocation[key as Stat]) && allocation[key as Stat] >= 0) && allocationTotal(allocation) === CREATION_POINTS;
}
export type Hero = { hp: number; maxHp: number; gold: number; relics: number } & Record<Stat, number>;
export type Choice = { label: string; hint: string; stat?: Stat; difficulty?: number; cost?: number; success: Effect; failure?: Effect };
type Effect = { text: string; hp?: number; gold?: number; relics?: number; flag?: string; potions?: number; gainItem?: ItemId; loseItem?: boolean; status?: WorldEffectId };
export type EventCategory = 'battle' | 'story' | 'shop';
export type WorldEffectId = 'blessing' | 'curse';
export type WorldEffect = { id: WorldEffectId; battles: number };
export type Scene = { category: EventCategory; id: string; title: string; place: string; text: string; choices: Choice[] };
export type Combat = { enemy: string; hp: number; maxHp: number; attack: number; turn: number; intent: 'strike' | 'heavy' | 'recover'; log: string[]; boss: boolean; damageType: 'physical' | 'magic'; physicalDefense: number; magicDefense: number; playerBuff: number; enemyDebuff: number };
export type Progression = { level: number; exp: number; statPoints: number; potions: number; spiritPotions: number; energy: number; maxEnergy: number; inventory: string[]; weapon: string | null; armor: string | null };
export type BattleReport = { enemy: string; outcome: 'victory' | 'defeat' | 'retreat'; rounds: number; startHp: number; endHp: number; gold: number; exp: number; items: string[]; levels: number; log: string[]; startMental?: number; endMental?: number };
export type Run = { role: Role; day: number; seed: number; hero: Hero; sceneId: string; visited: string[]; flags: string[]; journal: string[]; result: string | null; ending: string | null; combat: Combat | null; progression: Progression; battleReport: BattleReport | null; loot: ItemId[]; effects: WorldEffect[]; transactionNotice: string | null; itemNotice: string | null };
export type RecordEntry = { id: string; role: Role; ending: string; days: number; relics: number };
export type Save = { version: 1; run: Run | null; records: RecordEntry[] };
export const roles: Record<Role, { name: string; subtitle: string; description: string; mark: string; range: AttackRange; attackScale: number; stats: Record<Stat, number> }> = {
  warrior: { name: t("game.001"), subtitle: t("game.002"), description: t("game.003"), mark: '力', range: 'melee', attackScale: 1, stats: { mu: 5, ji: 3, de: 1, che: 5, un: 1 } },
  archer: { name: t("game.004"), subtitle: t("game.005"), description: t("game.006"), mark: '弓', range: 'ranged', attackScale: 1, stats: { mu: 5, ji: 1, de: 5, che: 1, un: 3 } },
  swordsman: { name: t("game.007"), subtitle: t("game.008"), description: t("game.009"), mark: '劍', range: 'melee', attackScale: 1, stats: { mu: 3, ji: 3, de: 3, che: 3, un: 3 } },
  sorcerer: { name: t("game.010"), subtitle: t("game.011"), description: t("game.012"), mark: '符', range: 'ranged', attackScale: 0.55, stats: { mu: 2, ji: 5, de: 5, che: 2, un: 1 } },
  medium: { name: t("game.013"), subtitle: t("game.014"), description: t("game.015"), mark: '巫', range: 'mixed', attackScale: 0.55, stats: { mu: 1, ji: 5, de: 3, che: 1, un: 5 } },
  healer: { name: t("game.016"), subtitle: t("game.017"), description: t("game.018"), mark: '生', range: 'mixed', attackScale: 0.45, stats: { mu: 1, ji: 4, de: 1, che: 5, un: 4 } },
};
const legacyRoles: Record<string, Role> = { ranger: 'swordsman', scholar: 'sorcerer', wanderer: 'archer', monk: 'healer' };
export const worldEffects: Record<WorldEffectId, { name: string; description: string; modifier: number }> = {
  blessing: { name: t('events.blessing'), description: t('events.blessing.description'), modifier: 2 },
  curse: { name: t('events.curse'), description: t('events.curse.description'), modifier: -2 },
};
export function eventCategory(run: Run): EventCategory { return currentScene(run).category; }
export function itemCount(run: Run, id: ItemId): number { return id === 'potion' ? run.progression.potions : id === 'spirit_potion' ? run.progression.spiritPotions : Number(run.progression.inventory.includes(id)); }
export type InventoryEntry = { id: ItemId; count: number; equipped: boolean; category: 'equipment' | 'consumable' };
export function getInventory(run: Run): InventoryEntry[] {
  return (Object.keys(itemCatalog) as ItemId[]).map(id => ({ id, count: itemCount(run, id), equipped: itemCatalog[id].kind === 'equipment' && run.progression[equipment[id].slot] === id, category: itemCatalog[id].kind })).filter(entry => entry.count > 0);
}
export const skills: Record<Role, string> = { warrior: t("game.002"), archer: t("game.005"), swordsman: t("game.008"), sorcerer: t("game.011"), medium: t("game.014"), healer: t("game.017") };
export const statNames: Record<Stat, string> = { mu: t("game.025"), ji: t("game.026"), de: t("game.027"), che: t("game.028"), un: t("game.029") };
export const statEffects: Record<Stat, string> = { mu: t("game.030"), ji: t("game.031"), de: t("game.032"), che: t("game.033"), un: t("game.034") };
export function maxHealth(che: number, level: number): number { return 20 + che * 4 + (level - 1) * 4; }
export function combatStats(run: Run) {
  const h = run.hero, p = run.progression;
  const weapon = p.weapon ? equipment[p.weapon].bonus : 0, armor = p.armor ? equipment[p.armor].bonus : 0;
  const modifier = run.effects.reduce((sum, effect) => sum + worldEffects[effect.id].modifier, 0);
  return {
    physicalAttack: Math.max(1, 3 + h.mu * 2 + p.level - 1 + weapon + modifier),
    magicAttack: Math.max(1, 3 + h.ji * 2 + p.level - 1 + modifier),
    physicalDefense: Math.max(0, h.che + armor + (run.role === 'warrior' ? 2 : 0) + modifier),
    magicDefense: Math.max(0, h.ji + h.che + armor + (run.role === 'warrior' ? 2 : 0) + modifier),
    hit: Math.min(0.98, 0.8 + h.de * 0.04),
    evade: Math.min(0.5, h.de * 0.015 + h.un * 0.01),
    critical: Math.min(0.5, 0.05 + h.un * 0.03),
  };
}
export const scenes: Scene[] = [
  { id: 'gate', category: 'story', title: t("game.035"), place: t("game.036"), text: t("game.037"), choices: [
    { label: t("game.038"), hint: t("game.039"), success: { text: t("game.040"), flag: 'child', relics: 1, gainItem: 'charm' } },
    { label: t("game.041"), hint: t("game.042"), stat: 'ji', difficulty: 5, success: { text: t("game.043"), flag: 'map', relics: 1, status: 'blessing' }, failure: { text: t("game.044"), hp: -3, status: 'curse' } },
    { label: t("events.gate.trust"), hint: t("events.gate.trust_hint"), success: { text: t("events.gate.trust_result"), loseItem: true, status: 'curse' } },
  ] },
  { id: 'bridge', category: 'battle', title: t("game.048"), place: t("game.049"), text: t("game.050"), choices: [] },
  { id: 'merchant', category: 'shop', title: t("game.058"), place: t("game.059"), text: t("game.060"), choices: [] },
  { id: 'wolf', category: 'battle', title: t("game.073"), place: t("game.074"), text: t("game.075"), choices: [] },
  { id: 'library', category: 'story', title: t("game.087"), place: t("game.088"), text: t("game.089"), choices: [
    { label: t("game.090"), hint: t("game.091"), stat: 'ji', difficulty: 6, success: { text: t("game.092"), flag: 'truth', relics: 1, status: 'blessing' }, failure: { text: t("game.093"), hp: -4, loseItem: true, status: 'curse' } },
    { label: t("game.094"), hint: t("game.095"), success: { text: t("game.096"), hp: -3, relics: 1, gainItem: 'blade' } },
    { label: t("game.097"), hint: t("game.098"), success: { text: t("game.099"), hp: 3 } },
  ] },
  { id: 'pool', category: 'story', title: t("game.100"), place: t("game.101"), text: t("game.102"), choices: [
    { label: t("game.103"), hint: t("game.081"), stat: 'de', difficulty: 5, success: { text: t("game.104"), relics: 1, hp: 2, status: 'blessing' }, failure: { text: t("game.105"), hp: -4, status: 'curse' } },
    { label: t("game.106"), hint: t("game.107"), success: { text: t("game.108"), hp: 4 } },
    { label: t('events.pool.offer'), hint: t('events.pool.offer_hint'), cost: 2, success: { text: t('events.pool.offer_result'), gainItem: 'charm' } },
  ] },
  { id: 'camp', category: 'story', title: t("game.109"), place: t("game.110"), text: t("game.111"), choices: [
    { label: t("game.112"), hint: t("game.113"), success: { text: t("game.114"), hp: 5, status: 'blessing' } },
    { label: t("game.115"), hint: t("game.042"), stat: 'ji', difficulty: 5, success: { text: t("game.116"), gold: 7, flag: 'map', gainItem: 'sword' }, failure: { text: t("game.117"), gold: 2, hp: -3, loseItem: true, status: 'curse' } },
    { label: t('events.camp.stranger'), hint: t('events.camp.stranger_hint'), success: { text: t('events.camp.stranger_result'), loseItem: true, status: 'curse' } },
  ] },
  { id: 'bells', category: 'story', title: t("game.118"), place: t("game.119"), text: t("game.120"), choices: [
    { label: t("game.121"), hint: t("game.122"), stat: 'mu', difficulty: 5, success: { text: t("game.123"), relics: 1, flag: 'freed', status: 'blessing' }, failure: { text: t("game.124"), hp: -4, status: 'curse' } },
    { label: t("game.125"), hint: t("game.126"), success: { text: t("game.127"), hp: 2, gold: 3, gainItem: 'potion' } },
    { label: t('events.bells.touch'), hint: t('events.bells.touch_hint'), success: { text: t('events.bells.touch_result'), loseItem: true, status: 'curse' } },
  ] },
  { id: 'ambush', category: 'battle', title: t('events.ambush.title'), place: t('events.ambush.place'), text: t('events.ambush.text'), choices: [] },
  { id: 'boss', category: 'battle', title: t('events.boss.title'), place: t('events.boss.place'), text: t('events.boss.text'), choices: [] },
];
export function newRun(role: Role, seed = Date.now(), allocation?: StatAllocation): Run {
  if (allocation && !validAllocation(allocation)) throw new Error(t("game.128"));
  const stats = { ...roles[role].stats };
  if (allocation) for (const key of Object.keys(stats) as Stat[]) stats[key] += allocation[key];
  return { role, seed: seed >>> 0, day: 1, hero: { ...stats, hp: maxHealth(stats.che, 1), maxHp: maxHealth(stats.che, 1), gold: 8, relics: 0 }, sceneId: 'gate', visited: ['gate'], flags: [], journal: [t("game.129")], result: null, ending: null, combat: null, progression: initialProgression(), battleReport: null, loot: [], effects: [], transactionNotice: null, itemNotice: null };
}
export function initialProgression(): Progression { return { level: 1, exp: 0, statPoints: 0, potions: 2, spiritPotions: 1, energy: MAX_MENTAL, maxEnergy: MAX_MENTAL, inventory: [], weapon: null, armor: null }; }
export function gainExperience(run: Run, amount: number): Run {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Experience reward must be a nonnegative safe integer');
  const hero = { ...run.hero }, progression = { ...run.progression };
  if (!Number.isInteger(progression.level) || progression.level < 1 || progression.level > MAX_LEVEL) throw new Error('Character level must be between 1 and 30');
  progression.exp += amount;
  if (!Number.isSafeInteger(progression.exp)) throw new Error('Experience exceeds the supported range');
  while (progression.level < MAX_LEVEL && progression.exp >= progression.level * 10) {
    progression.exp -= progression.level * 10;
    progression.level++;
    progression.statPoints += LEVEL_STAT_POINTS;
    hero.maxHp += 4;
    hero.hp = Math.min(hero.maxHp, hero.hp + 8);
  }
  return { ...run, hero, progression };
}
export function canSpendStatPoints(run: Run, allocation: StatAllocation): boolean {
  if (run.combat || run.hero.hp <= 0) return false;
  const keys: Stat[] = ['mu', 'ji', 'de', 'che', 'un'];
  if (!keys.every(key => Number.isSafeInteger(allocation[key]) && allocation[key] >= 0)) return false;
  const total = allocationTotal(allocation);
  return total > 0 && total <= run.progression.statPoints;
}
export function spendStatPoints(run: Run, allocation: StatAllocation): Run {
  if (!canSpendStatPoints(run, allocation)) return run;
  const hero = { ...run.hero };
  for (const key of Object.keys(statNames) as Stat[]) hero[key] += allocation[key];
  // Preserve the existing injury rather than healing it through point allocation.
  hero.maxHp += allocation.che * 4;
  hero.hp += allocation.che * 4;
  return { ...run, hero, progression: { ...run.progression, statPoints: run.progression.statPoints - allocationTotal(allocation) } };
}
function random(seed: number): [number, number] { const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return [next / 4294967296, next]; }
export function currentScene(run: Run): Scene {
  if (run.sceneId !== 'heart') return scenes.find(s => s.id === run.sceneId)!;
  const help = run.flags.includes('wolf') || run.flags.includes('spirit');
  return { id: 'heart', category: 'story', title: t("game.130"), place: t("game.131"), text: t("game.135", { value1: run.flags.includes('child') ? t("game.132") : '', value2: run.flags.includes('truth') ? t("game.133") : t("game.134") }), choices: [
    { label: t("game.136"), hint: t("game.137", { value1: run.flags.includes('truth') ? 2 : 3 }), cost: undefined, success: { text: t("game.138") } },
    { label: t("game.139"), hint: help ? t("game.140") : t("game.141"), stat: help ? undefined : 'de', difficulty: 6, success: { text: t("game.142") }, failure: { text: t("game.143"), hp: -5 } },
    { label: t("game.144"), hint: t("game.145"), success: { text: t("game.146") } },
  ] };
}
export function disabledReason(run: Run, index: number): string | null {
  const c = currentScene(run).choices[index];
  if (!c) return t("game.150");
  if (run.sceneId === 'heart' && index === 0 && run.hero.relics < (run.flags.includes('truth') ? 2 : 3)) return t("game.151");
  if ((c.cost ?? 0) > run.hero.gold) return t("game.152");
  return null;
}
export function prepareEvent(run: Run): Run {
  if (run.result || run.ending) return run;
  if (run.combat) return autoBattle(run);
  return eventCategory(run) === 'battle' ? autoBattle(beginCombat(run)) : run;
}
export function choose(run: Run, index: number): Run {
  if (run.result || run.ending || run.combat || eventCategory(run) !== 'story' || disabledReason(run, index)) return run;
  const scene = currentScene(run), choice = scene.choices[index];
  const [roll, seed] = random(run.seed), dice = Math.floor(roll * 6) + 1;
  const success = !choice.stat || dice + run.hero[choice.stat] >= (choice.difficulty ?? 5);
  const effect = success ? choice.success : choice.failure!;
  let next: Run = { ...run, seed, hero: { ...run.hero, hp: Math.max(0, Math.min(run.hero.maxHp, run.hero.hp + (effect.hp ?? 0))), gold: run.hero.gold - (choice.cost ?? 0) + (effect.gold ?? 0), relics: run.hero.relics + (effect.relics ?? 0) }, progression: { ...run.progression, inventory: [...run.progression.inventory], potions: run.progression.potions + (effect.potions ?? 0) }, effects: run.effects.map(value => ({ ...value })), flags: effect.flag ? [...new Set([...run.flags, effect.flag])] : run.flags };
  const changes: string[] = [];
  if (effect.gainItem) {
    const id = effect.gainItem;
    if (id === 'potion') next.progression.potions++;
    else if (id === 'spirit_potion') next.progression.spiritPotions++;
    else if (!next.progression.inventory.includes(id)) next.progression.inventory.push(id);
    else { next.hero.gold += itemCatalog[id].sell; changes.push(t('events.item.duplicate', { name: itemCatalog[id].name, gold: itemCatalog[id].sell })); }
    if (!changes.length) changes.push(t('events.item.gain', { name: itemCatalog[id].name }));
  }
  if (effect.loseItem) {
    const candidates: ItemId[] = [...next.progression.inventory as ItemId[], ...(next.progression.potions > 0 ? ['potion' as const] : []), ...(next.progression.spiritPotions > 0 ? ['spirit_potion' as const] : [])];
    if (candidates.length) {
      const [value, nextSeed] = random(next.seed); next.seed = nextSeed;
      const id = candidates[Math.floor(value * candidates.length)];
      next = removeOwnedItem(next, id);
      changes.push(t('events.item.loss', { name: itemCatalog[id].name }));
    } else { next.hero.gold = Math.max(0, next.hero.gold - 3); changes.push(t('events.item.none')); }
  }
  if (effect.status) {
    next.effects = [...next.effects.filter(value => value.id !== effect.status), { id: effect.status, battles: 3 }];
    changes.push(t('events.effect.gain', { name: worldEffects[effect.status].name, battles: 3 }));
  }
  const result = `${choice.stat ? t("game.155", { value1: statNames[choice.stat], value2: run.hero[choice.stat], dice, difficulty: choice.difficulty ?? 5, value5: success ? t("game.153") : t("game.154") }) : ''}${effect.text}` + (changes.length ? '\n\n' + changes.join('\n') : '');
  const ending = next.hero.hp === 0 ? '안개에 남은 발자국' : scene.id === 'heart' ? index === 0 ? '모든 이름의 새벽' : index === 2 ? '숲의 새로운 등불' : success ? '다시 잡은 손' : '닿지 못한 손' : null;
  return { ...next, result, ending, journal: [...run.journal, t("game.156", { day: run.day, title: scene.title, label: choice.label, result })] };
}
function removeOwnedItem(run: Run, id: ItemId): Run {
  const p = run.progression;
  return { ...run, progression: { ...p, potions: p.potions - (id === 'potion' ? 1 : 0), spiritPotions: p.spiritPotions - (id === 'spirit_potion' ? 1 : 0), inventory: itemCatalog[id].kind === 'consumable' ? [...p.inventory] : p.inventory.filter(value => value !== id), weapon: p.weapon === id ? null : p.weapon, armor: p.armor === id ? null : p.armor } };
}
export function tradeReason(run: Run, id: ItemId, direction: 'buy' | 'sell'): string | null {
  if (!Object.hasOwn(itemCatalog, id) || eventCategory(run) !== 'shop' || run.combat || run.ending || run.hero.hp <= 0) return t('shop.closed');
  if (direction === 'buy' && itemCatalog[id].kind === 'equipment' && itemCount(run, id)) return t('shop.owned');
  if (direction === 'buy' && run.hero.gold < itemCatalog[id].buy) return t('shop.no_gold');
  if (direction === 'sell' && itemCount(run, id) === 0) return t('shop.no_item');
  return null;
}
export function buyItem(run: Run, id: ItemId): Run {
  if (tradeReason(run, id, 'buy')) return run;
  const item = itemCatalog[id], p = run.progression;
  const message = t('shop.bought', { name: item.name, price: item.buy });
  return { ...run, hero: { ...run.hero, gold: run.hero.gold - item.buy }, progression: { ...p, inventory: itemCatalog[id].kind === 'consumable' ? [...p.inventory] : [...p.inventory, id], potions: p.potions + (id === 'potion' ? 1 : 0), spiritPotions: p.spiritPotions + (id === 'spirit_potion' ? 1 : 0) }, transactionNotice: message, journal: [...run.journal, t('events.transaction_log', { day: run.day, message })] };
}
export function sellItem(run: Run, id: ItemId): Run {
  if (tradeReason(run, id, 'sell')) return run;
  const item = itemCatalog[id], next = removeOwnedItem(run, id);
  const message = t('shop.sold', { name: item.name, price: item.sell });
  return { ...next, hero: { ...next.hero, gold: next.hero.gold + item.sell }, transactionNotice: message, journal: [...run.journal, t('events.transaction_log', { day: run.day, message })] };
}
export function itemUseReason(run: Run, id: ItemId): string | null {
  if (!Object.hasOwn(itemCatalog, id) || itemCatalog[id].kind !== 'consumable' || itemCount(run, id) === 0) return t('items.unavailable');
  if (run.combat || run.hero.hp <= 0) return t('items.locked');
  if (id === 'potion' && run.hero.hp === run.hero.maxHp) return t('items.full_hp');
  if (id === 'spirit_potion' && run.progression.energy === run.progression.maxEnergy) return t('items.full_mp');
  return null;
}
export function useItem(run: Run, id: ItemId): Run {
  if (itemUseReason(run, id)) return run;
  const next = removeOwnedItem(run, id);
  const amount = id === 'potion' ? Math.min(itemCatalog.potion.amount, run.hero.maxHp - run.hero.hp) : Math.min(itemCatalog.spirit_potion.amount, run.progression.maxEnergy - run.progression.energy);
  const message = t(id === 'potion' ? 'items.used_hp' : 'items.used_mp', { name: itemCatalog[id].name, amount });
  return { ...next, hero: { ...next.hero, hp: next.hero.hp + (id === 'potion' ? amount : 0) }, progression: { ...next.progression, energy: next.progression.energy + (id === 'spirit_potion' ? amount : 0) }, itemNotice: message, journal: [...run.journal, t('events.transaction_log', { day: run.day, message })] };
}
export function advance(run: Run): Run {
  if ((!run.result && eventCategory(run) !== 'shop') || run.ending || run.combat) return run;
  const [roll, seed] = random(run.seed);
  let sceneId: string;
  if (run.day >= 9) sceneId = 'heart';
  else if (run.day === 8) sceneId = 'boss';
  else {
    const category: EventCategory = run.day === 1 ? 'battle' : run.day === 2 ? 'shop' : roll < 0.5 ? 'battle' : roll < 0.8 ? 'story' : 'shop';
    const pool = scenes.filter(scene => scene.category === category && scene.id !== 'gate' && scene.id !== 'boss');
    const fresh = pool.filter(scene => !run.visited.includes(scene.id));
    const candidates = fresh.length ? fresh : pool;
    const [pick, nextSeed] = random(seed);
    const selected = candidates[Math.floor(pick * candidates.length)];
    sceneId = selected.id;
    const next: Run = { ...run, seed: nextSeed, day: run.day + 1, sceneId, visited: [...run.visited, sceneId], result: null, battleReport: null, loot: [], transactionNotice: null, journal: eventCategory(run) === 'shop' ? [...run.journal, t('shop.journal')] : run.journal };
    return selected.category === 'battle' ? autoBattle(beginCombat(next)) : next;
  }
  const next: Run = { ...run, day: run.day + 1, seed, sceneId, visited: [...run.visited, sceneId], result: null, battleReport: null, loot: [], transactionNotice: null };
  return sceneId === 'boss' ? autoBattle(beginCombat(next)) : next;
}
export function archive(save: Save, run: Run): Save {
  if (!run.ending) return { ...save, run };
  const id = `${run.seed}-${run.role}-${run.ending}`;
  return { version: 1, run, records: save.records.some(r => r.id === id) ? save.records : [{ id, role: run.role, ending: run.ending, days: run.day, relics: run.hero.relics }, ...save.records].slice(0, 30) };
}
export function decodeSave(raw: string | null): Save {
  const empty: Save = { version: 1, run: null, records: [] };
  if (!raw) return empty;
  try {
    const s = JSON.parse(raw);
    const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
    if (s.run && typeof s.run.role === 'string' && Object.hasOwn(legacyRoles, s.run.role)) s.run.role = legacyRoles[s.run.role];
    if (Array.isArray(s.records)) for (const record of s.records) {
      if (record && typeof record.role === 'string' && Object.hasOwn(legacyRoles, record.role)) record.role = legacyRoles[record.role];
    }
    if (s.version !== 1 || !Array.isArray(s.records) || !s.records.every((r: RecordEntry) => r && typeof r.id === 'string' && Object.hasOwn(roles, r.role) && typeof r.ending === 'string' && finite(r.days) && finite(r.relics))) return empty;
    if (s.run !== null) {
      const r = s.run;
      if (r && Object.hasOwn(roles, r.role) && r.hero && ['strength', 'wisdom', 'spirit'].every(k => Number.isInteger(r.hero[k]) && r.hero[k] >= 0) && ['mu', 'ji', 'de', 'che', 'un'].every(k => r.hero[k] === undefined) && finite(r.hero.hp) && finite(r.hero.maxHp) && r.hero.maxHp > 0 && r.hero.hp >= 0 && r.hero.hp <= r.hero.maxHp) {
        const old = r.hero, defaults = roles[r.role as Role].stats;
        const maxHp = maxHealth(defaults.che, Number.isInteger(r.progression?.level) ? r.progression.level : 1);
        r.hero = { hp: old.hp === 0 ? 0 : Math.max(1, maxHp - (old.maxHp - old.hp)), maxHp, gold: old.gold, relics: old.relics, mu: old.strength, ji: old.wisdom, de: old.spirit, che: defaults.che, un: defaults.un };
      }
      if (!r || !(Object.hasOwn(roles, r.role)) || !finite(r.day) || r.day < 1 || r.day > 10 || !finite(r.seed) || !(r.sceneId === 'heart' || scenes.some(sc => sc.id === r.sceneId)) || !r.hero || !['hp', 'maxHp', 'gold', 'relics', 'mu', 'ji', 'de', 'che', 'un'].every(k => finite(r.hero[k])) || !['flags', 'visited', 'journal'].every(k => Array.isArray(r[k]) && r[k].every((v: unknown) => typeof v === 'string')) || !(r.result === null || typeof r.result === 'string') || !(r.ending === null || typeof r.ending === 'string')) return empty;
    }
    if (s.run) {
      const r = s.run;
      r.progression ??= initialProgression();
      r.combat ??= null;
      if (r.combat) {
        r.combat.damageType ??= r.sceneId === 'bridge' || r.sceneId === 'heart' ? 'magic' : 'physical';
        r.combat.physicalDefense ??= r.combat.boss ? 3 : 1;
        r.combat.magicDefense ??= r.combat.boss ? 3 : 1;
        r.combat.playerBuff ??= 0;
        r.combat.enemyDebuff ??= 0;
      }
      if (r.hero.maxHp <= 0 || r.hero.hp < 0 || r.hero.hp > r.hero.maxHp || !['mu', 'ji', 'de', 'che', 'un'].every(k => Number.isInteger(r.hero[k]) && r.hero[k] >= 0)) return empty;
      r.loot ??= [];
      r.effects ??= [];
      r.transactionNotice ??= null;
      r.itemNotice ??= null;
      if (!(r.itemNotice === null || typeof r.itemNotice === 'string')) return empty;
      if (!Array.isArray(r.loot) || !r.loot.every((id: unknown) => typeof id === 'string' && Object.hasOwn(itemCatalog, id)) || !Array.isArray(r.effects) || !r.effects.every((effect: WorldEffect) => effect && Object.hasOwn(worldEffects, effect.id) && Number.isInteger(effect.battles) && effect.battles >= 1 && effect.battles <= 3) || new Set(r.effects.map((effect: WorldEffect) => effect.id)).size !== r.effects.length || !(r.transactionNotice === null || typeof r.transactionNotice === 'string')) return empty;
      r.battleReport ??= null;
      const report = r.battleReport;
      if (report && (typeof report.enemy !== 'string' || !['startMental', 'endMental'].every(k => report[k] === undefined || (Number.isSafeInteger(report[k]) && report[k] >= 0)) || !['victory', 'defeat', 'retreat'].includes(report.outcome) || !['rounds', 'startHp', 'endHp', 'gold', 'exp', 'levels'].every(k => Number.isInteger(report[k]) && report[k] >= 0) || !Array.isArray(report.items) || !report.items.every((id: unknown) => typeof id === 'string' && Object.hasOwn(itemCatalog, id)) || !Array.isArray(report.log) || !report.log.every((line: unknown) => typeof line === 'string'))) return empty;
      const p = r.progression;
      if (p && !Object.hasOwn(p, 'maxEnergy')) {
        if (!Number.isSafeInteger(p.energy) || p.energy < 0 || p.energy > 3) return empty;
        p.energy *= 10; p.maxEnergy = MAX_MENTAL;
      }
      if (p && !Object.hasOwn(p, 'spiritPotions')) p.spiritPotions = 0;
      if (p?.weapon && Object.hasOwn(equipment, p.weapon) && equipment[p.weapon].slot !== 'weapon') p.weapon = null;
      if (p?.armor && Object.hasOwn(equipment, p.armor) && equipment[p.armor].slot !== 'armor') p.armor = null;
      if (!p || !['level', 'exp', 'potions', 'spiritPotions', 'energy', 'maxEnergy'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) || p.level < 1 || p.maxEnergy < 1 || p.energy > p.maxEnergy || !Array.isArray(p.inventory) || !p.inventory.every((id: unknown) => typeof id === 'string' && Object.hasOwn(equipment, id)) || !['weapon', 'armor'].every(slot => p[slot] === null || (p.inventory.includes(p[slot]) && equipment[p[slot]]?.slot === slot))) return empty;
      // Preserve old uncapped saves while applying the new level ceiling.
      if (p.level > MAX_LEVEL) {
        const removedLevels = p.level - MAX_LEVEL;
        r.hero.maxHp = Math.max(1, r.hero.maxHp - removedLevels * 4);
        r.hero.hp = Math.min(r.hero.hp, r.hero.maxHp);
        p.level = MAX_LEVEL;
      }
      if (!Object.hasOwn(p, 'statPoints')) p.statPoints = (p.level - 1) * LEVEL_STAT_POINTS;
      if (!Number.isSafeInteger(p.statPoints) || p.statPoints < 0 || p.statPoints > (p.level - 1) * LEVEL_STAT_POINTS) return empty;
      if (r.combat && (!['hp', 'maxHp', 'attack', 'turn'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] > 0) || r.combat.hp > r.combat.maxHp || !['physical', 'magic'].includes(r.combat.damageType) || !['playerBuff', 'enemyDebuff'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] >= 0 && r.combat[k] <= 3) || !['physicalDefense', 'magicDefense'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] >= 0) || !['strike', 'heavy', 'recover'].includes(r.combat.intent) || typeof r.combat.enemy !== 'string' || typeof r.combat.boss !== 'boolean' || !Array.isArray(r.combat.log) || !r.combat.log.every((line: unknown) => typeof line === 'string') || r.result || r.ending)) return empty;
    }
    return s;
  } catch { return empty; }
}

export function beginCombat(run: Run): Run {
  const boss = run.sceneId === 'heart' || run.sceneId === 'boss';
  const enemy = boss ? t("game.157") : run.sceneId === 'wolf' ? t("game.158") : run.sceneId === 'bridge' ? t("game.159") : t("game.160");
  const hp = boss ? 34 : run.sceneId === 'wolf' ? 20 : 16;
  return { ...run, loot: [], combat: { enemy, hp, maxHp: hp, attack: boss ? 7 : 5, turn: 1, intent: 'strike', boss, damageType: boss || run.sceneId === 'bridge' ? 'magic' : 'physical', physicalDefense: boss ? 3 : 1, magicDefense: boss ? 3 : 1, playerBuff: 0, enemyDebuff: 0, log: [t("game.161", { enemy: enemy })] }, progression: { ...run.progression } };
}
export type BattleAction = 'attack' | 'guard' | 'skill' | 'potion' | 'spirit_potion' | 'flee';
export function battleDisabled(run: Run, action: BattleAction): string | null {
  if (!run.combat || run.ending) return t("game.162");
  if (action === 'skill' && run.progression.energy < SKILL_MENTAL_COST) return t("game.163");
  if (action === 'potion' && run.progression.potions < 1) return t("game.164");
  if (action === 'potion' && run.hero.hp === run.hero.maxHp) return t("game.165");
  if (action === 'spirit_potion' && run.progression.spiritPotions < 1) return t('items.unavailable');
  if (action === 'spirit_potion' && run.progression.energy === run.progression.maxEnergy) return t('items.full_mp');
  if (action === 'flee' && run.combat.boss) return t("game.166");
  return null;
}
export function battleTurn(run: Run, action: BattleAction): Run {
  if (battleDisabled(run, action) || run.result) return run;
  const combat = { ...run.combat! }, hero = { ...run.hero }, progression = { ...run.progression, inventory: [...run.progression.inventory] };
  let seed = run.seed;
  function draw() { const [value, next] = random(seed); seed = next; return value; }
  const log: string[] = [t("game.167", { turn: combat.turn })];
  let guarded = false;
  const stats = combatStats(run);
  function recover() {
    const blessing = run.effects.some(effect => effect.id === 'blessing');
    const hpRecovery = blessing ? Math.min(2, hero.maxHp - hero.hp) : 0;
    const mpRecovery = Math.min((blessing ? 3 : 0) + (combat.playerBuff > 0 ? 2 : 0), progression.maxEnergy - progression.energy);
    hero.hp += hpRecovery; progression.energy += mpRecovery;
    if (hpRecovery || mpRecovery) log.push(t('vitals.regeneration', { hp: hpRecovery, mp: mpRecovery }));
  }
  if (action === 'flee') {
    if (draw() < 0.7) return { ...run, seed, combat: null, result: t("game.168"), journal: [...run.journal, t("game.169", { day: run.day, enemy: combat.enemy })] };
    log.push(t("game.170"));
  } else if (action === 'potion') {
    progression.potions--;
    const restored = Math.min(itemCatalog.potion.amount, hero.maxHp - hero.hp); hero.hp += restored;
    log.push(t("game.171", { name: itemCatalog.potion.name, restored: restored }));
  } else if (action === 'spirit_potion') {
    progression.spiritPotions--;
    const restored = Math.min(itemCatalog.spirit_potion.amount, progression.maxEnergy - progression.energy); progression.energy += restored;
    log.push(t('items.used_mp', { name: itemCatalog.spirit_potion.name, amount: restored }));
  } else if (action === 'guard') {
    guarded = true; progression.energy = Math.min(progression.maxEnergy, progression.energy + 3);
    log.push(t("game.172"));
  } else {
    const profile = roles[run.role];
    const magical = run.role === 'sorcerer' || ((run.role === 'medium' || run.role === 'healer') && (action === 'skill' || combat.intent === 'heavy'));
    const range = profile.range === 'mixed' ? combat.intent === 'heavy' ? 'ranged' : 'melee' : profile.range;
    const kind = `${range === 'ranged' ? t("game.173") : t("game.174")} ${magical ? t("game.175") : t("game.176")}`;
    let bonus = 0;
    if (action === 'skill') {
      progression.energy -= SKILL_MENTAL_COST;
      log.push(t('vitals.skill_cost', { cost: SKILL_MENTAL_COST }));
      if (run.role === 'warrior') { guarded = true; bonus = 3; log.push(t("game.177")); }
      if (run.role === 'swordsman') bonus = 5;
      if (run.role === 'archer') { combat.enemyDebuff = 3; bonus = 3; }
      if (run.role === 'sorcerer' || run.role === 'medium' || run.role === 'healer') { combat.playerBuff = 3; combat.enemyDebuff = 3; bonus = 1; }
      if (combat.playerBuff === 3) log.push(t("game.178"));
      if (combat.enemyDebuff === 3) log.push(t("game.179"));
      if (run.role === 'healer') {
        const healed = Math.min(10 + hero.ji, hero.maxHp - hero.hp);
        hero.hp += healed; log.push(t("game.180", { healed: healed }));
      }
    }
    if (!(action === 'skill' && run.role === 'healer')) {
      const power = magical ? stats.magicAttack : stats.physicalAttack;
      let damage = Math.floor(power * profile.attackScale) + bonus + (combat.playerBuff > 0 ? 2 : 0) + Math.floor(draw() * 3);
      damage = Math.max(1, damage - (magical ? combat.magicDefense : combat.physicalDefense));
      const hit = draw() < stats.hit;
      const crit = hit && draw() < stats.critical;
      if (crit) damage = Math.floor(damage * 1.5);
      if (hit) {
        combat.hp = Math.max(0, combat.hp - damage);
        log.push(t("game.183", { value1: action === 'skill' ? skills[run.role] : t("game.181"), kind: kind, value3: crit ? t("game.182") : '', enemy: combat.enemy, damage: damage }));
      } else log.push(t("game.184", { value1: action === 'skill' ? skills[run.role] : t("game.181"), kind: kind }));
    }
  }
  if (combat.hp === 0) {
    recover();
    const reward = combat.boss ? 12 : 5;
    hero.gold += reward; hero.relics++;
    const dropped: ItemId[] = [];
    if (draw() < (combat.boss ? 0.6 : 0.4)) {
      const pool = (Object.keys(itemCatalog) as ItemId[]).filter(id => itemCatalog[id].kind === 'consumable' || !progression.inventory.includes(id));
      const id = pool[Math.floor(draw() * pool.length)]; dropped.push(id);
      if (id === 'potion') progression.potions++; else if (id === 'spirit_potion') progression.spiritPotions++; else progression.inventory.push(id);
    }
    log.push(t("game.186", { reward, value2: combat.boss ? 12 : 6, value3: dropped.length ? t("game.185", { name: itemCatalog[dropped[0]].name }) : '' }));
    if (!dropped.length) log.push(t('events.drop.none'));
    const grown = gainExperience({ ...run, hero, progression }, combat.boss ? 12 : 6);
    for (let level = progression.level + 1; level <= grown.progression.level; level++) log.push(t("game.187", { level }), t('growth.reward', { points: LEVEL_STAT_POINTS }));
    return { ...grown, loot: dropped, flags: combat.boss ? [...new Set([...grown.flags, 'bossDefeated'])] : grown.flags, seed, combat: null, result: log.join('\n'), ending: run.sceneId === 'heart' && combat.boss ? '모든 이름의 새벽' : null, journal: [...run.journal, t("game.188", { day: run.day, enemy: combat.enemy, value3: [...combat.log, ...log].join('\n') })] };
  }
  if (combat.intent === 'recover') { combat.hp = Math.min(combat.maxHp, combat.hp + 3); log.push(t("game.189", { enemy: combat.enemy })); }
  else {
    const magical = combat.damageType === 'magic';
    if (draw() < Math.min(0.75, stats.evade + (combat.enemyDebuff > 0 ? 0.1 : 0))) log.push(t("game.190", { enemy: combat.enemy, value2: magical ? t("game.175") : t("game.176") }));
    else {
      let damage = combat.attack + (combat.intent === 'heavy' ? 4 : 0) + Math.floor(draw() * 2);
      damage -= (magical ? stats.magicDefense : stats.physicalDefense) + (combat.playerBuff > 0 ? 2 : 0) + (combat.enemyDebuff > 0 ? 2 : 0);
      if (!magical && (roles[run.role].range === 'ranged' || (roles[run.role].range === 'mixed' && combat.intent === 'heavy'))) damage -= 1;
      if (guarded) damage = Math.floor(damage / 2);
      damage = Math.max(1, damage); hero.hp = Math.max(0, hero.hp - damage);
      log.push(t("game.192", { enemy: combat.enemy, value2: magical ? t("game.175") : t("game.176"), value3: combat.intent === 'heavy' ? t("game.191") : t("game.181"), damage: damage }));
    }
  }
  if (hero.hp === 0) return { ...run, seed, hero, progression, combat: null, result: log.join('\n'), ending: '안개에 남은 발자국', journal: [...run.journal, t("game.193", { day: run.day, enemy: combat.enemy, value3: [...combat.log, ...log].join('\n') })] };
  recover();
  combat.playerBuff = Math.max(0, combat.playerBuff - 1);
  combat.enemyDebuff = Math.max(0, combat.enemyDebuff - 1);
  const roll = draw(); combat.intent = roll < 0.35 ? 'heavy' : roll < 0.55 ? 'recover' : 'strike';
  combat.turn++; combat.log = [...combat.log, ...log].slice(-200);
  return { ...run, seed, hero, progression, combat };
}
export function equip(run: Run, id: string): Run {
  if (run.combat || run.ending || !run.progression.inventory.includes(id) || !equipment[id]) return run;
  const slot = equipment[id].slot;
  return { ...run, progression: { ...run.progression, [slot]: run.progression[slot] === id ? null : id } };
}

/** Resolve the whole battle once, using the same seeded rules as the turn engine. */
export function autoBattle(run: Run): Run {
  if (!run.combat || run.result || run.ending) return run;
  const start = run, enemy = run.combat.enemy;
  let next = run, rounds = 0;
  let battleLog: string[] = [];
  while (next.combat && rounds < 60) {
    const healerNeedsSkill = next.role === 'healer' && next.progression.energy >= SKILL_MENTAL_COST && next.hero.maxHp - next.hero.hp >= 8;
    const action: BattleAction = healerNeedsSkill ? 'skill' : next.hero.hp <= 12 && next.progression.potions > 0 ? 'potion'
      : next.progression.energy < SKILL_MENTAL_COST && next.progression.spiritPotions > 0 ? 'spirit_potion'
      : next.progression.energy >= SKILL_MENTAL_COST && (next.role !== 'healer' || next.combat.playerBuff === 0 || next.combat.enemyDebuff === 0) ? 'skill'
      : next.combat.intent === 'heavy' ? 'guard' : 'attack';
    const previousLog = next.combat.log;
    next = battleTurn(next, action); rounds++;
    if (!next.combat) battleLog = [...previousLog, ...(next.result || '').split('\n')];
  }
  if (next.combat) {
    const log = [...next.combat.log, t("game.194")];
    battleLog = log;
    next = { ...next, ending: next.combat.boss ? '닿지 못한 손' : null, combat: null, result: log.join('\n'), journal: [...next.journal, t("game.188", { day: next.day, enemy: enemy, value3: log.join('\n') })] };
  }
  const victory = next.hero.gold > start.hero.gold;
  const log = battleLog;
  return { ...next, effects: next.effects.map(effect => ({ ...effect, battles: effect.battles - 1 })).filter(effect => effect.battles > 0), battleReport: { enemy, outcome: next.hero.hp === 0 ? 'defeat' : victory ? 'victory' : 'retreat', rounds: start.combat!.turn - 1 + rounds, startHp: start.hero.hp, endHp: next.hero.hp, gold: next.hero.gold - start.hero.gold, exp: victory ? start.combat!.boss ? 12 : 6 : 0, items: next.loot, levels: next.progression.level - start.progression.level, log, startMental: start.progression.energy, endMental: next.progression.energy }, result: log.join('\n') };
}
