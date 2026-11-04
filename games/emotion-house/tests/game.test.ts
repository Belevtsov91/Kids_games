import { describe, expect, it } from 'vitest';
import { EMOTIONS, HELPERS, STARTER } from '../src/game/emotions';
import { emptyProgress, litRooms, openEmotions, readProgress, recordCorrect, recordFeeling, showFaces, UNLOCK_ALL_AT } from '../src/game/progress';
import { emotionChoices, nextScenario } from '../src/game/rounds';
import { SCENARIOS } from '../src/game/scenarios';

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('данные', () => {
  it('на каждую эмоцию три ситуации и три помощника', () => {
    for (const e of EMOTIONS) {
      expect(SCENARIOS.filter((s) => s.emotion === e)).toHaveLength(3);
      expect(HELPERS[e]).toHaveLength(3);
    }
  });
});

describe('раунды', () => {
  it('берёт наименее отработанную эмоцию и не повторяет прошлую ситуацию', () => {
    const p = { ...emptyProgress(), rooms: { joy: 2, sad: 1, anger: 0 } };
    expect(nextScenario(STARTER, p, null, seq(0)).emotion).toBe('anger');
    expect(nextScenario(STARTER, p, 'tower', seq(0)).id).not.toBe('tower');
  });
  it('варианты: верный и два разных', () => {
    const c = emotionChoices('sad', EMOTIONS, seq(0.3, 0.7, 0.1));
    expect(c).toContain('sad');
    expect(new Set(c).size).toBe(3);
  });
});

describe('прогресс', () => {
  it('открывает эмоции и убирает лица по мере игры', () => {
    let p = emptyProgress();
    expect(openEmotions(p)).toEqual(STARTER);
    for (let i = 0; i < UNLOCK_ALL_AT; i++) p = recordCorrect(p, 'joy');
    expect(openEmotions(p)).toEqual(EMOTIONS);
    expect(p.rooms.joy).toBe(3);
    expect(litRooms(p)).toBe(1);
    expect(showFaces(p)).toBe(true);
  });
  it('дневник: одна отметка в день', () => {
    let p = recordFeeling(emptyProgress(), '2026-11-03', 'sad');
    p = recordFeeling(p, '2026-11-03', 'joy');
    expect(p.diary).toEqual([{ day: '2026-11-03', emotion: 'joy' }]);
  });
  it('битое сохранение', () => {
    expect(readProgress({ rooms: { joy: 9, x: 1 }, correct: -3, diary: [{ day: 'd', emotion: 'nope' }] })).toEqual({ rooms: { joy: 3 }, correct: 0, diary: [] });
  });
});
