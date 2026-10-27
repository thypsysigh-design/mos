import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readStories,storiesPath} from './story-catalog.mjs';
async function edited(edit,check){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'stories-'));try{const b=new ExcelJS.Workbook();await b.xlsx.readFile(storiesPath);edit(b);const file=path.join(dir,'stories.xlsx');await b.xlsx.writeFile(file);await check(file);}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('Excel stories import added content, choices, outcome effects and weights',async()=>{
 await edited(b=>{b.getWorksheet('Stories').addRow(['new_tale','random',7,'새로운 이야기','','','숲','','','달빛 아래 만남','','']);
 for(let n=1;n<=3;n++){b.getWorksheet('Choices').addRow(['new_tale',n,'선택 '+n,'','','안내','','','',0,0]);b.getWorksheet('Effects').addRow(['new_tale',n,'success','결과 '+n,'','',-3,9,5,0,'spirit_potion','no','blessing',7,'new_flag',0]);}},async f=>{const story=(await readStories(f)).new_tale;assert.equal(story.weight,7);assert.equal(story.text.ko,'달빛 아래 만남');assert.equal(story.choices.length,3);assert.equal(story.choices[2].success.mental,9);assert.equal(story.choices[0].success.statusBattles,7);assert.equal(story.choices[1].success.gainItem,'spirit_potion');});
});
test('story validation rejects missing choices, invalid references, weights and incomplete checks',async()=>{
 const edits=[b=>b.getWorksheet('Stories').getCell('C3').value=-1,b=>b.getWorksheet('Stories').getCell('A3').value='gate',b=>b.getWorksheet('Choices').spliceRows(2,1),b=>b.getWorksheet('Effects').getCell('K2').value='missing_item',b=>b.getWorksheet('Effects').getCell('M2').value='unknown_buff',b=>b.getWorksheet('Effects').getCell('G2').value={formula:'1+1'},b=>b.getWorksheet('Effects').spliceRows(4,1),b=>{const s=b.getWorksheet('Stories');for(let i=2;i<=s.rowCount;i++)s.getCell(i,3).value=0;},b=>b.getWorksheet('Stories').getCell('J3').value='{unsupported}'];
 for(const edit of edits)await edited(edit,f=>assert.rejects(()=>readStories(f)));
});
