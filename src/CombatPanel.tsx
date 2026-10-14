import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { equipment, roles, combatStats, statNames, statEffects, type Stat, type BattleReport, type Run } from './game';

export function BattleResult({ report }: { report: BattleReport }) {
  const outcome = report.outcome === 'victory' ? '승리' : report.outcome === 'defeat' ? '패배' : '철수';
  return <View style={s.panel}>
    <Text style={s.kicker}>자동 전투 결과 · {report.rounds}턴</Text>
    <Text accessibilityLiveRegion="polite" style={[s.enemy, { color: '#332311' }]}>{outcome} · {report.enemy}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>내 체력 {report.startHp} → {report.endHp}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>획득 보상 · {report.gold}냥 · 경험치 {report.exp}{report.outcome === 'victory' ? ' · 봉인 유물 1개' : ''}</Text>
    {report.items.map(id => <Text key={id} style={[s.detail, { color: '#8b2924' }]}>전리품 · {equipment[id].name}</Text>)}
    {report.levels > 0 && <Text style={[s.detail, { color: '#8b2924' }]}>레벨 +{report.levels} · 최대 체력 증가</Text>}
    <Text style={[s.help, { color: '#786343' }]}>직업 기술·방어·탕약 사용까지 자동으로 진행됩니다.</Text>
    <Text style={s.kicker}>전체 전투 기록</Text>
    <View style={s.log}>{report.log.map((line, i) => <Text key={i} style={s.line}>{line}</Text>)}</View>
  </View>;
}
export function EquipmentPanel({ run, onEquip }: { run: Run; onEquip: (id: string) => void }) {
  const stats = combatStats(run);
  return <View>
    <Text style={s.enemy}>사냥꾼의 행낭</Text>
    <Text style={s.itemName}>{roles[run.role].name} · {roles[run.role].description}</Text>
    <Text style={s.help}>아군 강화·회복은 현재 1인 모험에서는 본인에게 적용됩니다.</Text>
    <Text style={s.detail}>레벨 {run.progression.level} · 경험치 {run.progression.exp} / {run.progression.level * 10}</Text>
    <Text style={s.detail}>산삼 탕약 {run.progression.potions}개 · 전투 중 체력 12 회복</Text>
    <View style={s.item}>
      <Text style={s.itemName}>무 · 지 · 덕 · 체 · 운</Text>
      {(Object.keys(statNames) as Stat[]).map(key => <View key={key} style={{ marginTop: 10 }}><Text style={s.itemName}>{statNames[key]} {run.hero[key]}</Text><Text style={s.detail}>{statEffects[key]}</Text></View>)}
    </View>
    <View style={s.item}>
      <Text style={s.itemName}>전투 능력</Text>
      <Text style={s.detail}>물리 공격력 {stats.physicalAttack} · 주술 공격력 {stats.magicAttack}</Text>
      <Text style={s.detail}>물리 방어력 {stats.physicalDefense} · 주술 방어력 {stats.magicDefense}</Text>
      <Text style={s.detail}>최대 체력 {run.hero.maxHp}</Text>
      <Text style={s.detail}>명중 {(stats.hit * 100).toFixed(1)}% · 회피 {(stats.evade * 100).toFixed(1)}%</Text>
      <Text style={s.detail}>치명타 {(stats.critical * 100).toFixed(1)}%</Text>
    </View>
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
