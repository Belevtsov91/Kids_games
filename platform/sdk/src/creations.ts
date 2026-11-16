import type { GameApi } from './game';
import type { Locale } from './manifest';

// Работы ребёнка для кабинета родителя: рисунки, мелодии, биты и всё, что игра умеет сохранять.
// Игра регистрируется сама: кладёт `games/<id>/src/creations.ts` с `export default defineCreations({...})`.
// Оболочка находит такие файлы сама и собирает из них общую страницу «Творчество».
// Данные игра берёт со своего сервера (`/api/games/<id>/...`), а сервер сверяется с кабинетом (parentCanView).

/** Чем работа является: по этому оболочка делит ленту на вкладки. */
export type CreationKind = 'picture' | 'music' | 'story' | 'build';
export const CREATION_KINDS: readonly CreationKind[] = ['picture', 'music', 'story', 'build'];

/** Одна работа в ленте. Оболочка показывает название, дату и игру, остальное рисует игра. */
export interface Creation {
  id: string;
  title: string;
  /** ISO-дата: по ней лента сортируется, новые сверху. */
  createdAt: string;
  kind: CreationKind;
}

/** Что оболочка даёт игре на странице «Творчество». */
export interface CreationsSdk {
  /** Чьи работы смотрит взрослый. */
  childId: string;
  /** Запросы только в префикс игры `/api/games/<id>`. */
  api: GameApi;
  locale: Locale;
  /** Общий выключатель звука сайта. */
  muted: boolean;
}

/** Показанная работа: картинка, проигрыватель мелодии и т. п. */
export interface CreationView {
  unmount(): void;
  /** Остановить звук: оболочка зовёт, когда запускается другая работа. */
  stop?(): void;
}

export interface CreationsModule {
  /** Работы ребёнка, новые сверху. */
  list(sdk: CreationsSdk): Promise<Creation[]>;
  /** Нарисовать работу в контейнер. `onPlay` — работа зазвучала, остальные оболочка заглушит. */
  mount(container: HTMLElement, creation: Creation, sdk: CreationsSdk, onPlay: () => void): CreationView;
  /** Если есть — у работы появится кнопка «Удалить». */
  remove?(creation: Creation, sdk: CreationsSdk): Promise<void>;
}

export const defineCreations = (module: CreationsModule) => module;

/** Сливает ленты игр в одну: новые сверху, при равной дате — по названию. */
export function mergeCreations<T extends Creation>(lists: readonly (readonly T[])[]): T[] {
  return lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title));
}
