import type { GameApi } from '@ig/sdk';
import { emptyProgress, mergeProgress, type Progress } from '../game/rounds';

// Уровень и найденные зверята. Хранятся на сервере игры; чей прогресс — сервер знает по сессии.

export class ProgressSync {
  progress: Progress = emptyProgress();
  private loading: Promise<void> | null = null;

  constructor(private readonly api: GameApi) {}

  /** Грузим по первому нажатию, а не при запуске: до игры прогресс не нужен. */
  load() {
    this.loading ??= this.api
      .get<Progress>('/progress')
      .then((saved) => void (this.progress = mergeProgress(this.progress, saved)))
      .catch(() => undefined); // Нет сети или сессии — играем с начала, без сохранения.
    return this.loading;
  }

  /** Раунд пройден: следующий уровень и новые найденные зверята. */
  async completeRound(level: number, found: string[]) {
    this.progress = mergeProgress(this.progress, { level: level + 1, found });
    try {
      this.progress = mergeProgress(this.progress, await this.api.post<Progress>('/progress', this.progress));
    } catch {
      // Не сохранилось — не страшно: в следующий раз начнём с последнего сохранённого уровня.
    }
  }
}
