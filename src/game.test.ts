import assert from 'node:assert/strict';
import test from 'node:test';
import { advance, archive, battleTurn, battleDisabled, beginCombat, equip, choose, currentScene, decodeSave, disabledReason, newRun, roles, type Role, type Run } from './game';

test('same seed and choices produce the same adventure', () => {
  let a = newRun('scholar', 123), b = newRun('scholar', 123);
  for (let i = 0; i < 10 && !a.ending; i++) {
    a = advance(choose(a, 0)); b = advance(choose(b, 0));
    if (a.combat) { a = battleTurn(a, 'attack'); b = battleTurn(b, 'attack'); }
    assert.deepEqual(a, b);
  }
});
test('payment is required, deducted once and health is capped', () => {
  const base = { ...newRun('ranger', 1), sceneId: 'merchant' };
  assert.equal(choose({ ...base, hero: { ...base.hero, gold: 0 } }, 0).hero.gold, 0);
  const paid = choose(base, 0);
  assert.equal(paid.hero.gold, 4);
  assert.equal(paid.hero.hp, 32);
  assert.equal(choose(paid, 0), paid);
  assert.equal(choose(base, 99), base);
});
test('earlier discoveries unlock the final ending', () => {
  const heart: Run = { ...newRun('scholar', 12), day: 10, sceneId: 'heart' };
  assert.ok(disabledReason(heart, 0));
  const informed = { ...heart, flags: ['truth'], hero: { ...heart.hero, relics: 2 } };
  assert.equal(disabledReason(informed, 0), null);
  assert.equal(choose(informed, 0).ending, '모든 이름의 새벽');
  assert.equal(choose({ ...heart, flags: ['wolf'] }, 1).ending, '다시 잡은 손');
  assert.equal(choose(heart, 2).ending, '숲의 새로운 등불');
  const fallen = choose({ ...newRun('ranger', 1), sceneId: 'bridge', hero: { ...heart.hero, hp: 1 } }, 1);
  assert.equal(fallen.ending, '안개에 남은 발자국');
  assert.equal(advance(fallen), fallen);
  const weak = { ...heart, hero: { ...heart.hero, spirit: 0 } };
  assert.equal(choose(weak, 1).ending, '닿지 못한 손');
});
test('saving and restoring retains the pending outcome; archive is idempotent', () => {
  const finished = choose({ ...newRun('wanderer', 42), sceneId: 'heart', day: 10 }, 2);
  const save = archive({ version: 1, run: null, records: [] }, finished);
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  assert.equal(archive(save, finished).records.length, 1);
  assert.deepEqual(decodeSave('bad json'), { version: 1, run: null, records: [] });
  assert.equal(decodeSave(JSON.stringify({ ...save, run: { ...finished, hero: null } })).run, null);
});
test('400 seeded runs have legal choices and reach a terminal state within ten days', () => {
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
  let base = beginCombat(newRun('ranger', 1));
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
  const base = beginCombat(newRun('ranger', 1));
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
  const base = beginCombat({ ...newRun('scholar', 12), sceneId: 'heart', day: 10 });
  assert.ok(battleDisabled(base, 'flee'));
  const won = battleTurn({ ...base, combat: { ...base.combat!, hp: 1 } }, 'skill');
  assert.equal(won.ending, '모든 이름의 새벽');
  assert.equal(advance(won), won);
});
test('potion consumes a turn, defeat resolves, and level rewards are applied', () => {
  const base = beginCombat(newRun('wanderer', 7));
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
  assert.equal(levelled.hero.maxHp, 36);
});
test('mid-combat save round-trips and older saves migrate without losing story', () => {
  const base = battleTurn(beginCombat(newRun('monk', 55)), 'guard');
  const save = { version: 1, run: base, records: [] };
  assert.deepEqual(decodeSave(JSON.stringify(save)), save);
  const old: any = { ...newRun('scholar', 10) }; delete old.combat; delete old.progression;
  const restored = decodeSave(JSON.stringify({ version: 1, run: old, records: [] }));
  assert.equal(restored.run?.day, 1);
  assert.equal(restored.run?.progression.potions, 2);
  assert.equal(decodeSave(JSON.stringify({ ...save, run: { ...base, combat: { ...base.combat, intent: 'invalid' } } })).run, null);
});
