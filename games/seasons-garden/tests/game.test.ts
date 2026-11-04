import { describe, expect, it } from 'vitest';
import { adapt } from '../src/game/adapt';
import { allSeen, emptyProgress, readProgress, recordAnswer, seeSeason } from '../src/game/progress';
import { animalState, fixWeather, nextSeason, sceneOf, SEASONS, weatherOk } from '../src/game/seasons';
import { answerOk, makeQuestion, MAX_LEVEL, THINGS } from '../src/game/things';

const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length]!;
};

describe('сад', () => {
  it('снег только зимой, зимой нет дождя', () => {
    expect(weatherOk('winter', 'snow')).toBe(true);
    expect(weatherOk('summer', 'snow')).toBe(false);
    expect(weatherOk('winter', 'rain')).toBe(false);
    expect(fixWeather('summer', 'snow')).toBe('sun');
    expect(fixWeather('winter', 'rain')).toBe('snow');
  });

  it('звери живут по сезону', () => {
    expect(animalState('bear', 'winter', 'snow')).toBe('asleep');
    expect(animalState('bird', 'winter', 'sun')).toBe('away');
    expect(animalState('squirrel', 'autumn', 'sun')).toBe('busy');
    const s = sceneOf('winter', 'rain');
    expect(s.weather).toBe('snow');
    expect(s.tree).toBe('bare');
    expect(s.extras).toContain('⛄');
  });

  it('сезоны идут по кругу', () => {
    expect(nextSeason('winter')).toBe('spring');
    expect(SEASONS.map(nextSeason)).toEqual(['summer', 'autumn', 'winter', 'spring']);
  });
});

describe('загадки', () => {
  it('на каждом уровне ровно один правильный ответ', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let k = 0; k < 40; k++) {
        const q = makeQuestion(level, seq(k / 40, (k * 7 % 40) / 40, 0.3, 0.8, 0.1));
        if (q.kind === 'fits' || q.kind === 'odd') {
          const right = q.options.filter((t) => answerOk(q, t.id));
          expect(right).toHaveLength(1);
          const fits = q.options.filter((t) => t.seasons.includes(q.season));
          expect(fits).toHaveLength(q.kind === 'fits' ? 1 : 3);
          expect(new Set(q.options.map((t) => t.id)).size).toBe(q.options.length);
        } else {
          expect(q.options).toContain(q.answer);
        }
      }
    }
  });

  it('у каждого предмета есть сезон', () => {
    expect(THINGS.every((t) => t.seasons.length > 0)).toBe(true);
  });
});

describe('прогресс', () => {
  it('открытые сезоны и отгаданные загадки', () => {
    let p = emptyProgress();
    for (const s of SEASONS) p = seeSeason(seeSeason(p, s), s);
    expect(allSeen(p)).toBe(true);
    p = recordAnswer(p, true, adapt(p.adapt, true, MAX_LEVEL));
    expect(p.solved).toBe(1);
    expect(readProgress(JSON.parse(JSON.stringify(p)))).toMatchObject({ seen: p.seen, solved: 1 });
    expect(readProgress({ adapt: { level: 99 }, seen: ['x', 'winter'], solved: -1 })).toEqual({ ...emptyProgress(), seen: ['winter'] });
  });
});
