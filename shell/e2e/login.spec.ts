import { expect as baseExpect, test, type Page } from '@playwright/test';
import { en as authEn } from '../src/auth/text/en';
import { ro as authRo } from '../src/auth/text/ro';
import { ru as text } from '../src/auth/text/ru';
import { uk as authUk } from '../src/auth/text/uk';
import { en as dictEn } from '../src/i18n/dict/en';
import { ro as dictRo } from '../src/i18n/dict/ro';
import { ru as dict } from '../src/i18n/dict/ru';
import { uk as dictUk } from '../src/i18n/dict/uk';
import { FAMILY, fakeApi, PASSWORD, useLocale } from './fakeApi';

// Под нагрузкой (3D-сцены в параллельных прогонах) страницы отвечают медленнее: ждём до 15 с.
const expect = baseExpect.configure({ timeout: 15_000 });

// Вход: кейсы L1–L12 из qa/test-cases/login.md. API подменён (fakeApi), Supabase и лимиты сервера не трогаем.

test.slow(); // 3D-остров на страницах входа грузится долго, особенно в параллельных прогонах

const a = dict.auth;
const submit = (page: Page, name: string | RegExp = dict.common.login) => page.locator('form').getByRole('button', { name });

async function openLogin(page: Page) {
  await page.goto('/login');
  await expect(page.getByLabel(a.email)).toBeVisible({ timeout: 15_000 });
}

async function fill(page: Page, email: string, pass: string) {
  await page.getByLabel(a.email).fill(email);
  await page.getByLabel(a.password, { exact: true }).fill(pass);
}

test('L1: пустая форма — ошибки под полями и фокус на почте', async ({ page }) => {
  await fakeApi(page);
  await openLogin(page);
  await submit(page).click();
  await expect(page.getByText(text.email.empty)).toBeVisible();
  await expect(page.getByText(text.passEmpty)).toBeVisible();
  await expect(page.getByLabel(a.email)).toBeFocused();
  await expect(page.getByLabel(a.email)).toHaveAttribute('aria-invalid', 'true');
});

test('L2, L8: проверка адреса почты', async ({ page }) => {
  await fakeApi(page);
  await openLogin(page);
  const cases: [string, string][] = [
    ['abc', text.email.noAt],
    ['abc@', text.email.format],
    ['a@b.c', text.email.format],
    ['a b@c.com', text.email.format],
    ['юзер@почта.рф', text.email.latin], // L8: сервер принимает только латиницу
  ];
  for (const [value, message] of cases) {
    await page.getByLabel(a.email).fill(value);
    await page.getByLabel(a.email).blur();
    await expect(page.locator('#login-email-msg')).toHaveText(message);
  }
  await page.getByLabel(a.email).fill(' mama@example.com ');
  await page.getByLabel(a.email).blur();
  await expect(page.locator('#login-email-msg')).toHaveText('');
});

test('L3: опечатка в домене — подсказка исправляет адрес', async ({ page }) => {
  await fakeApi(page);
  await openLogin(page);
  await page.getByLabel(a.email).fill('mama@gmial.com');
  await page.getByRole('button', { name: 'mama@gmail.com' }).click();
  await expect(page.getByLabel(a.email)).toHaveValue('mama@gmail.com');
});

test('L4: короткий пароль', async ({ page }) => {
  await fakeApi(page);
  await openLogin(page);
  await fill(page, 'mama@example.com', 'short');
  await submit(page).click();
  await expect(page.getByText(text.passShort)).toBeVisible();
});

test('L5: три неверных пароля — счётчик, дверь замерзает на 15 с и оттаивает', async ({ page }) => {
  const api = await fakeApi(page);
  await openLogin(page);
  for (const left of [2, 1]) {
    await fill(page, 'mama@example.com', 'Wrong-pass1');
    await submit(page).click();
    await expect(page.getByRole('alert')).toHaveText(a.wrongLogin);
    await expect(page.getByText(text.triesLeft(left))).toBeVisible();
    await expect(page.getByLabel(a.password, { exact: true })).toHaveValue('');
  }
  await fill(page, 'mama@example.com', 'Wrong-pass1');
  await submit(page).click();
  await expect(submit(page, /Подождите \d+ с/)).toBeVisible();
  // пока дверь замёрзла, повторная отправка не уходит на сервер
  const before = api.calls.filter((c) => c === 'POST /api/auth/login').length;
  await submit(page, /Подождите/).click();
  expect(api.calls.filter((c) => c === 'POST /api/auth/login').length).toBe(before);
  // отсчёт идёт по секундным таймерам и под нагрузкой отстаёт от настоящих часов
  await expect(submit(page)).toBeVisible({ timeout: 45_000 });
});

test('L6: верный пароль — «дверь открыта» и переход в игры', async ({ page }) => {
  await fakeApi(page);
  await openLogin(page);
  await fill(page, ' MAMA@example.com ', PASSWORD);
  await submit(page).click();
  await expect(page.getByRole('heading', { name: text.loginWin })).toBeVisible();
  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
});

test('L7: вошедшего человека /login отправляет дальше', async ({ page }) => {
  await fakeApi(page, {}, structuredClone(FAMILY));
  await page.goto('/login');
  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
});

test('L9: сервер ответил 429 — ждём столько, сколько он сказал', async ({ page }) => {
  await fakeApi(page, {
    'POST /api/auth/login': (route) => route.fulfill({ status: 429, headers: { 'retry-after': '898' }, json: { error: 'Rate limit exceeded' } }),
  });
  await openLogin(page);
  await fill(page, 'mama@example.com', 'Wrong-pass1');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(a.tooMany);
  await expect(submit(page, text.wait(898))).toBeVisible();
  expect(text.wait(898)).toBe('Подождите 15 мин');
});

test('L10, L11: ошибка сервера и обрыв связи — разные сообщения', async ({ page }) => {
  let mode: 'error' | 'offline' = 'error';
  await fakeApi(page, {
    'POST /api/auth/login': (route) => (mode === 'error' ? route.fulfill({ status: 500, json: { error: 'boom' } }) : route.abort('connectionrefused')),
  });
  await openLogin(page);
  await fill(page, 'mama@example.com', 'Wrong-pass1');
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(a.serverError);
  mode = 'offline';
  await submit(page).click();
  await expect(page.getByRole('alert')).toHaveText(a.offline, { timeout: 15_000 });
});

const LOCALES = { ru: [text, dict], uk: [authUk, dictUk], ro: [authRo, dictRo], en: [authEn, dictEn] } as const;
for (const [locale, [t, d]] of Object.entries(LOCALES)) {
  test(`L12: форма входа — ${locale}, без горизонтальной прокрутки`, async ({ page }) => {
    await useLocale(page, locale as keyof typeof LOCALES);
    await fakeApi(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: t.loginTitle.join('') })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(d.auth.email)).toBeVisible();
    await expect(page.getByRole('link', { name: t.forgot.link })).toBeVisible();
    await submit(page, d.common.login).click();
    await expect(page.getByText(t.email.empty)).toBeVisible();
    const overflow = await page.evaluate(() => {
      const el = (globalThis as unknown as { document: { documentElement: { scrollWidth: number; clientWidth: number } } }).document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
