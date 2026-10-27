import { t } from './localization';
import { LevelProgress } from './LevelProgress';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { equipment, roles, combatStats, statNames, statEffects, type Stat, type BattleReport, type Run } from './game';

export function BattleResult({ report }: { report: BattleReport }) {
  const outcome = report.outcome === 'victory' ? t("combat_ui.001") : report.outcome === 'defeat' ? t("combat_ui.002") : t("combat_ui.003");
  return <View style={s.panel}>
    <Text style={s.kicker}>{t("combat_ui.004", { rounds: report.rounds })}</Text>
    <Text accessibilityLiveRegion="polite" style={[s.enemy, { color: '#332311' }]}>{outcome} · {report.enemy}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>{t("combat_ui.005", { startHp: report.startHp, endHp: report.endHp })}</Text>
    <Text style={[s.detail, { color: '#59462f' }]}>{t("combat_ui.007", { gold: report.gold, exp: report.exp, value3: report.outcome === 'victory' ? t("combat_ui.006") : '' })}</Text>
    {report.items.map(id => <Text key={id} style={[s.detail, { color: '#8b2924' }]}>{t("combat_ui.008", { name: equipment[id].name })}</Text>)}
    {report.levels > 0 && <Text style={[s.detail, { color: '#8b2924' }]}>{t("combat_ui.009", { levels: report.levels })}</Text>}
    <Text style={[s.help, { color: '#786343' }]}>{t("combat_ui.010")}</Text>
    <Text style={s.kicker}>{t("combat_ui.011")}</Text>
    <View style={s.log}>{report.log.map((line, i) => <Text key={i} style={s.line}>{line}</Text>)}</View>
  </View>;
}
export function EquipmentPanel({ run, onEquip }: { run: Run; onEquip: (id: string) => void }) {
  const stats = combatStats(run);
  return <View>
    <Text style={s.enemy}>{t("ui.045")}</Text>
    <Text style={s.itemName}>{roles[run.role].name} · {roles[run.role].description}</Text>
    <Text style={s.help}>{t("combat_ui.012")}</Text>
    <LevelProgress run={run} />
    <Text style={s.detail}>{t("combat_ui.014", { potions: run.progression.potions })}</Text>
    <View style={s.item}>
      <Text style={s.itemName}>{t("combat_ui.015")}</Text>
      {(Object.keys(statNames) as Stat[]).map(key => <View key={key} style={{ marginTop: 10 }}><Text style={s.itemName}>{statNames[key]} {run.hero[key]}</Text><Text style={s.detail}>{statEffects[key]}</Text></View>)}
    </View>
    <View style={s.item}>
      <Text style={s.itemName}>{t("combat_ui.016")}</Text>
      <Text style={s.detail}>{t("combat_ui.017", { physicalAttack: stats.physicalAttack, magicAttack: stats.magicAttack })}</Text>
      <Text style={s.detail}>{t("combat_ui.018", { physicalDefense: stats.physicalDefense, magicDefense: stats.magicDefense })}</Text>
      <Text style={s.detail}>{t("combat_ui.019", { maxHp: run.hero.maxHp })}</Text>
      <Text style={s.detail}>{t("combat_ui.020", { value1: (stats.hit * 100).toFixed(1), value2: (stats.evade * 100).toFixed(1) })}</Text>
      <Text style={s.detail}>{t("combat_ui.021", { value1: (stats.critical * 100).toFixed(1) })}</Text>
    </View>
    <Text style={s.help}>{t("combat_ui.023", { value1: run.combat ? t("combat_ui.022") : '' })}</Text>
    {run.progression.inventory.length === 0 && <Text style={s.detail}>{t("combat_ui.024")}</Text>}
    {run.progression.inventory.map(id => {
      const item = equipment[id], equipped = run.progression[item.slot] === id;
      return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!run.combat || !!run.ending, selected: equipped }} disabled={!!run.combat || !!run.ending} key={id} onPress={() => onEquip(id)} style={[s.item, equipped && { borderColor: '#cead64' }]}><Text style={s.itemName}>{item.name} {equipped ? t("combat_ui.025") : t("combat_ui.026")}</Text><Text style={s.detail}>{item.description}</Text></Pressable>;
    })}
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#eadfc7', borderWidth: 1, borderColor: '#b28a4f', borderRadius: 8, padding: 20, marginVertical: 18 }, kicker: { fontSize: 11, color: '#8b2924', letterSpacing: 2, marginBottom: 12 }, enemy: { fontSize: 25, color: '#ceb47e', fontWeight: '700', marginBottom: 14 }, detail: { color: '#c2af8c', fontSize: 13, lineHeight: 23 }, track: { height: 6, backgroundColor: '#cbbda0', marginVertical: 12, borderRadius: 3 }, fill: { height: 6, backgroundColor: '#8b2924', borderRadius: 3 }, intent: { backgroundColor: '#dfc9a3', borderLeftWidth: 3, borderLeftColor: '#8b2924', padding: 12, marginBottom: 14 }, intentText: { color: '#5b2821', fontSize: 13, lineHeight: 22 }, help: { color: '#ad9875', fontSize: 12, lineHeight: 22, marginVertical: 14 }, actions: { gap: 8, marginBottom: 24 }, action: { backgroundColor: '#f6efdd', borderColor: '#b8a783', borderWidth: 1, padding: 14, borderRadius: 6, minHeight: 68 }, actionName: { color: '#332311', fontWeight: '700', fontSize: 15 }, actionHint: { color: '#786343', fontSize: 11, marginTop: 5, lineHeight: 18 }, log: { borderTopWidth: 1, borderTopColor: '#cbbda0', paddingTop: 12 }, line: { color: '#59462f', fontSize: 12, lineHeight: 23 }, item: { padding: 20, borderWidth: 1, borderColor: '#5c4931', borderRadius: 8, marginTop: 14 }, itemName: { color: '#eadfc7', fontSize: 17, marginBottom: 8 },
});
