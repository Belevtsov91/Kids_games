// Отметки «сегодня уже было» на этом устройстве: сыгранные игры плана, задание дома, голосовой привет.
// Хранилище может быть недоступно (приватный режим) — тогда просто ничего не помним.
import { today } from './season';

type Kind = 'played' | 'offline' | 'voice';

const key = (kind: Kind, childId: string) => `ig:daily-${kind}:${childId}`;

function read(kind: Kind, childId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(kind, childId)) ?? 'null') as { day?: string; items?: unknown } | null;
    return raw?.day === today() && Array.isArray(raw.items) ? raw.items.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(kind: Kind, childId: string, items: string[]) {
  try {
    localStorage.setItem(key(kind, childId), JSON.stringify({ day: today(), items: items.slice(-30) }));
  } catch {
    /* без хранилища отметки живут до перезагрузки */
  }
}

export const doneToday = (kind: Kind, childId: string, item = '') => read(kind, childId).includes(item);

export function markToday(kind: Kind, childId: string, item = '') {
  const items = read(kind, childId);
  if (!items.includes(item)) write(kind, childId, [...items, item]);
}

export const listToday = (kind: Kind, childId: string) => read(kind, childId);
