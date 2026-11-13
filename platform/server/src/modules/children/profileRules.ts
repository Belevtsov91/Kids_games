// Правила профилей детей. Чистые функции без БД: их проверяют тесты, ими пользуются маршруты.

/** С этого возраста ребёнок сам решит задачу для взрослых: кабинету нужен PIN или пароль. */
export const PIN_REQUIRED_AGE = 7;

/** Через сколько часов без игры оболочка снова спрашивает «кто играет?». */
export const ASK_WHO_HOURS = 4;

/** Сколько дней удалённый профиль лежит в корзине. */
export const TRASH_DAYS = 30;

export interface DefaultRules {
  limit_weekday: number;
  limit_weekend: number;
  quiet_from: string;
  quiet_to: string;
  break_every: number;
}

/**
 * Правила нового профиля по возрасту. Раньше профиль создавался вообще без лимита и тихих часов,
 * и большинство семей так его и оставляло. Взрослый меняет их в кабинете, раздел «Время».
 */
export function defaultRules(age: number): DefaultRules {
  if (age <= 5) return { limit_weekday: 40, limit_weekend: 60, quiet_from: '20:00', quiet_to: '07:00', break_every: 20 };
  if (age <= 8) return { limit_weekday: 60, limit_weekend: 90, quiet_from: '21:00', quiet_to: '07:00', break_every: 30 };
  if (age <= 12) return { limit_weekday: 90, limit_weekend: 120, quiet_from: '21:30', quiet_to: '07:00', break_every: 30 };
  return { limit_weekday: 120, limit_weekend: 180, quiet_from: '22:00', quiet_to: '07:00', break_every: 45 };
}

/** Почему для смены профиля нужен взрослый. */
export type SwitchReason = 'quiet' | 'limit' | 'rules' | 'exit' | 'locked' | 'create';

export interface SwitchInput {
  /** Профиль, из которого уходят; null — профиль ещё не выбран. */
  leaving: { blocked: 'quiet' | 'limit' | null; hasRules: boolean; exitLock: boolean } | null;
  /** Куда идут: в существующий профиль или создают новый. */
  target: { locked: boolean } | 'new';
  /** Сколько профилей уже есть в семье (без корзины). */
  childCount: number;
}

/**
 * Нужен ли взрослый. Уйти из профиля с правилами времени или с замком на выход нельзя: иначе ребёнок
 * за минуту до конца лимита уходит к брату. Войти в защищённый профиль нельзя: иначе младший играет
 * без лимита под именем старшего. Новый профиль — только со взрослым, кроме самого первого.
 */
export function switchReason({ leaving, target, childCount }: SwitchInput): SwitchReason | null {
  if (leaving?.blocked) return leaving.blocked;
  if (leaving?.hasRules) return 'rules';
  if (leaving?.exitLock) return 'exit';
  if (target === 'new') return childCount > 0 ? 'create' : null;
  return target.locked ? 'locked' : null;
}

/**
 * Пора ли снова спросить «кто играет?». Сессия живёт неделю, и планшет остаётся на последнем ребёнке:
 * время брата записывается сестре. Спрашиваем, если детей несколько, а в выбранном профиле давно не играли.
 * С замком на выход устройство считается личным — не спрашиваем.
 */
export function shouldAskWho(o: { childCount: number; exitLock: boolean; seenAt: (string | null | undefined)[]; now?: Date }) {
  if (o.childCount < 2 || o.exitLock) return false;
  const last = Math.max(0, ...o.seenAt.map((s) => (s ? new Date(s).getTime() : 0)));
  return (o.now ?? new Date()).getTime() - last > ASK_WHO_HOURS * 3_600_000;
}

/** Кабинет без PIN при ребёнке от 7 лет: вместо одной задачи нужен пароль аккаунта. */
export const needsPassword = (hasPin: boolean, ages: number[]) => !hasPin && ages.some((a) => a >= PIN_REQUIRED_AGE);

export type InactiveStep = 'none' | 'warn' | 'delete';
/** Аккаунт, в который не входили столько дней, удаляется. За WARN_DAYS до этого — письмо. */
export const INACTIVE_DAYS = 730;
export const WARN_DAYS = 30;

/** Что делать с давно не входившим аккаунтом. Без письма-предупреждения ничего не удаляем. */
export function inactiveStep(lastSeenAt: string, warnedAt: string | null, now = new Date()): InactiveStep {
  const day = 86_400_000;
  const idle = now.getTime() - new Date(lastSeenAt).getTime();
  if (idle < (INACTIVE_DAYS - WARN_DAYS) * day) return 'none';
  if (!warnedAt || new Date(warnedAt).getTime() < new Date(lastSeenAt).getTime()) return 'warn';
  return now.getTime() - new Date(warnedAt).getTime() >= WARN_DAYS * day && idle >= INACTIVE_DAYS * day ? 'delete' : 'none';
}
