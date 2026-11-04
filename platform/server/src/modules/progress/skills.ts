// Сводка навыков ребёнка из событий игр. Чистые функции: их проверяют тесты.

export interface SkillEvent {
  game_id: string;
  kind: 'level' | 'skill';
  name: string;
  ok: boolean | null;
  created_at: string;
}

export interface SkillSummary {
  skill: string;
  /** Ответов всего и верных — за весь период. */
  total: number;
  right: number;
  /** Доля верных за последние RECENT ответов, 0–1. */
  recent: number;
  /** Игры, где тренировался навык. */
  games: string[];
  /** Получается (≥ 80% недавних верны), учится, или пока мало данных. */
  level: 'good' | 'learning' | 'new';
}

const RECENT = 20;
const MIN_ANSWERS = 5;

export function summarizeSkills(events: SkillEvent[]): SkillSummary[] {
  const by = new Map<string, SkillEvent[]>();
  for (const e of events) {
    if (e.kind !== 'skill' || e.ok === null) continue;
    by.set(e.name, [...(by.get(e.name) ?? []), e]);
  }
  return [...by.entries()]
    .map(([skill, list]) => {
      const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const recentList = sorted.slice(-RECENT);
      const recent = recentList.filter((e) => e.ok).length / recentList.length;
      const level: SkillSummary['level'] = sorted.length < MIN_ANSWERS ? 'new' : recent >= 0.8 ? 'good' : 'learning';
      return {
        skill,
        total: sorted.length,
        right: sorted.filter((e) => e.ok).length,
        recent: Math.round(recent * 100) / 100,
        games: [...new Set(sorted.map((e) => e.game_id))],
        level,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Уровни, пройденные за период, по играм: { counting: 12 }. */
export function levelsByGame(events: SkillEvent[]) {
  const out: Record<string, number> = {};
  for (const e of events) if (e.kind === 'level') out[e.game_id] = (out[e.game_id] ?? 0) + 1;
  return out;
}
