// Задание дня: одна игра на день, засчитывается после QUEST_SECONDS игры в неё.
// Серия — дни подряд с выполненным заданием. Пропуск ничего не отнимает: подарок Тёпе за каждые
// GIFT_EVERY выполненных дней, сколько бы пропусков между ними ни было.

export const QUEST_SECONDS = 180;
export const GIFT_EVERY = 7;
export const MAX_CANDIDATES = 40;

/** Устойчивый выбор: тот же ребёнок и день — та же игра. Вчерашнюю игру по возможности не повторяем. */
export function pickGame(candidates: string[], childId: string, day: string, yesterday?: string | null): string | null {
  const list = [...new Set(candidates)].sort();
  if (!list.length) return null;
  const pool = list.length > 1 && yesterday ? list.filter((g) => g !== yesterday) : list;
  let h = 2166136261;
  for (const ch of `${childId}:${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return pool[h % pool.length];
}

const prevDay = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Серия: дни подряд с выполненным заданием по сегодня (или по вчера, если сегодня ещё не сделано). */
export function streakOf(doneDays: string[], today: string): number {
  const set = new Set(doneDays);
  let day = set.has(today) ? today : prevDay(today);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = prevDay(day);
  }
  return n;
}

export function giftsOf(total: number) {
  return { gifts: Math.floor(total / GIFT_EVERY), toNext: GIFT_EVERY - (total % GIFT_EVERY) };
}
