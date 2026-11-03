// Восстановление сохранения: всё битое или старое заменяется значениями по умолчанию.

import { initialState, MAX_LEVEL, withUnlocks, type Pet, type PlantStage, type Plot, type QuestState, type Stats, type ValleyState } from './state';

const num = (value: unknown, fallback: number, min = 0, max = 1e6) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/** Сохранение с сервера или из хранилища: всё битое или старое заменяется значениями по умолчанию. */
export function restoreState(raw: unknown): ValleyState {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const saved = raw as Partial<ValleyState>;
  const list = <T,>(value: unknown): Partial<T>[] => (Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []);
  const savedPlots = list<Plot>(saved.plots);
  const savedPets = list<Pet>(saved.pets);
  const plots = base.plots.map((plot) => {
    const stage = savedPlots.find((item) => item.id === plot.id)?.stage;
    return { ...plot, stage: num(stage, 0, 0, 3) as PlantStage };
  });
  const pets = base.pets.map((pet) => {
    const old = savedPets.find((item) => item.id === pet.id);
    return old ? { ...pet, affection: num(old.affection, 0, 0, 100), level: num(old.level, 1, 1, 5) } : pet;
  });
  const strings = (value: unknown, fallback: string[]) =>
    Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length <= 32))].slice(0, 50) : fallback;
  const stats = (saved.stats ?? {}) as Partial<Stats>;
  const quest = (saved.quest ?? {}) as Partial<QuestState>;
  return withUnlocks({
    level: num(saved.level, 1, 1, MAX_LEVEL),
    xp: num(saved.xp, 0),
    starlight: num(saved.starlight, base.starlight),
    seeds: num(saved.seeds, base.seeds),
    water: num(saved.water, base.water),
    plots,
    pets,
    buildings: strings(saved.buildings, base.buildings),
    explored: strings(saved.explored, base.explored),
    opened: strings(saved.opened, []),
    stats: {
      harvested: num(stats.harvested, 0),
      crystals: num(stats.crystals, 0),
      cleansed: num(stats.cleansed, 0),
      boss: num(stats.boss, 0, 0, 1),
      chests: num(stats.chests, 0),
    },
    quest: { index: num(quest.index, 0, 0, 100), active: quest.active === true, base: num(quest.base, 0) },
  });
}
