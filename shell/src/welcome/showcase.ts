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

export type BigId = (typeof BIG_IDS)[number];
export type SmallId = (typeof SMALL_IDS)[number];
export type ShowcaseId = BigId | SmallId;

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
};

export const ALL_IDS: ShowcaseId[] = [...BIG_IDS, ...SMALL_IDS];
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
