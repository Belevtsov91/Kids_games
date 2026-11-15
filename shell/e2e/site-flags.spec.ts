import { expect, test, type Page } from '@playwright/test';
import { serverAwake } from './server';

// Флаги из админки владельца: GET /api/site. Сервер не запущен — ответ подменяем.
async function signedIn(page: Page, site: Record<string, unknown>) {
  await serverAwake(page);
  await page.route('**/api/site', (route) => route.fulfill({ json: { maintenance: false, banner: {}, disabledGames: [], ...site } }));
  await page.route('/api/auth/me', (route) =>
    route.fulfill({ json: { parent: { id: 'p1', name: 'Мама' }, children: [{ id: 'c1', name: 'Аня', age: 8, avatar: '🐰' }], activeChildId: 'c1' } }),
  );
}

test('обслуживание: заглушка вместо сайта, документы открыты', async ({ page }) => {
  await signedIn(page, { maintenance: true });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Тёпа наводит порядок' })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Тёпа наводит порядок' })).toHaveCount(0);
});

test('объявление сверху, закрывается крестиком', async ({ page }) => {
  await signedIn(page, { banner: { ru: 'В субботу обновление', en: 'Update on Saturday' } });
  await page.goto('/dashboard');
  await expect(page.getByText('В субботу обновление')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть объявление' }).click();
  await expect(page.getByText('В субботу обновление')).toHaveCount(0);
});

test('выключенная игра пропадает из меню, по ссылке — «игра отдыхает»', async ({ page }) => {
  await signedIn(page, { disabledGames: ['counting'] });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
  await expect(page.locator('a[href="/play/counting"]')).toHaveCount(0);
  await expect(page.locator('a[href="/play/drawing"]')).toHaveCount(1);
  await page.goto('/play/counting');
  await expect(page.getByRole('heading', { name: 'Эта игра отдыхает' })).toBeVisible();
});
