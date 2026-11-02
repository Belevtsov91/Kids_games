import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        parent: { id: 'test-parent', name: 'Parent' },
        children: [{ id: 'counting-test', name: 'Child', age: 5, avatar: '🐰' }],
        activeChildId: 'counting-test',
      },
    }),
  );
  await page.goto('/play/counting');
  await expect(page.locator('.counting-game')).toBeVisible();
}

async function solve(page: Page, mode: number) {
  const board = page.locator('.cg-board');
  if (mode === 1) {
    const target = Number(await board.locator('.cg-target').textContent());
    for (let i = 0; i < target; i++) await board.locator('[data-action="food"][data-value="1"]').click();
    await board.locator('[data-action="check"]').click();
  } else {
    let answer = 0;
    if (mode === 0 || mode === 2) answer = await board.locator('.cg-object').count();
    if (mode === 3) {
      const values = await board.locator('.cg-sequence span').allTextContents();
      const gap = values.indexOf('?');
      answer = gap ? Number(values[gap - 1]) + 1 : Number(values[1]) - 1;
    }
    if (mode === 4) {
      const left = await board.locator('.cg-compare > div').nth(0).locator('.cg-object').count();
      const right = await board.locator('.cg-compare > div').nth(1).locator('.cg-object').count();
      answer = left === right ? 0 : left > right ? 1 : 2;
    }
    if (mode === 5) {
      const text = (await board.locator('.cg-equation').textContent()) ?? '';
      const [a, b] = (text.match(/\d+/g) ?? []).map(Number);
      answer = text.includes('−') ? a - b : a + b;
    }
    await board.locator(`[data-action="answer"][data-value="${answer}"]`).click();
  }
  await expect(board.locator('[data-action="next"]')).toBeVisible();
}

test('all languages, themes and modes are playable without overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await page.screenshot({ path: test.info().outputPath('home.png'), fullPage: true });
  for (const language of ['uk', 'ru', 'ro', 'en']) {
    await page.locator('select[name="language"]').selectOption(language);
    await page.locator('select[name="speech"]').selectOption(language);
    await expect(page.locator('.counting-game')).toHaveAttribute('lang', language);
    for (let mode = 0; mode < 6; mode++) {
      await page.locator(`[data-action="theme"][data-value="${mode % 3}"]`).click();
      await page.locator(`[data-action="start"][data-value="${mode}"]`).click();
      const overflow = await page.locator('.counting-game').evaluate((element) => element.scrollWidth > element.clientWidth + 1);
      expect(overflow).toBe(false);
      await solve(page, mode);
      if (language === 'uk' && mode === 1) await page.screenshot({ path: test.info().outputPath('feed.png'), fullPage: true });
      await page.locator('[data-action="home"]').click();
    }
  }
  expect(errors).toEqual([]);
});

test('five rounds, retry, saved medal, reload and exit', async ({ page }) => {
  await open(page);
  await page.locator('select[name="language"]').selectOption('en');
  await page.locator('[data-action="start"][data-value="2"]').click();
  const count = await page.locator('.cg-board .cg-object').count();
  const wrong = page.locator(`.cg-answer:not([data-value="${count}"])`).first();
  await wrong.click();
  await expect(page.locator('.cg-feedback')).toContainText('Try again');
  for (let i = 0; i < 5; i++) {
    await solve(page, 2);
    await page.locator('[data-action="next"]').click();
  }
  await expect(page.locator('.cg-result')).toContainText('4 / 5');
  await page.reload();
  await expect(page.locator('.counting-game')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-action="start"][data-value="2"] .cg-record')).toContainText('★★★★');
  await page.locator('[data-action="exit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.counting-game')).toHaveCount(0);
});
