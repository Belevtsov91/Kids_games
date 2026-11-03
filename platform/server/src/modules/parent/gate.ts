import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

// Задача «только для взрослых» перед кабинетом родителя.
// Ответ знает только сервер: клиент получает условие и подписанный токен, в котором ответа нет.
// Текст загадок живёт в оболочке на четырёх языках; сервер знает только номер и ответ.

const TTL_MS = 5 * 60 * 1000;

/** Ответы загадок по номеру. Тексты: shell/src/parent/text/riddles.ts — порядок тот же. */
export const RIDDLE_ANSWERS = [4, 4, 2, 3, 11, 12, 9] as const;

export type Challenge =
  | { kind: 'seq'; numbers: number[] }
  | { kind: 'mul'; a: number; b: number; c: number }
  | { kind: 'riddle'; index: number };

/** Ряд с растущим шагом (3, 6, 11, 18, 27 → 38), пример «a × b + c» или загадка с подвохом. */
export function makeChallenge(rnd: (min: number, max: number) => number = (min, max) => randomInt(min, max + 1)) {
  const kind = (['seq', 'mul', 'riddle'] as const)[rnd(0, 2)];
  if (kind === 'seq') {
    const numbers = [rnd(2, 6)];
    let step = rnd(1, 4);
    for (let i = 0; i < 5; i++) {
      numbers.push(numbers[i] + step);
      step += 2;
    }
    const answer = numbers.pop()!;
    return { challenge: { kind, numbers } as Challenge, answer };
  }
  if (kind === 'mul') {
    const a = rnd(13, 29), b = rnd(6, 9), c = rnd(11, 49);
    return { challenge: { kind, a, b, c } as Challenge, answer: a * b + c };
  }
  const index = rnd(0, RIDDLE_ANSWERS.length - 1);
  return { challenge: { kind, index } as Challenge, answer: RIDDLE_ANSWERS[index] };
}

const sign = (secret: string, payload: string, answer: number, parentId: string) =>
  createHmac('sha256', secret).update(`${payload}|${answer}|${parentId}`).digest('base64url');

/** Токен: срок и случайная соль открыто, подпись — от ответа и родителя. Чужому аккаунту не подойдёт. */
export function issueToken(secret: string, answer: number, parentId: string, now = Date.now()) {
  const payload = `${now + TTL_MS}.${randomBytes(9).toString('base64url')}`;
  return `${payload}.${sign(secret, payload, answer, parentId)}`;
}

export type CheckResult = 'ok' | 'wrong' | 'expired';

export function checkAnswer(secret: string, token: string, answer: number, parentId: string, now = Date.now()): CheckResult {
  const parts = token.split('.');
  if (parts.length !== 3) return 'wrong';
  const [exp, salt, sig] = parts;
  if (!(Number(exp) > now)) return 'expired';
  const expected = Buffer.from(sign(secret, `${exp}.${salt}`, answer, parentId));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? 'ok' : 'wrong';
}

/** PIN из 4 цифр, кроме самых простых: 1111, 1234, 4321. */
export function isWeakPin(pin: string) {
  if (/^(\d)\1{3}$/.test(pin)) return true;
  return '0123456789'.includes(pin) || '9876543210'.includes(pin);
}
