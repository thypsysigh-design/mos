import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { allocationTotal, CREATION_POINTS, emptyAllocation, roles, statEffects, statNames, type Role, type Stat, type StatAllocation } from './game';

export function StatAllocationPanel({ role, allocation, onChange }: { role: Role; allocation: StatAllocation; onChange: React.Dispatch<React.SetStateAction<StatAllocation>> }) {
  const remaining = CREATION_POINTS - allocationTotal(allocation);
  function adjust(stat: Stat, amount: number) {
    onChange(current => {
      if ((amount > 0 && allocationTotal(current) >= CREATION_POINTS) || current[stat] + amount < 0) return current;
      return { ...current, [stat]: current[stat] + amount };
    });
  }
  return <View style={s.panel}>
    <Text style={s.heading}>추가 스탯 분배</Text>
    <Text accessibilityLiveRegion="polite" style={s.remaining}>남은 포인트 {remaining} / {CREATION_POINTS}</Text>
    <Text style={s.help}>직업 기본 스탯에 15포인트를 추가합니다. 모두 분배하면 게임을 시작할 수 있습니다.</Text>
    {(Object.keys(statNames) as Stat[]).map(stat => <View key={stat} style={s.row}>
      <View style={s.info}><Text style={s.name}>{statNames[stat]} · 최종 {roles[role].stats[stat] + allocation[stat]}</Text><Text style={s.detail}>기본 {roles[role].stats[stat]} + 추가 {allocation[stat]}</Text><Text style={s.detail}>{statEffects[stat]}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${statNames[stat]} 감소`} accessibilityState={{ disabled: allocation[stat] === 0 }} disabled={allocation[stat] === 0} onPress={() => adjust(stat, -1)} style={[s.control, allocation[stat] === 0 && s.disabled]}><Text style={s.symbol}>−</Text></Pressable>
      <Text style={s.value}>{allocation[stat]}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${statNames[stat]} 증가`} accessibilityState={{ disabled: remaining === 0 }} disabled={remaining === 0} onPress={() => adjust(stat, 1)} style={[s.control, remaining === 0 && s.disabled]}><Text style={s.symbol}>+</Text></Pressable>
    </View>)}
    <Pressable accessibilityRole="button" onPress={() => onChange(emptyAllocation())} style={s.reset}><Text style={s.resetText}>분배 초기화</Text></Pressable>
    <Text style={s.help}>직업을 바꿔도 추가 분배는 유지됩니다. 게임 시작 후에는 분배를 변경할 수 없습니다.</Text>
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#2b2016', borderColor: '#59472f', borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 24 }, heading: { color: '#efe5ce', fontSize: 18, fontWeight: '700' }, remaining: { color: '#d4b476', fontSize: 15, marginVertical: 12 }, help: { color: '#b7a384', fontSize: 12, lineHeight: 22 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#59472f' }, info: { flex: 1 }, name: { color: '#efe5ce', fontSize: 15, marginBottom: 4 }, detail: { color: '#b7a384', fontSize: 11, lineHeight: 20 }, control: { width: 40, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d4b476', borderRadius: 6 }, symbol: { color: '#d4b476', fontSize: 22 }, value: { color: '#efe5ce', fontSize: 14, minWidth: 22, textAlign: 'center' }, disabled: { opacity: 0.3 }, reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }, resetText: { color: '#d4b476', fontSize: 13 },
});
