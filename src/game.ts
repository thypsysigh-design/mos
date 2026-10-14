export type Role = 'warrior' | 'archer' | 'swordsman' | 'sorcerer' | 'medium' | 'healer';
export type AttackRange = 'melee' | 'ranged' | 'mixed';
export type Stat = 'mu' | 'ji' | 'de' | 'che' | 'un';
export type StatAllocation = Record<Stat, number>;
export const CREATION_POINTS = 15;
export function emptyAllocation(): StatAllocation { return { mu: 0, ji: 0, de: 0, che: 0, un: 0 }; }
export function allocationTotal(allocation: StatAllocation): number { return allocation.mu + allocation.ji + allocation.de + allocation.che + allocation.un; }
export function validAllocation(allocation: StatAllocation): boolean {
  return ['mu', 'ji', 'de', 'che', 'un'].every(key => Number.isInteger(allocation[key as Stat]) && allocation[key as Stat] >= 0) && allocationTotal(allocation) === CREATION_POINTS;
}
export type Hero = { hp: number; maxHp: number; gold: number; relics: number } & Record<Stat, number>;
export type Choice = { label: string; hint: string; stat?: Stat; difficulty?: number; cost?: number; success: Effect; failure?: Effect };
type Effect = { text: string; hp?: number; gold?: number; relics?: number; flag?: string; potions?: number };
export type Scene = { id: string; title: string; place: string; text: string; choices: Choice[] };
export type Combat = { enemy: string; hp: number; maxHp: number; attack: number; turn: number; intent: 'strike' | 'heavy' | 'recover'; log: string[]; boss: boolean; damageType: 'physical' | 'magic'; physicalDefense: number; magicDefense: number; playerBuff: number; enemyDebuff: number };
export type Progression = { level: number; exp: number; potions: number; energy: number; inventory: string[]; weapon: string | null; armor: string | null };
export type BattleReport = { enemy: string; outcome: 'victory' | 'defeat' | 'retreat'; rounds: number; startHp: number; endHp: number; gold: number; exp: number; items: string[]; levels: number; log: string[] };
export type Run = { role: Role; day: number; seed: number; hero: Hero; sceneId: string; visited: string[]; flags: string[]; journal: string[]; result: string | null; ending: string | null; combat: Combat | null; progression: Progression; battleReport: BattleReport | null };
export type RecordEntry = { id: string; role: Role; ending: string; days: number; relics: number };
export type Save = { version: 1; run: Run | null; records: RecordEntry[] };
export const roles: Record<Role, { name: string; subtitle: string; description: string; mark: string; range: AttackRange; attackScale: number; stats: Record<Stat, number> }> = {
  warrior: { name: '역사', subtitle: '철벽 강타', description: '근거리 공격 전문 · 높은 방어력', mark: '力', range: 'melee', attackScale: 1, stats: { mu: 5, ji: 3, de: 1, che: 5, un: 1 } },
  archer: { name: '궁사', subtitle: '억제 사격', description: '원거리 공격 전문 · 적군 약화', mark: '弓', range: 'ranged', attackScale: 1, stats: { mu: 5, ji: 1, de: 5, che: 1, un: 3 } },
  swordsman: { name: '검사', subtitle: '연속 베기', description: '근거리 공격 전문', mark: '劍', range: 'melee', attackScale: 1, stats: { mu: 3, ji: 3, de: 3, che: 3, un: 3 } },
  sorcerer: { name: '주술사', subtitle: '주박', description: '약한 원거리 공격 · 아군 강화·적군 약화', mark: '符', range: 'ranged', attackScale: 0.55, stats: { mu: 2, ji: 5, de: 5, che: 2, un: 1 } },
  medium: { name: '무격', subtitle: '강신무', description: '약한 근·원거리 공격 · 아군 강화·적군 약화', mark: '巫', range: 'mixed', attackScale: 0.55, stats: { mu: 1, ji: 5, de: 3, che: 1, un: 5 } },
  healer: { name: '활사', subtitle: '생명의 굿', description: '약한 근·원거리 공격 · 회복·아군 강화·적군 약화', mark: '生', range: 'mixed', attackScale: 0.45, stats: { mu: 1, ji: 4, de: 1, che: 5, un: 4 } },
};
const legacyRoles: Record<string, Role> = { ranger: 'swordsman', scholar: 'sorcerer', wanderer: 'archer', monk: 'healer' };
export const equipment: Record<string, { name: string; slot: 'weapon' | 'armor'; bonus: number; description: string }> = {
  sword: { name: '은빛 환도', slot: 'weapon', bonus: 2, description: '물리 공격력 +2' },
  charm: { name: '삼재 부적', slot: 'armor', bonus: 1, description: '물리·주술 방어력 +1' },
  blade: { name: '귀문검', slot: 'weapon', bonus: 3, description: '물리 공격력 +3' },
};
export const skills: Record<Role, string> = { warrior: '철벽 강타', archer: '억제 사격', swordsman: '연속 베기', sorcerer: '주박', medium: '강신무', healer: '생명의 굿' };
export const statNames: Record<Stat, string> = { mu: '무', ji: '지', de: '덕', che: '체', un: '운' };
export const statEffects: Record<Stat, string> = { mu: '물리 공격력', ji: '주술 공격력·주술 방어력', de: '명중·회피', che: '물리 방어력·주술 방어력·최대 체력', un: '치명타 확률·회피' };
export function maxHealth(che: number, level: number): number { return 20 + che * 4 + (level - 1) * 4; }
export function combatStats(run: Run) {
  const h = run.hero, p = run.progression;
  const weapon = p.weapon ? equipment[p.weapon].bonus : 0, armor = p.armor ? equipment[p.armor].bonus : 0;
  return {
    physicalAttack: 3 + h.mu * 2 + p.level - 1 + weapon,
    magicAttack: 3 + h.ji * 2 + p.level - 1,
    physicalDefense: h.che + armor + (run.role === 'warrior' ? 2 : 0),
    magicDefense: h.ji + h.che + armor + (run.role === 'warrior' ? 2 : 0),
    hit: Math.min(0.98, 0.8 + h.de * 0.04),
    evade: Math.min(0.5, h.de * 0.015 + h.un * 0.01),
    critical: Math.min(0.5, 0.05 + h.un * 0.03),
  };
}
export const scenes: Scene[] = [
  { id: 'gate', title: '숲은 이름을 기억한다', place: '한양 성문 밖', text: '요괴가 민심을 어지럽히는 조선. 포도청에서 사령패를 받은 당신은 사라진 누이를 찾아 북악산에 들었다. 편지에는 단 한 문장이 남아 있었다. “숲이 네 이름을 부르면, 대답하지 마.”\n\n낡은 이정표 너머, 안개 속에서 작은 등불이 흔들린다. 당신은 열흘 안에 숲의 심장에 도착해야 한다.', choices: [
    { label: '등불을 따라간다', hint: '낯선 이를 만난다', success: { text: '등불의 주인은 길 잃은 아이였다. 아이는 당신의 손에 은빛 씨앗을 쥐여준다.', flag: 'child', relics: 1 } },
    { label: '편지의 숨은 문양을 읽는다', hint: '지 판정 · 난이도 5', stat: 'ji', difficulty: 5, success: { text: '편지를 달빛에 비추자 숨은 지도가 드러난다. 누이는 이 길을 이미 걸었다.', flag: 'map', relics: 1 }, failure: { text: '문양이 손끝을 태운다. 오래된 마법의 흔적만 알아냈다.', hp: -3 } },
    { label: '성문 밖 도깨비와 맞선다', hint: '자동 전투 · 환도와 전리품 획득', success: { text: '덤불 사이에서 낡은 여행자의 주머니를 찾았다. 가시에 긁힌 손이 쓰리다.', hp: -2, gold: 6 } },
  ] },
  { id: 'bridge', title: '다리 아래의 목소리', place: '북악산 구름다리', text: '썩은 나무다리가 골짜기를 가로지른다. 아래에서는 당신과 똑같은 목소리가 도움을 청한다.\n\n“내가 떨어졌어. 나를 두고 가지 마.”', choices: [
    { label: '원귀를 물리치고 다리를 건넌다', hint: '자동 전투 · 삼재 부적 획득', stat: 'mu', difficulty: 6, success: { text: '끌어올린 것은 목소리를 훔치는 작은 정령이었다. 정령은 빚을 기억하겠다고 약속한다.', relics: 1, flag: 'spirit' }, failure: { text: '밧줄이 끊어졌다. 절벽에 부딪힌 어깨가 욱신거린다.', hp: -5 } },
    { label: '목소리를 무시하고 건넌다', hint: '체력 2 소모', success: { text: '다리가 무너지는 순간 반대편으로 뛰었다. 당신의 목소리가 한동안 계곡에 남았다.', hp: -2 } },
  ] },
  { id: 'merchant', title: '그녀가 파는 것은 내일', place: '달빛 장터', text: '숲 한가운데 찻잔을 늘어놓은 노파가 있다. 찻잔마다 아직 일어나지 않은 날의 풍경이 비친다.\n\n“살아 돌아갈 만큼만 욕심내렴.”', choices: [
    { label: '따뜻한 차를 마신다', hint: '금 4 · 체력 7 회복', cost: 4, success: { text: '차에서는 집 냄새가 났다. 잠시나마 몸의 통증이 가라앉는다.', hp: 7 } },
    { label: '은빛 조각을 산다', hint: '금 6 · 유물 1 획득', cost: 6, success: { text: '조각 안에서 심장 박동이 느껴진다. 노파가 처음으로 미소 짓는다.', relics: 1 } },
    { label: '산삼 탕약을 산다', hint: '4냥 · 전투용 회복약 1개', cost: 4, success: { text: '노파가 산삼 탕약을 행낭에 넣어 주었다.', potions: 1 } },
    { label: '다음 길만 물어본다', hint: '비용 없이 지나간다', success: { text: '“네가 잃어버린 것은 길이 아니야.” 노파는 대답 대신 북쪽을 가리켰다.' } },
  ] },
  { id: 'wolf', title: '잿빛 털의 수호자', place: '북악산 산자락', text: '수백 년 묵은 삵이 길을 막는다. 가슴에는 부러진 창이 박혀 있다. 으르렁거림 사이로 인간의 숨소리가 들린다.', choices: [
    { label: '묵은 삵과 맞서 싸운다', hint: '자동 전투 · 귀문검 획득', stat: 'mu', difficulty: 6, success: { text: '묵은 삵는 빛으로 흩어지고, 창끝만 남았다. 창에는 누이의 이름이 새겨져 있다.', relics: 1, gold: 3 }, failure: { text: '발톱이 팔을 스쳤다. 간신히 나무 사이로 몸을 숨긴다.', hp: -6 } },
    { label: '상처에 손을 뻗는다', hint: '덕 판정 · 난이도 5', stat: 'de', difficulty: 5, success: { text: '창을 뽑자 묵은 삵의 눈이 부드러워졌다. 숲의 수호자가 당신을 기억한다.', flag: 'wolf', hp: 3 }, failure: { text: '겁에 질린 묵은 삵가 손을 물었다. 그래도 창은 빠졌다.', hp: -4, flag: 'wolf' } },
    { label: '먹을 것을 놓고 돌아간다', hint: '금 2 · 안전하게 통과', cost: 2, success: { text: '묵은 삵가 고개를 숙인 사이 길을 돌아 나왔다.' } },
  ] },
  { id: 'library', title: '읽히기를 기다리는 이름', place: '무너진 서원', text: '나무뿌리 아래 책장이 끝없이 이어진다. 책등에는 이 숲에서 사라진 사람들의 이름이 적혀 있다.\n\n누이의 책은 마지막 장이 비어 있다.', choices: [
    { label: '비어 있는 장을 해독한다', hint: '지 판정 · 난이도 6', stat: 'ji', difficulty: 6, success: { text: '누이는 숲에 갇힌 이름들을 지키고 있었다. 숲의 심장을 여는 주문을 알아냈다.', flag: 'truth', relics: 1 }, failure: { text: '잉크가 손을 타고 기억을 마신다. 얼굴 하나가 잠시 떠오르지 않는다.', hp: -4 } },
    { label: '누이의 책을 품에 넣는다', hint: '체력 3 소모 · 유물 1 획득', success: { text: '뿌리가 당신을 붙잡았지만 책을 놓지 않았다. 이제 누이의 이름은 당신 곁에 있다.', hp: -3, relics: 1 } },
    { label: '책을 그대로 두고 쉰다', hint: '체력 3 회복', success: { text: '책장이 바람 없이 넘어간다. 꿈에서 누이가 당신의 손을 잡았다.', hp: 3 } },
  ] },
  { id: 'pool', title: '물속에 남겨진 어제', place: '기억의 샘', text: '샘물에 비친 얼굴은 어린 시절의 당신이다. 물속의 아이가 말한다.\n\n“그날 누이가 떠날 때, 왜 붙잡지 않았어?”', choices: [
    { label: '도망치지 않고 대답한다', hint: '덕 판정 · 난이도 5', stat: 'de', difficulty: 5, success: { text: '“이번에는 데려갈 거야.” 물속의 아이가 웃는다. 샘 바닥에서 별의 파편이 떠올랐다.', relics: 1, hp: 2 }, failure: { text: '대답은 끝내 목에 걸렸다. 차가운 기억이 가슴을 조인다.', hp: -4 } },
    { label: '물 한 모금을 마신다', hint: '체력 4 회복', success: { text: '어린 시절의 여름처럼 따뜻하다. 기억은 아프지만 살아갈 힘도 준다.', hp: 4 } },
  ] },
  { id: 'camp', title: '불씨 하나의 온기', place: '버려진 야영지', text: '아직 온기가 남은 모닥불. 주인을 잃은 배낭 옆에는 덜 깎인 나무 새가 놓여 있다.\n\n오늘 밤만큼은 별이 보인다.', choices: [
    { label: '불을 살리고 잠든다', hint: '체력 5 회복', success: { text: '오랜만에 꿈 없는 잠을 잤다. 새벽의 숲은 잠깐 평범해 보인다.', hp: 5 } },
    { label: '배낭의 흔적을 조사한다', hint: '지 판정 · 난이도 5', stat: 'ji', difficulty: 5, success: { text: '배낭의 이중 바닥에 지도와 동전이 숨겨져 있었다.', gold: 7, flag: 'map' }, failure: { text: '덫이 터졌다. 동전 몇 닢을 찾았지만 손가락을 다쳤다.', gold: 2, hp: -3 } },
  ] },
  { id: 'bells', title: '울리지 않는 종', place: '폐허가 된 사찰', text: '종탑에는 혀 없는 종이 매달려 있다. 의자마다 투명한 사람들이 앉아 당신을 바라본다.\n\n그들은 아주 오랫동안 마지막 종소리를 기다렸다.', choices: [
    { label: '검 손잡이로 종을 울린다', hint: '무 판정 · 난이도 5', stat: 'mu', difficulty: 5, success: { text: '종소리가 숲을 흔든다. 사람들이 빛으로 사라지며 한 조각의 감사를 남겼다.', relics: 1, flag: 'freed' }, failure: { text: '종의 무게를 버티지 못했다. 무너진 돌조각이 다리를 스쳤다.', hp: -4 } },
    { label: '그들의 이야기를 듣는다', hint: '체력 2 회복 · 금 3 획득', success: { text: '이름 하나하나를 기억해 주자 유령들은 웃었다. 오래된 동전이 무릎 위에 남았다.', hp: 2, gold: 3 } },
  ] },
];
export function newRun(role: Role, seed = Date.now(), allocation?: StatAllocation): Run {
  if (allocation && !validAllocation(allocation)) throw new Error('추가 스탯 15포인트를 모두 분배해야 합니다.');
  const stats = { ...roles[role].stats };
  if (allocation) for (const key of Object.keys(stats) as Stat[]) stats[key] += allocation[key];
  return { role, seed: seed >>> 0, day: 1, hero: { ...stats, hp: maxHealth(stats.che, 1), maxHp: maxHealth(stats.che, 1), gold: 8, relics: 0 }, sceneId: 'gate', visited: ['gate'], flags: [], journal: ['사령패와 누이의 편지를 품고 북악산으로 들어갔다.'], result: null, ending: null, combat: null, progression: initialProgression(), battleReport: null };
}
export function initialProgression(): Progression { return { level: 1, exp: 0, potions: 2, energy: 3, inventory: [], weapon: null, armor: null }; }
function random(seed: number): [number, number] { const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return [next / 4294967296, next]; }
export function currentScene(run: Run): Scene {
  if (run.sceneId !== 'heart') return scenes.find(s => s.id === run.sceneId)!;
  const help = run.flags.includes('wolf') || run.flags.includes('spirit');
  return { id: 'heart', title: '숲의 심장', place: '이름들의 나무', text: `${run.flags.includes('child') ? '입구에서 만난 아이가 마지막 길을 밝혀 준다.\n\n' : ''}거대한 나무의 속에서 누이가 눈을 뜬다. “나를 데려가면, 이곳의 이름들은 잊혀져.”\n\n${run.flags.includes('truth') ? '서고에서 읽은 주문이라면 모두를 풀어줄 수 있을 것이다.' : '당신에게는 봉인 유물과 지금까지 걸어온 길의 기억이 남아 있다.'}`, choices: [
    { label: '숲에 묶인 모든 이름을 풀어준다', hint: `유물 ${run.flags.includes('truth') ? 2 : 3}개 필요`, cost: undefined, success: { text: '기억들이 별처럼 흩어진다.' } },
    { label: '누이의 손을 잡고 숲을 떠난다', hint: help ? '숲의 친구가 탈출을 돕는다' : '덕 판정 · 난이도 6', stat: help ? undefined : 'de', difficulty: 6, success: { text: '다시는 손을 놓지 않는다.' }, failure: { text: '숲은 아직 당신을 놓아주지 않는다.', hp: -5 } },
    { label: '누이와 함께 숲의 지기가 된다', hint: '숲에 남는 결말', success: { text: '이제 당신이 길 잃은 이의 등불이 된다.' } },
    { label: '이름을 삼키는 대감신과 맞선다', hint: '자동 보스 전투 · 승리하면 모두를 해방', success: { text: '사령패가 붉게 빛난다.' } },
  ] };
}
export function disabledReason(run: Run, index: number): string | null {
  const c = currentScene(run).choices[index];
  if (!c) return '없는 선택';
  if (run.sceneId === 'heart' && index === 0 && run.hero.relics < (run.flags.includes('truth') ? 2 : 3)) return '유물이 부족합니다';
  if ((c.cost ?? 0) > run.hero.gold) return '금이 부족합니다';
  return null;
}
export function choose(run: Run, index: number): Run {
  if (run.result || run.ending || run.combat || disabledReason(run, index)) return run;
  if ((run.sceneId === 'wolf' && index === 0) || (run.sceneId === 'gate' && index === 2) || (run.sceneId === 'bridge' && index === 0) || (run.sceneId === 'heart' && index === 3)) return autoBattle(beginCombat(run));
  const scene = currentScene(run), choice = scene.choices[index];
  const [roll, seed] = random(run.seed), dice = Math.floor(roll * 6) + 1;
  const success = !choice.stat || dice + run.hero[choice.stat] >= (choice.difficulty ?? 5);
  const effect = success ? choice.success : choice.failure!;
  const hero = { ...run.hero, hp: Math.max(0, Math.min(run.hero.maxHp, run.hero.hp + (effect.hp ?? 0))), gold: run.hero.gold - (choice.cost ?? 0) + (effect.gold ?? 0), relics: run.hero.relics + (effect.relics ?? 0) };
  const result = `${choice.stat ? `${statNames[choice.stat]} ${run.hero[choice.stat]} + 주사위 ${dice} / ${choice.difficulty} · ${success ? '성공' : '실패'}\n\n` : ''}${effect.text}`;
  const ending = hero.hp === 0 ? '안개에 남은 발자국' : scene.id === 'heart' ? index === 0 ? '모든 이름의 새벽' : index === 2 ? '숲의 새로운 등불' : success ? '다시 잡은 손' : '닿지 못한 손' : null;
  return { ...run, seed, hero, progression: { ...run.progression, potions: run.progression.potions + (effect.potions ?? 0) }, flags: effect.flag ? [...new Set([...run.flags, effect.flag])] : run.flags, result, ending, journal: [...run.journal, `${run.day}일 · ${scene.title}\n${choice.label}\n${result}`] };
}
export function advance(run: Run): Run {
  if (!run.result || run.ending) return run;
  const [roll, seed] = random(run.seed);
  // All seven encounters appear once in a different order; two later encounters may recur.
  const fresh = scenes.filter(s => s.id !== 'gate' && !run.visited.includes(s.id));
  const pool = fresh.length ? fresh : scenes.filter(s => s.id !== 'gate' && s.id !== run.sceneId);
  const sceneId = run.day >= 9 ? 'heart' : pool[Math.floor(roll * pool.length)].id;
  return { ...run, day: run.day + 1, seed, sceneId, visited: [...run.visited, sceneId], result: null, battleReport: null };
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
      r.battleReport ??= null;
      const report = r.battleReport;
      if (report && (typeof report.enemy !== 'string' || !['victory', 'defeat', 'retreat'].includes(report.outcome) || !['rounds', 'startHp', 'endHp', 'gold', 'exp', 'levels'].every(k => Number.isInteger(report[k]) && report[k] >= 0) || !Array.isArray(report.items) || !report.items.every((id: unknown) => typeof id === 'string' && Object.hasOwn(equipment, id)) || !Array.isArray(report.log) || !report.log.every((line: unknown) => typeof line === 'string'))) return empty;
      const p = r.progression;
      if (!p || !['level', 'exp', 'potions', 'energy'].every(k => Number.isInteger(p[k]) && p[k] >= 0) || p.level < 1 || p.energy > 3 || !Array.isArray(p.inventory) || !p.inventory.every((id: unknown) => typeof id === 'string' && Object.hasOwn(equipment, id)) || !['weapon', 'armor'].every(slot => p[slot] === null || (p.inventory.includes(p[slot]) && equipment[p[slot]]?.slot === slot))) return empty;
      if (r.combat && (!['hp', 'maxHp', 'attack', 'turn'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] > 0) || r.combat.hp > r.combat.maxHp || !['physical', 'magic'].includes(r.combat.damageType) || !['playerBuff', 'enemyDebuff'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] >= 0 && r.combat[k] <= 3) || !['physicalDefense', 'magicDefense'].every(k => Number.isInteger(r.combat[k]) && r.combat[k] >= 0) || !['strike', 'heavy', 'recover'].includes(r.combat.intent) || typeof r.combat.enemy !== 'string' || typeof r.combat.boss !== 'boolean' || !Array.isArray(r.combat.log) || !r.combat.log.every((line: unknown) => typeof line === 'string') || r.result || r.ending)) return empty;
    }
    return s;
  } catch { return empty; }
}

export function beginCombat(run: Run): Run {
  const boss = run.sceneId === 'heart';
  const enemy = boss ? '이름을 삼키는 대감신' : run.sceneId === 'wolf' ? '창에 묶인 묵은 삵' : run.sceneId === 'bridge' ? '목소리를 훔친 원귀' : '성문 밖 도깨비';
  const hp = boss ? 34 : run.sceneId === 'wolf' ? 20 : 16;
  return { ...run, combat: { enemy, hp, maxHp: hp, attack: boss ? 7 : 5, turn: 1, intent: 'strike', boss, damageType: boss || run.sceneId === 'bridge' ? 'magic' : 'physical', physicalDefense: boss ? 3 : 1, magicDefense: boss ? 3 : 1, playerBuff: 0, enemyDebuff: 0, log: [`${enemy}이 앞을 막았다. 사령패가 희미하게 빛난다.`] }, progression: { ...run.progression, energy: Math.max(2, run.progression.energy) } };
}
export type BattleAction = 'attack' | 'guard' | 'skill' | 'potion' | 'flee';
export function battleDisabled(run: Run, action: BattleAction): string | null {
  if (!run.combat || run.ending) return '전투 중이 아닙니다';
  if (action === 'skill' && run.progression.energy < 2) return '기력 2 필요';
  if (action === 'potion' && run.progression.potions < 1) return '탕약이 없습니다';
  if (action === 'potion' && run.hero.hp === run.hero.maxHp) return '체력이 가득 찼습니다';
  if (action === 'flee' && run.combat.boss) return '대감신 앞에서는 도망칠 수 없습니다';
  return null;
}
export function battleTurn(run: Run, action: BattleAction): Run {
  if (battleDisabled(run, action) || run.result) return run;
  const combat = { ...run.combat! }, hero = { ...run.hero }, progression = { ...run.progression, inventory: [...run.progression.inventory] };
  let seed = run.seed;
  function draw() { const [value, next] = random(seed); seed = next; return value; }
  const log: string[] = [`― ${combat.turn}번째 턴 ―`];
  let guarded = false;
  const stats = combatStats(run);
  if (action === 'flee') {
    if (draw() < 0.7) return { ...run, seed, combat: null, result: '발자국을 감추고 전투에서 벗어났다. 전리품은 얻지 못했다.', journal: [...run.journal, `${run.day}일 · ${combat.enemy}에게서 도주했다.`] };
    log.push('도주 실패! 요괴가 퇴로를 막았다.');
  } else if (action === 'potion') {
    progression.potions--;
    const restored = Math.min(12, hero.maxHp - hero.hp); hero.hp += restored;
    log.push(`산삼 탕약으로 체력 ${restored} 회복. 적도 행동한다.`);
  } else if (action === 'guard') {
    guarded = true; progression.energy = Math.min(3, progression.energy + 1);
    log.push('호흡을 가다듬었다. 이번 피해 절반 · 기력 1 회복.');
  } else {
    const profile = roles[run.role];
    const magical = run.role === 'sorcerer' || ((run.role === 'medium' || run.role === 'healer') && (action === 'skill' || combat.intent === 'heavy'));
    const range = profile.range === 'mixed' ? combat.intent === 'heavy' ? 'ranged' : 'melee' : profile.range;
    const kind = `${range === 'ranged' ? '원거리' : '근거리'} ${magical ? '주술' : '물리'}`;
    let bonus = 0;
    if (action === 'skill') {
      progression.energy -= 2;
      if (run.role === 'warrior') { guarded = true; bonus = 3; log.push('철벽 자세 · 이번 피해 절반.'); }
      if (run.role === 'swordsman') bonus = 5;
      if (run.role === 'archer') { combat.enemyDebuff = 3; bonus = 3; }
      if (run.role === 'sorcerer' || run.role === 'medium' || run.role === 'healer') { combat.playerBuff = 3; combat.enemyDebuff = 3; bonus = 1; }
      if (combat.playerBuff === 3) log.push('아군 강화 3턴 · 공격력·방어력 +2 (현재 본인에게 적용).');
      if (combat.enemyDebuff === 3) log.push('적군 약화 3턴 · 공격력 -2 · 명중률 -10%p.');
      if (run.role === 'healer') {
        const healed = Math.min(10 + hero.ji, hero.maxHp - hero.hp);
        hero.hp += healed; log.push(`생명의 굿 · 아군 체력 ${healed} 회복 (현재 본인).`);
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
        log.push(`${action === 'skill' ? skills[run.role] : '공격'} · ${kind}${crit ? ' · 치명타' : ''}! ${combat.enemy}에게 ${damage} 피해.`);
      } else log.push(`${action === 'skill' ? skills[run.role] : '공격'} · ${kind} 공격이 빗나갔다.`);
    }
  }
  if (combat.hp === 0) {
    const reward = combat.boss ? 12 : 5;
    hero.gold += reward; hero.relics++;
    progression.exp += combat.boss ? 12 : 6;
    const drop = run.sceneId === 'wolf' ? 'blade' : run.sceneId === 'bridge' ? 'charm' : 'sword';
    const found = !progression.inventory.includes(drop);
    if (found) progression.inventory.push(drop);
    log.push(`승리! ${reward}냥 · 유물 1개 · 경험치 ${combat.boss ? 12 : 6} 획득.${found ? ` ${equipment[drop].name}을 얻었다. 장비 탭에서 착용할 수 있다.` : ''}`);
    while (progression.exp >= progression.level * 10) { progression.exp -= progression.level * 10; progression.level++; hero.maxHp += 4; hero.hp = Math.min(hero.maxHp, hero.hp + 8); log.push(`레벨 ${progression.level}! 최대 체력 +4 · 체력 8 회복.`); }
    return { ...run, seed, hero, progression, combat: null, result: log.join('\n'), ending: combat.boss ? '모든 이름의 새벽' : null, journal: [...run.journal, `${run.day}일 · ${combat.enemy}\n${[...combat.log, ...log].join('\n')}`] };
  }
  if (combat.intent === 'recover') { combat.hp = Math.min(combat.maxHp, combat.hp + 3); log.push(`${combat.enemy}이 기운을 모아 체력 3을 회복했다.`); }
  else {
    const magical = combat.damageType === 'magic';
    if (draw() < Math.min(0.75, stats.evade + (combat.enemyDebuff > 0 ? 0.1 : 0))) log.push(`${combat.enemy}의 ${magical ? '주술' : '물리'} 공격을 회피했다!`);
    else {
      let damage = combat.attack + (combat.intent === 'heavy' ? 4 : 0) + Math.floor(draw() * 2);
      damage -= (magical ? stats.magicDefense : stats.physicalDefense) + (combat.playerBuff > 0 ? 2 : 0) + (combat.enemyDebuff > 0 ? 2 : 0);
      if (!magical && (roles[run.role].range === 'ranged' || (roles[run.role].range === 'mixed' && combat.intent === 'heavy'))) damage -= 1;
      if (guarded) damage = Math.floor(damage / 2);
      damage = Math.max(1, damage); hero.hp = Math.max(0, hero.hp - damage);
      log.push(`${combat.enemy}의 ${magical ? '주술' : '물리'} ${combat.intent === 'heavy' ? '강타' : '공격'}! 체력 ${damage} 감소.`);
    }
  }
  if (hero.hp === 0) return { ...run, seed, hero, progression, combat: null, result: log.join('\n'), ending: '안개에 남은 발자국', journal: [...run.journal, `${run.day}일 · ${combat.enemy}에게 쓰러졌다.\n${[...combat.log, ...log].join('\n')}`] };
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
  while (next.combat && rounds < 60) {
    const healerNeedsSkill = next.role === 'healer' && next.progression.energy >= 2 && next.hero.maxHp - next.hero.hp >= 8;
    const action: BattleAction = healerNeedsSkill ? 'skill' : next.hero.hp <= 12 && next.progression.potions > 0 ? 'potion'
      : next.progression.energy >= 2 && (next.role !== 'healer' || next.combat.playerBuff === 0 || next.combat.enemyDebuff === 0) ? 'skill'
      : next.combat.intent === 'heavy' ? 'guard' : 'attack';
    next = battleTurn(next, action); rounds++;
  }
  if (next.combat) {
    const log = [...next.combat.log, '싸움이 길어져 물러났다. 보상은 없다.'];
    next = { ...next, ending: next.combat.boss ? '닿지 못한 손' : null, combat: null, result: log.join('\n'), journal: [...next.journal, `${next.day}일 · ${enemy}\n${log.join('\n')}`] };
  }
  const victory = next.hero.gold > start.hero.gold;
  const log = next.journal[next.journal.length - 1].split('\n').slice(1);
  return { ...next, battleReport: { enemy, outcome: next.hero.hp === 0 ? 'defeat' : victory ? 'victory' : 'retreat', rounds: start.combat!.turn - 1 + rounds, startHp: start.hero.hp, endHp: next.hero.hp, gold: next.hero.gold - start.hero.gold, exp: victory ? start.combat!.boss ? 12 : 6 : 0, items: next.progression.inventory.filter(id => !start.progression.inventory.includes(id)), levels: next.progression.level - start.progression.level, log }, result: log.join('\n') };
}
