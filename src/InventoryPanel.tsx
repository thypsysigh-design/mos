import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { combatStats, getInventory, itemUseReason, itemCatalog, roles, statEffects, statNames, type ItemId, type Run, type Stat } from './game';
import { VitalsPanel } from './VitalsPanel';
import { LevelProgress } from './LevelProgress';
import { t } from './localization';

export function InventoryPanel({ run, onUse, onEquip, onAllocate }: { run: Run; onUse: (id: ItemId) => void; onEquip: (id: string) => void; onAllocate?: () => void }) {
  const entries = getInventory(run), stats = combatStats(run);
  const types = entries.length + Number(run.hero.relics > 0);
  const count = entries.reduce((sum, entry) => sum + entry.count, 0) + run.hero.relics;
  const locked = !!run.combat || !!run.ending;
  return <View>
    <Text style={s.title}>{t('inventory.title')}</Text>
    <VitalsPanel run={run} />
    {run.itemNotice && <Text accessibilityLiveRegion="polite" style={s.quantity}>{run.itemNotice}</Text>}
    <Text style={s.summary}>{t('inventory.summary', { types, count })}</Text>
    <Text style={s.detail}>{t('shop.gold', { gold: run.hero.gold })}</Text>
    {entries.length === 0 && run.hero.relics === 0 && <Text style={s.help}>{t('inventory.empty')}</Text>}
    {entries.map(entry => {
      const item = itemCatalog[entry.id], useReason = itemUseReason(run, entry.id);
      return <View key={entry.id} style={[s.card, entry.equipped && s.equipped]}>
        <Text style={s.tag}>{t(entry.category === 'equipment' ? 'inventory.equipment' : 'inventory.consumable')}{entry.category === 'equipment' ? ` · ${t(entry.equipped ? 'inventory.equipped' : 'inventory.not_equipped')}` : ''}</Text>
        <Text style={s.name}>{item.name}</Text>
        <Text style={s.quantity}>{t('inventory.count', { count: entry.count })}</Text>
        <Text style={s.detail}>{item.description}</Text>
        <Text style={s.detail}>{t('inventory.sell_price', { price: item.sell })}</Text>
        {entry.category === 'equipment' ? <>
          <Pressable accessibilityRole="button" disabled={locked} onPress={() => onEquip(entry.id)} style={[s.button, locked && s.disabled]}><Text style={s.buttonText}>{t(entry.equipped ? 'inventory.unequip' : 'inventory.equip', { name: item.name })}</Text></Pressable>
          {locked && <Text style={s.detail}>{t('inventory.locked')}</Text>}
        </> : <><Text style={s.help}>{t('inventory.auto_potion')}</Text><Pressable accessibilityRole="button" disabled={!!useReason} onPress={() => onUse(entry.id)} style={[s.button, !!useReason && s.disabled]}><Text style={s.buttonText}>{t('items.use', { name: item.name })}</Text></Pressable>{useReason && <Text style={s.detail}>{useReason}</Text>}</>}
      </View>;
    })}
    {run.hero.relics > 0 && <View style={s.card}>
      <Text style={s.tag}>{t('inventory.quest')}</Text><Text style={s.name}>{t('inventory.relic_name')}</Text>
      <Text style={s.quantity}>{t('inventory.count', { count: run.hero.relics })}</Text><Text style={s.detail}>{t('inventory.relic_help')}</Text>
    </View>}
    <Text style={s.section}>{t('inventory.character')}</Text>
    <Text style={s.name}>{roles[run.role].name}</Text>
    <LevelProgress run={run} onAllocate={onAllocate} />
    <View style={s.card}>
      <Text style={s.name}>{t('combat_ui.015')}</Text>
      {(Object.keys(statNames) as Stat[]).map(stat => <View key={stat} style={{ marginTop: 10 }}><Text style={s.name}>{statNames[stat]} {run.hero[stat]}</Text><Text style={s.detail}>{statEffects[stat]}</Text></View>)}
    </View>
    <View style={s.card}>
      <Text style={s.name}>{t('combat_ui.016')}</Text>
      <Text style={s.detail}>{t('combat_ui.017', { physicalAttack: stats.physicalAttack, magicAttack: stats.magicAttack })}</Text>
      <Text style={s.detail}>{t('combat_ui.018', { physicalDefense: stats.physicalDefense, magicDefense: stats.magicDefense })}</Text>
      <Text style={s.detail}>{t('combat_ui.019', { maxHp: run.hero.maxHp })}</Text>
      <Text style={s.detail}>{t('combat_ui.020', { value1: (stats.hit * 100).toFixed(1), value2: (stats.evade * 100).toFixed(1) })}</Text>
      <Text style={s.detail}>{t('combat_ui.021', { value1: (stats.critical * 100).toFixed(1) })}</Text>
    </View>
  </View>;
}
const s = StyleSheet.create({
  title: { color: '#efe5ce', fontSize: 28, fontWeight: '700', marginBottom: 12 }, summary: { color: '#d4b476', fontSize: 14, lineHeight: 24 }, card: { backgroundColor: '#2b2016', borderWidth: 1, borderColor: '#59472f', borderRadius: 10, padding: 18, marginTop: 18 }, equipped: { borderColor: '#d4b476' }, tag: { color: '#d4b476', fontSize: 11, lineHeight: 20, marginBottom: 6 }, name: { color: '#efe5ce', fontSize: 17, fontWeight: '600', lineHeight: 26 }, quantity: { color: '#d4b476', fontSize: 13, lineHeight: 24, marginVertical: 6 }, detail: { color: '#b7a384', fontSize: 12, lineHeight: 22, marginTop: 4 }, help: { color: '#b7a384', fontSize: 12, lineHeight: 22, marginTop: 14 }, button: { backgroundColor: '#d4b476', borderRadius: 6, padding: 14, minHeight: 44, alignItems: 'center', marginTop: 16 }, buttonText: { color: '#1a120d', fontSize: 14, fontWeight: '700' }, disabled: { opacity: 0.35 }, section: { color: '#efe5ce', fontSize: 22, fontWeight: '700', marginTop: 32, marginBottom: 16 },
});
