import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/game/levels';
import { allDone, emptyProgress, isUnlocked, readProgress, recordWin, starsFor, totalStars } from '../src/game/progress';

describe('прогресс', () => {
  it('звёзды: долетел, кристаллы, попытки', () => {
    expect(starsFor(1, 1, 1)).toBe(3);
    expect(starsFor(0, 1, 2)).toBe(2);
    expect(starsFor(0, 2, 7)).toBe(1);
    expect(starsFor(0, 0, 9)).toBe(2);
  });

  it('уровни открываются по очереди, лучший результат сохраняется', () => {
    let p = emptyProgress();
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    p = recordWin(p, LEVELS[0].id, 3).progress;
    const r = recordWin(p, LEVELS[0].id, 1);
    expect(r.improved).toBe(false);
    expect(r.progress.stars[LEVELS[0].id]).toBe(3);
    expect(isUnlocked(r.progress, 1)).toBe(true);
    expect(totalStars(r.progress)).toBe(3);
  });

  it('испорченное сохранение не ломает игру', () => {
    expect(readProgress(null)).toEqual({ stars: {} });
    expect(readProgress({ stars: { 'first-launch': 9, detour: 2, nope: 3 } })).toEqual({ stars: { detour: 2 } });
  });

  it('все уровни пройдены', () => {
    const p = { stars: Object.fromEntries(LEVELS.map((l) => [l.id, 1])) };
    expect(allDone(p)).toBe(true);
    expect(allDone(emptyProgress())).toBe(false);
  });
});
