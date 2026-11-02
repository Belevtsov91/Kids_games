import { describe, expect, it, vi } from 'vitest';
import type { GameSdk } from '@ig/sdk';
import { extendStroke, strokeLength, type Vec } from '../src/game/ink';
import { levels, PLANK_TURN } from '../src/game/levels';
import { isUnlocked, starsFor } from '../src/game/scoring';
import { Simulation } from '../src/game/simulation';
import { createProgress } from '../src/progress';

describe('лиана', () => {
  it('пропускает слишком близкие точки', () => {
    const points: Vec[] = [];
    extendStroke(points, { x: 0, y: 0 }, 100);
    extendStroke(points, { x: 5, y: 0 }, 100);
    extendStroke(points, { x: 20, y: 0 }, 100);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ]);
  });

  it('обрезается ровно по запасу', () => {
    const points: Vec[] = [{ x: 0, y: 0 }];
    expect(extendStroke(points, { x: 100, y: 0 }, 60)).toBe(false);
    expect(strokeLength(points)).toBeCloseTo(60);
    expect(extendStroke(points, { x: 120, y: 0 }, 60)).toBe(false);
    expect(points).toHaveLength(2);
  });
});

describe('симуляция', () => {
  const level = levels[0];
  const line = [
    { x: 100, y: 300 },
    { x: 300, y: 300 },
  ];

  it('лиана тратит запас, отмена его возвращает', () => {
    const sim = new Simulation(level);
    expect(sim.addLine(line)).not.toBeNull();
    expect(sim.inkLeft).toBeCloseTo(level.ink - 200);
    expect(sim.undo()).toBe(true);
    expect(sim.inkLeft).toBe(level.ink);
    expect(sim.undo()).toBe(false);
  });

  it('не даёт нарисовать больше запаса', () => {
    const sim = new Simulation({ ...level, ink: 150 });
    expect(sim.addLine(line)).toBeNull();
    expect(sim.lines).toHaveLength(0);
  });

  it('до полива капли не появляются, сброс убирает капли и оставляет лианы', () => {
    const sim = new Simulation(level);
    sim.addLine(line);
    for (let i = 0; i < 30; i++) sim.step();
    expect(sim.drops).toHaveLength(0);
    sim.startPour();
    for (let i = 0; i < 30; i++) sim.step();
    expect(sim.drops.length).toBeGreaterThan(0);
    sim.reset();
    expect(sim).toMatchObject({ phase: 'edit', collected: 0, emitted: 0, drops: [] });
    expect(sim.lines).toHaveLength(1);
  });

  it('доску можно найти касанием рядом, подвинуть и повернуть', () => {
    const plankLevel = levels.find((l) => l.planks?.length)!;
    const sim = new Simulation(plankLevel);
    const { x, y } = plankLevel.planks![0];
    const plank = sim.plankAt({ x: x + 20, y: y + 15 })!;
    expect(plank).not.toBeNull();
    expect(sim.plankAt({ x: x, y: y + 100 })).toBeNull();
    sim.movePlank(plank, 400, 300);
    expect(plank.body.position).toMatchObject({ x: 400, y: 300 });
    sim.movePlank(plank, -100, 2000);
    expect(plank.body.position.x).toBeGreaterThanOrEqual(0);
    expect(plank.body.position.y).toBeLessThanOrEqual(800);
    const before = plank.body.angle;
    sim.turnPlank(plank, PLANK_TURN);
    expect(plank.body.angle).toBeCloseTo(before + PLANK_TURN);
  });
});

describe('звёзды и уровни', () => {
  it('меньше лианы — больше звёзд', () => {
    expect(starsFor(100, 1000)).toBe(3);
    expect(starsFor(700, 1000)).toBe(2);
    expect(starsFor(990, 1000)).toBe(1);
  });

  it('следующий уровень открывается после прохождения предыдущего', () => {
    expect(isUnlocked(0, [])).toBe(true);
    expect(isUnlocked(1, [0])).toBe(false);
    expect(isUnlocked(1, [2])).toBe(true);
    expect(isUnlocked(2, [3, 0])).toBe(false);
  });
});

describe('прогресс', () => {
  const fakeApi = () => ({
    get: vi.fn(async () => ({ profileId: 'kid', levels: { sprout: 2 } })),
    post: vi.fn(async (_path: string, body: unknown) => {
      const { levelId, stars } = body as { levelId: string; stars: number };
      return { profileId: 'kid', levels: { sprout: 2, [levelId]: stars } };
    }),
    delete: vi.fn(async () => {}),
  });

  it('грузит и сохраняет звёзды через сервер игры', async () => {
    const api = fakeApi();
    const progress = createProgress({ api: api as unknown as GameSdk['api'], profile: { id: 'kid', name: 'Аня', avatar: '🦊' } });
    await progress.load();
    expect(api.get).toHaveBeenCalledWith('/progress');
    expect(progress.stars('sprout')).toBe(2);

    await progress.record('rock', 3);
    expect(api.post).toHaveBeenCalledWith('/progress', { levelId: 'rock', stars: 3 });
    expect(progress.stars('rock')).toBe(3);

    await progress.record('sprout', 1);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(progress.stars('sprout')).toBe(2);
  });

  it('без профиля ничего не отправляет, звёзды живут в памяти', async () => {
    const api = fakeApi();
    const progress = createProgress({ api: api as unknown as GameSdk['api'], profile: null });
    await progress.load();
    await progress.record('sprout', 3);
    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(progress.stars('sprout')).toBe(3);
  });

  it('ошибка сети не ломает игру', async () => {
    const api = fakeApi();
    api.post.mockRejectedValueOnce(new Error('offline'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const progress = createProgress({ api: api as unknown as GameSdk['api'], profile: { id: 'kid', name: 'Аня', avatar: '🦊' } });
    await progress.record('rock', 2);
    expect(progress.stars('rock')).toBe(2);
    warn.mockRestore();
  });
});
