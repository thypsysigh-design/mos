import { t, endingText } from './src/localization';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyAllocation, validAllocation, advance, archive, autoBattle, equip, choose, currentScene, decodeSave, disabledReason, newRun, roles, statNames, type Role, type Save, type Stat } from './src/game';

import { LevelProgress } from './src/LevelProgress';
import { StatAllocationPanel } from './src/StatAllocationPanel';
import { BattleResult, EquipmentPanel } from './src/CombatPanel';

const STORAGE = 'mos-adventure.v1';
const empty: Save = { version: 1, run: null, records: [] };
const endings: Record<string, string> = {
  '모든 이름의 새벽': t("ui.001"),
  '다시 잡은 손': t("ui.002"),
  '숲의 새로운 등불': t("ui.003"),
  '닿지 못한 손': t("ui.004"),
  '안개에 남은 발자국': t("ui.005"),
};
function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}><Text style={[styles.buttonText, secondary && { color: colors.gold }]}>{title}</Text></Pressable>;
}
const colors = { bg: '#1a120d', panel: '#2b2016', gold: '#d4b476', text: '#efe5ce', muted: '#b7a384', border: '#59472f', danger: '#e8a293' };
export default function App() {
  const [save, setSave] = useState<Save>(empty);
  const [loaded, setLoaded] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'adventure' | 'journal' | 'records' | 'equipment'>('adventure');
  const [screen, setScreen] = useState<'index' | 'prologue' | 'allocation' | 'game'>('index');
  const [role, setRole] = useState<Role>('swordsman');
  const [allocation, setAllocation] = useState(emptyAllocation);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const queue = useRef(Promise.resolve());
  const scroll = useRef<ScrollView>(null);
  async function load() {
    setReadFailed(false);
    try {
      const raw = await AsyncStorage.getItem(STORAGE);
      const decoded = decodeSave(raw);
      setSave(decoded.run?.combat ? archive(decoded, autoBattle(decoded.run)) : decoded);
      setError(raw && !decoded.run && decoded.records.length === 0 && raw !== JSON.stringify(empty) ? t("ui.006") : null);
      setLoaded(true);
    } catch { setReadFailed(true); setError(t("ui.007")); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!loaded) return;
    // Serialize writes so rapid choices cannot overwrite a newer save with an older one.
    queue.current = queue.current.then(() => AsyncStorage.setItem(STORAGE, JSON.stringify(save))).then(() => setError(null)).catch(() => setError(t("ui.008")));
  }, [save, loaded]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [save.run?.sceneId, tab, screen]);
  function start() { if (!validAllocation(allocation)) return; setSave(s => ({ ...s, run: newRun(role, Date.now(), allocation) })); setAllocation(emptyAllocation()); setTab('adventure'); setScreen('game'); }
  function select(index: number) { setSave(s => s.run ? archive(s, choose(s.run, index)) : s); }
  function wear(id: string) { setSave(s => s.run ? { ...s, run: equip(s.run, id) } : s); }
  function next() { setSave(s => s.run ? { ...s, run: advance(s.run) } : s); }
  function abandon() { setConfirmAbandon(true); }
  const run = save.run;
  const scene = run ? currentScene(run) : null;
  return <SafeAreaProvider><SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    {screen !== 'index' && <View style={styles.header}><View><Text style={styles.eyebrow}>{t("ui.009")}</Text>
      <Text style={styles.brand}>{t("common.title")}<Text style={{ color: colors.gold }}>✧</Text></Text></View>
      <Text style={styles.edition}>{t("ui.010", { subtitle: t("common.subtitle") })}</Text></View>}
    {error && <View style={styles.error}><Text style={{ color: colors.danger, lineHeight: 21 }}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => { if (!loaded) void load(); else setSave(s => ({ ...s })); }}><Text style={{ color: colors.gold, paddingTop: 8 }}>{t("ui.011")}</Text></Pressable></View>}
    {!loaded ? <View style={styles.loading}>{readFailed ? <Button title={t("ui.012")} onPress={() => void load()} /> : <><ActivityIndicator color={colors.gold} /><Text style={styles.muted}>{t("ui.013")}</Text></>}</View> : <>
    <ScrollView ref={scroll} contentContainerStyle={[styles.content, screen === 'index' && styles.indexContent]}>
      {screen === 'index' && <View style={styles.indexCard}><Text accessibilityRole="header" style={styles.indexTitle}>{t("common.title")}</Text>
        <Text style={styles.indexSubtitle}>{t("title.intro", { subtitle: t("common.subtitle") })}</Text>
        <View style={{ width: '100%', marginTop: 42 }}><Button title={t("button.enter")} onPress={() => { setScreen('prologue'); setTab('adventure'); }} /></View></View>}
      {screen === 'prologue' && <>

        <Text style={styles.eyebrow}>{t("prologue.label")}</Text><Text style={styles.title}>{t("prologue.title")}</Text>
        <Text style={styles.body}>{t("prologue.body")}</Text>
        {!run && <><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t("creation.class_prompt")}</Text><Text style={styles.muted}>{t("creation.class_count")}</Text></View>
        {(Object.keys(roles) as Role[]).map(key => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: role === key }} accessibilityLabel={`${roles[key].name}, ${roles[key].subtitle}`} onPress={() => setRole(key)} style={[styles.role, role === key && styles.selected]}><Text style={styles.roleMark}>{roles[key].mark}</Text><View style={{ flex: 1 }}><Text style={styles.roleName}>{roles[key].name}</Text><Text style={styles.muted}>{roles[key].subtitle}</Text><Text style={styles.muted}>{(Object.keys(statNames) as Stat[]).map(stat => `${statNames[stat]} ${roles[key].stats[stat]}`).join(' · ')}</Text><Text style={styles.muted}>{roles[key].description}</Text></View><Text style={{ color: colors.gold }}>{role === key ? '●' : '○'}</Text></Pressable>)}
        <Button title={t("button.next_stats")} onPress={() => setScreen('allocation')} /></>}
        {run && <><Text style={styles.body}>{t("ui.022", { day: run.day })}</Text><Button title={t("button.resume")} onPress={() => { setScreen('game'); setTab('adventure'); }} /></>}
        <Button title={t("button.back_to_title")} secondary onPress={() => setScreen('index')} /><Text style={styles.footnote}>{t("ui.025")}</Text>
      </>}
      {screen === 'allocation' && !run && <>
        <Text style={styles.eyebrow}>{t("creation.allocation_step")}</Text>
        <Text style={styles.title}>{roles[role].name}</Text>
        <Text style={styles.body}>{roles[role].description}</Text>
        <StatAllocationPanel role={role} allocation={allocation} onChange={setAllocation} />
        <Button title={t("button.start_game")} onPress={start} disabled={!validAllocation(allocation)} />
        <Button title={t("button.back_to_class")} secondary onPress={() => setScreen('prologue')} />
      </>}
      {screen === 'game' && tab === 'adventure' && run && scene && <>
        <View style={styles.dayRow}><Text style={styles.eyebrow}>{t("ui.026", { value1: String(run.day).padStart(2, '0'), place: scene.place })}</Text><Text style={styles.muted}>{t("ui.027", { day: run.day })}</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${run.day * 10}%` }]} /></View>
        <View style={styles.stats}><View style={{ flex: 1 }}><Text style={styles.muted}>{t("ui.028")}</Text><Text style={styles.statValue}>{run.hero.hp}<Text style={styles.muted}> / {run.hero.maxHp}</Text></Text><View style={styles.hpTrack}><View style={[styles.hpFill, { width: `${run.hero.hp / run.hero.maxHp * 100}%` }]} /></View></View><View style={styles.statCell}><Text style={styles.muted}>{t("ui.029")}</Text><Text style={styles.statValue}>{run.hero.gold}</Text></View><View style={styles.statCell}><Text style={styles.muted}>{t("ui.030")}</Text><Text style={[styles.statValue, { color: colors.gold }]}>✧ {run.hero.relics}</Text></View></View>
        <View style={styles.traits}>{(Object.keys(statNames) as Stat[]).map(s => <Text key={s} style={styles.trait}>{statNames[s]} {run.hero[s]}</Text>)}<Text style={styles.muted}>{t("ui.031", { name: roles[run.role].name, level: run.progression.level })}</Text></View>
        <LevelProgress run={run} />
        {run.ending ? <View style={styles.ending}><Text style={styles.endingMark}>✧</Text><Text style={styles.eyebrow}>{t("ui.032")}</Text><Text style={styles.title}>{endingText(run.ending)}</Text><Text style={styles.body}>{endings[run.ending]}</Text>{run.battleReport && <BattleResult report={run.battleReport} />}<Text style={styles.footnote}>{t("ui.033", { day: run.day, relics: run.hero.relics })}</Text><Button title={t("ui.034")} onPress={() => { setSave(s => ({ ...s, run: null })); setScreen('prologue'); }} /><Button title={t("ui.035")} onPress={() => setTab('journal')} secondary /></View> : <>
          {!run.combat && <View style={styles.story}><Text style={styles.storyMark}>封</Text><Text style={[styles.title, { color: '#332311' }]}>{scene.title}</Text><View style={styles.divider} /><Text style={[styles.body, { color: '#59462f' }]}>{scene.text}</Text></View>}
          {run.result ? <View style={styles.result}><Text style={styles.eyebrow}>{t("ui.036")}</Text>{run.battleReport ? <BattleResult report={run.battleReport} /> : <Text accessibilityLiveRegion="polite" style={styles.body}>{run.result}</Text>}<Button title={run.day === 9 ? t("ui.037") : t("ui.038")} onPress={next} /></View> : <><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t("ui.039")}</Text><Text style={styles.muted}>{t("ui.040", { length: scene.choices.length })}</Text></View>{scene.choices.map((c, i) => { const reason = disabledReason(run, i); return <Pressable key={`${scene.id}-${i}`} accessibilityRole="button" accessibilityState={{ disabled: !!reason }} disabled={!!reason} onPress={() => select(i)} style={({ pressed }) => [styles.choice, reason && { opacity: 0.45 }, pressed && { borderColor: colors.gold, backgroundColor: '#443220' }]}><Text style={styles.choiceNumber}>{String(i + 1).padStart(2, '0')}</Text><View style={{ flex: 1 }}><Text style={styles.choiceTitle}>{c.label}</Text><Text style={styles.muted}>{reason ?? c.hint}</Text></View><Text style={{ color: colors.gold }}>↗</Text></Pressable>; })}</>}
          {confirmAbandon && <View style={styles.result}><Text style={styles.body}>{t("ui.041")}</Text><Button title={t("ui.042")} secondary onPress={() => setConfirmAbandon(false)} /><Button title={t("ui.043")} onPress={() => { setConfirmAbandon(false); setSave(s => ({ ...s, run: null })); setScreen('prologue'); }} /></View>}
          <Pressable accessibilityRole="button" onPress={abandon} style={{ alignSelf: 'center', padding: 20 }}><Text style={styles.muted}>{t("ui.044")}</Text></Pressable>
        </>}
      </>}
      {screen === 'game' && tab === 'equipment' && <>{run ? <EquipmentPanel run={run} onEquip={wear} /> : <><Text style={styles.title}>{t("ui.045")}</Text><Text style={styles.body}>{t("ui.046")}</Text><Button title={t("ui.047")} onPress={() => setTab('adventure')} /></>}</>}
      {screen === 'game' && tab === 'journal' && <><Text style={styles.eyebrow}>{t("ui.048")}</Text><Text style={styles.title}>{t("ui.049")}</Text><Text style={styles.body}>{t("ui.050")}</Text>{run ? [...run.journal].reverse().map((entry, i) => <View style={styles.journalEntry} key={i}><Text style={styles.eyebrow}>{t("ui.051", { value1: String(run.journal.length - i).padStart(2, '0') })}</Text><Text style={styles.body}>{entry}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyMark}>✎</Text><Text style={styles.body}>{t("ui.052")}</Text><Button title={t("ui.053")} onPress={() => setTab('adventure')} /></View>}</>}
      {screen === 'game' && tab === 'records' && <><Text style={styles.eyebrow}>{t("ui.054")}</Text><Text style={styles.title}>{t("ui.055")}</Text><Text style={styles.body}>{t("ui.056")}</Text><View style={styles.summary}><Text style={styles.statValue}>{save.records.length} <Text style={styles.muted}>{t("ui.057")}</Text></Text><Text style={styles.statValue}>{new Set(save.records.map(r => r.ending)).size}<Text style={styles.muted}>{t("ui.058")}</Text></Text></View>{save.records.length ? save.records.map(r => <View key={r.id} style={styles.journalEntry}><Text style={styles.eyebrow}>{roles[r.role].name}</Text><Text style={styles.recordTitle}>{endingText(r.ending)}</Text><Text style={styles.muted}>{t("ui.059", { days: r.days, relics: r.relics })}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyMark}>✧</Text><Text style={styles.body}>{t("ui.060")}</Text></View>}<Text style={styles.footnote}>{t("ui.061")}</Text></>}
    </ScrollView>
    {screen === 'game' && <View style={styles.navigation}>{([{ id: 'adventure', icon: '↟', name: t("ui.062") }, { id: 'equipment', icon: '⚔', name: t("ui.063") }, { id: 'journal', icon: '≡', name: t("ui.064") }, { id: 'records', icon: '✧', name: t("ui.065") }] as const).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={styles.navItem}><Text style={[styles.navIcon, tab === item.id && { color: colors.gold }]}>{item.icon}</Text><Text style={[styles.navLabel, tab === item.id && { color: colors.gold }]}>{item.name}</Text></Pressable>)}</View>}
    </>}
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  indexContent: { flexGrow: 1, justifyContent: 'center' }, indexCard: { alignItems: 'center', paddingVertical: 48, width: '100%' }, indexTitle: { color: colors.text, fontSize: 32, lineHeight: 48, fontWeight: '700', textAlign: 'center' }, indexSubtitle: { color: colors.gold, fontSize: 22, letterSpacing: 8, marginTop: 16, textAlign: 'center' },
  safe: { flex: 1, backgroundColor: colors.bg }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }, eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 2, lineHeight: 18 }, brand: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 2 }, edition: { color: colors.muted, textAlign: 'right', fontSize: 11, lineHeight: 18 }, content: { padding: 24, paddingBottom: 36, maxWidth: 620, width: '100%', alignSelf: 'center' }, title: { color: colors.text, fontWeight: '700', fontSize: 28, lineHeight: 40, marginTop: 10, marginBottom: 18 }, body: { color: colors.text, fontSize: 16, lineHeight: 29, marginVertical: 10 }, muted: { color: colors.muted, fontSize: 12, lineHeight: 20 }, heroArt: { height: 185, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 100, marginBottom: 28, overflow: 'hidden' }, moon: { color: colors.gold, fontSize: 48, lineHeight: 56 }, forest: { color: '#a58b56', fontSize: 36, lineHeight: 48, letterSpacing: 10, marginLeft: 10 }, artCaption: { color: colors.muted, fontSize: 10, marginTop: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 14 }, sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '600' }, role: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 17, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 10, minHeight: 82 }, selected: { backgroundColor: '#3b2d1a', borderColor: colors.gold }, roleMark: { color: colors.gold, fontSize: 30, width: 36, textAlign: 'center' }, roleName: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 }, button: { backgroundColor: colors.gold, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', marginTop: 14 }, buttonText: { color: colors.bg, fontSize: 15, fontWeight: '700' }, secondary: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }, footnote: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 21, marginTop: 18 }, dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressTrack: { height: 2, backgroundColor: colors.border, marginVertical: 16 }, progressFill: { height: 2, backgroundColor: colors.gold }, stats: { flexDirection: 'row', gap: 24, backgroundColor: colors.panel, padding: 18, borderRadius: 12 }, statCell: { minWidth: 40 }, statValue: { color: colors.text, fontSize: 22, fontWeight: '600', marginTop: 4 }, hpTrack: { height: 3, backgroundColor: colors.border, marginTop: 8 }, hpFill: { height: 3, backgroundColor: '#aa7153' }, traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }, trait: { color: colors.gold, fontSize: 12, lineHeight: 20 }, story: { padding: 22, marginTop: 24, backgroundColor: '#eadfc7', borderRadius: 6, borderWidth: 1, borderColor: '#b28a4f' }, storyMark: { color: colors.gold, fontSize: 28, marginVertical: 8 }, divider: { width: 34, height: 1, backgroundColor: colors.gold, marginBottom: 12 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, minHeight: 88 }, choiceNumber: { color: colors.gold, fontSize: 12 }, choiceTitle: { color: colors.text, fontSize: 15, lineHeight: 23, marginBottom: 4 }, result: { borderTopWidth: 1, borderTopColor: colors.gold, paddingTop: 22 }, ending: { paddingTop: 36 }, endingMark: { fontSize: 60, color: colors.gold, textAlign: 'center', marginBottom: 30 }, journalEntry: { backgroundColor: colors.panel, borderLeftWidth: 2, borderLeftColor: colors.gold, padding: 20, borderRadius: 8, marginTop: 18 }, recordTitle: { color: colors.text, fontSize: 20, fontWeight: '600', marginVertical: 12 }, empty: { paddingVertical: 40, alignItems: 'center' }, emptyMark: { color: colors.gold, fontSize: 48 }, summary: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, backgroundColor: colors.panel, borderRadius: 12, marginVertical: 16 }, navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg, paddingVertical: 12 }, navItem: { flex: 1, alignItems: 'center', minHeight: 48 }, navIcon: { fontSize: 25, lineHeight: 30, color: colors.muted }, navLabel: { fontSize: 11, marginTop: 3, color: colors.muted }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }, error: { padding: 16, backgroundColor: '#342720' },
});
