import { describe, expect, it } from 'vitest';
import manifest from '../manifest';
import { dinnerRounds, nextScene, pajamaOf, pajamaRound, SCENES, stickersFor, toysRound } from '../src/game/logic';

// Простой воспроизводимый генератор: тесты не зависят от Math.random.
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('ужин', () => {
  it('в каждом раунде ровно одно блюдо нужного цвета и цели не повторяются', () => {
    for (let s = 1; s < 50; s++) {
      const rounds = dinnerRounds(seeded(s));
      expect(new Set(rounds.map((r) => r.target)).size).toBe(3);
      for (const r of rounds) {
        expect(r.options).toHaveLength(4);
        expect(r.options.filter((c) => c === r.target)).toHaveLength(1);
        expect(new Set(r.options).size).toBe(4);
      }
    }
  });
});

describe('пижама и игрушки', () => {
  it('три места и четыре фигурки, одна лишняя', () => {
    const { slots, tray } = pajamaRound(seeded(7));
    expect(slots).toHaveLength(3);
    expect(tray).toHaveLength(4);
    for (const s of slots) expect(tray).toContain(s);
  });

  it('больших и маленьких игрушек поровну', () => {
    const toys = toysRound(seeded(3));
    expect(toys.filter((t) => t.big)).toHaveLength(2);
    expect(new Set(toys.map((t) => t.toy)).size).toBe(4);
  });
});

describe('порядок вечера', () => {
  it('сцены идут по порядку и заканчиваются ночью', () => {
    const seen: string[] = [];
    let s = nextScene(null, false);
    while (s) {
      seen.push(s);
      s = nextScene(s, false);
    }
    expect(seen).toEqual(SCENES);
  });

  it('время кончается — сразу ночь', () => {
    expect(nextScene('bath', true)).toBe('night');
    expect(nextScene('night', true)).toBeNull();
  });
});

describe('наклейки', () => {
  const ids = new Set(manifest.stickers?.map((s) => s.id));

  it('первая ночь, чистые лапки, пижама', () => {
    expect(stickersFor(0, true)).toEqual(['pajama-stars', 'first-night', 'clean-paws']);
  });

  it('седьмая ночь даёт наклейку и все наклейки есть в манифесте', () => {
    expect(stickersFor(6, false)).toContain('seven-nights');
    for (let n = 0; n < 10; n++) for (const id of stickersFor(n, true)) expect(ids.has(id)).toBe(true);
  });

  it('пижамы идут по кругу', () => {
    expect(pajamaOf(0)).toBe(pajamaOf(5));
    expect(pajamaOf(1)).not.toBe(pajamaOf(0));
  });
});
