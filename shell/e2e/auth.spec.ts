import { expect, test, type Page } from '@playwright/test';
import { serverAwake } from './server';

test.beforeEach(({ page }) => serverAwake(page));

// Приветствие → регистрация → профиль ребёнка → дашборд → выход.
// API подменяем: проверяем оболочку, а не Supabase. Сервер держит состояние, браузер — ничего.

interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

function fakeServer(page: Page) {
  let me: { parent: { id: string; name: string }; children: Child[]; activeChildId: string | null } | null = null;
  const calls: string[] = [];

  return {
    calls,
    async install() {
      await page.route('/api/**', async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        calls.push(`${req.method()} ${path}`);
        const body = req.postDataJSON() as Record<string, unknown> | null;

        if (path === '/api/health') return route.fulfill({ json: { status: 'ok' } });
        if (path === '/api/auth/me') return me ? route.fulfill({ json: me }) : route.fulfill({ status: 401, json: { error: 'Нужно войти' } });
        if (path === '/api/auth/register') {
          me = { parent: { id: 'p1', name: String(body?.name) }, children: [], activeChildId: null };
          return route.fulfill({ status: 201, json: { ok: true } });
        }
        if (path === '/api/auth/login') {
          if (body?.password !== 'correct-horse') return route.fulfill({ status: 401, json: { error: 'Неверная почта или пароль' } });
          me = { parent: { id: 'p1', name: 'Мама' }, children: [{ id: 'c1', name: 'Аня', age: 6, avatar: '🐰' }], activeChildId: 'c1' };
          return route.fulfill({ json: { ok: true } });
        }
        if (path === '/api/auth/logout') {
          me = null;
          return route.fulfill({ status: 204 });
        }
        if (path === '/api/children' && me) {
          const child = { id: `c${me.children.length + 1}`, ...(body as Omit<Child, 'id'>) };
          me.children.push(child);
          return route.fulfill({ status: 201, json: child });
        }
        if (path === '/api/children/active' && me) {
          me.activeChildId = String(body?.childId);
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ status: 404, json: { error: 'not found' } });
      });
    },
  };
}

async function browserStorage(page: Page) {
  return page.evaluate(async () => {
    // e2e компилируется без DOM-типов: indexedDB описываем сами.
    const idb = (globalThis as unknown as { indexedDB: { databases(): Promise<{ name?: string }[]> } }).indexedDB;
    return {
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      idb: (await idb.databases()).map((d) => d.name),
    };
  });
}

test('приветствие → регистрация → ребёнок → дашборд → выход', async ({ page }) => {
  test.slow(); // 3D-остров на страницах входа грузится долго, особенно в параллельных прогонах
  const server = fakeServer(page);
  await server.install();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Привет! Выбирай свой мир и играй!' })).toBeVisible();
  await page.getByRole('link', { name: 'Регистрация' }).click();

  await page.getByLabel('Ваше имя').fill('Мама');
  await page.getByLabel('Почта').fill('mama@example.com');
  await page.getByLabel('Пароль (от 8 символов)').fill('super-secret-1');
  await page.getByLabel('Пароль ещё раз').fill('super-secret-1');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  // Новый аккаунт: настройка за минуту — ребёнок, время, PIN (до 7 лет PIN можно позже).
  await expect(page).toHaveURL('/setup', { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: 'Кто будет играть?' })).toBeVisible();
  await page.getByLabel('Имя ребёнка').fill('Петя');
  // С 7 лет PIN обязателен; младшему ребёнку его можно отложить.
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: '🦊' }).click();
  await page.getByRole('button', { name: 'Дальше →' }).click();
  await expect(page.getByRole('heading', { name: 'Сколько можно играть в день?' })).toBeVisible();
  await page.getByRole('button', { name: 'Дальше →' }).click();
  await page.getByRole('button', { name: 'Позже' }).click();

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Во что поиграем?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Петя/ })).toBeVisible();

  // Ни пароля, ни профиля в хранилищах браузера.
  expect(await browserStorage(page)).toEqual({ local: [], session: [], idb: [] });

  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL('/login');
  expect(server.calls).toContain('POST /api/auth/logout');
});

test('вход: неверный пароль показывает ошибку, верный ведёт в дашборд', async ({ page }) => {
  test.slow(); // 3D-остров на страницах входа грузится долго, особенно в параллельных прогонах
  await fakeServer(page).install();
  await page.goto('/login');
  await page.getByLabel('Почта').fill('mama@example.com');
  await page.getByLabel('Пароль').fill('wrong-password');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByRole('alert')).toHaveText('Неверная почта или пароль.');

  await page.getByLabel('Пароль').fill('correct-horse');
  await page.getByRole('button', { name: 'Войти' }).click();
  // После входа форма пару секунд показывает «дверь открыта», потом переход.
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });
});

test('закрытые страницы без входа ведут на вход', async ({ page }) => {
  await fakeServer(page).install();
  for (const path of ['/dashboard', '/children', '/play/drawing']) {
    await page.goto(path);
    await expect(page).toHaveURL('/login');
  }
});
