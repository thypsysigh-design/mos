import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const exportDir = path.join(root, 'web-dist');
let html = await readFile(path.join(exportDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error('Expected one Expo web bundle for standalone playtest.');
const bundlePath = path.resolve(exportDir, scripts[0][1].replace(/^\/+/, ''));
if (!bundlePath.startsWith(exportDir + path.sep)) throw new Error('Bundle is outside export directory.');
const bundle = await readFile(bundlePath, 'utf8');
html = html.replace(scripts[0][0], () => `<script>${bundle.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace('<html lang="en">', '<html lang="ko">');
await mkdir(path.join(root, 'playtest'), { recursive: true });
const destination = path.join(root, 'playtest', 'mos-playtest.html');
await writeFile(destination, html);
console.log(`Standalone local playtest: ${destination}`);
