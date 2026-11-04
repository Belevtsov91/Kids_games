// Адаптивная сложность: три верных подряд — уровень выше, две ошибки подряд — ниже. Без DOM.

export interface Adapt {
  level: number;
  streak: number;
  misses: number;
}

export const startAdapt = (level = 1): Adapt => ({ level, streak: 0, misses: 0 });

export function adapt(a: Adapt, ok: boolean, maxLevel: number): Adapt {
  if (ok) {
    const streak = a.streak + 1;
    return streak >= 3 ? { level: Math.min(maxLevel, a.level + 1), streak: 0, misses: 0 } : { ...a, streak, misses: 0 };
  }
  const misses = a.misses + 1;
  return misses >= 2 ? { level: Math.max(1, a.level - 1), streak: 0, misses: 0 } : { ...a, streak: 0, misses };
}
