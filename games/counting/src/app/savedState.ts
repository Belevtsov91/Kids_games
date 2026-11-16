import { byAge, type GameStorage } from '@ig/sdk';
import { languages, type Language } from '../i18n';
import { LIMITS, ROUNDS } from '../game/themes';

// Настройки и лучшие результаты хранятся локально на устройстве через sdk.storage, отдельно для каждого профиля.

export interface Preferences {
  language: Language;
  speech: Language;
  limit: number;
  theme: number;
}

/** Лучшие звёзды по ключу «режим:язык:диапазон:тема». */
export type Progress = Record<string, number>;

/** Стартовый диапазон по возрасту: малышам до 5, с 5 лет до 10, с 7 лет до 20. Потом ребёнок меняет его сам. */
export const limitForAge = (age: number | null | undefined) => byAge(age, [[5, 10], [7, 20]], 5);

export const defaultPreferences = (age?: number | null): Preferences => ({ language: 'uk', speech: 'uk', limit: limitForAge(age), theme: 0 });

export const progressKey = (mode: string, p: Preferences) => `${mode}:${p.language}:${p.limit}:${p.theme}`;

/** Читает сохранённое (без сохранения — диапазон по возрасту); всё некорректное заменяется значениями по умолчанию. `null` — хранилище недоступно. */
export function loadSaved(storage: GameStorage, key: string, age?: number | null): { prefs: Preferences; progress: Progress } | null {
  try {
    const saved = storage.load<{ preferences?: Partial<Preferences>; progress?: Progress }>(key);
    const p = saved?.preferences;
    const prefs = p
      ? {
          language: languages.includes(p.language!) ? p.language! : 'uk',
          speech: languages.includes(p.speech!) ? p.speech! : 'uk',
          limit: LIMITS.includes(p.limit!) ? p.limit! : 5,
          theme: [0, 1, 2].includes(p.theme!) ? p.theme! : 0,
        }
      : defaultPreferences(age);
    const progress =
      saved?.progress && typeof saved.progress === 'object'
        ? Object.fromEntries(Object.entries(saved.progress).filter(([, value]) => typeof value === 'number' && value >= 0 && value <= ROUNDS))
        : {};
    return { prefs, progress };
  } catch {
    return null;
  }
}

/** Сохраняет; false — хранилище недоступно (например, приватный режим). */
export function saveState(storage: GameStorage, key: string, prefs: Preferences, progress: Progress): boolean {
  try {
    storage.save(key, { preferences: prefs, progress });
    return true;
  } catch {
    return false;
  }
}
