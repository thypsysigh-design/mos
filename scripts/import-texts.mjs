import fs from 'node:fs/promises';
import path from 'node:path';
import { readCatalog, generatedFiles, root } from './text-catalog.mjs';

try {
  const catalogs = await readCatalog();
  const files = generatedFiles(catalogs);
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [file, text] of Object.entries(files)) {
    const destination = path.join(root, file);
    if (check) {
      if (await fs.readFile(destination, 'utf8').catch(() => null) !== text) stale.push(file);
    } else {
      const existing = await fs.readFile(destination, 'utf8').catch(() => null);
      if (existing !== text) await fs.writeFile(destination, text);
    }
  }
  if (stale.length) throw new Error(`Excel changes are not imported. Run npm run texts:import. Stale: ${stale.join(', ')}`);
  console.log(`${check ? 'Verified' : 'Imported'} ${Object.keys(catalogs.ko).length} texts (${Object.keys(catalogs).join(', ')}).`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
