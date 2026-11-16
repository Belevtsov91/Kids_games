import { expect, test, type Page } from '@playwright/test';
import { serverAwake } from './server';

// Фильтр меню по предметам и значок «Новое». Дата зафиксирована: «новые» игры — 30 дней после addedAt.
async function signedIn(page: Page, child: Record<string, unknown>) {
  await page.clock.setFixedTime(new Date('2026-11-20T12:00:00Z'));
  await serverAwake(page);
  await page.route('/api/auth/me', (route) =>
    route.fulfill({ json: { parent: { id: 'p1', name: 'Мама' }, children: [{ id: 'c1', name: 'Аня', avatar: '🐰', ...child }], activeChildId: 'c1' } }),
  );
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
}

test('предмет «Буквы» оставляет игры про буквы на обеих полках', async ({ page }) => {
  await signedIn(page, { age: 10 });
  await page.getByRole('group', { name: 'Какие игры показать' }).getByRole('button', { name: /Буквы/ }).click();
  await expect(page.getByTestId('menu-fits').locator('a[href="/play/cipher"]')).toHaveCount(1);
  await expect(page.locator('a[href="/play/letter-eater"]')).toHaveCount(1);
  await expect(page.locator('a[href="/play/pizza"]')).toHaveCount(0);
});

test('«Новые» показывает новые игры со значком', async ({ page }) => {
  await signedIn(page, { age: 10 });
  await page.getByRole('button', { name: /Новые/ }).click();
  const lab = page.locator('a[href="/play/lab"]');
  await expect(lab).toHaveCount(1);
  await expect(lab.getByText('Новое')).toBeVisible();
  await expect(page.locator('a[href="/play/counting"]')).toHaveCount(0);
});

test('возраст по месяцу рождения: игры для 9+ наверху у ребёнка, которому уже 9', async ({ page }) => {
  // В профиле age 8, но месяц рождения говорит, что ребёнку уже 9.
  await signedIn(page, { age: 8, birthMonth: '2017-10' });
  await expect(page.getByTestId('menu-fits').locator('a[href="/play/cipher"]')).toHaveCount(1);
});
