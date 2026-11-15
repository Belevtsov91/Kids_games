// Где дети бросают игру: воронка по уровням из ig_play_events (kind = 'level') и дней игры из ig_play_daily.
// Чистые функции без базы — их проверяют тесты; маршрут только читает строки и зовёт buildDropoff.

/** Ребёнок, который не заходил в игру столько дней, считается бросившим. Кто играл позже — «ещё играет». */
export const QUIT_AFTER_DAYS = 3;

export interface PlayRow { child_id: string; day: string }
export interface LevelRow { child_id: string; name: string; created_at: string }

export interface DropoffLevel {
  name: string;
  /** Сколько детей прошли этот уровень за период. */
  reached: number;
  /** Сколько бросили сразу после него: это их последний уровень, и они больше не заходят. */
  quit: number;
}

export interface Dropoff {
  players: number;
  /** Ещё играют: заходили за последние QUIT_AFTER_DAYS дней. */
  active: number;
  /** Бросили, не пройдя ни одного уровня. */
  quitBeforeFirst: number;
  levels: DropoffLevel[];
  /** Где бросают чаще всего: имя уровня, '' — до первого уровня; null — пока никто не бросил. */
  worst: { level: string; quit: number; share: number } | null;
}

const naturally = new Intl.Collator('en', { numeric: true }).compare;

/**
 * Воронка одной игры. Порядок уровней — по тому, сколько детей их прошли (так идёт воронка),
 * при равенстве — «по-человечески» по имени: 2 раньше 10.
 * today — «YYYY-MM-DD» в часовом поясе владельца.
 */
export function buildDropoff(plays: PlayRow[], levels: LevelRow[], today: string, quitAfterDays = QUIT_AFTER_DAYS): Dropoff {
  const lastSeen = new Map<string, string>();
  const seen = (child: string, day: string) => {
    const before = lastSeen.get(child);
    if (!before || day > before) lastSeen.set(child, day);
  };
  for (const p of plays) seen(p.child_id, p.day);

  const reached = new Map<string, Set<string>>();
  const lastLevel = new Map<string, LevelRow>();
  for (const e of levels) {
    seen(e.child_id, e.created_at.slice(0, 10));
    if (!reached.has(e.name)) reached.set(e.name, new Set());
    reached.get(e.name)!.add(e.child_id);
    const before = lastLevel.get(e.child_id);
    if (!before || e.created_at > before.created_at) lastLevel.set(e.child_id, e);
  }

  const cutoff = new Date(Date.parse(`${today}T12:00:00Z`) - quitAfterDays * 86_400_000).toISOString().slice(0, 10);
  const quitAt = new Map<string, number>();
  let active = 0;
  let quitBeforeFirst = 0;
  for (const [child, day] of lastSeen) {
    if (day > cutoff) active++;
    else if (!lastLevel.has(child)) quitBeforeFirst++;
    else {
      const name = lastLevel.get(child)!.name;
      quitAt.set(name, (quitAt.get(name) ?? 0) + 1);
    }
  }

  const list = [...reached].map(([name, kids]) => ({ name, reached: kids.size, quit: quitAt.get(name) ?? 0 }));
  list.sort((a, b) => b.reached - a.reached || naturally(a.name, b.name));

  const players = lastSeen.size;
  const candidates = [{ level: '', quit: quitBeforeFirst }, ...list.map((l) => ({ level: l.name, quit: l.quit }))];
  const top = candidates.reduce((best, c) => (c.quit > best.quit ? c : best), { level: '', quit: 0 });
  const worst = top.quit > 0 ? { ...top, share: Math.round((top.quit / players) * 100) } : null;

  return { players, active, quitBeforeFirst, levels: list, worst };
}

/** Строки по играм: один проход вместо фильтра на каждую игру. */
export function byGame<T extends { game_id: string }>(rows: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const r of rows) {
    if (!out.has(r.game_id)) out.set(r.game_id, []);
    out.get(r.game_id)!.push(r);
  }
  return out;
}
