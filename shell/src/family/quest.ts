import { kidApi, tz } from '@/kid/KidStatus';

// Задание дня с сервера: какая игра, сколько уже сыграно, серия и подарки Тёпе.

export interface Quest {
  day: string;
  gameId: string | null;
  done: boolean;
  seconds: number;
  need: number;
  streak: number;
  total: number;
  gifts: number;
  toNext: number;
}

export const GIFT_ICONS = ['🧣', '🎩', '🕶️', '🎀', '👑', '🎒', '🪁', '🎈', '⭐', '🚲', '🎸', '🚀'] as const;

export const loadQuest = (games: string[]) =>
  kidApi.get<Quest>(`/quest?tz=${encodeURIComponent(tz())}&games=${encodeURIComponent(games.slice(0, 40).join(','))}`);

/** Подарки по кругу: после последнего снова первый. */
export const giftIndex = (n: number) => ((n % GIFT_ICONS.length) + GIFT_ICONS.length) % GIFT_ICONS.length;

/** Сколько минут осталось (вверх, минимум 1, пока не выполнено). */
export const minutesLeft = (q: Pick<Quest, 'seconds' | 'need' | 'done'>) => (q.done ? 0 : Math.max(1, Math.ceil((q.need - q.seconds) / 60)));
