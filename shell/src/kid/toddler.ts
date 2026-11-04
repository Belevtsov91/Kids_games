import type { Child } from '@/auth/AuthContext';

// «Режим малыша» для детей до 5 лет: без кнопок, которые выкидывают из сайта
// (выйти из аккаунта, сменить язык), а выход из игры — только удержанием.
// Взрослый может выключить режим в кабинете (настройка «Удобство»).

export const TODDLER_MAX_AGE = 4;

export const isToddler = (child: Pick<Child, 'age'> & { toddler?: boolean | null } | null | undefined) =>
  Boolean(child) && (child!.toddler ?? child!.age <= TODDLER_MAX_AGE);
