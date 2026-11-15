import type { Groove } from '../src/game/pattern.js';

export interface Beat extends Groove {
  id: string;
  profileId: string;
  title: string;
  /** Ребёнок нажал «Показать родителям». */
  shared: boolean;
  createdAt: string;
}

/** Сколько битов хранится у одного ребёнка; старые уходят, когда приходят новые. */
export const MAX_BEATS_PER_PROFILE = 30;

export interface BeatsRepository {
  /** Новые сверху. */
  list(profileId: string): Promise<Beat[]>;
  /** Только те, что ребёнок показал родителям. */
  listShared(profileId: string): Promise<Beat[]>;
  create(data: Pick<Beat, 'profileId' | 'title' | 'bpm' | 'swing' | 'pattern'>): Promise<Beat>;
  /** null — бита нет или он чужой. */
  share(id: string, profileId: string, shared: boolean): Promise<Beat | null>;
  /** Удаляет, только если бит принадлежит этому профилю. */
  remove(id: string, profileId: string): Promise<boolean>;
}
