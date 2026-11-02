// Прогресс садовника: звёзды за уровни по профилю ребёнка.
// In-memory хранилище. Заменить на БД, сохранив сигнатуры.

export interface Progress {
  profileId: string;
  /** id уровня → лучшие звёзды (1..3). */
  levels: Record<string, number>;
}

const progress = new Map<string, Record<string, number>>();

export const progressRepository = {
  async get(profileId: string): Promise<Progress> {
    return { profileId, levels: { ...(progress.get(profileId) ?? {}) } };
  },
  /** Сохраняет результат, только если он лучше прежнего. */
  async record(profileId: string, levelId: string, stars: number): Promise<Progress> {
    const levels = progress.get(profileId) ?? {};
    levels[levelId] = Math.max(levels[levelId] ?? 0, stars);
    progress.set(profileId, levels);
    return { profileId, levels: { ...levels } };
  },
};
