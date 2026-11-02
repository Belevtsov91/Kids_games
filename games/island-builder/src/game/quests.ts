import { maxHeight, type Stats, type World } from './world';

export interface Quest {
  id: string;
  emoji: string;
  title: string;
  goal: number;
  progress(world: World, stats: Stats): number;
}

const countBlocks = (world: World, type: string) => [...world.blocks.values()].filter((t) => t === type).length;

/**
 * Задания-достижения: подсказывают, что ещё можно попробовать на острове.
 * Считаются по действиям игрока, чтобы случайный остров не выполнял их сам.
 */
export const QUESTS: Quest[] = [
  { id: 'builder', emoji: '🧱', title: 'Поставь 15 блоков', goal: 15, progress: (_, s) => s.placed },
  { id: 'gardener', emoji: '🌳', title: 'Посади 8 деревьев', goal: 8, progress: (_, s) => s.planted },
  { id: 'tower', emoji: '🗼', title: 'Построй башню высотой 11', goal: 11, progress: (w) => maxHeight(w) },
  { id: 'sailor', emoji: '⛵', title: 'Спусти на воду 3 лодки', goal: 3, progress: (_, s) => s.boats },
  { id: 'designer', emoji: '🎨', title: 'Используй 6 разных материалов', goal: 6, progress: (w) => new Set(w.blocks.values()).size },
  { id: 'lights', emoji: '🏮', title: 'Поставь 4 фонаря', goal: 4, progress: (w) => countBlocks(w, 'lantern') },
  { id: 'painter', emoji: '🖌️', title: 'Перекрась 10 блоков', goal: 10, progress: (_, s) => s.painted },
  { id: 'digger', emoji: '⛏️', title: 'Выкопай бухту: убери 20 блоков', goal: 20, progress: (_, s) => s.dug },
  { id: 'cargo', emoji: '📦', title: 'Сбрось 10 ящиков', goal: 10, progress: (_, s) => s.crates },
];

export function questState(world: World, stats: Stats, achieved: readonly string[]) {
  return QUESTS.map((quest) => {
    const done = achieved.includes(quest.id);
    const value = done ? quest.goal : Math.min(quest.goal, quest.progress(world, stats));
    return { quest, value, done: done || value >= quest.goal };
  });
}

/** Задания, которые выполнены сейчас, но ещё не отмечены. Отмеченное остаётся навсегда. */
export function newlyDone(world: World, stats: Stats, achieved: readonly string[]): Quest[] {
  return QUESTS.filter((q) => !achieved.includes(q.id) && q.progress(world, stats) >= q.goal);
}
