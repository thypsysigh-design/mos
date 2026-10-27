import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Run } from './game';
import { t } from './localization';

export function VitalsPanel({ run }: { run: Run }) {
  return <View style={s.panel}>
    <Text accessibilityLiveRegion="polite" style={s.label}>{t('vitals.hp', { current: run.hero.hp, max: run.hero.maxHp })}</Text>
    <View style={s.track}><View style={[s.hp, { width: `${run.hero.hp / run.hero.maxHp * 100}%` }]} /></View>
    <Text accessibilityLiveRegion="polite" style={s.label}>{t('vitals.mp', { current: run.progression.energy, max: run.progression.maxEnergy })}</Text>
    <View style={s.track}><View style={[s.mp, { width: `${run.progression.energy / run.progression.maxEnergy * 100}%` }]} /></View>
  </View>;
}
const s = StyleSheet.create({ panel: { backgroundColor: '#2b2016', padding: 16, borderRadius: 8, marginVertical: 16, borderWidth: 1, borderColor: '#59472f' }, label: { color: '#efe5ce', fontSize: 14, lineHeight: 24 }, track: { height: 5, backgroundColor: '#59472f', borderRadius: 3, marginTop: 6, marginBottom: 12 }, hp: { height: 5, backgroundColor: '#b46a53', borderRadius: 3 }, mp: { height: 5, backgroundColor: '#779cae', borderRadius: 3 } });
