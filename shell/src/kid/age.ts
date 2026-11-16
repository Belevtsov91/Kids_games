import type { Child } from '@/auth/AuthContext';

// Возраст ребёнка на сегодня. Сервер уже присылает age с учётом месяца рождения (childView.effectiveAge),
// но вкладка с дашбордом может провисеть открытой через день рождения: считаем ещё раз тем же правилом.

const MIN_AGE = 3;
const MAX_AGE = 15;

/** Полных лет по месяцу рождения «YYYY-MM» (или «YYYY-MM-DD») на дату now, в пределах 3–15; без месяца — age профиля. */
export function kidAge(child: Pick<Child, 'age' | 'birthMonth'>, now = new Date()) {
  const match = child.birthMonth ? /^(\d{4})-(\d{2})/.exec(child.birthMonth) : null;
  if (!match) return child.age;
  const months = (now.getUTCFullYear() - Number(match[1])) * 12 + (now.getUTCMonth() + 1 - Number(match[2]));
  return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.floor(months / 12)));
}
