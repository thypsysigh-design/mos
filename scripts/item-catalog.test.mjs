import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readItems, itemsPath } from './item-catalog.mjs';

async function edited(edit, run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sangun-items-'));
  try {
    const book = new ExcelJS.Workbook(); await book.xlsx.readFile(itemsPath);
    edit(book.getWorksheet('Items'));
    const file = path.join(directory, 'items.xlsx'); await book.xlsx.writeFile(file); await run(file);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
}
function row(sheet, id) { let found; sheet.eachRow(value => { if (value.getCell(1).value === id) found = value; }); assert.ok(found); return found; }

test('item Excel edits preserve numeric effects, names, translations and prices', async () => {
  await edited(sheet => {
    const item = row(sheet, 'potion'); item.getCell(5).value = 27; item.getCell(6).value = 8;
    item.getCell(8).value = '달빛 탕약'; item.getCell(9).value = 'Moonlight Potion';
  }, async file => {
    const items = await readItems(file);
    assert.equal(items.potion.amount, 27); assert.equal(items.potion.buy, 8);
    assert.equal(items.potion.names.ko, '달빛 탕약'); assert.equal(items.potion.names.en, 'Moonlight Potion');
    assert.equal(items.potion.effect, 'heal_hp');
  });
});

test('invalid item data fails before producing runtime data', async () => {
  for (const [edit, pattern] of [
    [s => { row(s, 'potion').getCell(5).value = -1; }, /nonnegative integer/],
    [s => { row(s, 'potion').getCell(7).value = 999; }, /sell must not exceed buy/],
    [s => { row(s, 'potion').getCell(8).value = ''; }, /name is required/],
    [s => { row(s, 'potion').getCell(4).value = 'heal_mp'; }, /incompatible/],
    [s => { row(s, 'blade').getCell(1).value = 'sword'; }, /duplicate/],
    [s => { const r = row(s, 'potion'); s.spliceRows(r.number, 1); }, /Missing required item/],
  ]) await edited(edit, file => assert.rejects(() => readItems(file), pattern));
});
