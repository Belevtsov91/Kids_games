import { useEffect, useState } from 'react';
import { get } from './client';
import type { Game } from './types';

// Названия игр по id: загружаются один раз и нужны в карточке семьи.

let cache: Promise<Map<string, string>> | null = null;

export function useGameTitles() {
  const [titles, setTitles] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    cache ??= get<Game[]>('/games?days=1').then((games) => new Map(games.map((g) => [g.id, `${g.emoji} ${g.title}`])));
    cache.then(setTitles).catch(() => (cache = null));
  }, []);
  return (id: string) => titles.get(id) ?? id;
}
