import type { GameManifest } from './manifest';

/** Ответы API игры. Запросы идут только в её собственный префикс `/api/games/<id>`. */
export interface GameApi {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

/** Локальное хранилище игры: ключи изолированы по id игры. */
export interface GameStorage {
  load<T>(key: string): T | null;
  save(key: string, value: unknown): void;
}

/** Всё, что оболочка даёт игре. Других способов связаться с платформой у игры нет. */
export interface GameSdk {
  manifest: GameManifest;
  /** Профиль ребёнка; null, пока выбора профиля нет. */
  profile: { id: string; name: string; avatar: string } | null;
  api: GameApi;
  storage: GameStorage;
  /** Общий выключатель звука. Игра читает его сама и подписывается на изменения. */
  audio: { readonly muted: boolean; onMuteChange(listener: (muted: boolean) => void): () => void };
  /** Вернуться в меню. */
  exit(): void;
}

/** Запущенная игра. Оболочка зовёт pause/resume, когда вкладка скрывается и возвращается. */
export interface GameInstance {
  unmount(): void;
  pause?(): void;
  resume?(): void;
}

/** Точка входа: `games/<id>/src/index.ts` экспортирует по умолчанию результат defineGame. */
export interface GameModule {
  mount(container: HTMLElement, sdk: GameSdk): GameInstance | Promise<GameInstance>;
}

export const defineGame = (game: GameModule) => game;
