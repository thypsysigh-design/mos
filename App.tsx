import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyAllocation, validAllocation, advance, archive, autoBattle, equip, choose, currentScene, decodeSave, disabledReason, newRun, roles, statNames, type Role, type Save, type Stat } from './src/game';

import { StatAllocationPanel } from './src/StatAllocationPanel';
import { BattleResult, EquipmentPanel } from './src/CombatPanel';

const STORAGE = 'mos-adventure.v1';
const empty: Save = { version: 1, run: null, records: [] };
const endings: Record<string, string> = {
  '모든 이름의 새벽': '숲에 갇힌 이름들이 별이 되어 하늘로 돌아간다. 누이는 당신의 손을 잡았다. 두 사람의 앞에, 처음 보는 아침이 열린다.',
  '다시 잡은 손': '등 뒤에서 숲의 목소리가 멀어진다. 누이가 웃는다. 잃어버린 시간은 돌아오지 않지만, 함께 걸을 길은 아직 남아 있다.',
  '숲의 새로운 등불': '당신과 누이는 숲에 남기로 했다. 다음에 길을 잃은 여행자는 어둠 속에서 두 개의 등불을 만날 것이다.',
  '닿지 못한 손': '뻗은 손끝에서 누이의 모습이 안개처럼 흩어진다. 당신은 숲 밖으로 돌아왔다. 편지에는 새로운 문장이 나타나 있다. “다시 만나.”',
  '안개에 남은 발자국': '더는 발걸음을 옮길 수 없다. 숲이 요괴가 숨 쉬는 조용히 부른다. 다른 모험에서는, 다른 길을 찾을 수 있을 것이다.',
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
  const [screen, setScreen] = useState<'index' | 'prologue' | 'game'>('index');
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
      setError(raw && !decoded.run && decoded.records.length === 0 && raw !== JSON.stringify(empty) ? '이전 저장 기록을 읽을 수 없어 새 모험을 준비했습니다.' : null);
      setLoaded(true);
    } catch { setReadFailed(true); setError('기록을 불러오지 못했습니다. 다시 시도해 주세요.'); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!loaded) return;
    // Serialize writes so rapid choices cannot overwrite a newer save with an older one.
    queue.current = queue.current.then(() => AsyncStorage.setItem(STORAGE, JSON.stringify(save))).then(() => setError(null)).catch(() => setError('기기 저장에 실패했습니다. 앱을 닫기 전에 저장을 다시 시도해 주세요.'));
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
    {screen !== 'index' && <View style={styles.header}><View><Text style={styles.eyebrow}>JOSEON / YOKAI HUNTER</Text>
      <Text style={styles.brand}>이매망량의 주인<Text style={{ color: colors.gold }}>✧</Text></Text></View>
      <Text style={styles.edition}>부제{ '\n' }산군</Text></View>}
    {error && <View style={styles.error}><Text style={{ color: colors.danger, lineHeight: 21 }}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => { if (!loaded) void load(); else setSave(s => ({ ...s })); }}><Text style={{ color: colors.gold, paddingTop: 8 }}>다시 시도 ↻</Text></Pressable></View>}
    {!loaded ? <View style={styles.loading}>{readFailed ? <Button title="기록 다시 불러오기" onPress={() => void load()} /> : <><ActivityIndicator color={colors.gold} /><Text style={styles.muted}>숲의 기억을 불러오는 중…</Text></>}</View> : <>
    <ScrollView ref={scroll} contentContainerStyle={[styles.content, screen === 'index' && styles.indexContent]}>
      {screen === 'index' && <View style={styles.indexCard}><Text accessibilityRole="header" style={styles.indexTitle}>이매망량의 주인</Text>
        <Text style={styles.indexSubtitle}>산군{ '\n' }{ '\n' }
        이름을부른다해서응해서는안된다{ '\n' }
        답을하는순간산군에게홀려창귀가될것이다</Text>
        <View style={{ width: '100%', marginTop: 42 }}><Button title="시작" onPress={() => { setScreen('prologue'); setTab('adventure'); }} /></View></View>}
      {screen === 'prologue' && <>

        <Text style={styles.eyebrow}>PROLOGUE / 여정의 시작</Text><Text style={styles.title}>요괴가 숨 쉬는{ '\n' }조선의 밤으로.</Text>
        <Text style={styles.body}>포도청에서 받은 사령패 한 장.{ '\n' }누이를 삼킨 북악산의 안개.{ '\n' }사냥과 선택으로 써 내려갈 열흘의 기록.</Text>
        {!run && <><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>어떤 사냥꾼이 되시겠습니까?</Text><Text style={styles.muted}>여섯 가지 직업</Text></View>
        {(Object.keys(roles) as Role[]).map(key => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: role === key }} accessibilityLabel={`${roles[key].name}, ${roles[key].subtitle}`} onPress={() => setRole(key)} style={[styles.role, role === key && styles.selected]}><Text style={styles.roleMark}>{roles[key].mark}</Text><View style={{ flex: 1 }}><Text style={styles.roleName}>{roles[key].name}</Text><Text style={styles.muted}>{roles[key].subtitle}</Text><Text style={styles.muted}>{(Object.keys(statNames) as Stat[]).map(stat => `${statNames[stat]} ${roles[key].stats[stat]}`).join(' · ')}</Text><Text style={styles.muted}>{roles[key].description}</Text></View><Text style={{ color: colors.gold }}>{role === key ? '●' : '○'}</Text></Pressable>)}
        <StatAllocationPanel role={role} allocation={allocation} onChange={setAllocation} /><Button title="게임 시작" onPress={start} disabled={!validAllocation(allocation)} /></>}
        {run && <><Text style={styles.body}>저장된 여정이 있습니다. {run.day}일째의 이야기를 이어갈 수 있습니다.</Text><Button title="모험 이어하기" onPress={() => { setScreen('game'); setTab('adventure'); }} /></>}
        <Button title="타이틀로 돌아가기" secondary onPress={() => setScreen('index')} /><Text style={styles.footnote}>한 번의 모험은 약 10분 · 진행은 자동 저장됩니다.{ '\n' }자동 전투 · 장비 획득 · 경험치 성장 · 다섯 가지 결말</Text>
      </>}
      {screen === 'game' && tab === 'adventure' && run && scene && <>
        <View style={styles.dayRow}><Text style={styles.eyebrow}>CHAPTER {String(run.day).padStart(2, '0')} / {scene.place}</Text><Text style={styles.muted}>{run.day} / 10일</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${run.day * 10}%` }]} /></View>
        <View style={styles.stats}><View style={{ flex: 1 }}><Text style={styles.muted}>생명</Text><Text style={styles.statValue}>{run.hero.hp}<Text style={styles.muted}> / {run.hero.maxHp}</Text></Text><View style={styles.hpTrack}><View style={[styles.hpFill, { width: `${run.hero.hp / run.hero.maxHp * 100}%` }]} /></View></View><View style={styles.statCell}><Text style={styles.muted}>냥</Text><Text style={styles.statValue}>{run.hero.gold}</Text></View><View style={styles.statCell}><Text style={styles.muted}>봉인 유물</Text><Text style={[styles.statValue, { color: colors.gold }]}>✧ {run.hero.relics}</Text></View></View>
        <View style={styles.traits}>{(Object.keys(statNames) as Stat[]).map(s => <Text key={s} style={styles.trait}>{statNames[s]} {run.hero[s]}</Text>)}<Text style={styles.muted}>{roles[run.role].name} · Lv.{run.progression.level}</Text></View>
        {run.ending ? <View style={styles.ending}><Text style={styles.endingMark}>✧</Text><Text style={styles.eyebrow}>EPILOGUE / 모험의 끝</Text><Text style={styles.title}>{run.ending}</Text><Text style={styles.body}>{endings[run.ending]}</Text>{run.battleReport && <BattleResult report={run.battleReport} />}<Text style={styles.footnote}>{run.day}일의 여정 · 유물 {run.hero.relics}개 · 모험집에 기록되었습니다.</Text><Button title="또 다른 이야기를 시작하기" onPress={() => { setSave(s => ({ ...s, run: null })); setScreen('prologue'); }} /><Button title="이번 여정 돌아보기" onPress={() => setTab('journal')} secondary /></View> : <>
          {!run.combat && <View style={styles.story}><Text style={styles.storyMark}>封</Text><Text style={[styles.title, { color: '#332311' }]}>{scene.title}</Text><View style={styles.divider} /><Text style={[styles.body, { color: '#59462f' }]}>{scene.text}</Text></View>}
          {run.result ? <View style={styles.result}><Text style={styles.eyebrow}>당신의 선택이 남긴 것</Text>{run.battleReport ? <BattleResult report={run.battleReport} /> : <Text accessibilityLiveRegion="polite" style={styles.body}>{run.result}</Text>}<Button title={run.day === 9 ? '숲의 심장으로  →' : '다음 길로 나아가기  →'} onPress={next} /></View> : <><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>어떻게 하시겠습니까?</Text><Text style={styles.muted}>선택 {scene.choices.length}개</Text></View>{scene.choices.map((c, i) => { const reason = disabledReason(run, i); return <Pressable key={`${scene.id}-${i}`} accessibilityRole="button" accessibilityState={{ disabled: !!reason }} disabled={!!reason} onPress={() => select(i)} style={({ pressed }) => [styles.choice, reason && { opacity: 0.45 }, pressed && { borderColor: colors.gold, backgroundColor: '#443220' }]}><Text style={styles.choiceNumber}>{String(i + 1).padStart(2, '0')}</Text><View style={{ flex: 1 }}><Text style={styles.choiceTitle}>{c.label}</Text><Text style={styles.muted}>{reason ?? c.hint}</Text></View><Text style={{ color: colors.gold }}>↗</Text></Pressable>; })}</>}
          {confirmAbandon && <View style={styles.result}><Text style={styles.body}>현재 여정을 포기할까요? 완료한 모험집은 남습니다.</Text><Button title="계속 모험하기" secondary onPress={() => setConfirmAbandon(false)} /><Button title="포기하고 처음으로" onPress={() => { setConfirmAbandon(false); setSave(s => ({ ...s, run: null })); setScreen('prologue'); }} /></View>}
          <Pressable accessibilityRole="button" onPress={abandon} style={{ alignSelf: 'center', padding: 20 }}><Text style={styles.muted}>모험 포기하기</Text></Pressable>
        </>}
      </>}
      {screen === 'game' && tab === 'equipment' && <>{run ? <EquipmentPanel run={run} onEquip={wear} /> : <><Text style={styles.title}>사냥꾼의 행낭</Text><Text style={styles.body}>모험을 시작하면 장비와 성장 정보를 확인할 수 있습니다.</Text><Button title="모험 시작 화면으로" onPress={() => setTab('adventure')} /></>}</>}
      {screen === 'game' && tab === 'journal' && <><Text style={styles.eyebrow}>TRAVEL JOURNAL</Text><Text style={styles.title}>걸어온 길</Text><Text style={styles.body}>당신의 선택은 숲에 흔적을 남깁니다.</Text>{run ? [...run.journal].reverse().map((entry, i) => <View style={styles.journalEntry} key={i}><Text style={styles.eyebrow}>기록 {String(run.journal.length - i).padStart(2, '0')}</Text><Text style={styles.body}>{entry}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyMark}>✎</Text><Text style={styles.body}>아직 발자국이 없습니다.{ '\n' }첫 모험을 시작해 보세요.</Text><Button title="모험으로" onPress={() => setTab('adventure')} /></View>}</>}
      {screen === 'game' && tab === 'records' && <><Text style={styles.eyebrow}>COLLECTED TALES</Text><Text style={styles.title}>당신의 모험집</Text><Text style={styles.body}>끝은 하나가 아닙니다.{ '\n' }다른 선택으로 새로운 결말을 만나세요.</Text><View style={styles.summary}><Text style={styles.statValue}>{save.records.length} <Text style={styles.muted}>번의 모험</Text></Text><Text style={styles.statValue}>{new Set(save.records.map(r => r.ending)).size}<Text style={styles.muted}> / 5 결말</Text></Text></View>{save.records.length ? save.records.map(r => <View key={r.id} style={styles.journalEntry}><Text style={styles.eyebrow}>{roles[r.role].name}</Text><Text style={styles.recordTitle}>{r.ending}</Text><Text style={styles.muted}>{r.days}일의 여정 · 유물 {r.relics}개</Text></View>) : <View style={styles.empty}><Text style={styles.emptyMark}>✧</Text><Text style={styles.body}>아직 완성된 이야기가 없습니다.{ '\n' }숲의 끝에서 첫 기록을 남겨 보세요.</Text></View>}<Text style={styles.footnote}>최근 30개의 결말을 이 기기에 보관합니다.{ '\n' }앱을 삭제하면 기록도 삭제됩니다.</Text></>}
    </ScrollView>
    {screen === 'game' && <View style={styles.navigation}>{([{ id: 'adventure', icon: '↟', name: '모험' }, { id: 'equipment', icon: '⚔', name: '장비' }, { id: 'journal', icon: '≡', name: '여정' }, { id: 'records', icon: '✧', name: '모험집' }] as const).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={styles.navItem}><Text style={[styles.navIcon, tab === item.id && { color: colors.gold }]}>{item.icon}</Text><Text style={[styles.navLabel, tab === item.id && { color: colors.gold }]}>{item.name}</Text></Pressable>)}</View>}
    </>}
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  indexContent: { flexGrow: 1, justifyContent: 'center' }, indexCard: { alignItems: 'center', paddingVertical: 48, width: '100%' }, indexTitle: { color: colors.text, fontSize: 32, lineHeight: 48, fontWeight: '700', textAlign: 'center' }, indexSubtitle: { color: colors.gold, fontSize: 22, letterSpacing: 8, marginTop: 16, textAlign: 'center' },
  safe: { flex: 1, backgroundColor: colors.bg }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }, eyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 2, lineHeight: 18 }, brand: { color: colors.text, fontSize: 19, fontWeight: '700', marginTop: 2 }, edition: { color: colors.muted, textAlign: 'right', fontSize: 11, lineHeight: 18 }, content: { padding: 24, paddingBottom: 36, maxWidth: 620, width: '100%', alignSelf: 'center' }, title: { color: colors.text, fontWeight: '700', fontSize: 28, lineHeight: 40, marginTop: 10, marginBottom: 18 }, body: { color: colors.text, fontSize: 16, lineHeight: 29, marginVertical: 10 }, muted: { color: colors.muted, fontSize: 12, lineHeight: 20 }, heroArt: { height: 185, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 100, marginBottom: 28, overflow: 'hidden' }, moon: { color: colors.gold, fontSize: 48, lineHeight: 56 }, forest: { color: '#a58b56', fontSize: 36, lineHeight: 48, letterSpacing: 10, marginLeft: 10 }, artCaption: { color: colors.muted, fontSize: 10, marginTop: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 14 }, sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '600' }, role: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 17, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 10, minHeight: 82 }, selected: { backgroundColor: '#3b2d1a', borderColor: colors.gold }, roleMark: { color: colors.gold, fontSize: 30, width: 36, textAlign: 'center' }, roleName: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 }, button: { backgroundColor: colors.gold, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', marginTop: 14 }, buttonText: { color: colors.bg, fontSize: 15, fontWeight: '700' }, secondary: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }, footnote: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 21, marginTop: 18 }, dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressTrack: { height: 2, backgroundColor: colors.border, marginVertical: 16 }, progressFill: { height: 2, backgroundColor: colors.gold }, stats: { flexDirection: 'row', gap: 24, backgroundColor: colors.panel, padding: 18, borderRadius: 12 }, statCell: { minWidth: 40 }, statValue: { color: colors.text, fontSize: 22, fontWeight: '600', marginTop: 4 }, hpTrack: { height: 3, backgroundColor: colors.border, marginTop: 8 }, hpFill: { height: 3, backgroundColor: '#aa7153' }, traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }, trait: { color: colors.gold, fontSize: 12, lineHeight: 20 }, story: { padding: 22, marginTop: 24, backgroundColor: '#eadfc7', borderRadius: 6, borderWidth: 1, borderColor: '#b28a4f' }, storyMark: { color: colors.gold, fontSize: 28, marginVertical: 8 }, divider: { width: 34, height: 1, backgroundColor: colors.gold, marginBottom: 12 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, minHeight: 88 }, choiceNumber: { color: colors.gold, fontSize: 12 }, choiceTitle: { color: colors.text, fontSize: 15, lineHeight: 23, marginBottom: 4 }, result: { borderTopWidth: 1, borderTopColor: colors.gold, paddingTop: 22 }, ending: { paddingTop: 36 }, endingMark: { fontSize: 60, color: colors.gold, textAlign: 'center', marginBottom: 30 }, journalEntry: { backgroundColor: colors.panel, borderLeftWidth: 2, borderLeftColor: colors.gold, padding: 20, borderRadius: 8, marginTop: 18 }, recordTitle: { color: colors.text, fontSize: 20, fontWeight: '600', marginVertical: 12 }, empty: { paddingVertical: 40, alignItems: 'center' }, emptyMark: { color: colors.gold, fontSize: 48 }, summary: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, backgroundColor: colors.panel, borderRadius: 12, marginVertical: 16 }, navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg, paddingVertical: 12 }, navItem: { flex: 1, alignItems: 'center', minHeight: 48 }, navIcon: { fontSize: 25, lineHeight: 30, color: colors.muted }, navLabel: { fontSize: 11, marginTop: 3, color: colors.muted }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }, error: { padding: 16, backgroundColor: '#342720' },
});
