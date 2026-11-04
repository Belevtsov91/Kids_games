import type { Page, Route } from '@playwright/test';

// Подменный API для e2e страниц загрузки, входа, регистрации и восстановления пароля.
// Сервер и Supabase не нужны: каждый тест сам решает, что ответит «сервер». Кейсы — qa/test-cases/.

export type Handler = (route: Route, body: Record<string, unknown> | null) => Promise<void> | void;

export interface FakeChild {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

export interface FakeMe {
  parent: { id: string; name: string };
  children: FakeChild[];
  activeChildId: string | null;
}

export const PASSWORD = 'Correct-horse1';
export const RESET_TOKEN = 'a'.repeat(43);

/** Взрослый с ребёнком 8 лет: так открываются страницы ребёнка и игры. */
export const FAMILY: FakeMe = {
  parent: { id: 'p1', name: 'Мама' },
  children: [{ id: 'c1', name: 'Аня', age: 8, avatar: '🐰' }],
  activeChildId: 'c1',
};

/**
 * Ставит подменный API. overrides — свои ответы по «METHOD /path» (путь без query), они важнее стандартных.
 * Стандартно: сервер не спит, гость не вошёл, вход по PASSWORD, регистрация и письмо проходят.
 */
export async function fakeApi(page: Page, overrides: Record<string, Handler> = {}, start: FakeMe | null = null) {
  const state = { me: start, calls: [] as string[] };
  // Только запросы к API: шаблон '**/api/**' зацепил бы и модули Vite вроде /src/api/client.ts.
  await page.route('/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const key = `${req.method()} ${path}`;
    state.calls.push(key);
    const body = (req.postDataJSON() as Record<string, unknown> | null) ?? null;
    if (overrides[key]) return overrides[key](route, body);

    if (key === 'GET /api/health') return route.fulfill({ json: { status: 'ok' } });
    if (key === 'GET /api/auth/me') return state.me ? route.fulfill({ json: state.me }) : route.fulfill({ status: 401, json: { error: 'Нужно войти' } });
    if (key === 'POST /api/auth/login') {
      if (body?.password !== PASSWORD) return route.fulfill({ status: 401, json: { error: 'Неверная почта или пароль' } });
      state.me = FAMILY;
      return route.fulfill({ json: { ok: true } });
    }
    if (key === 'POST /api/auth/register') {
      state.me = { parent: { id: 'p1', name: String(body?.name) }, children: [], activeChildId: null };
      return route.fulfill({ status: 201, json: { ok: true } });
    }
    if (key === 'POST /api/auth/forgot') return route.fulfill({ json: { ok: true } });
    if (key === 'POST /api/auth/reset/check') return body?.token === RESET_TOKEN ? route.fulfill({ json: { ok: true } }) : route.fulfill({ status: 410, json: { error: 'gone' } });
    if (key === 'POST /api/auth/reset') {
      state.me = FAMILY;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ status: 404, json: { error: 'not found' } });
  });
  return state;
}

/** Ответ с задержкой: так выглядит спящий сервер. */
export const slow = (ms: number, json: unknown = { status: 'ok' }): Handler => async (route) => {
  await new Promise((r) => setTimeout(r, ms));
  await route.fulfill({ json }).catch(() => undefined);
};

/** Нет WebGL: старый планшет или выключенное ускорение. */
export async function noWebGL(page: Page) {
  await page.addInitScript(() => {
    // e2e компилируется без DOM-типов: canvas описываем сами.
    type GetContext = (this: unknown, type: string, ...args: unknown[]) => unknown;
    const proto = (globalThis as unknown as { HTMLCanvasElement: { prototype: { getContext: GetContext } } }).HTMLCanvasElement.prototype;
    const original = proto.getContext;
    proto.getContext = function (type, ...args) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...args);
    };
  });
}

/** Язык сайта до загрузки страницы (хранится в localStorage, как выбрал бы человек). */
export async function useLocale(page: Page, locale: 'ru' | 'uk' | 'ro' | 'en') {
  await page.addInitScript((l) => (globalThis as unknown as { localStorage: { setItem(k: string, v: string): void } }).localStorage.setItem('ig:lang', l), locale);
}
