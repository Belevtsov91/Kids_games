// Насколько мишка проснулся: 0 — спит под одеялом, 1 — стоит возле кровати и машет.
// Пока сервер молчит, мишка встаёт всё медленнее и останавливается сидя на краю кровати (HOLD):
// встать до конца можно только когда сервер ответил.

/** Сидит на краю кровати и ждёт. */
export const HOLD = 0.84;
/** За сколько секунд мишка проходит примерно половину пути до HOLD. */
const PACE_S = 18;
/** Скорость после ответа сервера: до края кровати быстро, а встаёт и потягивается не спеша (~1,5 с). */
const CATCH_UP_RATE = 0.5;
const STAND_RATE = 0.11;

/** Куда стремится мишка, пока сервер ещё спит. */
export function sleepyTarget(elapsedS: number): number {
  return HOLD * (1 - Math.exp(-Math.max(0, elapsedS) / PACE_S));
}

/** Следующее значение подъёма за кадр dt. */
export function stepProgress(p: number, dt: number, elapsedS: number, awake: boolean): number {
  if (awake) return Math.min(1, Math.max(p, 0) + dt * (p < HOLD ? CATCH_UP_RATE : STAND_RATE));
  const target = sleepyTarget(elapsedS);
  return p + (target - p) * Math.min(1, dt * 2);
}

/** Доля отрезка [a, b], сглаженная: 0 до a, 1 после b. */
export function phase(p: number, a: number, b: number): number {
  const x = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** Какую подсказку показать: по прошедшим секундам. */
export function hintIndex(elapsedS: number, steps: readonly number[]): number {
  let i = 0;
  steps.forEach((s, k) => {
    if (elapsedS >= s) i = k;
  });
  return i;
}
