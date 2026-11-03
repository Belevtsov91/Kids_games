import { chromium } from '../node_modules/.pnpm/playwright@1.64.1/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { pages: [], coloring: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { parent: { id: 'visual-parent', name: 'Родитель' }, children: [{ id: 'visual-child', name: 'Аня', age: 8, avatar: '🐰' }], activeChildId: 'visual-child' } }));
  await page.route('**/api/games/**', route => route.fulfill({ json: {} }));
  await page.goto(base + '/dashboard');
  await page.getByRole('heading', { name: 'Во что поиграем?' }).waitFor();
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); })));
  await page.screenshot({ path: fileURLToPath(new URL('./preview-integrated-menu.png', import.meta.url)), fullPage: true });
  for (const id of ['counting', 'animal-orchestra', 'who-lives-where', 'puzzles']) {
    await page.goto(base + '/play/' + id);
    await page.getByTestId('game-container').locator(':scope > *').first().waitFor();
    if (id === 'who-lives-where') await page.getByRole('button', { name: 'Играть', exact: false }).click();
    await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode().catch(() => undefined); })));
    report.pages.push({ id, images: await page.locator('img').evaluateAll(imgs => imgs.map(img => ({ src: img.getAttribute('src'), loaded: img.naturalWidth > 0 }))) });
    await page.screenshot({ path: fileURLToPath(new URL('./preview-integrated-' + id + '.png', import.meta.url)) });
  }
  await page.goto(base + '/play/drawing');
  await page.getByRole('button', { name: 'Раскраски', exact: true }).click();
  await page.getByRole('button', { name: 'Дракон в саду Открыть раскраску' }).click();
  await page.getByRole('button', { name: 'Сохранить в альбом' }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.coloring-actions button:last-child').disabled);
  await page.screenshot({ path: fileURLToPath(new URL('./preview-integrated-coloring.png', import.meta.url)) });
  report.coloring = await page.evaluate(async () => {
    const root = '/@fs/C:/Disk.D/interact_games/games/drawing/src/';
    const { coloringPages } = await import(root + 'ui/coloringPages.ts');
    const { lineMask } = await import(root + 'engine/floodFill.ts');
    const regions = (mask, w, h) => {
      const seen = new Uint8Array(mask.length), queue = new Int32Array(mask.length), sizes = [];
      for (let start = 0; start < mask.length; start++) {
        if (mask[start] || seen[start]) continue;
        let head = 0, tail = 1; queue[0] = start; seen[start] = 1;
        const add = p => { if (!mask[p] && !seen[p]) { seen[p] = 1; queue[tail++] = p; } };
        while (head < tail) { const p = queue[head++]; if (p % w > 0) add(p - 1); if (p % w < w - 1) add(p + 1); if (p >= w) add(p - w); if (p < w * (h - 1)) add(p + w); }
        if (tail >= 20) sizes.push(tail);
      }
      return { count: sizes.length, largest: sizes.sort((a, b) => b - a).slice(0, 5) };
    };
    const result = [];
    for (const item of coloringPages) {
      const image = new Image(); image.src = item.src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const after = lineMask(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      const original = new Image(); original.src = '/@fs/C:/Disk.D/interact_games/visual-lab/drawing/coloring-pages/' + item.id + '-v3.svg'; await original.decode();
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(original, 0, 0);
      const before = lineMask(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      result.push({ id: item.id, before: regions(before, canvas.width, canvas.height), after: regions(after, canvas.width, canvas.height), addedPixels: after.reduce((n, x, i) => n + Number(x && !before[i]), 0) });
    }
    return result;
  });
  report.errors = errors;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Заливка', exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('./preview-integrated-coloring-phone.png', import.meta.url)) });
  console.log(JSON.stringify(report.coloring));
  console.log(JSON.stringify({ errors, brokenImages: report.pages.flatMap(p => p.images.filter(i => !i.loaded).map(i => ({ game: p.id, ...i }))) }));
  await writeFile(new URL('./integration-check.json', import.meta.url), JSON.stringify(report, null, 2));
} finally { await browser.close(); }
