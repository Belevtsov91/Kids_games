/// <reference lib="dom" />
import { expect, test } from '@playwright/test';
import { serverAwake } from './server';

test.beforeEach(({ page }) => serverAwake(page));

test('раскраска: цвет, отмена, защита выхода, ошибка сохранения и повтор', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route('**/api/auth/me', route => route.fulfill({ json: {
    parent: { id: 'color-parent', name: 'Родитель' },
    children: [{ id: 'color-child', name: 'Аня', age: 8, avatar: '🐰' }], activeChildId: 'color-child',
  } }));
  let attempts = 0;
  let saved: { image: string; title: string } | undefined;
  await page.route('**/api/games/drawing/drawings', async route => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
    attempts++;
    saved = route.request().postDataJSON();
    if (attempts === 1) return route.fulfill({ status: 500, json: { error: 'Test failure' } });
    return route.fulfill({ json: { id: 'saved-coloring', createdAt: new Date(0).toISOString() } });
  });
  await page.goto('/play/drawing');
  await expect(page.getByTestId('game-container')).toHaveAttribute('data-state', 'running');
  await page.getByRole('button', { name: 'Раскраски', exact: true }).click();
  await page.getByRole('button', { name: 'Дракон в саду Открыть раскраску' }).click();
  const save = page.getByRole('button', { name: 'Сохранить в альбом' });
  await expect(save).toBeEnabled();
  const canvas = page.getByLabel('Раскраска: Дракон в саду', { exact: true });
  const baseline = await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL());
  // Find a real white area, away from lines, and map it into the displayed canvas.
  const point = await canvas.evaluate((node: HTMLCanvasElement) => {
    const ctx = node.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, node.width, node.height);
    for (let y = node.height / 3 | 0; y < node.height * 2 / 3; y += 8) for (let x = node.width / 3 | 0; x < node.width * 2 / 3; x += 8) {
      let white = true;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (data[((y + dy) * node.width + x + dx) * 4] < 250) white = false;
      if (white) return { x: x * node.clientWidth / node.width, y: y * node.clientHeight / node.height };
    }
    throw new Error('No colorable area in page');
  });
  await canvas.click({ position: point });
  await expect(page.getByRole('button', { name: 'Отменить', exact: true })).toBeEnabled();
  expect(await canvas.evaluate((node: HTMLCanvasElement, before) => node.toDataURL() !== before, baseline)).toBe(true);
  await page.getByRole('button', { name: 'Отменить', exact: true }).click();
  expect(await canvas.evaluate((node: HTMLCanvasElement, before) => node.toDataURL() === before, baseline)).toBe(true);
  await canvas.click({ position: point });
  await page.getByRole('link', { name: 'В меню', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page).toHaveURL('/play/drawing');
  await page.getByRole('button', { name: 'Продолжить раскрашивать' }).click();
  await page.getByRole('button', { name: 'Все раскраски' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить раскрашивать' }).click();
  await save.click();
  await expect(page.getByText('Не удалось сохранить. Рисунок остался здесь — попробуй ещё раз.')).toBeVisible();
  await save.click();
  await expect(page.getByText('Готово! Раскраска сохранена в альбом.')).toBeVisible();
  expect(attempts).toBe(2);
  expect(saved?.title).toBe('Дракон в саду');
  expect(saved?.image.startsWith('data:image/png;base64,')).toBe(true);
  expect(saved?.image).not.toBe(baseline);
  const dimensions = await page.evaluate(async src => {
    const image = new Image(); image.src = src!; await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, saved?.image);
  expect(dimensions).toEqual([1536, 1024]);
  await page.getByRole('button', { name: 'К рисованию' }).click();
  await expect(page.getByRole('button', { name: 'Раскраски', exact: true })).toBeVisible();
});
