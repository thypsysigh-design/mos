import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const itemsPath = path.join(root, 'content/items.xlsx');
const expectedIds = ['sword', 'charm', 'blade', 'potion', 'spirit_potion'];
export async function readItems(file = itemsPath) {
  const book = new ExcelJS.Workbook(); await book.xlsx.readFile(file);
  const sheet = book.getWorksheet('Items');
  if (!sheet) throw new Error('Missing Items sheet');
  const headers = sheet.getRow(1).values.slice(1).map(String);
  for (const key of ['ID', '종류', '슬롯', '효과', '수치', '구매가', '판매가', 'ko_name']) if (!headers.includes(key)) throw new Error(`Missing item column: ${key}`);
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate item column');
  const result = {};
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const cell = key => row.getCell(headers.indexOf(key) + 1).value;
    const text = key => { const value = cell(key); if (value === null || value === undefined) return ''; if (typeof value !== 'string') throw new Error(`Row ${number}: ${key} must be text (no formulas)`); return value; };
    const id = text('ID');
    if (!id && row.values.slice(1).every(v => v === null || v === undefined || v === '')) return;
    if (!expectedIds.includes(id) || Object.hasOwn(result, id)) throw new Error(`Invalid or duplicate item ID: ${id}`);
    const kind = text('종류'), slot = text('슬롯'), effect = text('효과');
    const numberValue = key => { const value = cell(key); if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${id}: ${key} must be a nonnegative integer`); return value; };
    const amount = numberValue('수치'), buy = numberValue('구매가'), sell = numberValue('판매가');
    if (amount > 999 || buy < 1 || buy > 1000000 || sell > buy) throw new Error(`${id}: invalid amount/prices (sell must not exceed buy)`);
    const consumable = id === 'potion' || id === 'spirit_potion';
    if (consumable ? kind !== 'consumable' || slot !== '' || effect !== (id === 'potion' ? 'heal_hp' : 'heal_mp') || amount < 1 : kind !== 'equipment' || !((slot === 'weapon' && effect === 'physical_attack') || (slot === 'armor' && effect === 'defense'))) throw new Error(`${id}: incompatible item category/slot/effect`);
    const names = {}, flavors = {};
    for (const header of headers) {
      const match = header.match(/^([a-z]{2}(?:-[A-Z]{2})?)_(name|flavor)$/);
      if (match) { const value = text(header); if (value.trim()) (match[2] === 'name' ? names : flavors)[match[1]] = value; }
    }
    if (!names.ko) throw new Error(`${id}: Korean item name is required`);
    result[id] = { kind, slot, effect, amount, buy, sell, names, flavors };
  });
  for (const id of expectedIds) if (!Object.hasOwn(result, id)) throw new Error(`Missing required item: ${id}`);
  return Object.fromEntries(expectedIds.map(id => [id, result[id]]));
}
export async function itemOutput(items) { return JSON.stringify(items, null, 2) + '\n'; }
