import { describe, expect, it } from 'vitest';
import { levelsByGame, summarizeSkills, type SkillEvent } from '../src/modules/progress/skills';
import { answerToken, readAnswerToken } from '../src/modules/notify/answerToken';
import { ageFromBirth, birthdayMonth, childView, effectiveAge } from '../src/modules/children/childView';
import { reportDue } from '../src/modules/notify/weekly';

const ev = (name: string, ok: boolean, i: number, game = 'counting'): SkillEvent => ({
  game_id: game,
  kind: 'skill',
  name,
  ok,
  created_at: `2026-11-01T10:${String(i).padStart(2, '0')}:00Z`,
});

describe('навыки', () => {
  it('мало ответов — «только начал», 8 из 10 — «получается»', () => {
    expect(summarizeSkills([ev('count', true, 1), ev('count', true, 2)])[0]).toMatchObject({ level: 'new', total: 2, right: 2 });
    const many = Array.from({ length: 10 }, (_, i) => ev('colors', i < 8, i, i % 2 ? 'counting' : 'sleepy-bear'));
    expect(summarizeSkills(many)[0]).toMatchObject({ skill: 'colors', level: 'good', recent: 0.8, games: ['sleepy-bear', 'counting'] });
  });

  it('учится, если недавно ошибается; уровни считаются по играм', () => {
    const list = Array.from({ length: 10 }, (_, i) => ev('shapes', i % 2 === 0, i));
    expect(summarizeSkills(list)[0].level).toBe('learning');
    const levels: SkillEvent[] = [
      { game_id: 'puzzles', kind: 'level', name: '1', ok: null, created_at: '' },
      { game_id: 'puzzles', kind: 'level', name: '2', ok: null, created_at: '' },
    ];
    expect(levelsByGame(levels)).toEqual({ puzzles: 2 });
  });
});

describe('кнопки ответа в письме', () => {
  const secret = 'k'.repeat(64);
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e';

  it('токен подписан и хранит ответ', () => {
    expect(readAnswerToken(secret, answerToken(secret, id, true))).toEqual({ requestId: id, approve: true });
    expect(readAnswerToken(secret, answerToken(secret, id, false))).toEqual({ requestId: id, approve: false });
    expect(readAnswerToken('x'.repeat(64), answerToken(secret, id, true))).toBeNull();
    expect(readAnswerToken(secret, 'мусор.мусор')).toBeNull();
  });

  it('живёт сутки', () => {
    const token = answerToken(secret, id, true, 0);
    expect(readAnswerToken(secret, token, 23 * 3600_000)).not.toBeNull();
    expect(readAnswerToken(secret, token, 25 * 3600_000)).toBeNull();
  });
});

describe('возраст по месяцу рождения', () => {
  const now = new Date('2026-11-03T12:00:00Z');
  it('считает полные годы и держит в пределах 3–15', () => {
    expect(ageFromBirth('2022-11-01', now)).toBe(4);
    expect(ageFromBirth('2022-12-01', now)).toBe(3);
    expect(effectiveAge(7, '2025-01-01', now)).toBe(3);
    expect(effectiveAge(7, null, now)).toBe(7);
    expect(birthdayMonth('2022-11-01', now)).toBe(true);
    expect(birthdayMonth('2022-10-01', now)).toBe(false);
  });
});

describe('отчёт за неделю', () => {
  it('воскресенье с 18:00, один раз за день', () => {
    const sunday = { day: '2026-11-08', weekday: 0, minutes: 18 * 60 + 5 };
    expect(reportDue(sunday, null)).toBe(true);
    expect(reportDue(sunday, '2026-11-08')).toBe(false);
    expect(reportDue({ ...sunday, minutes: 17 * 60 }, null)).toBe(false);
    expect(reportDue({ ...sunday, weekday: 1 }, null)).toBe(false);
  });
});

describe('план дня', () => {
  const kid = { id: 'c1', name: 'Аня', age: 5, avatar: '🐰' };

  it('без настроек план пустой, с настройками — как сохранил взрослый', () => {
    expect(childView(kid, undefined).plan).toEqual([]);
    const extra = { child_id: 'c1', photo: null, lang: null, toddler: null, birth_month: null, music_volume: 80, effects_volume: 100, reduce_motion: false, big_buttons: false };
    expect(childView(kid, { ...extra, day_plan: null }).plan).toEqual([]);
    expect(childView(kid, { ...extra, day_plan: ['robot-chef', 'memory-train'] }).plan).toEqual(['robot-chef', 'memory-train']);
  });
});
