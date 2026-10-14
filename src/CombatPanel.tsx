import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { battleDisabled, equipment, skills, type BattleAction, type Run } from './game';

const actions: { id: BattleAction; name: string; hint: string }[] = [
  { id: 'attack', name: '공격', hint: '기본 공격 · 치명타 가능' },
  { id: 'guard', name: '방어', hint: '피해 절반 · 기력 +1' },
  { id: 'skill', name: '직업 기술', hint: '기력 2 소모' },
  { id: 'potion', name: '산삼 탕약', hint: '체력 +12 · 적도 행동' },
  { id: 'flee', name: '도주', hint: '성공률 70% · 실패 시 반격' },
];
export function CombatPanel({ run, onAction }: { run: Run; onAction: (action: BattleAction) => void }) {
  const c = run.combat!;
  const skillHint = run.role === 'monk' ? '기력 2 · 피해 +1, 체력 +5, 피해 절반' : run.role === 'scholar' ? '기력 2 · 지혜에 비례한 주술 피해' : run.role === 'wanderer' ? '기력 2 · 의지에 비례한 사격 피해' : '기력 2 · 공격 피해 +5';
  const intent = c.intent === 'heavy' ? '강타 준비 · 다음 공격 +4, 방어가 유리합니다' : c.intent === 'recover' ? '회복 준비 · 이번 턴은 공격하지 않습니다' : '일반 공격 준비';
  return <View style={s.panel}>
    <Text style={[s.detail, { color: '#8b2924', marginBottom: 12 }]}>내 체력 {run.hero.hp} / {run.hero.maxHp} · Lv.{run.progression.level}</Text>
    <Text style={s.kicker}>{c.boss ? '최후의 사냥' : '요괴 조우'} · {c.turn}번째 턴</Text>
    <Text style={[s.enemy, { color: '#332311' }]}>{c.enemy}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>요괴 체력 {c.hp} / {c.maxHp}</Text>
    <View style={s.track}><View style={[s.fill, { width: `${c.hp / c.maxHp * 100}%` }]} /></View>
    <View style={s.intent}><Text style={s.intentText}>⚠ {intent}</Text></View>
    <Text style={[s.detail, { color: '#59462f' }]}>기력 {run.progression.energy} / 3 · 산삼 탕약 {run.progression.potions}개</Text>
    <Text style={[s.help, { color: '#786343' }]}>한 번 선택하면 요괴도 행동합니다. 적의 예고를 살펴보세요.</Text>
    <View style={s.actions}>{actions.map(a => {
      const reason = battleDisabled(run, a.id);
      return <Pressable key={a.id} disabled={!!reason} accessibilityRole="button" accessibilityState={{ disabled: !!reason }} onPress={() => onAction(a.id)} style={({ pressed }) => [s.action, !!reason && { opacity: 0.4 }, pressed && { backgroundColor: '#d7c199' }]}>
        <Text style={s.actionName}>{a.id === 'skill' ? skills[run.role] : a.name}</Text><Text style={s.actionHint}>{reason ?? (a.id === 'skill' ? skillHint : a.hint)}</Text>
      </Pressable>;
    })}</View>
    <Text style={s.kicker}>전투 기록</Text><View accessibilityLiveRegion="polite" style={s.log}>{c.log.slice(-9).map((line, i) => <Text key={`${c.turn}-${i}`} style={s.line}>{line}</Text>)}</View>
  </View>;
}
export function EquipmentPanel({ run, onEquip }: { run: Run; onEquip: (id: string) => void }) {
  return <View>
    <Text style={s.enemy}>사냥꾼의 행낭</Text>
    <Text style={s.detail}>레벨 {run.progression.level} · 경험치 {run.progression.exp} / {run.progression.level * 10}</Text>
    <Text style={s.detail}>산삼 탕약 {run.progression.potions}개 · 전투 중 체력 12 회복</Text>
    <Text style={s.help}>전투에서 얻은 장비를 눌러 착용하세요. 같은 종류는 하나씩 착용합니다.{run.combat ? '\n전투 중에는 장비를 바꿀 수 없습니다.' : ''}</Text>
    {run.progression.inventory.length === 0 && <Text style={s.detail}>아직 장비가 없습니다. 성문 밖 도깨비를 사냥해 환도를 얻어 보세요.</Text>}
    {run.progression.inventory.map(id => {
      const item = equipment[id], equipped = run.progression[item.slot] === id;
      return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!run.combat || !!run.ending, selected: equipped }} disabled={!!run.combat || !!run.ending} key={id} onPress={() => onEquip(id)} style={[s.item, equipped && { borderColor: '#cead64' }]}><Text style={s.itemName}>{item.name} {equipped ? '· 착용 중' : '· 미착용'}</Text><Text style={s.detail}>{item.description}</Text></Pressable>;
    })}
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#eadfc7', borderWidth: 1, borderColor: '#b28a4f', borderRadius: 8, padding: 20, marginVertical: 18 }, kicker: { fontSize: 11, color: '#8b2924', letterSpacing: 2, marginBottom: 12 }, enemy: { fontSize: 25, color: '#ceb47e', fontWeight: '700', marginBottom: 14 }, detail: { color: '#c2af8c', fontSize: 13, lineHeight: 23 }, track: { height: 6, backgroundColor: '#cbbda0', marginVertical: 12, borderRadius: 3 }, fill: { height: 6, backgroundColor: '#8b2924', borderRadius: 3 }, intent: { backgroundColor: '#dfc9a3', borderLeftWidth: 3, borderLeftColor: '#8b2924', padding: 12, marginBottom: 14 }, intentText: { color: '#5b2821', fontSize: 13, lineHeight: 22 }, help: { color: '#ad9875', fontSize: 12, lineHeight: 22, marginVertical: 14 }, actions: { gap: 8, marginBottom: 24 }, action: { backgroundColor: '#f6efdd', borderColor: '#b8a783', borderWidth: 1, padding: 14, borderRadius: 6, minHeight: 68 }, actionName: { color: '#332311', fontWeight: '700', fontSize: 15 }, actionHint: { color: '#786343', fontSize: 11, marginTop: 5, lineHeight: 18 }, log: { borderTopWidth: 1, borderTopColor: '#cbbda0', paddingTop: 12 }, line: { color: '#59462f', fontSize: 12, lineHeight: 23 }, item: { padding: 20, borderWidth: 1, borderColor: '#5c4931', borderRadius: 8, marginTop: 14 }, itemName: { color: '#eadfc7', fontSize: 17, marginBottom: 8 },
});
