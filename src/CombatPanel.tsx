import { t } from './localization';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { itemCatalog, LEVEL_STAT_POINTS, type BattleReport } from './game';

export function BattleResult({ report }: { report: BattleReport }) {
  const outcome = report.outcome === 'victory' ? t("combat_ui.001") : report.outcome === 'defeat' ? t("combat_ui.002") : t("combat_ui.003");
  return <View style={s.panel}>
    <Text style={s.kicker}>{t("combat_ui.004", { rounds: report.rounds })}</Text>
    <Text accessibilityLiveRegion="polite" style={[s.enemy, { color: '#332311' }]}>{outcome} · {report.enemy}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>{t("combat_ui.005", { startHp: report.startHp, endHp: report.endHp })}</Text>
    {report.startMental !== undefined && report.endMental !== undefined && <Text style={[s.detail, { color: '#59462f' }]}>{t('vitals.battle_mp', { before: report.startMental, after: report.endMental })}</Text>}
    <Text style={[s.detail, { color: '#59462f' }]}>{t("combat_ui.007", { gold: report.gold, exp: report.exp, value3: report.outcome === 'victory' ? t("combat_ui.006") : '' })}</Text>
    {report.items.map(id => <Text key={id} style={[s.detail, { color: '#8b2924' }]}>{t("combat_ui.008", { name: itemCatalog[id as keyof typeof itemCatalog].name })}</Text>)}
    {report.levels > 0 && <Text style={[s.detail, { color: '#8b2924' }]}>{t("combat_ui.009", { levels: report.levels })}</Text>}
    {report.levels > 0 && <Text style={[s.detail, { color: '#8b2924' }]}>{t('growth.reward', { points: report.levels * LEVEL_STAT_POINTS })}</Text>}
    <Text style={[s.help, { color: '#786343' }]}>{t("combat_ui.010")}</Text>
    <Text style={s.help}>{t("events.drop.rate")}</Text>
    <Text style={s.kicker}>{t("combat_ui.011")}</Text>
    <View style={s.log}>{report.log.map((line, i) => <Text key={i} style={s.line}>{line}</Text>)}</View>
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#eadfc7', borderWidth: 1, borderColor: '#b28a4f', borderRadius: 8, padding: 20, marginVertical: 18 }, kicker: { fontSize: 11, color: '#8b2924', letterSpacing: 2, marginBottom: 12 }, enemy: { fontSize: 25, color: '#ceb47e', fontWeight: '700', marginBottom: 14 }, detail: { color: '#c2af8c', fontSize: 13, lineHeight: 23 }, track: { height: 6, backgroundColor: '#cbbda0', marginVertical: 12, borderRadius: 3 }, fill: { height: 6, backgroundColor: '#8b2924', borderRadius: 3 }, intent: { backgroundColor: '#dfc9a3', borderLeftWidth: 3, borderLeftColor: '#8b2924', padding: 12, marginBottom: 14 }, intentText: { color: '#5b2821', fontSize: 13, lineHeight: 22 }, help: { color: '#ad9875', fontSize: 12, lineHeight: 22, marginVertical: 14 }, actions: { gap: 8, marginBottom: 24 }, action: { backgroundColor: '#f6efdd', borderColor: '#b8a783', borderWidth: 1, padding: 14, borderRadius: 6, minHeight: 68 }, actionName: { color: '#332311', fontWeight: '700', fontSize: 15 }, actionHint: { color: '#786343', fontSize: 11, marginTop: 5, lineHeight: 18 }, log: { borderTopWidth: 1, borderTopColor: '#cbbda0', paddingTop: 12 }, line: { color: '#59462f', fontSize: 12, lineHeight: 23 }, item: { padding: 20, borderWidth: 1, borderColor: '#5c4931', borderRadius: 8, marginTop: 14 }, itemName: { color: '#eadfc7', fontSize: 17, marginBottom: 8 },
});
