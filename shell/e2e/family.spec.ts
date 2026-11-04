import { expect, test } from '@playwright/test';
import { serverAwake } from './server';

test.beforeEach(({ page }) => serverAwake(page));

// Мишка, план дня и задание дома на дашборде. API нет: /api/auth/me подменяем.
test('план дня от взрослого: игры наверху и галочка после игры', async ({ page }) => {
  await page.route('/api/auth/me', (route) =>
    route.fulfill({
      json: {
        parent: { id: 'p1', name: 'Мама' },
        children: [{ id: 'c1', name: 'Аня', age: 6, avatar: '🐰', plan: ['memory-train', 'seasons-garden'] }],
        activeChildId: 'c1',
      },
    }),
  );
  await page.goto('/dashboard');
  await expect(page.getByTestId('mascot')).toContainText('Аня');
  const plan = page.getByTestId('day-plan');
  await expect(plan.getByRole('button')).toHaveCount(2);
  await expect(page.getByTestId('mascot')).toContainText('Игр в плане: 2');

  await plan.getByRole('button').first().click();
  await expect(page).toHaveURL('/play/memory-train');
  await page.goto('/dashboard');
  await expect(plan.locator('li.is-done')).toHaveCount(1);
  // После игры появляется задание дома по её навыку.
  const task = page.getByTestId('offline-task');
  await expect(task).toBeVisible();
  await task.getByRole('button').click();
  await expect(page.getByTestId('mascot')).toContainText('Мишка гордится');
});
