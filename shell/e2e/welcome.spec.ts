import { expect as baseExpect, test } from '@playwright/test';
import { en } from '../src/i18n/dict/en';
import { ru } from '../src/i18n/dict/ru';
import { fakeApi, noWebGL } from './fakeApi';

// Под нагрузкой (3D-сцены в параллельных прогонах) страницы отвечают медленнее: ждём до 15 с.
const expect = baseExpect.configure({ timeout: 15_000 });

// Главная (приветствие): кейсы P1–P6 из qa/test-cases/welcome.md. API подменён (fakeApi).

test.slow(); // 3D-архипелаг на главной тяжёлый, в параллельных прогонах всё медленнее

const title = (d: typeof ru) => d.hero.titleStart + d.hero.titleAccent + d.hero.titleEnd;
const isPhone = (width: number) => width <= 600;

test('P1: кнопки главной ведут куда нужно', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: title(ru) })).toBeVisible();
  await expect(page.getByRole('link', { name: ru.common.start }).first()).toHaveAttribute('href', '/register');
  await expect(page.getByRole('link', { name: ru.common.login }).first()).toHaveAttribute('href', '/login');
  if (!isPhone(page.viewportSize()!.width)) {
    await expect(page.getByRole('link', { name: ru.common.register })).toHaveAttribute('href', '/register');
    await expect(page.getByRole('link', { name: ru.hero.seeGames })).toHaveAttribute('href', '#worlds');
  }
});

test('P2: подпись острова открывает карточку игры, Esc закрывает', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  const pill = page.getByRole('button', { name: 'Лунная Долина', exact: true });
  await expect(pill).toBeVisible();
  // Острова кружатся, и подпись то и дело уезжает за край: открываем с клавиатуры — так же, как без мыши.
  await pill.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.wl-hero')).toHaveClass(/is-focused/);
  await expect(page.locator('.wl-panel').getByRole('heading', { name: /Хранители Лунной Долины/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.wl-hero')).not.toHaveClass(/is-focused/);
  await pill.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: ru.panel.close }).click();
  await expect(page.locator('.wl-hero')).not.toHaveClass(/is-focused/);
});

test('P3: смена языка — сразу и после перезагрузки', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'English' }).first().click();
  await expect(page.getByRole('heading', { name: title(en) })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: title(en) })).toBeVisible();
  await page.getByRole('button', { name: 'Русский' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('P4, P5: на телефоне нет горизонтальной прокрутки, подписи островов — значки с названием для диктора', async ({ page }) => {
  test.skip(!isPhone(page.viewportSize()!.width), 'только телефон');
  await fakeApi(page);
  await page.goto('/');
  const pill = page.getByRole('button', { name: 'Остров-конструктор', exact: true });
  await expect(pill).toBeVisible();
  await expect(pill.locator('.wl-pill-text')).toBeHidden();
  const overflow = await page.evaluate(() => {
    const el = (globalThis as unknown as { document: { documentElement: { scrollWidth: number; clientWidth: number } } }).document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

test('P6: без WebGL — плоская главная без 3D', async ({ page }) => {
  await noWebGL(page);
  await fakeApi(page);
  await page.goto('/');
  await expect(page.locator('.wl-hero')).toHaveClass(/is-flat/);
  await expect(page.getByRole('heading', { name: title(ru) })).toBeVisible();
  await expect(page.getByRole('link', { name: ru.common.start }).first()).toBeVisible();
});
