/** Витрина стартовой страницы: какие игры показываем островами и игрушками в 3D-сцене. */
import type { Locale } from '@ig/sdk';
import { ageRange } from '@/i18n/plural';
import { SHOWCASE_TEXT } from './showcaseText';

/** Не зависящее от языка: цвета, иконки, возраст, картинки. */
export interface ShowcaseBase {
  id: string;
  icon: string;
  kind: '2D' | '3D';
  ages: { min: number; max: number };
  /** Цвет подписи, иконки и подсветки. */
  color: string;
  /** Настоящие кадры из игры (из public/). */
  shots?: string[];
}

/** Тексты витрины на одном языке. */
export interface ShowcaseCopy {
  title: string;
  /** Короткое имя для подписи над островом. */
  short?: string;
  text: string;
  /** Одна строка для карточки на полке. */
  card?: string;
  tags: string[];
  /** Подписи к кадрам из `shots`, по порядку. */
  shotAlts?: string[];
  /** Чему учит игра (страница «Родителям»). */
  benefit: string;
}

/** Готовая карточка игры на выбранном языке. */
export interface ShowcaseGame extends Omit<ShowcaseBase, 'ages' | 'shots'>, Omit<ShowcaseCopy, 'shotAlts'> {
  /** «7–15 лет» на языке сайта. */
  ages: string;
  shots?: { src: string; alt: string }[];
}

/** Большие острова-диорамы, по часовой стрелке. */
export const BIG_IDS = ['moon-valley', 'island-builder', 'playground3d', 'space-gardener'] as const;
/** Маленькие игрушки вокруг островов. */
export const SMALL_IDS = ['drawing', 'puzzles', 'letter-eater', 'animal-orchestra', 'counting', 'who-lives-where'] as const;

/** Игры осени 2026: в 3D-сцене их нет (там и так тесно), но они в списке «Родителям» и в подборке «Новые». */
export const NEW_IDS = ['lab', 'eco', 'cipher', 'star-navigator', 'studio', 'pizza', 'atlas', 'robot', 'clock', 'road'] as const;

export type BigId = (typeof BIG_IDS)[number];
export type SmallId = (typeof SMALL_IDS)[number];
export type NewId = (typeof NEW_IDS)[number];
/** Игры, которые стоят в 3D-сцене стартовой страницы. */
export type SceneId = BigId | SmallId;
export type ShowcaseId = SceneId | NewId;

export const SHOWCASE: Record<ShowcaseId, ShowcaseBase> = {
  'moon-valley': {
    id: 'moon-valley', icon: '🌙', kind: '3D', ages: { min: 7, max: 15 }, color: '#a99bff',
    shots: ['/welcome/moon-valley-village.jpg', '/welcome/moon-valley-night.jpg'],
  },
  'island-builder': { id: 'island-builder', icon: '🏝️', kind: '3D', ages: { min: 10, max: 15 }, color: '#7ee7ff' },
  playground3d: { id: 'playground3d', icon: '🧊', kind: '3D', ages: { min: 5, max: 15 }, color: '#ffd25a' },
  'space-gardener': { id: 'space-gardener', icon: '🌱', kind: '2D', ages: { min: 6, max: 10 }, color: '#7ef09a' },
  drawing: { id: 'drawing', icon: '🖍️', kind: '2D', ages: { min: 3, max: 15 }, color: '#ff7eb6' },
  puzzles: { id: 'puzzles', icon: '🧩', kind: '2D', ages: { min: 3, max: 12 }, color: '#ff9f43' },
  'letter-eater': { id: 'letter-eater', icon: '🔤', kind: '2D', ages: { min: 6, max: 10 }, color: '#ffd25a' },
  'animal-orchestra': { id: 'animal-orchestra', icon: '🎵', kind: '2D', ages: { min: 3, max: 6 }, color: '#a99bff' },
  counting: { id: 'counting', icon: '🔢', kind: '2D', ages: { min: 3, max: 8 }, color: '#7ee7ff' },
  'who-lives-where': { id: 'who-lives-where', icon: '🏡', kind: '2D', ages: { min: 3, max: 6 }, color: '#7ef09a' },
  lab: { id: 'lab', icon: '🔬', kind: '3D', ages: { min: 9, max: 15 }, color: '#ffc94d' },
  eco: { id: 'eco', icon: '🌱', kind: '2D', ages: { min: 10, max: 15 }, color: '#5be36b' },
  cipher: { id: 'cipher', icon: '✉️', kind: '2D', ages: { min: 9, max: 14 }, color: '#6a4fd0' },
  'star-navigator': { id: 'star-navigator', icon: '🚀', kind: '2D', ages: { min: 10, max: 15 }, color: '#7b6cff' },
  studio: { id: 'studio', icon: '🎛️', kind: '2D', ages: { min: 9, max: 15 }, color: '#ff5c9a' },
  pizza: { id: 'pizza', icon: '🍕', kind: '2D', ages: { min: 8, max: 12 }, color: '#ff9f5a' },
  atlas: { id: 'atlas', icon: '🌍', kind: '2D', ages: { min: 8, max: 14 }, color: '#5b9dff' },
  robot: { id: 'robot', icon: '📦', kind: '2D', ages: { min: 5, max: 10 }, color: '#ffb35c' },
  clock: { id: 'clock', icon: '🕰️', kind: '2D', ages: { min: 5, max: 8 }, color: '#ffc98a' },
  road: { id: 'road', icon: '🚦', kind: '2D', ages: { min: 4, max: 8 }, color: '#3f7bff' },
};

/** Игры 3D-сцены: острова и игрушки. */
export const ALL_IDS: SceneId[] = [...BIG_IDS, ...SMALL_IDS];
/** Все игры витрины, по возрасту: для списка на странице «Родителям». */
export const LISTED_IDS: ShowcaseId[] = [...ALL_IDS, ...NEW_IDS].sort(
  (a, b) => SHOWCASE[a].ages.min - SHOWCASE[b].ages.min || SHOWCASE[a].ages.max - SHOWCASE[b].ages.max,
);
export const isBig = (id: ShowcaseId): id is BigId => (BIG_IDS as readonly string[]).includes(id);

/** Карточка игры на нужном языке. */
export function showcaseGame(id: ShowcaseId, locale: Locale): ShowcaseGame {
  const base = SHOWCASE[id];
  const { shotAlts, ...copy } = SHOWCASE_TEXT[locale][id];
  return {
    ...base,
    ...copy,
    ages: ageRange(locale, base.ages.min, base.ages.max),
    shots: base.shots?.map((src, i) => ({ src, alt: shotAlts?.[i] ?? copy.title })),
  };
}
