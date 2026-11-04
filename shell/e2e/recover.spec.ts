import { expect as baseExpect, test, type Page } from '@playwright/test';
import { ru as text } from '../src/auth/text/ru';
import { ru as dict } from '../src/i18n/dict/ru';
import { fakeApi, RESET_TOKEN } from './fakeApi';

// Под нагрузкой (3D-сцены в параллельных прогонах) страницы отвечают медленнее: ждём до 15 с.
const expect = baseExpect.configure({ timeout: 15_000 });

// «Забыли пароль?» и страница из письма /reset: кейсы F1–F9 из qa/test-cases/forgot-reset.md.
// F7 (настоящее письмо через Brevo) — только вручную: e2e не шлёт писем.

test.slow(); // 3D-остров на страницах входа грузится долго, особенно в параллельных прогонах

const a = dict.auth;
const f = text.forgot;

async function openForgot(page: Page) {
  await page.goto('/forgot');
  await expect(page.getByLabel(a.email)).toBeVisible({ timeout: 15_000 });
}

test('F1: ссылка со входа переносит введённую почту', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/login');
  await page.getByLabel(a.email).fill('mama@example.com');
  await page.getByRole('link', { name: f.link }).click();
  await expect(page).toHaveURL('/forgot');
  await expect(page.getByLabel(a.email)).toHaveValue('mama@example.com');
});

test('F2: неверная почта — письмо не отправляем', async ({ page }) => {
  const api = await fakeApi(page);
  await openForgot(page);
  await page.getByLabel(a.email).fill('bad');
  await page.getByRole('button', { name: f.send }).click();
  await expect(page.locator('#forgot-email-msg')).toHaveText(text.email.noAt);
  expect(api.calls).not.toContain('POST /api/auth/forgot');
});

test('F3: письмо отправлено — один и тот же ответ, есть почта или нет', async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await fakeApi(page, {
    'POST /api/auth/forgot': (route, body) => {
      sent = body;
      return route.fulfill({ json: { ok: true } });
    },
  });
  await openForgot(page);
  await page.getByLabel(a.email).fill(' mama@example.com ');
  await page.getByRole('button', { name: f.send }).click();
  await expect(page.getByRole('heading', { name: f.sentTitle })).toBeVisible();
  await expect(page.getByText(f.sentText('mama@example.com'))).toBeVisible();
  expect(sent).toEqual({ email: 'mama@example.com', locale: 'ru' });
  await page.getByRole('button', { name: f.again }).click();
  await expect(page.getByLabel(a.email)).toBeVisible();
});

test('F4: слишком много писем подряд — понятное сообщение', async ({ page }) => {
  await fakeApi(page, {
    'POST /api/auth/forgot': (route) => route.fulfill({ status: 429, headers: { 'retry-after': '600' }, json: { error: 'Rate limit exceeded' } }),
  });
  await openForgot(page);
  await page.getByLabel(a.email).fill('mama@example.com');
  await page.getByRole('button', { name: f.send }).click();
  await expect(page.getByRole('alert')).toHaveText(a.tooMany);
});

test('F5: ссылка из письма устарела', async ({ page }) => {
  await fakeApi(page);
  await page.goto(`/reset#${'b'.repeat(43)}`);
  await expect(page.getByRole('heading', { name: f.goneTitle })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: f.newLink })).toHaveAttribute('href', '/forgot');
});

test('F6: /reset без ссылки — «Здесь нет ссылки», а не «устарела»', async ({ page }) => {
  await fakeApi(page);
  await page.goto('/reset');
  await expect(page.getByRole('heading', { name: f.noLinkTitle })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(f.noLinkText)).toBeVisible();
});

test('F8, F9: живая ссылка — простой пароль не принимаем, хороший сохраняем и входим', async ({ page }) => {
  const api = await fakeApi(page);
  await page.goto(`/reset#${RESET_TOKEN}`);
  const pass = page.getByLabel(a.passwordHint);
  await expect(pass).toBeVisible({ timeout: 15_000 });
  // токен убран из адресной строки, чтобы не остался в истории
  await expect(page).toHaveURL('/reset');

  await pass.fill('abcdefgh1');
  await page.getByLabel(a.passwordAgain).fill('abcdefgh1');
  await page.getByRole('button', { name: f.save }).click();
  await expect(page.getByText(text.newPass.weak)).toBeVisible();
  expect(api.calls).not.toContain('POST /api/auth/reset');

  await pass.fill('Better-pass1');
  await page.getByLabel(a.passwordAgain).fill('Better-pass1');
  await page.getByRole('button', { name: f.save }).click();
  await expect(page.getByRole('heading', { name: f.doneTitle })).toBeVisible();
  await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
});
