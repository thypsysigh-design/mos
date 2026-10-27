import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { experienceForNextLevel, MAX_LEVEL, type Run } from './game';
import { t } from './localization';

export function LevelProgress({ run, onAllocate }: { run: Run; onAllocate?: () => void }) {
  const { level, exp } = run.progression;
  const required = experienceForNextLevel(level);
  const ratio = required === null ? 1 : Math.min(1, exp / required);
  return <View style={styles.panel}>
    <Text style={styles.heading}>{required === null
      ? t('progression.maximum', { level, maxLevel: MAX_LEVEL })
      : t('progression.status', { level, maxLevel: MAX_LEVEL, exp, required })}</Text>
    <View accessibilityRole="progressbar" accessibilityLabel={t('progression.label')} accessibilityValue={{ min: 0, max: 100, now: Math.floor(ratio * 100) }} style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%` }]} /></View>
    <Text style={styles.detail}>{required === null
      ? t('progression.banked', { exp })
      : t('progression.remaining', { remaining: Math.max(0, required - exp) })}</Text>
    <Text style={styles.detail}>{t('growth.pending', { points: run.progression.statPoints })}</Text>
    {run.progression.statPoints > 0 && run.hero.hp > 0 && onAllocate && <Pressable accessibilityRole="button" onPress={onAllocate} style={{ paddingVertical: 14 }}><Text style={styles.heading}>{t('growth.open', { points: run.progression.statPoints })}</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { marginTop: 16, padding: 16, borderRadius: 8, backgroundColor: '#2b2016', borderWidth: 1, borderColor: '#59472f' }, heading: { color: '#d4b476', fontSize: 13, lineHeight: 22 }, track: { height: 4, backgroundColor: '#59472f', borderRadius: 2, marginVertical: 10 }, fill: { height: 4, borderRadius: 2, backgroundColor: '#d4b476' }, detail: { color: '#b7a384', fontSize: 12, lineHeight: 20 },
});
