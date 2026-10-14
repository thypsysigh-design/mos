import assert from 'node:assert/strict';
import test from 'node:test';
import { advance, archive, autoBattle, combatStats, maxHealth, battleTurn, battleDisabled, beginCombat, equip, choose, currentScene, decodeSave, disabledReason, newRun, roles, type Role, type Run } from './game';

test('same seed and choices produce the same adventure', () => {
  let a = newRun('sorcerer', 123), b = newRun('sorcerer', 123);
  for (let i = 0; i < 10 && !a.ending; i++) {
    a = advance(choose(a, 0)); b = advance(choose(b, 0));
    if (a.combat) { a = battleTurn(a, 'attack'); b = battleTurn(b, 'attack'); }
    assert.deepEqual(a, b);
  }
});
test('payment is required, deducted once and health is capped', () => {
  const base = { ...newRun('swordsman', 1), sceneId: 'merchant' };
  assert.equal(choose({ ...base, hero: { ...base.hero, gold: 0 } }, 0).hero.gold, 0);
  const paid = choose(base, 0);
  assert.equal(paid.hero.gold, 4);
  assert.equal(paid.hero.hp, base.hero.maxHp);
  assert.equal(choose(paid, 0), paid);
  assert.equal(choose(base, 99), base);
});
test('earlier discoveries unlock the final ending', () => {
  const heart: Run = { ...newRun('sorcerer', 12), day: 10, sceneId: 'heart' };
  assert.ok(disabledReason(heart, 0));
  const informed = { ...heart, flags: ['truth'], hero: { ...heart.hero, relics: 2 } };
  assert.equal(disabledReason(informed, 0), null);
  assert.equal(choose(informed, 0).ending, '모든 이름의 새벽');
  assert.equal(choose({ ...heart, flags: ['wolf'] }, 1).ending, '다시 잡은 손');
  assert.equal(choose(heart, 2).ending, '숲의 새로운 등불');
  const fallen = choose({ ...newRun('swordsman', 1), sceneId: 'bridge', hero: { ...heart.hero, hp: 1 } }, 1);
  assert.equal(fallen.ending, '안개에 남은 발자국');
  assert.equal(advance(fallen), fallen);
  const weak = { ...heart, hero: { ...heart.hero, de: 0 } };
  assert.equal(choose(weak, 1).ending, '닿지 못한 손');
});
test('saving and restoring retains the pending outcome; archive is idempotent', () => {
  const finished = choose({ ...newRun('archer', 42), sceneId: 'heart', day: 10 }, 2);
  const save = archive({ version: 1, run: null, records: [] }, finished);
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  assert.equal(archive(save, finished).records.length, 1);
  assert.deepEqual(decodeSave('bad json'), { version: 1, run: null, records: [] });
  assert.equal(decodeSave(JSON.stringify({ ...save, run: { ...finished, hero: null } })).run, null);
});
test('600 seeded runs have legal choices and reach a terminal state within ten days', () => {
  for (const role of Object.keys(roles) as Role[]) for (let seed = 0; seed < 100; seed++) {
    let run = newRun(role, seed);
    for (let step = 0; !run.ending && step < 10; step++) {
      const options = currentScene(run).choices.map((_, i) => i).filter(i => !disabledReason(run, i));
      assert.ok(options.length);
      run = choose(run, options[(seed + step) % options.length]);
      for (let turn = 0; run.combat && turn < 30; turn++) {
        const action = run.hero.hp <= 12 && run.progression.potions ? 'potion' : run.progression.energy >= 2 ? 'skill' : 'attack';
        run = battleTurn(run, action);
      }
      assert.equal(run.combat, null, 'combat should resolve');
      run = advance(run);
      assert.ok(run.hero.hp >= 0 && run.hero.hp <= run.hero.maxHp);
      assert.ok(run.hero.gold >= 0);
      assert.ok(run.day <= 10);
    }
    assert.ok(run.ending, `seed ${seed} (${role}) did not finish`);
    const encounters = run.visited.slice(0, Math.min(8, run.visited.length));
    assert.equal(new Set(encounters).size, encounters.length);
  }
});


test('combat blocks story choices; guarding reduces heavy damage and restores energy', () => {
  let base = beginCombat(newRun('swordsman', 1));
  base = { ...base, combat: { ...base.combat!, intent: 'heavy' }, progression: { ...base.progression, energy: 0 } };
  const attack = battleTurn(base, 'attack'), guard = battleTurn(base, 'guard');
  assert.ok(guard.hero.hp > attack.hero.hp);
  assert.equal(guard.progression.energy, 1);
  assert.equal(choose(base, 0), base);
  assert.equal(advance(base), base);
  assert.ok(battleDisabled(base, 'skill'));
  assert.equal(battleTurn(base, 'skill'), base);
});
test('victory gives one reward and equipment; equipment cannot change during combat', () => {
  const base = beginCombat(newRun('swordsman', 1));
  const won = battleTurn({ ...base, combat: { ...base.combat!, hp: 1 } }, 'attack');
  assert.equal(won.combat, null);
  assert.equal(won.hero.gold, 13);
  assert.equal(won.hero.relics, 1);
  assert.ok(won.progression.inventory.includes('sword'));
  assert.equal(battleTurn(won, 'attack'), won);
  const worn = equip(won, 'sword');
  assert.equal(worn.progression.weapon, 'sword');
  assert.equal(equip(beginCombat(worn), 'sword').progression.weapon, 'sword');
  assert.equal(equip(worn, 'charm'), worn);
});
test('boss victory has a terminal ending and cannot flee', () => {
  const base = beginCombat({ ...newRun('sorcerer', 12), sceneId: 'heart', day: 10 });
  assert.ok(battleDisabled(base, 'flee'));
  const won = battleTurn({ ...base, combat: { ...base.combat!, hp: 1 } }, 'skill');
  assert.equal(won.ending, '모든 이름의 새벽');
  assert.equal(advance(won), won);
});
test('potion consumes a turn, defeat resolves, and level rewards are applied', () => {
  const base = beginCombat(newRun('archer', 7));
  const hurt = { ...base, hero: { ...base.hero, hp: 10 } };
  const healed = battleTurn(hurt, 'potion');
  assert.equal(healed.progression.potions, 1);
  assert.equal(healed.combat!.turn, 2);
  assert.ok(healed.hero.hp > 10 && healed.hero.hp < 22);
  const dead = battleTurn({ ...base, hero: { ...base.hero, hp: 1 } }, 'guard');
  assert.equal(dead.ending, '안개에 남은 발자국');
  const ready = { ...base, progression: { ...base.progression, exp: 8 }, combat: { ...base.combat!, hp: 1 } };
  const levelled = battleTurn(ready, 'attack');
  assert.equal(levelled.progression.level, 2);
  assert.equal(levelled.progression.exp, 4);
  assert.equal(levelled.hero.maxHp, base.hero.maxHp + 4);
});
test('mid-combat save round-trips and older saves migrate without losing story', () => {
  const base = battleTurn(beginCombat(newRun('medium', 55)), 'guard');
  const save = { version: 1, run: base, records: [] };
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  const old: any = { ...newRun('sorcerer', 10) }; delete old.combat; delete old.progression;
  const restored = decodeSave(JSON.stringify({ version: 1, run: old, records: [] }));
  assert.equal(restored.run?.day, 1);
  assert.equal(restored.run?.progression.potions, 2);
  assert.equal(decodeSave(JSON.stringify({ ...save, run: { ...base, combat: { ...base.combat, intent: 'invalid' } } })).run, null);
});

test('choosing combat automatically resolves it and exposes full results exactly once', () => {
  const base = newRun('swordsman', 12);
  const won = choose(base, 2);
  assert.equal(won.combat, null);
  assert.equal(won.battleReport?.outcome, 'victory');
  assert.equal(won.battleReport?.gold, 5);
  assert.equal(won.battleReport?.exp, 6);
  assert.deepEqual(won.battleReport?.items, ['sword']);
  assert.ok(won.battleReport!.log.some(line => line.includes('1번째 턴')));
  assert.ok(won.battleReport!.log.some(line => line.includes('승리!')));
  assert.equal(autoBattle(won), won);
  assert.equal(choose(won, 2), won);
  assert.equal(advance(won).battleReport, null);
  assert.deepEqual(decodeSave(JSON.stringify({version: 1, run: won, records: []})).run, won);
});

test('automatic defeats and boss victories retain their result report at the ending', () => {
  const base = beginCombat(newRun('swordsman', 1));
  const weak = { ...base, hero: { ...base.hero, hp: 1 }, progression: { ...base.progression, potions: 0, energy: 0 } };
  const dead = autoBattle(weak);
  assert.equal(dead.ending, '안개에 남은 발자국');
  assert.equal(dead.battleReport?.outcome, 'defeat');
  assert.equal(dead.battleReport?.gold, 0);
  const boss = beginCombat({ ...newRun('medium', 1), sceneId: 'heart', day: 10 });
  const won = autoBattle({ ...boss, combat: { ...boss.combat!, hp: 1 } });
  assert.equal(won.ending, '모든 이름의 새벽');
  assert.equal(won.battleReport?.outcome, 'victory');
  assert.equal(won.battleReport?.exp, 12);
});

test('five stats affect exactly the requested combat attributes', () => {
  const base = newRun('swordsman', 99), stats = combatStats(base);
  const changed = (key: 'mu' | 'ji' | 'de' | 'che' | 'un') => combatStats({ ...base, hero: { ...base.hero, [key]: base.hero[key] + 1 } });
  assert.ok(changed('mu').physicalAttack > stats.physicalAttack);
  assert.equal(changed('mu').magicAttack, stats.magicAttack);
  assert.ok(changed('ji').magicAttack > stats.magicAttack);
  assert.ok(changed('ji').magicDefense > stats.magicDefense);
  assert.equal(changed('ji').physicalDefense, stats.physicalDefense);
  assert.ok(changed('de').hit > stats.hit);
  assert.ok(changed('de').evade > stats.evade);
  assert.equal(changed('de').critical, stats.critical);
  assert.ok(changed('che').physicalDefense > stats.physicalDefense);
  assert.ok(changed('che').magicDefense > stats.magicDefense);
  assert.ok(maxHealth(base.hero.che + 1, 1) > base.hero.maxHp);
  assert.ok(changed('un').critical > stats.critical);
  assert.ok(changed('un').evade > stats.evade);
  assert.equal(changed('un').hit, stats.hit);
});

test('physical and magical defense each reduce incoming damage of their own type', () => {
  const base = beginCombat(newRun('swordsman', 1));
  base.combat!.attack = 20;
  const tougher = { ...base, hero: { ...base.hero, che: base.hero.che + 4 } };
  assert.ok(battleTurn(tougher, 'guard').hero.hp > battleTurn(base, 'guard').hero.hp);
  const magic = { ...base, combat: { ...base.combat!, damageType: 'magic' as const, attack: 15 } };
  const wiser = { ...magic, hero: { ...magic.hero, ji: magic.hero.ji + 4 } };
  assert.ok(battleTurn(wiser, 'guard').hero.hp > battleTurn(magic, 'guard').hero.hp);
  const physical = { ...magic, combat: { ...magic.combat, damageType: 'physical' as const } };
  assert.equal(battleTurn({ ...physical, hero: wiser.hero }, 'guard').hero.hp, battleTurn(physical, 'guard').hero.hp);
});

test('dexterity and luck control real misses, dodges and criticals across seeded battles', () => {
  const counts = { missesLow: 0, missesHigh: 0, dodgesLow: 0, dodgesHigh: 0, criticalLow: 0, criticalHigh: 0 };
  for (let seed = 0; seed < 200; seed++) {
    const base = beginCombat(newRun('swordsman', seed * 7919));
    const low = { ...base, combat: { ...base.combat!, hp: 100, maxHp: 100 }, hero: { ...base.hero, de: 0, un: 0 } };
    const high = { ...low, hero: { ...low.hero, de: 10, un: 10 } };
    for (const [name, run] of [['Low', low], ['High', high]] as const) {
      const attack = battleTurn(run, 'attack').combat!.log.join('\n');
      const guard = battleTurn(run, 'guard').combat!.log.join('\n');
      if (attack.includes('빗나갔다')) counts[`misses${name}`]++;
      if (attack.includes('치명타')) counts[`critical${name}`]++;
      if (guard.includes('회피했다')) counts[`dodges${name}`]++;
    }
  }
  assert.ok(counts.missesHigh < counts.missesLow);
  assert.ok(counts.dodgesHigh > counts.dodgesLow);
  assert.ok(counts.criticalHigh > counts.criticalLow);
});

test('old three-stat saves migrate without losing injury, gold, story or equipment', () => {
  const base = newRun('sorcerer', 42);
  const legacy: any = { ...base, hero: { hp: 20, maxHp: 32, gold: 17, relics: 2, strength: 1, wisdom: 3, spirit: 2 } };
  const restored = decodeSave(JSON.stringify({ version: 1, run: legacy, records: [] })).run!;
  assert.ok(restored);
  assert.deepEqual([restored.hero.mu, restored.hero.ji, restored.hero.de], [1, 3, 2]);
  assert.equal(restored.hero.che, 2);
  assert.equal(restored.hero.un, 1);
  assert.equal(restored.hero.maxHp - restored.hero.hp, 12);
  assert.equal(restored.hero.gold, 17);
  assert.deepEqual(restored.journal, base.journal);
  assert.deepEqual(restored.progression, base.progression);
  const again = decodeSave(JSON.stringify({ version: 1, run: restored, records: [] }));
  assert.deepEqual(again.run, restored);
  assert.equal(decodeSave(JSON.stringify({ version: 1, run: { ...restored, hero: { ...restored.hero, un: -1 } }, records: [] })).run, null);
});

test('six requested professions are available and distinguish damage, range and defense', () => {
  assert.deepEqual(Object.values(roles).map(r => r.name), ['역사', '궁사', '검사', '주술사', '무격', '활사']);
  const base = beginCombat(newRun('swordsman', 1));
  const common = { ...base, combat: { ...base.combat!, hp: 100, maxHp: 100 } };
  const sword = battleTurn(common, 'attack');
  assert.ok(sword.combat!.log.some(line => line.includes('근거리 물리')));
  const archer = battleTurn({ ...common, role: 'archer' }, 'attack');
  assert.ok(archer.combat!.log.some(line => line.includes('원거리 물리')));
  for (const role of ['sorcerer', 'medium', 'healer'] as const) {
    const weak = battleTurn({ ...common, role }, 'attack');
    assert.ok(weak.combat!.hp > sword.combat!.hp, `${role} should do weaker basic damage`);
  }
  const warrior = { ...common, role: 'warrior' as const };
  assert.ok(combatStats(warrior).physicalDefense > combatStats(common).physicalDefense);
  assert.ok(battleTurn(warrior, 'guard').hero.hp >= battleTurn(common, 'guard').hero.hp);
  const close = battleTurn({ ...common, role: 'medium' }, 'attack');
  const distant = battleTurn({ ...common, role: 'medium', combat: { ...common.combat!, intent: 'heavy' } }, 'attack');
  assert.ok(close.combat!.log.some(line => line.includes('근거리')));
  assert.ok(distant.combat!.log.some(line => line.includes('원거리')));
});

test('archer debuffs the enemy; support buffs and debuffs last three turns including cast', () => {
  for (const role of ['archer', 'sorcerer', 'medium', 'healer'] as const) {
    let run = beginCombat(newRun(role, 1));
    run.combat!.hp = 100; run.combat!.maxHp = 100;
    run = battleTurn(run, 'skill');
    assert.equal(run.combat!.enemyDebuff, 2);
    assert.equal(run.combat!.playerBuff, role === 'archer' ? 0 : 2);
    const protectedTurn = { ...run, combat: { ...run.combat!, attack: 18, intent: 'strike' as const } };
    const plainTurn = { ...protectedTurn, combat: { ...protectedTurn.combat, playerBuff: 0, enemyDebuff: 0 } };
    assert.ok(battleTurn(protectedTurn, 'guard').hero.hp > battleTurn(plainTurn, 'guard').hero.hp);
    run = battleTurn(run, 'guard');
    assert.equal(run.combat!.enemyDebuff, 1);
    run = battleTurn(run, 'guard');
    assert.equal(run.combat!.enemyDebuff, 0);
    assert.equal(run.combat!.playerBuff, 0);
  }
});

test('healer skill restores health and automatic battle prioritizes healing', () => {
  const base = beginCombat(newRun('healer', 77));
  const wounded = { ...base, hero: { ...base.hero, hp: 8 } };
  const healed = battleTurn(wounded, 'skill');
  assert.ok(healed.hero.hp > wounded.hero.hp);
  assert.ok(healed.hero.hp <= healed.hero.maxHp);
  assert.ok(healed.combat!.log.some(line => line.includes('아군 체력')));
  const auto = autoBattle(wounded);
  assert.ok(auto.battleReport!.log.some(line => line.includes('생명의 굿')));
  assert.equal(auto.combat, null);
});

test('legacy professions and mid-combat status fields migrate while retaining records', () => {
  const base = beginCombat(newRun('swordsman', 55));
  const old: any = { ...base, role: 'ranger' };
  delete old.combat.playerBuff; delete old.combat.enemyDebuff;
  const restored = decodeSave(JSON.stringify({ version: 1, run: old, records: [{ id: 'old', role: 'monk', ending: '숲의 새로운 등불', days: 10, relics: 2 }] }));
  assert.equal(restored.run!.role, 'swordsman');
  assert.equal(restored.run!.combat!.playerBuff, 0);
  assert.equal(restored.records[0].role, 'healer');
});
