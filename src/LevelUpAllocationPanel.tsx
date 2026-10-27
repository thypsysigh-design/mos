import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { allocationTotal, canSpendStatPoints, emptyAllocation, statEffects, statNames, type Run, type Stat, type StatAllocation } from './game';
import { t } from './localization';

export function LevelUpAllocationPanel({ run, onConfirm }: { run: Run; onConfirm: (allocation: StatAllocation) => void }) {
  const [draft, setDraft] = useState(emptyAllocation);
  const spent = allocationTotal(draft), remaining = run.progression.statPoints - spent;
  function adjust(stat: Stat, delta: number) {
    setDraft(current => {
      if ((delta > 0 && allocationTotal(current) >= run.progression.statPoints) || current[stat] + delta < 0) return current;
      return { ...current, [stat]: current[stat] + delta };
    });
  }
  const valid = canSpendStatPoints(run, draft);
  return <View>
    <Text style={s.title}>{t('growth.title')}</Text>
    <Text accessibilityLiveRegion="polite" style={s.points}>{t('growth.available', { points: run.progression.statPoints, spent, remaining })}</Text>
    <Text style={s.help}>{t('growth.help')}</Text>
    {(Object.keys(statNames) as Stat[]).map(stat => <View key={stat} style={s.row}>
      <View style={s.info}><Text style={s.name}>{statNames[stat]}</Text><Text style={s.help}>{t('growth.preview', { base: run.hero[stat], added: draft[stat], total: run.hero[stat] + draft[stat] })}</Text><Text style={s.help}>{statEffects[stat]}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('creation.006', { value1: statNames[stat] })} disabled={draft[stat] === 0} style={[s.control, draft[stat] === 0 && s.disabled]} onPress={() => adjust(stat, -1)}><Text style={s.symbol}>−</Text></Pressable>
      <Text style={s.value}>{draft[stat]}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('creation.007', { value1: statNames[stat] })} disabled={remaining <= 0} style={[s.control, remaining <= 0 && s.disabled]} onPress={() => adjust(stat, 1)}><Text style={s.symbol}>+</Text></Pressable>
    </View>)}
    <Pressable accessibilityRole="button" disabled={!valid} onPress={() => { if (valid) { onConfirm(draft); setDraft(emptyAllocation()); } }} style={[s.confirm, !valid && s.disabled]}><Text style={s.confirmText}>{t('growth.confirm')}</Text></Pressable>
  </View>;
}
const s = StyleSheet.create({
  title: { color: '#efe5ce', fontSize: 24, fontWeight: '700', lineHeight: 34, marginBottom: 16 }, points: { color: '#d4b476', fontSize: 14, lineHeight: 24, marginBottom: 16 }, help: { color: '#b7a384', fontSize: 12, lineHeight: 22 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#59472f' }, info: { flex: 1 }, name: { color: '#efe5ce', fontSize: 17, marginBottom: 6 }, control: { width: 40, minHeight: 44, borderWidth: 1, borderColor: '#d4b476', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, symbol: { color: '#d4b476', fontSize: 22 }, value: { color: '#efe5ce', minWidth: 22, textAlign: 'center' }, confirm: { backgroundColor: '#d4b476', padding: 18, marginTop: 24, alignItems: 'center', borderRadius: 10 }, confirmText: { color: '#1a120d', fontWeight: '700', fontSize: 15 }, disabled: { opacity: 0.35 },
});
