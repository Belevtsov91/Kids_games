import type { GameApi } from '@ig/sdk';
import { LEVELS } from '../game/words';

// Звёзды по уровням. Хранятся на сервере игры; без входа живут только до выхода из игры.

interface ProgressResponse {
  stars: number[];
}

export class ProgressStore {
  stars: number[] = LEVELS.map(() => 0);
  /** Сервер ответил: значит, звёзды сохраняются. */
  online = false;

  constructor(private readonly api: GameApi) {}

  /** Загружает звёзды. Возвращает true, если они изменились (надо перерисовать экран). */
  async load(): Promise<boolean> {
    try {
      const progress = await this.api.get<ProgressResponse>('/progress');
      this.online = true;
      const before = this.stars.join();
      this.merge(progress.stars);
      return before !== this.stars.join();
    } catch {
      this.online = false;
      return false;
    }
  }

  /** Запоминает лучший результат уровня и отправляет его на сервер. */
  async save(levelIndex: number, stars: number) {
    this.stars[levelIndex] = Math.max(this.stars[levelIndex] ?? 0, stars);
    if (!this.online) return;
    try {
      const progress = await this.api.post<ProgressResponse>('/progress', { level: levelIndex, stars });
      this.merge(progress.stars);
    } catch {
      // Сеть пропала: звёзды остались в памяти игры, ребёнок играет дальше.
    }
  }

  private merge(remote: number[]) {
    this.stars = LEVELS.map((_, i) => Math.max(this.stars[i] ?? 0, remote[i] ?? 0));
  }
}
