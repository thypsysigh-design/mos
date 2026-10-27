import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readMonsters,monstersPath} from './monster-catalog.mjs';
async function edited(edit,check){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'monsters-'));try{const b=new ExcelJS.Workbook();await b.xlsx.readFile(monstersPath);edit(b);const file=path.join(dir,'monsters.xlsx');await b.xlsx.writeFile(file);await check(file);}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('monster workbook imports added monsters, combat values, level gates and drops',async()=>{
 await edited(b=>{b.getWorksheet('Monsters').addRow(['test_beast','시험 요괴','','','normal',25,100,10,10,20,'magic',4,6]);b.getWorksheet('Drops').addRow(['test_beast','potion',75]);},async f=>{const m=(await readMonsters(f)).test_beast;assert.equal(m.names.ko,'시험 요괴');assert.equal(m.attack,25);assert.equal(m.hp,100);assert.equal(m.level,10);assert.equal(m.minLevel,10);assert.equal(m.maxLevel,20);assert.deepEqual(m.drops,[{item:'potion',probability:0.75}]);});
});
test('invalid monster values, drop references, probabilities and missing level coverage are rejected',async()=>{
 for(const edit of [b=>b.getWorksheet('Monsters').getRow(2).getCell(6).value=-1,b=>b.getWorksheet('Monsters').getRow(2).getCell(1).value='wolf',b=>b.getWorksheet('Monsters').getRow(5).getCell(9).value=2,b=>b.getWorksheet('Drops').getRow(2).getCell(2).value='unknown',b=>b.getWorksheet('Drops').getRow(2).getCell(3).value=101,b=>b.getWorksheet('Drops').getRow(2).getCell(3).value=90,b=>b.getWorksheet('Monsters').getRow(2).getCell(9).value=31])await edited(edit,f=>assert.rejects(()=>readMonsters(f)));
});
