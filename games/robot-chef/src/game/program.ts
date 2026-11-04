// Программа робота: список команд «стрелка × повтор». Повтор (×2, ×3) открывается на поздних уровнях.
import type { Dir } from './grid';

export interface Command {
  dir: Dir;
  times: 1 | 2 | 3;
}

export const MAX_TIMES = 3;

/** Разворачивает программу в шаги: [→×3, ↓] → → → → ↓. */
export const expand = (program: readonly Command[]): Dir[] => program.flatMap((c) => Array<Dir>(c.times).fill(c.dir));

/** Следующий повтор по кругу: 1 → 2 → 3 → 1. */
export const nextTimes = (t: Command['times']): Command['times'] => (t >= MAX_TIMES ? 1 : ((t + 1) as Command['times']));

/** Сжимает шаги в команды с повтором: → → → → ↓ → [→×3, →, ↓]. */
export function compress(steps: readonly Dir[], withRepeat: boolean): Command[] {
  const out: Command[] = [];
  for (const dir of steps) {
    const last = out.at(-1);
    if (withRepeat && last && last.dir === dir && last.times < MAX_TIMES) last.times = (last.times + 1) as Command['times'];
    else out.push({ dir, times: 1 });
  }
  return out;
}
