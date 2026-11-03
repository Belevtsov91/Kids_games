import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Список игр берём из папки games/, а не из кода: новая игра попадёт в проверку сама.
const gamesDir = fileURLToPath(new URL('../../games', import.meta.url));
const gameIds = readdirSync(gamesDir).filter((id) => existsSync(`${gamesDir}/${id}/manifest.ts`));
const minAge = (id: string) => Number(/min:\s*(\d+)/.exec(readFileSync(`${gamesDir}/${id}/manifest.ts`, 'utf8'))?.[1] ?? 3);

// Сервер API здесь не запускается: вход подменяем ответом /api/auth/me.
// Возраст ребёнка влияет на меню: игра видна, только если он в её диапазоне ages.
async function signedIn(page: Page, age = 15) {
  await page.route('/api/auth/me', (route) =>
    route.fulfill({
      json: {
        parent: { id: 'p1', name: 'Мама' },
        children: [{ id: 'c1', name: 'Аня', age, avatar: '🐰' }],
        activeChildId: 'c1',
      },
    }),
  );
}

test('каждая игра есть в меню для своего возраста', async ({ page }) => {
  for (const id of gameIds) {
    await page.unrouteAll();
    await signedIn(page, minAge(id));
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
    await expect(page.locator(`a[href="/play/${id}"]`)).toBeVisible();
  }
});

test('меню: сверху игры по возрасту, остальные ниже, но видны все', async ({ page }) => {
  await signedIn(page, 3);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
  for (const id of gameIds) {
    await expect(page.locator(`a[href="/play/${id}"]`)).toHaveCount(1);
    const section = minAge(id) <= 3 ? 'menu-fits' : 'menu-others';
    await expect(page.getByTestId(section).locator(`a[href="/play/${id}"]`)).toHaveCount(1);
  }
});

for (const id of gameIds) {
  test(`меню → ${id} → выход`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // API-сервер в e2e не запущен: сетевые ошибки запросов к нему — не ошибки игры.
    page.on('console', (msg) => msg.type() === 'error' && !msg.text().startsWith('Failed to load resource') && errors.push(msg.text()));

    await signedIn(page, minAge(id));
    await page.goto('/dashboard');
    await page.locator(`a[href="/play/${id}"]`).click();
    await expect(page).toHaveURL(`/play/${id}`);

    const container = page.getByTestId('game-container');
    await expect(container).toHaveAttribute('data-state', 'running', { timeout: 20_000 });
    // Игра что-то нарисовала: холст или свой DOM (у части игр интерфейс без canvas).
    await expect(container.locator(':scope > *').first()).toBeVisible();

    await page.getByRole('link', { name: 'В меню' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
    // После выхода игра должна убрать за собой холст.
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('неизвестная игра → понятное сообщение', async ({ page }) => {
  await signedIn(page);
  await page.goto('/play/nope');
  await expect(page.getByRole('heading', { name: 'Игра не найдена' })).toBeVisible();
});
