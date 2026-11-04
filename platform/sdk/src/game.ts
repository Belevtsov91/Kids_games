import type { GameManifest, Locale } from './manifest';
import type { GameCloud, GameComfort, GameProgress, GameTime } from './progress';

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
  /** Язык, выбранный на сайте. Игра берёт его при запуске и показывает интерфейс на нём. */
  locale: Locale;
  /** Общий выключатель звука. Игра читает его сама и подписывается на изменения. */
  audio: { readonly muted: boolean; onMuteChange(listener: (muted: boolean) => void): () => void };
  /** Успехи: уровни, навыки, наклейки. Видны ребёнку в альбоме и взрослому в кабинете. */
  progress: GameProgress;
  /** Сколько осталось играть и сигнал «скоро конец». */
  time: GameTime;
  /** Сохранения на сервере платформы (для игр без своего сервера). */
  cloud: GameCloud;
  /** Громкость, меньше движения, крупные кнопки, режим малыша. */
  comfort: GameComfort;
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
