// Возраст ребёнка для подстройки сложности. Без DOM.

/** Возраст из профиля SDK; null — неизвестен (нет профиля или взрослый не указал). */
export const ageOf = (profile: { age?: number | null } | null | undefined): number | null =>
  typeof profile?.age === 'number' && Number.isFinite(profile.age) && profile.age > 0 ? profile.age : null;

/**
 * Значение по возрасту: ступени [сЛет, значение] по возрастанию лет.
 * Берётся последняя ступень, до которой ребёнок дорос; младше первой или без возраста — fallback.
 *   byAge(6, [[3, 1], [5, 2], [7, 3]], 1) → 2
 */
export function byAge<T>(age: number | null | undefined, steps: readonly (readonly [number, T])[], fallback: T): T {
  if (typeof age !== 'number') return fallback;
  let value = fallback;
  for (const [from, v] of steps) if (age >= from) value = v;
  return value;
}
