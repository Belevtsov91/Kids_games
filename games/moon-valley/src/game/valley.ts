export type PetKind = 'fox' | 'owl' | 'bunny';
export type PlantStage = 0 | 1 | 2 | 3;

export interface Pet {
  id: PetKind;
  name: string;
  level: number;
  affection: number;
  unlocked: boolean;
}
export interface Plot {
  id: number;
  stage: PlantStage;
}
export interface ValleyState {
  level: number;
  xp: number;
  starlight: number;
  seeds: number;
  water: number;
  plots: Plot[];
  pets: Pet[];
  buildings: string[];
  explored: string[];
}

export const LEVEL_XP = [0, 35, 90, 170, 280];

export const initialState = (): ValleyState => ({
  level: 1,
  xp: 0,
  starlight: 12,
  seeds: 3,
  water: 3,
  plots: [
    { id: 0, stage: 0 },
    { id: 1, stage: 0 },
    { id: 2, stage: 0 },
  ],
  pets: [
    { id: 'fox', name: 'Искорка', level: 1, affection: 0, unlocked: true },
    { id: 'owl', name: 'Луна', level: 1, affection: 0, unlocked: false },
    { id: 'bunny', name: 'Мох', level: 1, affection: 0, unlocked: false },
  ],
  buildings: ['home'],
  explored: ['home'],
});

export const xpForNext = (level: number) => LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] ?? 400;
export const MAX_LEVEL = 5;
/** С какого уровня питомец выходит из тумана. */
export const PET_UNLOCK: Record<PetKind, number> = { fox: 1, owl: 2, bunny: 3 };

const withUnlocks = (state: ValleyState): ValleyState => ({
  ...state,
  pets: state.pets.map((pet) => (pet.unlocked || state.level < PET_UNLOCK[pet.id] ? pet : { ...pet, unlocked: true })),
});

export function addXp(state: ValleyState, amount: number): ValleyState {
  let xp = state.xp + amount;
  let level = state.level;
  while (level < MAX_LEVEL && xp >= xpForNext(level)) {
    xp -= xpForNext(level);
    level += 1;
  }
  // На последнем уровне полоска опыта просто заполнена.
  if (level >= MAX_LEVEL) xp = Math.min(xp, xpForNext(level));
  return withUnlocks({ ...state, xp, level });
}

const num = (value: unknown, fallback: number, min = 0, max = 1e6) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/** Сохранение из хранилища: всё битое или старое заменяется значениями по умолчанию. */
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
  const strings = (list: unknown, fallback: string[]) =>
    Array.isArray(list) ? [...new Set(list.filter((item): item is string => typeof item === 'string'))] : fallback;
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
  });
}

export function tendPlot(state: ValleyState, id: number): ValleyState {
  const plot = state.plots.find((item) => item.id === id);
  if (!plot) return state;
  if (plot.stage === 0 && state.seeds > 0)
    return addXp(
      { ...state, seeds: state.seeds - 1, plots: state.plots.map((item) => (item.id === id ? { ...item, stage: 1 } : item)) },
      8,
    );
  if (plot.stage > 0 && plot.stage < 3 && state.water > 0)
    return addXp(
      {
        ...state,
        water: state.water - 1,
        plots: state.plots.map((item) => (item.id === id ? { ...item, stage: (item.stage + 1) as PlantStage } : item)),
      },
      10,
    );
  if (plot.stage === 3)
    return addXp(
      {
        ...state,
        starlight: state.starlight + 8,
        seeds: state.seeds + 1,
        plots: state.plots.map((item) => (item.id === id ? { ...item, stage: 0 } : item)),
      },
      15,
    );
  return state;
}

export function befriend(state: ValleyState, id: PetKind): ValleyState {
  const pet = state.pets.find((item) => item.id === id);
  if (!pet?.unlocked) return state;
  const affection = Math.min(100, pet.affection + 20);
  return addXp(
    { ...state, pets: state.pets.map((item) => (item.id === id ? { ...item, affection, level: affection >= 60 ? 2 : item.level } : item)) },
    6,
  );
}
