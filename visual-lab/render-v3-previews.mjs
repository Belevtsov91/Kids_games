// Render previews from the final SVG files, never from their raster sources.
import { chromium } from '../node_modules/.pnpm/playwright@1.64.1/node_modules/playwright/index.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const jobs = JSON.parse(await readFile(path.join(root, 'vector-jobs-v3.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const job of jobs) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(root, 'studio.html')).href);
    await page.setContent('<style>html,body{margin:0;background:white}img{display:block;width:1200px;height:800px;object-fit:contain}</style><img alt="SVG preview">');
    await page.locator('img').evaluate(async (img, src) => { img.src = src; await img.decode(); }, pathToFileURL(path.join(root, job.path)).href);
    const preview = job.path.replace('.svg', '-preview.' + (job.category === 'coloring-pages' ? 'png' : 'jpg'));
    await page.screenshot({ path: path.join(root, preview), ...(preview.endsWith('.jpg') ? { type: 'jpeg', quality: 90 } : {}) });
    console.log(preview);
    await page.close();
  }
} finally {
  await browser.close();
}
