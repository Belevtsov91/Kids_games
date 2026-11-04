// Действия игрока: сад, питомцы, кристаллы, колодец, слаймы, босс, сундуки, теплица.
// Каждое действие берёт состояние и возвращает новое; если ничего не вышло — то же самое.

import { addXp, bump, FRIEND_AFFECTION, GREENHOUSE_COST, type PetKind, type PlantStage, type ValleyState } from './state';

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
