import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readCatalog, workbookPath } from './text-catalog.mjs';

async function editedWorkbook(edit, run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mos-texts-'));
  try {
    const book = new ExcelJS.Workbook(); await book.xlsx.readFile(workbookPath);
    edit(book.getWorksheet('Texts'));
    const file = path.join(directory, 'edited.xlsx'); await book.xlsx.writeFile(file);
    await run(file);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
}
function findRow(sheet, id) { let result; sheet.eachRow(row => { if (row.getCell(1).value === id) result = row; }); assert.ok(result, id); return result; }

test('an Excel edit changes runtime texts and supports reordered translated parameters', async () => {
  await editedWorkbook(sheet => {
    findRow(sheet, 'prologue.title').getCell(4).value = '편집한 프롤로그\n두 번째 줄';
    findRow(sheet, 'common.title').getCell(5).value = 'Master of Spirits';
    findRow(sheet, 'common.app_name').getCell(5).value = '{subtitle}: {title}';
  }, async file => {
    const catalogs = await readCatalog(file);
    assert.equal(catalogs.ko['prologue.title'], '편집한 프롤로그\n두 번째 줄');
    assert.equal(catalogs.en['common.title'], 'Master of Spirits');
    assert.equal(catalogs.en['common.app_name'], '{subtitle}: {title}');
    assert.equal(catalogs.ja['common.title'], undefined);
  });
});

test('duplicate IDs, missing IDs, missing source and invalid placeholders are rejected', async () => {
  for (const [edit, pattern] of [
    [s => { findRow(s, 'prologue.title').getCell(1).value = 'common.title'; }, /Duplicate ID/],
    [s => { const row = findRow(s, 'prologue.title'); s.spliceRows(row.number, 1); }, /Required ID missing/],
    [s => { findRow(s, 'common.title').getCell(4).value = ''; }, /must not be empty/],
    [s => { findRow(s, 'common.app_name').getCell(5).value = '{wrong}'; }, /placeholders must match/],
    [s => { findRow(s, 'common.app_name').getCell(4).value = '{title}'; }, /source placeholders changed/],
    [s => { findRow(s, 'common.title').getCell(4).value = { formula: '1+1', result: 2 }; }, /formulas/],
  ]) await editedWorkbook(edit, file => assert.rejects(() => readCatalog(file), pattern));
});
