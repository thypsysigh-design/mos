import fs from 'node:fs/promises';
import path from 'node:path';
import { readItems, itemOutput, root } from './item-catalog.mjs';
try {
  const items = await readItems(), content = await itemOutput(items);
  const file = path.join(root, 'src/data/items.json');
  const existing = await fs.readFile(file, 'utf8').catch(() => null);
  if (process.argv.includes('--check')) { if (existing !== content) throw new Error('Item Excel changes are not imported. Run npm run items:import.'); }
  else if (existing !== content) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, content); }
  console.log(`${process.argv.includes('--check') ? 'Verified' : 'Imported'} ${Object.keys(items).length} Excel items.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
