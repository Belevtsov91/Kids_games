// Главы и вопросы игры. Только данные и id: тексты лежат в i18n по тем же id. Без DOM — покрыто тестами.

export type ChapterId = 'light' | 'crossing' | 'lost';

/** Сигналы: три цвета для машин и два человечка для пешеходов. */
export type Light = 'red' | 'yellow' | 'green' | 'walk' | 'stop';

export interface Option {
  id: string;
  art: string;
  ok: boolean;
}

export interface LightRound {
  kind: 'light';
  id: Light;
}

export interface ChoiceRound {
  kind: 'choice';
  id: string;
  art: string;
  options: readonly Option[];
}

export type Round = LightRound | ChoiceRound;

export interface Chapter {
  id: ChapterId;
  art: string;
  /** Сколько вопросов в одном прохождении главы. */
  size: number;
  /** Где идёт Тёпа: через дорогу по зебре или по парку к маме. */
  scene: 'road' | 'park';
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'light', art: '🚦', size: 6, scene: 'road' },
  { id: 'crossing', art: '🚸', size: 5, scene: 'road' },
  { id: 'lost', art: '🧭', size: 5, scene: 'park' },
];

export const LIGHTS: readonly Light[] = ['red', 'yellow', 'green', 'walk', 'stop'];

/** Можно ли идти на этот сигнал: только зелёный и зелёный человечек. */
export const canGo = (light: Light): boolean => light === 'green' || light === 'walk';

const opt = (id: string, art: string, ok = false): Option => ({ id, art, ok });

export const CHOICES: Readonly<Record<'crossing' | 'lost', readonly ChoiceRound[]>> = {
  crossing: [
    { kind: 'choice', id: 'where', art: '🛣️', options: [opt('zebra', '🚸', true), opt('cars', '🚗'), opt('bend', '↪️')] },
    { kind: 'choice', id: 'look', art: '👀', options: [opt('look', '👀', true), opt('run', '🏃'), opt('phone', '📱')] },
    { kind: 'choice', id: 'hand', art: '🤝', options: [opt('adult', '🧑‍🧒', true), opt('alone', '🧒'), opt('dog', '🐕')] },
    { kind: 'choice', id: 'ball', art: '⚽', options: [opt('ask', '🙋', true), opt('chase', '🏃')] },
    { kind: 'choice', id: 'play', art: '🛝', options: [opt('playground', '🛝', true), opt('road', '🛣️'), opt('parking', '🅿️')] },
    { kind: 'choice', id: 'night', art: '🌙', options: [opt('reflector', '✨', true), opt('dark', '🌑')] },
    { kind: 'choice', id: 'car', art: '🚗', options: [opt('seat', '💺', true), opt('stand', '🧍')] },
    { kind: 'choice', id: 'bus', art: '🚌', options: [opt('wait', '⏳', true), opt('front', '💨')] },
  ],
  lost: [
    { kind: 'choice', id: 'shop', art: '🛒', options: [opt('stay', '🧍', true), opt('leave', '🚪'), opt('hide', '🙈')] },
    { kind: 'choice', id: 'helper', art: '🙋', options: [opt('police', '👮', true), opt('cashier', '🧑‍💼', true), opt('stranger', '🕶️')] },
    { kind: 'choice', id: 'candy', art: '🍬', options: [opt('no', '🙅', true), opt('go', '🍭')] },
    { kind: 'choice', id: 'know', art: '🧠', options: [opt('phoneNumber', '📞', true), opt('cartoons', '📺')] },
    { kind: 'choice', id: 'park', art: '🌳', options: [opt('call', '📣', true), opt('runAway', '🌲')] },
    { kind: 'choice', id: 'meet', art: '📍', options: [opt('meet', '📍', true), opt('home', '🏠')] },
  ],
};
