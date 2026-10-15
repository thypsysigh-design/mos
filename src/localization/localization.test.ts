import assert from 'node:assert/strict';
import test from 'node:test';
import ko from './ko.json';
import { catalogs } from './catalogs';
import { endingText, t, textForLocale, type TextId } from './index';

test('catalog preserves title, prologue, placeholders and untranslated language fallback', () => {
  assert.equal(t('common.title'), ko['common.title']);
  assert.equal(t('common.subtitle'), ko['common.subtitle']);
  assert.equal(textForLocale('en', 'common.title'), (catalogs.en as Record<string, string>)['common.title'] || ko['common.title']);
  assert.equal(textForLocale('ja', 'common.title'), (catalogs.ja as Record<string, string>)['common.title'] || ko['common.title']);
  assert.equal(t('prologue.title'), ko['prologue.title']);
  assert.ok(t('common.app_name', { title: 'TITLE', subtitle: 'SUBTITLE' }).includes('TITLE'));
  assert.ok(t('common.app_name', { title: 'TITLE', subtitle: 'SUBTITLE' }).includes('SUBTITLE'));
  assert.throws(() => t('common.app_name'), /Missing parameter/);
});

test('every catalog entry can interpolate its documented parameters', () => {
  for (const [id, value] of Object.entries(ko)) {
    const params = Object.fromEntries([...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m => [m[1], `TEST_${m[1]}`]));
    const rendered = t(id as TextId, params);
    assert.ok(!/\{[A-Za-z][A-Za-z0-9_]*\}/.test(rendered), id);
  }
});

test('ending display text is separated from stable save identifiers', () => {
  assert.equal(endingText('모든 이름의 새벽'), t('ending.1.title'));
  assert.equal(endingText('legacy-unknown'), 'legacy-unknown');
});


test('a filled translation is used without changing Korean fallback', () => {
  const en = catalogs.en as Record<string, string>;
  const prior = en['common.title'];
  try { en['common.title'] = 'TRANSLATED_TITLE'; assert.equal(textForLocale('en', 'common.title'), 'TRANSLATED_TITLE'); }
  finally { if (prior === undefined) delete en['common.title']; else en['common.title'] = prior; }
});
