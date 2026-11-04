import type { Page } from '@playwright/test';

/** Сервер API в e2e не запускается: говорим, что он не спит, иначе поверх сайта будет мишка (WakeGate). */
export async function serverAwake(page: Page) {
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }));
}
