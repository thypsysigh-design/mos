import ExcelJS from 'exceljs';
import path from 'node:path';
import {root,readItems} from './item-catalog.mjs';
export const storiesPath=path.join(root,'content/stories.xlsx');
export async function readStories(file=storiesPath){
 const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);const items=await readItems(),result={};
 function rows(name,required,visit){const sheet=book.getWorksheet(name);if(!sheet)throw new Error(`Missing ${name} sheet`);const headers=sheet.getRow(1).values.slice(1);if(new Set(headers).size!==headers.length||required.some(k=>!headers.includes(k)))throw new Error(`Invalid ${name} columns`);
 sheet.eachRow((row,n)=>{if(n===1||row.values.slice(1).every(v=>v==null||v===''))return;const get=k=>headers.includes(k)?row.getCell(headers.indexOf(k)+1).value:null;
 const text=k=>{const v=get(k)??'';if(typeof v!=='string')throw new Error(`${name} ${n}: invalid text ${k}`);return v;};
 const number=(k,min,max,blank=0)=>{const raw=get(k),v=raw==null||raw===''?blank:raw;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error(`${name} ${n}: invalid ${k}`);return v;};
 const integer=(k,min,max,blank=0)=>{const v=number(k,min,max,blank);if(!Number.isSafeInteger(v))throw new Error(`Invalid integer ${k}`);return v;};
 const translated=(key,required=true)=>{const value={};for(const lang of ['ko','en','ja']){const v=text(`${lang}_${key}`);if(v.trim())value[lang]=v;}if(required&&!value.ko)throw new Error(`Missing Korean ${key}`);return value;};visit({text,number,integer,translated});});}
 rows('Stories',['ID','등장구분','등장가중치','ko_title','ko_place','ko_text'],({text,number,translated})=>{
 const id=text('ID'),kind=text('등장구분');if(!/^[a-z][a-z0-9_]*$/.test(id)||Object.hasOwn(result,id)||!['start','ending','random'].includes(kind)||['bridge','merchant','wolf','ambush','boss'].includes(id))throw new Error(`Invalid story ID/type ${id}`);
 if((kind==='start'&&id!=='gate')||(kind==='ending'&&id!=='heart')||(id==='gate'&&kind!=='start')||(id==='heart'&&kind!=='ending'))throw new Error('Reserved story type');
 result[id]={kind,weight:number('등장가중치',0,1000000),title:translated('title'),place:translated('place'),text:translated('text'),choices:[]};});
 const choiceMap=new Map();
 rows('Choices',['이야기ID','선택번호','ko_label','ko_hint','판정스탯','난이도','비용'],({text,integer,translated})=>{
 const id=text('이야기ID'),index=integer('선택번호',1,3),key=`${id}:${index}`,stat=text('판정스탯');if(!Object.hasOwn(result,id)||choiceMap.has(key)||!['','mu','ji','de','che','un'].includes(stat))throw new Error(`Invalid choice ${key}`);
 const choice={label:translated('label'),hint:translated('hint',false),cost:integer('비용',0,1000000)};
 if(stat){choice.stat=stat;choice.difficulty=integer('난이도',1,9999);}else if(integer('난이도',0,9999)!==0)throw new Error('Difficulty requires a stat');
 const helpHint=translated('help_hint',false);if(Object.keys(helpHint).length)choice.helpHint=helpHint;
 choiceMap.set(key,choice);result[id].choices[index-1]=choice;});
 const effects=new Set();
 rows('Effects',['이야기ID','선택번호','결과','ko_text','체력변화','정신력변화','냥변화','유물변화','획득아이템ID','아이템분실','상태효과','효과전투횟수','기록플래그','탕약변화'],({text,integer,translated})=>{
 const id=text('이야기ID'),index=integer('선택번호',1,3),outcome=text('결과'),key=`${id}:${index}:${outcome}`,choice=choiceMap.get(`${id}:${index}`);
 if(!choice||!['success','failure'].includes(outcome)||effects.has(key))throw new Error(`Invalid effect ${key}`);effects.add(key);
 const effect={text:translated('text')};for(const [col,prop]of [['체력변화','hp'],['정신력변화','mental'],['냥변화','gold'],['유물변화','relics'],['탕약변화','potions']]){const v=integer(col,-1000000,1000000);if(v)effect[prop]=v;}
 const item=text('획득아이템ID'),loss=text('아이템분실'),status=text('상태효과'),flag=text('기록플래그');
 if(item){if(!Object.hasOwn(items,item))throw new Error('Invalid gain item');effect.gainItem=item;}
 if(!['','yes','no'].includes(loss)||!['','blessing','curse'].includes(status)||(flag&&!/^[a-z][a-z0-9_]*$/.test(flag)))throw new Error('Invalid effect type');
 if(loss==='yes')effect.loseItem=true;if(flag)effect.flag=flag;
 if(status){effect.status=status;effect.statusBattles=integer('효과전투횟수',1,99);}else if(integer('효과전투횟수',0,99)!==0)throw new Error('Duration requires a status');
 choice[outcome]=effect;});
 if(!result.gate||!result.heart||!Object.values(result).some(s=>s.kind==='random'&&s.weight>0))throw new Error('Missing fixed/active random stories');
 for(const story of Object.values(result))for(let i=0;i<3;i++){const c=story.choices[i];if(!c||!c.success||(c.stat&&!c.failure)||(!c.stat&&c.failure))throw new Error('Every story needs three choices and valid success/failure effects');}
 // Only the finale has supported runtime substitutions.
 for(const [id,story]of Object.entries(result)){
 const check=(texts,allowed=[])=>{for(const value of Object.values(texts))for(const match of value.matchAll(/\{([^{}]+)\}/g))if(!allowed.includes(match[1]))throw new Error(`Unsupported placeholder ${id}: ${match[1]}`);};
 check(story.title);check(story.place);check(story.text,id==='heart'?['value1','value2']:[]);story.choices.forEach((c,i)=>{check(c.label);if(c.helpHint)check(c.helpHint);check(c.hint,id==='heart'&&i===0?['value1']:[]);check(c.success.text);if(c.failure)check(c.failure.text);});
 }
 return result;
}
