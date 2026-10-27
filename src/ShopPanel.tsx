import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { itemCatalog, itemCount, tradeReason, type ItemId, type Run } from './game';
import { t } from './localization';

export function ShopPanel({ run, onBuy, onSell, onLeave }: { run: Run; onBuy: (id: ItemId) => void; onSell: (id: ItemId) => void; onLeave: () => void }) {
  return <View>
    <Text style={s.heading}>{t('shop.heading')}</Text><Text style={s.gold}>{t('shop.gold', { gold: run.hero.gold })}</Text>
    {run.transactionNotice && <Text accessibilityLiveRegion="polite" style={s.notice}>{run.transactionNotice}</Text>}
    {(Object.keys(itemCatalog) as ItemId[]).map(id => {
      const item = itemCatalog[id], buyReason = tradeReason(run, id, 'buy'), sellReason = tradeReason(run, id, 'sell');
      return <View key={id} style={s.item}>
        <Text style={s.name}>{item.name}</Text><Text style={s.detail}>{item.description}</Text>
        <Text style={s.gold}>{t('shop.row', { buy: item.buy, sell: item.sell, count: itemCount(run, id) })}</Text>
        <View style={s.buttons}>
          <Pressable accessibilityRole="button" disabled={!!buyReason} onPress={() => onBuy(id)} style={[s.button, !!buyReason && s.disabled]}><Text style={s.buttonText}>{t('shop.buy', { name: item.name })}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={!!sellReason} onPress={() => onSell(id)} style={[s.button, !!sellReason && s.disabled]}><Text style={s.buttonText}>{t('shop.sell', { name: item.name })}</Text></Pressable>
        </View>
        {buyReason && <Text style={s.detail}>{buyReason}</Text>}
      </View>;
    })}
    <Pressable accessibilityRole="button" onPress={onLeave} style={s.leave}><Text style={s.buttonText}>{t('shop.leave')}</Text></Pressable>
  </View>;
}
const s = StyleSheet.create({
  heading: { color: '#efe5ce', fontSize: 22, fontWeight: '700', marginVertical: 20 }, gold: { color: '#d4b476', fontSize: 13, lineHeight: 24, marginVertical: 8 }, notice: { color: '#efe5ce', fontSize: 14, lineHeight: 24, padding: 16, backgroundColor: '#3b2d1a', borderRadius: 8 }, item: { backgroundColor: '#2b2016', borderWidth: 1, borderColor: '#59472f', borderRadius: 8, padding: 16, marginTop: 16 }, name: { color: '#efe5ce', fontSize: 17, fontWeight: '600' }, detail: { color: '#b7a384', fontSize: 12, lineHeight: 22, marginTop: 8 }, buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }, button: { padding: 12, minHeight: 44, backgroundColor: '#d4b476', borderRadius: 6 }, buttonText: { color: '#1a120d', fontSize: 13, fontWeight: '700' }, leave: { padding: 18, backgroundColor: '#d4b476', borderRadius: 8, alignItems: 'center', marginTop: 24 }, disabled: { opacity: 0.35 },
});
