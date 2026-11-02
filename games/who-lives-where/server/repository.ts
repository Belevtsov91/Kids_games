import { emptyProgress, mergeProgress, type Progress } from '../src/rounds.js';

// In-memory хранилище прогресса по ребёнку. Заменить на БД, сохранив сигнатуры.
const progress = new Map<string, Progress>();

export const progressRepository = {
  async get(childId: string): Promise<Progress> {
    return progress.get(childId) ?? emptyProgress();
  },
  async save(childId: string, update: Partial<Progress>): Promise<Progress> {
    const next = mergeProgress(await this.get(childId), update);
    progress.set(childId, next);
    return next;
  },
};
