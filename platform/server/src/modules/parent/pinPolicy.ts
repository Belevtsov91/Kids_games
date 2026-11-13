import { db } from '../../db/index.js';
import { effectiveAge } from '../children/childView.js';
import { needsPassword } from '../children/profileRules.js';

// Задачу для взрослых ребёнок от 7 лет решит сам. Раньше PIN с этого возраста требовала только первая
// настройка: второй ребёнок постарше или выросший первый оставляли кабинет без защиты.
// Теперь, пока PIN не задан, кабинет в такой семье открывается задачей и паролем аккаунта.

/** Возрасты детей семьи на сегодня (по месяцу рождения, если он задан). */
export async function kidAges(parentId: string) {
  const { data: kids, error } = await db().from('ig_children').select('id, age').eq('parent_id', parentId).is('deleted_at', null);
  if (error) throw error;
  if (!kids?.length) return [];
  const { data: extra, error: eError } = await db().from('ig_child_settings').select('child_id, birth_month').in('child_id', kids.map((k) => k.id));
  if (eError) throw eError;
  const birth = new Map((extra ?? []).map((e) => [e.child_id, e.birth_month as string | null]));
  return kids.map((k) => effectiveAge(k.age, birth.get(k.id)));
}

/** Нужен ли пароль аккаунта вместо одной задачи: PIN нет, а в семье есть ребёнок от 7 лет. */
export async function passwordNeeded(parentId: string, hasPin: boolean) {
  return hasPin ? false : needsPassword(false, await kidAges(parentId));
}
