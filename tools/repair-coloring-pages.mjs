// Build thin SVG repairs once; phones should not analyse 1.5M pixels on every open.
import { chromium } from '../node_modules/.pnpm/playwright@1.64.1/node_modules/playwright/index.mjs';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const ids = ['dragon-garden', 'turtle-island', 'space-cat', 'forest-post', 'flower-city', 'ocean-friends'];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  const report = [];
  for (const id of ids) {
    const source = `visual-lab/drawing/coloring-pages/${id}-v3.svg`;
    const repair = await page.evaluate(async source => {
      const base = '/@fs/C:/Disk.D/interact_games/';
      const { lineMask } = await import(base + 'games/drawing/src/engine/floodFill.ts');
      const { closeLineGaps } = await import(base + 'games/drawing/src/engine/closeLineGaps.ts');
      const image = new Image(); image.src = base + source; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const before = lineMask(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      const after = closeLineGaps(before, canvas.width, canvas.height);
      let d = '', added = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const p = y * canvas.width + x;
        if (!after[p] || before[p]) continue;
        const start = x;
        while (x + 1 < canvas.width && after[y * canvas.width + x + 1] && !before[y * canvas.width + x + 1]) x++;
        const length = x - start + 1;
        d += `M${start} ${y}h${length}v1h-${length}Z`; added += length;
      }
      return { d, added };
    }, source);
    const original = await readFile(new URL(source, root), 'utf8');
    const svg = original.replace('</svg>', `<g id="contour-repairs" aria-label="Тонкие соединения разрывов"><path fill="#000" d="${repair.d}"/></g></svg>`);
    await writeFile(new URL(`games/drawing/assets/coloring-pages/${id}.svg`, root), svg);
    await writeFile(new URL(`visual-lab/drawing/coloring-pages/${id}-v4.svg`, root), svg);
    const preview = await page.evaluate(async svg => {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400;
        canvas.getContext('2d').drawImage(image, 0, 0, 600, 400);
        return canvas.toDataURL('image/webp', .9).split(',')[1];
      } finally { URL.revokeObjectURL(url); }
    }, svg);
    await writeFile(new URL(`games/drawing/assets/coloring-pages/${id}.webp`, root), Buffer.from(preview, 'base64'));
    report.push({ id, addedPixels: repair.added });
  }
  await writeFile(new URL('visual-lab/coloring-repairs.json', root), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
