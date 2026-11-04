// Без DOM: этот файл импортирует и сервер (через @ig/sdk/manifest).
import type { Locale } from './manifest';

/** Навыки, которые тренируют игры. По ним строится страница родителя «Чему научился». */
export const SKILLS = [
  'count', 'numbers', 'letters', 'reading', 'colors', 'shapes', 'sizes', 'animals',
  'music', 'memory', 'logic', 'creativity', 'routine', 'motor', 'space', 'nature', 'emotions',
] as const;
export type Skill = (typeof SKILLS)[number];
export const isSkill = (value: unknown): value is Skill => (SKILLS as readonly unknown[]).includes(value);

/** Наклейка за успех в игре. Список наклеек — в манифесте игры, выдаёт игра через sdk.progress.sticker(id). */
export interface StickerDef {
  /** Латиница, цифры, дефис; уникален внутри игры. */
  id: string;
  emoji: string;
  title: string;
  titles?: Partial<Record<Locale, string>>;
}

export const STICKER_ID_PATTERN = /^[a-z0-9-]{1,40}$/;

/** Успехи игры. Оболочка копит события и отправляет пачкой; без сети и без профиля просто молчит. */
export interface GameProgress {
  /** Пройден уровень (номер или имя). */
  level(name: string | number): void;
  /** Ответ по навыку: верно или нет. Навык должен быть в manifest.skills. */
  skill(skill: Skill, ok: boolean): void;
  /** Выдать наклейку из manifest.stickers. Повторная выдача ничего не меняет. */
  sticker(id: string): void;
}

/** Время ребёнка, как его видит игра. */
export interface GameTime {
  /** Сколько минут осталось на сегодня; null — без ограничения. */
  readonly remaining: number | null;
  /**
   * Время скоро кончится (за 2 минуты до лимита или тихих часов).
   * Игра доводит раунд до конца и сохраняется, а не обрывается на полуслове.
   */
  onEnding(listener: (minutesLeft: number) => void): () => void;
}

/** Облачные сохранения для игр без своего сервера: ключ-значение по ребёнку и игре, до 64 КБ. */
export interface GameCloud {
  load<T>(key: string): Promise<T | null>;
  save(key: string, value: unknown): Promise<void>;
}

/** Удобство, которое выбрал взрослый. Игра подстраивается, если может. */
export interface GameComfort {
  /** 0–1. */
  readonly musicVolume: number;
  readonly effectsVolume: number;
  /** Меньше движения: без тряски, мигания и быстрых анимаций. */
  readonly reduceMotion: boolean;
  /** Крупные кнопки и цели нажатия. */
  readonly bigButtons: boolean;
  /** Ребёнок до 5 лет (или взрослый включил «режим малыша»): без текста, всё голосом. */
  readonly toddler: boolean;
}
