import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { giftsOf, pickGame, streakOf } from '../src/modules/kid/quest';

describe('задание дня', () => {
  it('выбор игры устойчив и не зависит от порядка', () => {
    const a = pickGame(['drawing', 'puzzles', 'counting'], 'kid-1', '2026-11-15');
    expect(pickGame(['counting', 'drawing', 'puzzles', 'drawing'], 'kid-1', '2026-11-15')).toBe(a);
    expect(['drawing', 'puzzles', 'counting']).toContain(a);
    expect(pickGame([], 'kid-1', '2026-11-15')).toBeNull();
  });

  it('вчерашнюю игру не повторяет, если есть другие', () => {
    for (let d = 1; d <= 20; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      expect(pickGame(['drawing', 'puzzles'], 'kid-2', day, 'drawing')).toBe('puzzles');
    }
    expect(pickGame(['drawing'], 'kid-2', '2026-11-15', 'drawing')).toBe('drawing');
  });

  it('серия считает дни подряд по сегодня или по вчера', () => {
    expect(streakOf(['2026-11-15', '2026-11-14', '2026-11-13', '2026-11-10'], '2026-11-15')).toBe(3);
    expect(streakOf(['2026-11-14', '2026-11-13'], '2026-11-15')).toBe(2);
    expect(streakOf(['2026-11-12'], '2026-11-15')).toBe(0);
    expect(streakOf(['2026-11-01', '2026-10-31'], '2026-11-01')).toBe(2);
  });

  it('подарки за каждые 7 дней, пропуски их не сгорают', () => {
    expect(giftsOf(0)).toEqual({ gifts: 0, toNext: 7 });
    expect(giftsOf(6)).toEqual({ gifts: 0, toNext: 1 });
    expect(giftsOf(7)).toEqual({ gifts: 1, toNext: 7 });
    expect(giftsOf(15)).toEqual({ gifts: 2, toNext: 6 });
  });
});

describe('задание дня без входа закрыто', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());
  it('401 без сессии', async () => {
    expect((await app.inject('/api/kid/quest?games=drawing')).statusCode).toBe(401);
  });
});
