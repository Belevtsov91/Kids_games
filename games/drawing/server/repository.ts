import { randomUUID } from 'node:crypto';

export interface Drawing {
  id: string;
  profileId: string;
  title: string;
  /** PNG в виде data URL. Позже — ссылка на файл в хранилище. */
  image: string;
  createdAt: string;
}

export type DrawingSummary = Omit<Drawing, 'image'>;

// In-memory хранилище. Заменить на БД, сохранив сигнатуры.
const drawings = new Map<string, Drawing>();

export const drawingsRepository = {
  async list(profileId: string): Promise<DrawingSummary[]> {
    return [...drawings.values()]
      .filter((d) => d.profileId === profileId)
      .map(({ image: _image, ...summary }) => summary);
  },
  /** Отдаёт рисунок, только если он принадлежит этому профилю. */
  async get(id: string, profileId: string) {
    const drawing = drawings.get(id);
    return drawing?.profileId === profileId ? drawing : null;
  },
  async create(data: Pick<Drawing, 'profileId' | 'title' | 'image'>) {
    const drawing: Drawing = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
    drawings.set(drawing.id, drawing);
    return drawing;
  },
  /** Удаляет, только если рисунок принадлежит этому профилю. */
  async remove(id: string, profileId: string) {
    if (drawings.get(id)?.profileId !== profileId) return false;
    return drawings.delete(id);
  },
};
