import fs from 'node:fs/promises';
import {readStories} from './story-catalog.mjs';
try{const data=await readStories(),content=JSON.stringify(data,null,2)+'\n',file=new URL('../src/data/stories.json',import.meta.url);
if(process.argv.includes('--check')){if(await fs.readFile(file,'utf8').catch(()=>null)!==content)throw new Error('Run npm run stories:import');}else await fs.writeFile(file,content);
console.log(`Verified ${Object.keys(data).length} stories.`);}catch(error){console.error(error.message);process.exitCode=1;}
