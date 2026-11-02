export type PetKind = 'fox' | 'owl' | 'bunny';
export type PlantStage = 0 | 1 | 2 | 3;

export interface Pet { id: PetKind; name: string; level: number; affection: number; unlocked: boolean }
export interface Plot { id: number; stage: PlantStage }
export interface ValleyState { level: number; xp: number; starlight: number; seeds: number; water: number; plots: Plot[]; pets: Pet[]; buildings: string[]; explored: string[] }

export const LEVEL_XP = [0, 35, 90, 170, 280];

export const initialState = (): ValleyState => ({
  level: 1, xp: 0, starlight: 12, seeds: 3, water: 3,
  plots: [{ id: 0, stage: 0 }, { id: 1, stage: 0 }, { id: 2, stage: 0 }],
  pets: [{ id: 'fox', name: 'Искорка', level: 1, affection: 0, unlocked: true }, { id: 'owl', name: 'Луна', level: 1, affection: 0, unlocked: false }, { id: 'bunny', name: 'Мох', level: 1, affection: 0, unlocked: false }],
  buildings: ['home'], explored: ['home'],
});

export const xpForNext = (level: number) => LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] ?? 400;
export function addXp(state: ValleyState, amount: number): ValleyState {
  let xp = state.xp + amount;
  let level = state.level;
  while (level < 5 && xp >= xpForNext(level)) { xp -= xpForNext(level); level += 1; }
  return { ...state, xp, level };
}

export function tendPlot(state: ValleyState, id: number): ValleyState {
  const plot = state.plots.find((item) => item.id === id);
  if (!plot) return state;
  if (plot.stage === 0 && state.seeds > 0) return addXp({ ...state, seeds: state.seeds - 1, plots: state.plots.map((item) => item.id === id ? { ...item, stage: 1 } : item) }, 8);
  if (plot.stage > 0 && plot.stage < 3 && state.water > 0) return addXp({ ...state, water: state.water - 1, plots: state.plots.map((item) => item.id === id ? { ...item, stage: (item.stage + 1) as PlantStage } : item) }, 10);
  if (plot.stage === 3) return addXp({ ...state, starlight: state.starlight + 8, seeds: state.seeds + 1, plots: state.plots.map((item) => item.id === id ? { ...item, stage: 0 } : item) }, 15);
  return state;
}

export function befriend(state: ValleyState, id: PetKind): ValleyState {
  const pet = state.pets.find((item) => item.id === id);
  if (!pet?.unlocked) return state;
  const affection = Math.min(100, pet.affection + 20);
  return addXp({ ...state, pets: state.pets.map((item) => item.id === id ? { ...item, affection, level: affection >= 60 ? 2 : item.level } : item) }, 6);
}
