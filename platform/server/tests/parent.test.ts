import { afterAll, describe, expect, it } from 'vitest';
import { checkAnswer, isWeakPin, issueToken, makeChallenge, RIDDLE_ANSWERS } from '../src/modules/parent/gate';
import { beatSeconds, inQuiet, kidTime, lastDays, localNow, NO_RULES } from '../src/modules/kid/timeRules';
import { buildApp } from '../src/app';

const SECRET = 'a'.repeat(64);

describe('задача для взрослых', () => {
  it('токен подходит только к верному ответу и своему родителю', () => {
    const token = issueToken(SECRET, 42, 'parent-1');
    expect(checkAnswer(SECRET, token, 42, 'parent-1')).toBe('ok');
    expect(checkAnswer(SECRET, token, 41, 'parent-1')).toBe('wrong');
    expect(checkAnswer(SECRET, token, 42, 'parent-2')).toBe('wrong');
    expect(checkAnswer('b'.repeat(64), token, 42, 'parent-1')).toBe('wrong');
    expect(checkAnswer(SECRET, 'мусор', 42, 'parent-1')).toBe('wrong');
  });

  it('токен живёт 5 минут', () => {
    const token = issueToken(SECRET, 7, 'p', 0);
    expect(checkAnswer(SECRET, token, 7, 'p', 4 * 60_000)).toBe('ok');
    expect(checkAnswer(SECRET, token, 7, 'p', 6 * 60_000)).toBe('expired');
  });

  it('в токене нет ответа', () => {
    expect(issueToken(SECRET, 123456, 'p')).not.toContain('123456');
  });

  it('ряд с растущим шагом: 3, 6, 11, 18, 27 → 38', () => {
    const picks = [0, 3, 3];
    const { challenge, answer } = makeChallenge(() => picks.shift()!);
    expect(challenge).toEqual({ kind: 'seq', numbers: [3, 6, 11, 18, 27] });
    expect(answer).toBe(38);
  });

  it('пример и загадка дают свои ответы', () => {
    const mul = makeChallenge((min) => (min === 0 ? 1 : min));
    expect(mul).toEqual({ challenge: { kind: 'mul', a: 13, b: 6, c: 11 }, answer: 13 * 6 + 11 });
    const riddle = makeChallenge((_min, max) => (max === 2 ? 2 : 4));
    expect(riddle).toEqual({ challenge: { kind: 'riddle', index: 4 }, answer: RIDDLE_ANSWERS[4] });
  });

  it('простые PIN не подходят', () => {
    for (const pin of ['1111', '1234', '4321', '6789']) expect(isWeakPin(pin)).toBe(true);
    for (const pin of ['2580', '1379', '5050']) expect(isWeakPin(pin)).toBe(false);
  });
});

describe('время ребёнка', () => {
  const rules = { ...NO_RULES, limitWeekday: 45, limitWeekend: 90, quietFrom: '21:00', quietTo: '07:00' };
  const monday = { day: '2026-11-02', weekday: 1, minutes: 18 * 60 };

  it('без правил ограничений нет', () => {
    expect(kidTime(NO_RULES, 99_999, 0, monday)).toMatchObject({ limit: null, remaining: null, blocked: null });
  });

  it('лимит будней, выходных и прибавки', () => {
    expect(kidTime(rules, 30 * 60, 0, monday)).toMatchObject({ limit: 45, usedMinutes: 30, remaining: 15, blocked: null });
    expect(kidTime(rules, 45 * 60, 0, monday)).toMatchObject({ remaining: 0, blocked: 'limit' });
    expect(kidTime(rules, 45 * 60, 15, monday)).toMatchObject({ limit: 60, remaining: 15, blocked: null });
    expect(kidTime(rules, 60 * 60, 0, { ...monday, weekday: 6 })).toMatchObject({ limit: 90, remaining: 30 });
  });

  it('тихие часы через полночь важнее лимита', () => {
    expect(inQuiet(rules, 22 * 60)).toBe(true);
    expect(inQuiet(rules, 6 * 60 + 59)).toBe(true);
    expect(inQuiet(rules, 7 * 60)).toBe(false);
    expect(inQuiet({ quietFrom: '13:00', quietTo: '15:00' }, 14 * 60)).toBe(true);
    expect(kidTime(rules, 0, 0, { ...monday, minutes: 23 * 60 })).toMatchObject({ blocked: 'quiet', quietTo: '07:00' });
  });

  it('пульс засчитывает не больше минуты и ничего после долгой паузы', () => {
    const now = new Date('2026-11-03T10:00:00Z');
    expect(beatSeconds(null, now)).toBe(0);
    expect(beatSeconds(new Date(now.getTime() - 58_000), now)).toBe(58);
    expect(beatSeconds(new Date(now.getTime() - 120_000), now)).toBe(60);
    expect(beatSeconds(new Date(now.getTime() - 10 * 60_000), now)).toBe(0);
  });

  it('день и время считаются в часовом поясе семьи', () => {
    const now = new Date('2026-11-03T22:30:00Z');
    expect(localNow(now, 'Europe/Chisinau')).toEqual({ day: '2026-11-04', weekday: 3, minutes: 30 });
    expect(localNow(now, 'не пояс')).toMatchObject({ day: '2026-11-03', minutes: 22 * 60 + 30 });
    expect(lastDays('2026-11-03', 3)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
  });
});

describe('кабинет и страницы ребёнка без входа закрыты', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());

  it('кабинет без настроенной БД отвечает 503', async () => {
    expect((await app.inject('/api/parent/status')).statusCode).toBe(503);
    expect((await app.inject('/api/parent/overview')).statusCode).toBe(503);
  });

  it('страницы ребёнка без входа — 401', async () => {
    expect((await app.inject('/api/kid/status')).statusCode).toBe(401);
    const res = await app.inject({ method: 'POST', url: '/api/kid/beat', payload: { gameId: 'drawing' } });
    expect(res.statusCode).toBe(401);
  });

  it('с чужого сайта кабинет не открыть', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/parent/unlock',
      headers: { origin: 'https://evil.example' },
      payload: { token: 'x', answer: 1 },
    });
    expect(res.statusCode).toBe(403);
  });
});
