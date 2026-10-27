import fs from 'node:fs/promises';
import { readMonsters } from './monster-catalog.mjs';
const file = new URL('../src/data/monsters.json', import.meta.url);
try {
  const monsters=await readMonsters(), content=JSON.stringify(monsters,null,2)+'\n';
  if(process.argv.includes('--check')) { if(await fs.readFile(file,'utf8').catch(()=>null)!==content) throw new Error('Run npm run monsters:import'); }
  else await fs.writeFile(file,content);
  console.log(`Verified ${Object.keys(monsters).length} monsters.`);
} catch(error) { console.error(error.message);process.exitCode=1; }
