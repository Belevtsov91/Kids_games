import { expect as baseExpect, test, type Route } from '@playwright/test';
import { en } from '../src/wake/text/en';
import { ro } from '../src/wake/text/ro';
import { ru } from '../src/wake/text/ru';
import { uk } from '../src/wake/text/uk';
import { FAMILY, fakeApi, noWebGL, useLocale, type Handler } from './fakeApi';

// Под нагрузкой (3D-сцены в параллельных прогонах) страницы отвечают медленнее: ждём до 15 с.
const expect = baseExpect.configure({ timeout: 15_000 });

// Экран «Мишка просыпается»: кейсы W1–W12 из qa/test-cases/wake.md.
// Спящий сервер — это /api/health, который не отвечает, пока тест сам его не «разбудит» (gate).
// Так тест не зависит от того, как быстро Vite отдаёт 3D-чанк. Долгие ожидания — через page.clock.

const wake = '.wake';
const abort = (route: Route) => route.abort('connectionrefused');

/** Сервер спит, пока не позовут wake(): все запросы /health висят и отвечают разом. */
function sleepingServer() {
  let wakeUp = () => {};
  const awake = new Promise<void>((r) => (wakeUp = r));
  const handler: Handler = async (route) => {
    await awake;
    await route.fulfill({ json: { status: 'ok' } }).catch(() => undefined);
  };
  return { handler, wake: () => wakeUp() };
}

/** Следит, появлялся ли экран мишки и был ли он «проснувшимся» (is-awake). */
async function watchBear(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    type W = { __bear: string[]; MutationObserver: new (cb: () => void) => { observe(n: unknown, o: unknown): void }; document: { querySelector(s: string): { className: string } | null } };
    const w = globalThis as unknown as W;
    w.__bear = [];
    new w.MutationObserver(() => {
      const el = w.document.querySelector('.wake');
      if (el) w.__bear.push(el.className);
    }).observe(w.document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
  return () => page.evaluate(() => (globalThis as unknown as { __bear: string[] }).__bear);
}

test('W1: сервер ответил быстро — мишку не показываем', async ({ page }) => {
  const seen = await watchBear(page);
  await fakeApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Привет! Выбирай свой мир и играй!' })).toBeVisible({ timeout: 15_000 });
  expect(await seen()).toEqual([]);
});

test('W2: сервер ответил вскоре после появления мишки — экран уходит без «подъёма»', async ({ page }) => {
  const seen = await watchBear(page);
  const server = sleepingServer();
  await fakeApi(page, { 'GET /api/health': server.handler });
  await page.goto('/');
  await expect(page.locator(wake)).toBeVisible({ timeout: 15_000 });
  server.wake();
  await expect(page.locator(wake)).toHaveCount(0, { timeout: 5_000 });
  expect((await seen()).some((c) => c.includes('is-awake'))).toBe(false);
});

test('W3, W4: спящий сервер — мишка встаёт, текст читается, открывается та же страница', async ({ page }) => {
  test.slow();
  const server = sleepingServer();
  await fakeApi(page, { 'GET /api/health': server.handler });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: ru.title.start })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ru.lead.start)).toBeVisible();
  // мишка спит дольше QUICK_MS (2 с) — ждём по часам страницы, видимого признака у экрана нет
  await page.waitForFunction(() => (globalThis as unknown as { performance: { now(): number } }).performance.now() > 5_000);
  server.wake();
  await expect(page.locator(wake)).toHaveClass(/is-awake/, { timeout: 10_000 });
  await expect(page.getByText(ru.awake)).toBeVisible();
  // W4: утром текст остаётся светлым — на сиреневом небе тёмный не читался.
  const light = await page.locator('.wake-lead').evaluate((el) => {
    const g = globalThis as unknown as { getComputedStyle(e: unknown): { color: string } };
    const [r, gr, b] = g.getComputedStyle(el).color.match(/\d+/g)!.map(Number);
    return (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255;
  });
  expect(light).toBeGreaterThan(0.7);
  await expect(page.locator(wake)).toHaveCount(0, { timeout: 15_000 });
  await expect(page).toHaveURL('/login');
  await expect(page.getByLabel('Почта')).toBeVisible();
});

test('W5, W8: подсказки сменяются по времени, после 90 с — честная подсказка', async ({ page }) => {
  // Без WebGL: иначе page.clock прокручивает тысячи кадров 3D-сцены, а проверяем только тексты.
  await noWebGL(page);
  await page.clock.install();
  await fakeApi(page, { 'GET /api/health': abort });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: ru.title.start })).toBeVisible({ timeout: 15_000 });
  await page.clock.runFor(45_000);
  await expect(page.getByText(ru.hints[3])).toBeVisible();
  await page.clock.runFor(50_000);
  await expect(page.getByText(ru.stuck)).toBeVisible();
});

test('W6, W7: прокси отвечает 502 — мишка ждёт, потом сайт открывается', async ({ page }) => {
  test.slow();
  let gatewayDown = true;
  await fakeApi(page, {
    'GET /api/health': (route) => (gatewayDown ? route.fulfill({ status: 502, body: 'Bad gateway' }) : route.fulfill({ json: { status: 'ok' } })),
  });
  await page.goto('/');
  await expect(page.locator(wake)).toBeVisible({ timeout: 15_000 });
  gatewayDown = false;
  await expect(page.locator(wake)).toHaveCount(0, { timeout: 25_000 });
  await expect(page.getByRole('heading', { name: 'Привет! Выбирай свой мир и играй!' })).toBeVisible();
});

test('W9: сервер упал посреди игры — мишка поверх игры, игра не перезагружается', async ({ page }) => {
  test.slow();
  let down = false;
  await noWebGL(page); // сцена мишки здесь не нужна, а под page.clock она лишь грузит процессор
  await page.clock.install();
  await fakeApi(page, {
    'GET /api/health': (route) => (down ? abort(route) : route.fulfill({ json: { status: 'ok' } })),
    'GET /api/kid/status': (route) => (down ? abort(route) : route.fulfill({ status: 404, json: {} })),
  }, structuredClone(FAMILY));
  await page.goto('/play/counting');
  const game = page.getByRole('heading', { name: 'Считай и играй' }).first();
  await expect(game).toBeVisible({ timeout: 20_000 });
  // Метка на контейнере игры: если оболочка перемонтирует игру, метка пропадёт (сама игра может перерисовывать свой DOM).
  await page.locator('.game-container').evaluate((el) => ((el as { dataset: Record<string, string> }).dataset.qa = 'same'));

  down = true;
  await page.clock.runFor(62_000); // опрос времени ребёнка — раз в минуту
  await expect(page.getByRole('heading', { name: ru.title.lost })).toBeVisible({ timeout: 15_000 });

  down = false;
  await page.clock.runFor(15_000);
  await expect(page.locator(wake)).toHaveCount(0, { timeout: 10_000 });
  await expect(page).toHaveURL('/play/counting');
  await expect(page.locator('[data-qa="same"]')).toBeVisible();
});

test('W10: без WebGL экран уходит сразу после ответа сервера', async ({ page }) => {
  await noWebGL(page);
  const server = sleepingServer();
  await fakeApi(page, { 'GET /api/health': server.handler });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: ru.title.start })).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => (globalThis as unknown as { performance: { now(): number } }).performance.now() > 5_000);
  server.wake();
  // раньше пустой экран висел ещё 9 с
  await expect(page.locator(wake)).toHaveCount(0, { timeout: 3_000 });
});

for (const [locale, text] of Object.entries({ ru, uk, ro, en })) {
  test(`W11, W12: тексты экрана — ${locale}`, async ({ page }) => {
    await useLocale(page, locale as 'ru' | 'uk' | 'ro' | 'en');
    await noWebGL(page); // проверяем тексты и раскладку, сцена не нужна
    await fakeApi(page, { 'GET /api/health': abort });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: text.title.start })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(text.lead.start)).toBeVisible();
    // W12: текст не вылезает за экран и на телефоне.
    const box = await page.locator('.wake-text').boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
}
