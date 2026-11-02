import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import server from '../server';

describe('API прогресса садовника', () => {
  const app = Fastify();
  app.register(server);
  afterAll(() => app.close());

  const record = (payload: object) => app.inject({ method: 'POST', url: '/progress', payload });

  it('у нового профиля прогресса нет', async () => {
    const res = await app.inject({ url: '/progress?profileId=new-kid' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ profileId: 'new-kid', levels: {} });
  });

  it('хранит лучший результат и не путает профили', async () => {
    await record({ profileId: 'kid-1', levelId: 'sprout', stars: 2 });
    await record({ profileId: 'kid-1', levelId: 'sprout', stars: 1 });
    const best = await record({ profileId: 'kid-1', levelId: 'rock', stars: 3 });
    expect(best.json()).toEqual({ profileId: 'kid-1', levels: { sprout: 2, rock: 3 } });

    await record({ profileId: 'kid-1', levelId: 'sprout', stars: 3 });
    expect((await app.inject({ url: '/progress?profileId=kid-1' })).json().levels.sprout).toBe(3);
    expect((await app.inject({ url: '/progress?profileId=kid-2' })).json().levels).toEqual({});
  });

  it('отклоняет неверные данные', async () => {
    expect((await record({ profileId: 'kid-1', levelId: 'sprout', stars: 5 })).statusCode).toBe(400);
    expect((await record({ profileId: 'kid-1', levelId: 'Bad Id!', stars: 1 })).statusCode).toBe(400);
    expect((await record({ profileId: '', levelId: 'sprout', stars: 1 })).statusCode).toBe(400);
    expect((await app.inject({ url: '/progress' })).statusCode).toBe(400);
  });
});
