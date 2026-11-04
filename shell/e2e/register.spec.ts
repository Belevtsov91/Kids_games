import { expect as baseExpect, test, type Page } from '@playwright/test';
import { en as authEn } from '../src/auth/text/en';
import { ro as authRo } from '../src/auth/text/ro';
import { ru as text } from '../src/auth/text/ru';
import { uk as authUk } from '../src/auth/text/uk';
import { en as dictEn } from '../src/i18n/dict/en';
import { ro as dictRo } from '../src/i18n/dict/ro';
import { ru as dict } from '../src/i18n/dict/ru';
import { uk as dictUk } from '../src/i18n/dict/uk';
import { fakeApi, useLocale } from './fakeApi';

// Под нагрузкой (3D-сцены в параллельных прогонах) страницы отвечают медленнее: ждём до 15 с.
const expect = baseExpect.configure({ timeout: 15_000 });

// Регистрация: кейсы R1–R11 из qa/test-cases/register.md. API подменён (fakeApi).

test.slow(); // 3D-остров на страницах входа грузится долго, особенно в параллельных прогонах

const a = dict.auth;
const name = (page: Page) => page.getByLabel(a.name);
const email = (page: Page) => page.getByLabel(a.email);
const pass = (page: Page) => page.getByLabel(a.passwordHint);
const pass2 = (page: Page) => page.getByLabel(a.passwordAgain);
const agree = (page: Page) => page.getByRole('checkbox');
const create = (page: Page) => page.getByRole('button', { name: a.create });
const msg = (page: Page, id: string) => page.locator(`#${id}-msg`);

async function openRegister(page: Page) {
  await page.goto('/register');
  await expect(name(page)).toBeVisible({ timeout: 15_000 });
}

async function fillValid(page: Page, mail = 'mama@example.com') {
  await name(page).fill('Мама');
  await email(page).fill(mail);
  await pass(page).fill('Super-secret1');
  await pass2(page).fill('Super-secret1');
  await agree(page).check();
}

test('R5: нетронутая форма без ошибок', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  for (const field of [name, email, pass, pass2]) await expect(field(page)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.au-field.is-error')).toHaveCount(0);
});

test('R1: пустая отправка — пять ошибок, фокус на имени', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  await create(page).click();
  await expect(msg(page, 'reg-name')).toHaveText(text.name.short);
  await expect(msg(page, 'reg-email')).toHaveText(text.email.empty);
  await expect(msg(page, 'reg-pass')).toHaveText(text.newPass.empty);
  await expect(msg(page, 'reg-pass2')).toHaveText(text.pass2Empty);
  await expect(msg(page, 'reg-agree')).toHaveText(text.agreeNeeded);
  await expect(name(page)).toBeFocused();
});

test('R2: имя', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  const cases: [string, string][] = [['A', text.name.short], ['   ', text.name.short], ['Anna2', text.name.chars], ['Ана 😀', text.name.chars], ['Анна', ''], ["Mary-Jane O'Neil", '']];
  for (const [value, message] of cases) {
    await name(page).fill(value);
    await name(page).blur();
    await expect(msg(page, 'reg-name')).toHaveText(message);
  }
});

test('R3: правила пароля и шкала надёжности', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  await email(page).fill('annaqa@example.com');
  const cases: [string, string][] = [
    ['abcdefg', text.newPass.short],
    ['abcdefgh1', text.newPass.weak],
    ['xAnnaqa1!', text.newPass.likeEmail],
    ['Abcdefgh1', ''],
  ];
  for (const [value, message] of cases) {
    await pass(page).fill(value);
    await pass(page).blur();
    await expect(msg(page, 'reg-pass')).toHaveText(message);
  }
  await pass(page).fill('Abcdefgh1!');
  await expect(page.getByText(text.levels[4])).toBeVisible();
});

test('R4: пароли не совпадают', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  await pass(page).fill('Super-secret1');
  await pass2(page).fill('Super-secret2');
  await pass2(page).blur();
  await expect(msg(page, 'reg-pass2')).toHaveText(a.mismatch);
});

test('R6, R11: галочка согласия — квадратик в строку с текстом, ссылки открываются в новой вкладке', async ({ page }) => {
  await fakeApi(page);
  await openRegister(page);
  // Размеры по раскладке (offset*), а не boundingBox: карточка въезжает с анимацией масштаба.
  const layout = await page.locator('.au-check').evaluate((label) => {
    type El = { offsetWidth: number; offsetHeight: number; offsetTop: number };
    const q = label as unknown as { querySelector(s: string): El };
    const box = q.querySelector('input'), text = q.querySelector('span');
    return { w: box.offsetWidth, h: box.offsetHeight, rowGap: Math.abs(box.offsetTop - text.offsetTop) };
  });
  expect(layout).toEqual({ w: 22, h: 22, rowGap: expect.any(Number) });
  expect(layout.rowGap).toBeLessThan(12); // в одной строке, а не над текстом
  await agree(page).check();
  await expect(agree(page)).toBeChecked();
  for (const link of [page.getByRole('link', { name: text.agree[1] }), page.getByRole('link', { name: text.agree[3] })]) {
    await expect(link).toHaveAttribute('target', '_blank');
  }
});

test('R7: успешная регистрация — праздник и настройка за минуту', async ({ page }) => {
  const api = await fakeApi(page);
  await openRegister(page);
  await fillValid(page);
  await create(page).click();
  await expect(page.getByRole('heading', { name: text.registerWin('Мама') })).toBeVisible();
  await expect(page).toHaveURL('/setup', { timeout: 15_000 });
  expect(api.calls).toContain('POST /api/auth/register');
});

test('R8: почта занята — ошибка под полем почты', async ({ page }) => {
  await fakeApi(page, {
    'POST /api/auth/register': (route) => route.fulfill({ status: 409, json: { error: 'Не получилось зарегистрироваться с этой почтой' } }),
  });
  await openRegister(page);
  await fillValid(page, 'Mama@Example.com');
  await create(page).click();
  await expect(msg(page, 'reg-email')).toHaveText(a.emailTaken);
  await expect(email(page)).toBeFocused();
});

test('R10: сервер отклонил слишком простой пароль — форма не падает', async ({ page }) => {
  await fakeApi(page, {
    'POST /api/auth/register': (route) => route.fulfill({ status: 400, json: { error: 'Пароль слишком простой', code: 'weakPassword' } }),
  });
  await openRegister(page);
  await fillValid(page);
  await create(page).click();
  await expect(page.getByRole('alert')).toHaveText(a.checkFields);
  await expect(page).toHaveURL('/register');
});

const LOCALES = { ru: [text, dict], uk: [authUk, dictUk], ro: [authRo, dictRo], en: [authEn, dictEn] } as const;
for (const [locale, [t, d]] of Object.entries(LOCALES)) {
  test(`R9: форма регистрации — ${locale}, без горизонтальной прокрутки`, async ({ page }) => {
    await useLocale(page, locale as keyof typeof LOCALES);
    await fakeApi(page);
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: t.registerTitle.join('') })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: d.auth.create }).click();
    await expect(page.getByText(t.agreeNeeded)).toBeVisible();
    const overflow = await page.evaluate(() => {
      const el = (globalThis as unknown as { document: { documentElement: { scrollWidth: number; clientWidth: number } } }).document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
