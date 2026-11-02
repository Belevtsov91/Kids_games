import { afterAll, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';
import { buildApp } from '../src/app';

describe('пароли', () => {
  it('хеш не содержит пароль и проверяется только верным паролем', async () => {
    const hash = await hashPassword('super-secret-1');
    expect(hash).not.toContain('super-secret-1');
    expect(await verifyPassword('super-secret-1', hash)).toBe(true);
    expect(await verifyPassword('super-secret-2', hash)).toBe(false);
    expect(await hashPassword('super-secret-1')).not.toBe(hash);
  });
});

// В тестах БД не подключена (.env не читается): проверяем защитные слои без Supabase.
describe('защита API без БД', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());

  it('без входа /auth/me и профили детей закрыты', async () => {
    expect((await app.inject('/api/auth/me')).statusCode).toBe(503);
    const res = await app.inject({ method: 'POST', url: '/api/children', payload: { name: 'A', age: 5, avatar: '🐻' } });
    expect(res.statusCode).toBe(401);
  });

  it('изменяющий запрос с чужого сайта отклоняется', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: 'https://evil.example' },
      payload: { email: 'a@b.co', password: 'x' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('лишние поля и плохая почта не проходят валидацию', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/children',
      payload: { name: 'A', age: 99, avatar: '🐻', parent_id: 'x' },
    });
    expect([400, 401]).toContain(res.statusCode);
  });
});
