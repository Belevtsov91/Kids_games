// Без DOM: этот файл импортирует и сервер (через @ig/sdk/manifest).
import { isSkill, STICKER_ID_PATTERN, type Skill, type StickerDef } from './progress';

/** Языки сайта и игр: русский, украинский, румынский, английский. */
export const LOCALES = ['ru', 'uk', 'ro', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (value: unknown): value is Locale => (LOCALES as readonly unknown[]).includes(value);

/** Описание игры. Лежит в `games/<id>/manifest.ts`; из манифестов собирается каталог и в меню, и на сервере. */
export interface GameManifest {
  /** Совпадает с именем папки игры: латиница, цифры, дефис. */
  id: string;
  title: string;
  /** Название на других языках; если перевода нет, показывается `title`. */
  titles?: Partial<Record<Locale, string>>;
  /** Обложка в меню, пока эмодзи. */
  emoji: string;
  kind: '2d' | '3d';
  /** Возраст, для которого игра подходит, включительно. */
  ages: { min: number; max: number };
  /** Что тренирует игра: по этим навыкам родитель видит успехи. */
  skills?: Skill[];
  /** Наклейки, которые можно получить в игре. */
  stickers?: StickerDef[];
  /** Для родителя: что развивает игра, одна-две фразы. */
  about?: string;
  abouts?: Partial<Record<Locale, string>>;
}

export const GAME_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export const defineManifest = (manifest: GameManifest) => manifest;

/** Возвращает список ошибок; пустой список — манифест годен. `folder` — имя папки игры. */
export function validateManifest(manifest: unknown, folder: string): string[] {
  const m = manifest as Partial<GameManifest> | undefined;
  if (!m || typeof m !== 'object') return [`${folder}: manifest.ts должен экспортировать объект по умолчанию`];
  const errors: string[] = [];
  if (typeof m.id !== 'string' || !GAME_ID_PATTERN.test(m.id)) errors.push(`${folder}: неверный id "${m.id}"`);
  else if (m.id !== folder) errors.push(`${folder}: id "${m.id}" не совпадает с именем папки`);
  if (typeof m.title !== 'string' || !m.title.trim()) errors.push(`${folder}: пустой title`);
  if (typeof m.emoji !== 'string' || !m.emoji) errors.push(`${folder}: пустой emoji`);
  if (m.kind !== '2d' && m.kind !== '3d') errors.push(`${folder}: kind должен быть "2d" или "3d"`);
  const ages = m.ages;
  if (!ages || !Number.isInteger(ages.min) || !Number.isInteger(ages.max) || ages.min < 0 || ages.min > ages.max) {
    errors.push(`${folder}: ages должен быть { min, max }, min ≤ max`);
  }
  if (m.skills !== undefined && (!Array.isArray(m.skills) || !m.skills.every(isSkill))) errors.push(`${folder}: неизвестный навык в skills`);
  if (m.stickers !== undefined) {
    const ids = Array.isArray(m.stickers) ? m.stickers.map((s) => s?.id) : null;
    if (!ids || !ids.every((id) => typeof id === 'string' && STICKER_ID_PATTERN.test(id)) || new Set(ids).size !== ids.length) {
      errors.push(`${folder}: у наклеек должны быть разные id из латиницы, цифр и дефиса`);
    }
  }
  return errors;
}

/**
 * Собирает каталог из манифестов: `entries` — пары [имя папки, манифест].
 * Битый манифест не роняет каталог: игра пропускается, ошибка уходит в `onError`.
 */
export function buildCatalog(
  entries: Iterable<[folder: string, manifest: unknown]>,
  onError: (message: string) => void = console.error,
): GameManifest[] {
  const catalog: GameManifest[] = [];
  for (const [folder, manifest] of entries) {
    const errors = validateManifest(manifest, folder);
    if (errors.length) errors.forEach(onError);
    else catalog.push(manifest as GameManifest);
  }
  return catalog.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}
export * from './progress';
