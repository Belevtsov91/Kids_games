// Состояние Лунной Долины: типы, константы баланса, начальное состояние и опыт/уровни.
// Чистые функции без DOM, звука и 3D.

export type PetKind = 'fox' | 'owl' | 'bunny';
export type PlantStage = 0 | 1 | 2 | 3;
export type CropKind = 'corn' | 'beet' | 'wheat' | 'rice';

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
/** Счётчики для квестов и достижений. */
export interface Stats {
  harvested: number;
  crystals: number;
  cleansed: number;
  boss: number;
  chests: number;
}
export interface QuestState {
  /** Номер текущего квеста в цепочке; равен длине цепочки, когда всё пройдено. */
  index: number;
  /** Квест взят у жителя. */
  active: boolean;
  /** Значение счётчика в момент, когда квест взят (для «собери ещё N»). */
  base: number;
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
  /** Открытые сундуки (id из game/world). */
  opened: string[];
  stats: Stats;
  quest: QuestState;
}

export const PLOT_COUNT = 6;
export const CROPS: CropKind[] = ['corn', 'beet', 'wheat', 'rice'];
export const cropOf = (plotId: number): CropKind => CROPS[plotId % CROPS.length];

export const LEVEL_XP = [0, 35, 90, 170, 280, 400, 540, 700];
export const MAX_LEVEL = 8;
export const xpForNext = (level: number) => LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] ?? 900;
/** С какого уровня питомец выходит из тумана. */
export const PET_UNLOCK: Record<PetKind, number> = { fox: 1, owl: 2, bunny: 3 };
export const PET_EMOJI: Record<PetKind, string> = { fox: '🦊', owl: '🦉', bunny: '🐸' };
export const GREENHOUSE_COST = 15;
export const FRIEND_AFFECTION = 60;

export const emptyStats = (): Stats => ({ harvested: 0, crystals: 0, cleansed: 0, boss: 0, chests: 0 });

export const initialState = (): ValleyState => ({
  level: 1,
  xp: 0,
  starlight: 12,
  seeds: 3,
  water: 3,
  plots: Array.from({ length: PLOT_COUNT }, (_, id) => ({ id, stage: 0 as PlantStage })),
  pets: [
    { id: 'fox', name: 'Искорка', level: 1, affection: 0, unlocked: true },
    { id: 'owl', name: 'Луна', level: 1, affection: 0, unlocked: false },
    { id: 'bunny', name: 'Мох', level: 1, affection: 0, unlocked: false },
  ],
  buildings: ['home'],
  explored: ['home'],
  opened: [],
  stats: emptyStats(),
  quest: { index: 0, active: false, base: 0 },
});

export const withUnlocks = (state: ValleyState): ValleyState => ({
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

export const bump = (state: ValleyState, key: keyof Stats, by = 1): ValleyState => ({
  ...state,
  stats: { ...state.stats, [key]: state.stats[key] + by },
});
