import ExcelJS from 'exceljs';
import path from 'node:path';
import { root, readItems } from './item-catalog.mjs';
export const monstersPath = path.join(root, 'content/monsters.xlsx');
export async function readMonsters(file = monstersPath) {
  const book = new ExcelJS.Workbook(); await book.xlsx.readFile(file);
  const items = await readItems(), result = {};
  function rows(name, required, visit) {
    const sheet = book.getWorksheet(name); if (!sheet) throw new Error(`Missing ${name} sheet`);
    const headers = sheet.getRow(1).values.slice(1);
    if (new Set(headers).size !== headers.length || required.some(key => !headers.includes(key))) throw new Error(`Invalid ${name} columns`);
    sheet.eachRow((row, n) => {
      if (n === 1 || row.values.slice(1).every(v => v == null || v === '')) return;
      const get = key => row.getCell(headers.indexOf(key) + 1).value;
      const text = key => { const v = get(key) ?? ''; if (typeof v !== 'string') throw new Error(`${name} ${n}: ${key} must be text`); return v.trim(); };
      const number = (key, min, max) => { const v = get(key); if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`${name} ${n}: invalid ${key}`); return v; };
      const integer = (key, min, max) => { const v = number(key, min, max); if (!Number.isSafeInteger(v)) throw new Error(`Invalid integer ${key}`); return v; };
      visit({ text, number, integer });
    });
  }
  rows('Monsters', ['ID','ko_name','종류','전투력','체력','레벨','등장_최소레벨','등장_최대레벨','공격유형','물리방어','주술방어'], ({text,integer}) => {
    const id=text('ID'), kind=text('종류'), damageType=text('공격유형');
    if (!/^[a-z][a-z0-9_]*$/.test(id) || Object.hasOwn(result,id) || !['normal','boss'].includes(kind) || !['physical','magic'].includes(damageType)) throw new Error(`Invalid monster ID/type: ${id}`);
    const names={ko:text('ko_name')}; if (!names.ko) throw new Error('Monster name required');
    for (const lang of ['en','ja']) { const sheet=book.getWorksheet('Monsters'); if (sheet.getRow(1).values.includes(`${lang}_name`)) names[lang]=text(`${lang}_name`); }
    const minLevel=integer('등장_최소레벨',1,30), maxLevel=integer('등장_최대레벨',1,30);
    if (minLevel>maxLevel) throw new Error('Invalid level range');
    result[id]={names,kind,attack:integer('전투력',1,9999),hp:integer('체력',1,999999),level:integer('레벨',1,30),minLevel,maxLevel,damageType,physicalDefense:integer('물리방어',0,9999),magicDefense:integer('주술방어',0,9999),drops:[]};
  });
  const pairs=new Set();
  rows('Drops',['몬스터ID','아이템ID','드랍확률(%)'],({text,number})=>{
    const monster=text('몬스터ID'), item=text('아이템ID'), probability=number('드랍확률(%)',0,100)/100, key=`${monster}:${item}`;
    if (!Object.hasOwn(result,monster) || !Object.hasOwn(items,item) || pairs.has(key)) throw new Error(`Invalid/duplicate drop: ${key}`);
    pairs.add(key); result[monster].drops.push({item,probability});
  });
  for (const m of Object.values(result)) if(m.drops.reduce((sum,d)=>sum+d.probability,0)>1.000000001) throw new Error('Drop probability total exceeds 100%');
  for (const kind of ['normal','boss']) for(let level=1;level<=30;level++) if(!Object.values(result).some(m=>m.kind===kind && m.minLevel<=level && m.maxLevel>=level)) throw new Error(`No ${kind} monster for player level ${level}`);
  return result;
}
