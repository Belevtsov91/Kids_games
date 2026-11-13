import { expect, test } from '@playwright/test';
import { fakeApi, useLocale, type FakeMe } from './fakeApi';

// Логика профилей на странице «Кто играет?»: новый профиль и защищённый профиль — только со взрослым,
// после долгого перерыва сайт снова спрашивает, кто играет. Сервер подменный (fakeApi). Кейсы — qa/test-cases/profiles.md.

const TWO: FakeMe & { askWho?: boolean; children: (FakeMe['children'][number] & { locked?: boolean })[] } = {
  parent: { id: 'p1', name: 'Мама' },
  children: [
    { id: 'c1', name: 'Аня', age: 5, avatar: '🐰' },
    { id: 'c2', name: 'Петя', age: 11, avatar: '🦊', locked: true },
  ],
  activeChildId: 'c1',
};

const needAdult = (reason: string) => ({ status: 423, json: { error: 'Нужен взрослый', locked: true, reason } });
const gateStatus = { 'GET /api/parent/status': (route: import('@playwright/test').Route) => route.fulfill({ json: { unlocked: false, until: null, hasPin: true, needPassword: false } }) };

test.beforeEach(({ page }) => useLocale(page, 'ru'));

test('K1: новый профиль: сервер получает правила и выбор одним запросом, без взрослого — отказ', async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await fakeApi(
    page,
    {
      ...gateStatus,
      'POST /api/children': (route, body) => {
        sent = body;
        return route.fulfill(needAdult('create'));
      },
    },
    TWO,
  );
  await page.goto('/children');
  await page.locator('.child-card-add').click();
  await page.locator('input[name="name"]').fill('Маша');
  await page.locator('.child-form-actions button').last().click();

  await expect(page.locator('.adult-ask')).toContainText('только взрослый');
  expect(sent).toMatchObject({ name: 'Маша', age: 5, rules: true, activate: true });
  expect(sent).not.toHaveProperty('birthMonth');
});

test('K2: месяц рождения уходит вместо возраста, правила можно снять', async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await fakeApi(
    page,
    {
      ...gateStatus,
      'POST /api/children': (route, body) => {
        sent = body;
        return route.fulfill(needAdult('create'));
      },
    },
    TWO,
  );
  await page.goto('/children');
  await page.locator('.child-card-add').click();
  await page.locator('input[name="name"]').fill('Маша');
  const month = `${new Date().getFullYear() - 6}-03`;
  await page.locator('.child-birth input').fill(month);
  await page.locator('.child-rules input').uncheck();
  await page.locator('.child-form-actions button').last().click();

  await expect(page.locator('.adult-ask')).toBeVisible();
  expect(sent).toMatchObject({ name: 'Маша', birthMonth: month, rules: false, activate: true });
  expect(sent).not.toHaveProperty('age');
});

test('K3: защищённый профиль отмечен замком и без взрослого не открывается', async ({ page }) => {
  await fakeApi(page, { ...gateStatus, 'PUT /api/children/active': (route) => route.fulfill(needAdult('locked')) }, TWO);
  await page.goto('/children');
  const petya = page.locator('.child-card', { hasText: 'Петя' });
  await expect(petya.locator('.child-lock')).toBeVisible();
  await expect(page.locator('.child-card', { hasText: 'Аня' }).locator('.child-lock')).toHaveCount(0);
  await petya.click();
  await expect(page.locator('.adult-ask')).toContainText('защищён');
  await expect(page).toHaveURL(/\/children$/);
});

test('K4: после долгого перерыва сайт спрашивает, кто играет', async ({ page }) => {
  const state = await fakeApi(page, { 'PUT /api/children/active': (route) => route.fulfill({ status: 204, body: '' }) }, { ...TWO, askWho: true } as FakeMe);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/children$/);
  await page.locator('.child-card', { hasText: 'Аня' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.calls).toContain('PUT /api/children/active');
});
