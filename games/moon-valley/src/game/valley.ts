// Правила Лунной Долины без DOM, звука и 3D: состояние, опыт, сад, питомцы, кристаллы, слаймы и сундуки.
// Всё здесь — чистые функции, их покрывают юнит-тесты. Квесты — в quests.ts.

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
  /** Открытые сундуки (id из world.ts). */
  opened: string[];
  stats: Stats;
  quest: QuestState;
}

export const PLOT_COUNT = 6;
export const CROPS: CropKind[] = ['corn', 'beet', 'wheat', 'rice'];
export const cropOf = (plotId: number): CropKind => CROPS[plotId % CROPS.length];
export const CROP_NAME: Record<CropKind, string> = {
  corn: 'лунная кукуруза',
  beet: 'звёздная свёкла',
  wheat: 'серебряная пшеница',
  rice: 'облачный рис',
};

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

const bump = (state: ValleyState, key: keyof Stats, by = 1): ValleyState => ({
  ...state,
  stats: { ...state.stats, [key]: state.stats[key] + by },
});

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

/** Сад: посадить (семя), полить (вода) или собрать урожай. Ничего не вышло — возвращает то же состояние. */
export function tendPlot(state: ValleyState, id: number): ValleyState {
  const plot = state.plots.find((item) => item.id === id);
  if (!plot) return state;
  const setStage = (stage: PlantStage) => state.plots.map((item) => (item.id === id ? { ...item, stage } : item));
  if (plot.stage === 0 && state.seeds > 0) return addXp({ ...state, seeds: state.seeds - 1, plots: setStage(1) }, 8);
  if (plot.stage > 0 && plot.stage < 3 && state.water > 0)
    return addXp({ ...state, water: state.water - 1, plots: setStage((plot.stage + 1) as PlantStage) }, 10);
  if (plot.stage === 3)
    return addXp(bump({ ...state, starlight: state.starlight + 8, seeds: state.seeds + 2, plots: setStage(0) }, 'harvested'), 15);
  return state;
}

export function befriend(state: ValleyState, id: PetKind): ValleyState {
  const pet = state.pets.find((item) => item.id === id);
  if (!pet?.unlocked) return state;
  const affection = Math.min(100, pet.affection + 20);
  return addXp(
    {
      ...state,
      pets: state.pets.map((item) => (item.id === id ? { ...item, affection, level: affection >= FRIEND_AFFECTION ? 2 : item.level } : item)),
    },
    6,
  );
}

/** Лунный кристалл: свет, вода и опыт. */
export const collectCrystal = (state: ValleyState): ValleyState =>
  addXp(bump({ ...state, starlight: state.starlight + 3, water: state.water + 1 }, 'crystals'), 5);

/** Колодец: набрать воды. */
export const drawWater = (state: ValleyState): ValleyState => ({ ...state, water: Math.min(99, state.water + 2) });

/** Теневой слайм очищен светом. Большие дают больше. */
export const cleanseSlime = (state: ValleyState, big = false): ValleyState =>
  addXp(bump({ ...state, starlight: state.starlight + (big ? 4 : 2), seeds: state.seeds + (big ? 1 : 0) }, 'cleansed'), big ? 14 : 8);

/** Грибной король успокоен: один раз за игру. */
export function calmBoss(state: ValleyState): ValleyState {
  if (state.stats.boss) return state;
  return addXp({ ...bump(state, 'boss'), starlight: state.starlight + 30 }, 60);
}

/** Сундук открывается один раз. */
export function openChest(state: ValleyState, id: string): ValleyState {
  if (state.opened.includes(id)) return state;
  return addXp(
    bump({ ...state, opened: [...state.opened, id], starlight: state.starlight + 10, seeds: state.seeds + 2, water: state.water + 2 }, 'chests'),
    20,
  );
}

export function buildGreenhouse(state: ValleyState): ValleyState {
  if (state.buildings.includes('greenhouse') || state.starlight < GREENHOUSE_COST) return state;
  return addXp({ ...state, starlight: state.starlight - GREENHOUSE_COST, buildings: [...state.buildings, 'greenhouse'] }, 25);
}

/** Уровень питомца-друга: сколько питомцев уже близкие друзья. */
export const friendCount = (state: ValleyState) => state.pets.filter((pet) => pet.affection >= FRIEND_AFFECTION).length;
