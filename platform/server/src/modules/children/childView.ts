// Профиль ребёнка для оболочки: базовые поля + то, что взрослый настроил в кабинете.

export const CHILD_EXTRA = 'child_id, photo, lang, toddler, birth_month, music_volume, effects_volume, reduce_motion, big_buttons';

export interface ChildExtra {
  child_id: string;
  photo: string | null;
  lang: string | null;
  toddler: boolean | null;
  birth_month: string | null;
  music_volume: number;
  effects_volume: number;
  reduce_motion: boolean;
  big_buttons: boolean;
}

/** Полных лет по месяцу рождения «YYYY-MM-01» на дату now. */
export function ageFromBirth(birthMonth: string, now = new Date()) {
  const [y, m] = birthMonth.split('-').map(Number);
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  return Math.floor(months / 12);
}

/** Возраст: по месяцу рождения, если он есть (растёт сам), иначе число из профиля. В пределах 3–15. */
export const effectiveAge = (age: number, birthMonth: string | null | undefined, now = new Date()) =>
  birthMonth ? Math.min(15, Math.max(3, ageFromBirth(birthMonth, now))) : age;

/** День рождения в этом месяце? Для торта и наклейки на дашборде. */
export const birthdayMonth = (birthMonth: string | null | undefined, now = new Date()) =>
  Boolean(birthMonth) && Number(birthMonth!.slice(5, 7)) === now.getUTCMonth() + 1;

export function childView(c: { id: string; name: string; age: number; avatar: string }, e: ChildExtra | undefined) {
  return {
    ...c,
    age: effectiveAge(c.age, e?.birth_month),
    photo: e?.photo ?? null,
    lang: e?.lang ?? null,
    toddler: e?.toddler ?? null,
    birthMonth: e?.birth_month?.slice(0, 7) ?? null,
    birthday: birthdayMonth(e?.birth_month),
    comfort: {
      musicVolume: e?.music_volume ?? 80,
      effectsVolume: e?.effects_volume ?? 100,
      reduceMotion: e?.reduce_motion ?? false,
      bigButtons: e?.big_buttons ?? false,
    },
  };
}
