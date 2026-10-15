import { t } from './localization';
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
    <Text style={s.heading}>{t("creation.001")}</Text>
    <Text accessibilityLiveRegion="polite" style={s.remaining}>{t("creation.002", { remaining: remaining, CREATION_POINTS: CREATION_POINTS })}</Text>
    <Text style={s.help}>{t("creation.003")}</Text>
    {(Object.keys(statNames) as Stat[]).map(stat => <View key={stat} style={s.row}>
      <View style={s.info}><Text style={s.name}>{t("creation.004", { value1: statNames[stat], value2: roles[role].stats[stat] + allocation[stat] })}</Text><Text style={s.detail}>{t("creation.005", { value1: roles[role].stats[stat], value2: allocation[stat] })}</Text><Text style={s.detail}>{statEffects[stat]}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("creation.006", { value1: statNames[stat] })} accessibilityState={{ disabled: allocation[stat] === 0 }} disabled={allocation[stat] === 0} onPress={() => adjust(stat, -1)} style={[s.control, allocation[stat] === 0 && s.disabled]}><Text style={s.symbol}>−</Text></Pressable>
      <Text style={s.value}>{allocation[stat]}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("creation.007", { value1: statNames[stat] })} accessibilityState={{ disabled: remaining === 0 }} disabled={remaining === 0} onPress={() => adjust(stat, 1)} style={[s.control, remaining === 0 && s.disabled]}><Text style={s.symbol}>+</Text></Pressable>
    </View>)}
    <Pressable accessibilityRole="button" onPress={() => onChange(emptyAllocation())} style={s.reset}><Text style={s.resetText}>{t("creation.008")}</Text></Pressable>
    <Text style={s.help}>{t("creation.009")}</Text>
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#2b2016', borderColor: '#59472f', borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 24 }, heading: { color: '#efe5ce', fontSize: 18, fontWeight: '700' }, remaining: { color: '#d4b476', fontSize: 15, marginVertical: 12 }, help: { color: '#b7a384', fontSize: 12, lineHeight: 22 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#59472f' }, info: { flex: 1 }, name: { color: '#efe5ce', fontSize: 15, marginBottom: 4 }, detail: { color: '#b7a384', fontSize: 11, lineHeight: 20 }, control: { width: 40, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d4b476', borderRadius: 6 }, symbol: { color: '#d4b476', fontSize: 22 }, value: { color: '#efe5ce', fontSize: 14, minWidth: 22, textAlign: 'center' }, disabled: { opacity: 0.3 }, reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }, resetText: { color: '#d4b476', fontSize: 13 },
});
