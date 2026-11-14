// Правила «задача жива» без БД — их проверяют тесты.

export interface JobRun {
  job: string;
  ok: boolean;
  note: string | null;
  manual: boolean;
  started_at: string;
}

/** Как давно задача обязана была отработать: позже этого считаем, что она не запускается. */
export const JOB_MAX_AGE_HOURS: Record<string, number> = { 'weekly-report': 3, cleanup: 36, digest: 36 };

const ago = (ms: number) => {
  const hours = Math.round(ms / 3_600_000);
  return hours < 1 ? 'меньше часа назад' : hours < 48 ? `${hours} ч назад` : `${Math.round(hours / 24)} дн назад`;
};

/** По каждой известной задаче: последний запуск и вердикт. Задача без единого запуска — «не запускалась». */
export function jobHealth(runs: JobRun[], now: Date) {
  return Object.entries(JOB_MAX_AGE_HOURS).map(([job, maxHours]) => {
    const last = runs.filter((r) => r.job === job).sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
    if (!last) return { job, ok: false, lastAt: null as string | null, note: 'ещё не запускалась' };
    const age = now.getTime() - new Date(last.started_at).getTime();
    const stale = age > maxHours * 3_600_000;
    const note = !last.ok ? `сбой ${ago(age)}: ${last.note ?? 'без описания'}` : stale ? `давно не запускалась: ${ago(age)}` : `в порядке, ${ago(age)}`;
    return { job, ok: last.ok && !stale, lastAt: last.started_at, note };
  });
}

/**
 * Пора ли слать тревогу: проверка провалена, предыдущая тоже (то есть лежит дольше 5 минут),
 * а о текущем сбое ещё не сообщали. И «починилось» — когда после тревоги снова всё хорошо.
 */
export function alertStep(current: boolean, previous: { ok: boolean; alerted: boolean }[]): 'alert' | 'recovered' | null {
  const last = previous[0];
  if (!current) {
    if (!last || last.ok) return null;
    // Идём назад по подряд идущим сбоям: если среди них уже была тревога — молчим.
    for (const check of previous) {
      if (check.ok) break;
      if (check.alerted) return null;
    }
    return 'alert';
  }
  if (!last || last.ok) return null;
  for (const check of previous) {
    if (check.ok) break;
    if (check.alerted) return 'recovered';
  }
  return null;
}
