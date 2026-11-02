// Звёзды по уровням для каждого игрока. In-memory хранилище: заменить на БД, сохранив сигнатуры.

export const LEVEL_COUNT = 5;

const progress = new Map<string, number[]>();

export const progressRepository = {
  async get(owner: string): Promise<number[]> {
    return [...(progress.get(owner) ?? Array<number>(LEVEL_COUNT).fill(0))];
  },
  /** Сохраняет лучший результат: звёзды за уровень никогда не уменьшаются. */
  async saveBest(owner: string, level: number, stars: number): Promise<number[]> {
    const current = await this.get(owner);
    current[level] = Math.max(current[level] ?? 0, stars);
    progress.set(owner, current);
    return [...current];
  },
};
