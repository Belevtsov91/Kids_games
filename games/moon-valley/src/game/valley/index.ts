// Правила Лунной Долины без DOM, звука и 3D. Всё — чистые функции, их покрывают юнит-тесты. Квесты — в ../quests.ts.
//   state.ts   — типы, константы баланса, начальное состояние, опыт и уровни
//   restore.ts — безопасная загрузка сохранения
//   actions.ts — что делает игрок: сад, питомцы, кристаллы, слаймы, босс, сундуки, теплица

export {
  addXp,
  CROPS,
  cropOf,
  emptyStats,
  FRIEND_AFFECTION,
  GREENHOUSE_COST,
  initialState,
  LEVEL_XP,
  MAX_LEVEL,
  PET_EMOJI,
  PET_UNLOCK,
  PLOT_COUNT,
  xpForNext,
} from './state';
export type { CropKind, Pet, PetKind, PlantStage, Plot, QuestState, Stats, ValleyState } from './state';
export { restoreState } from './restore';
export * from './actions';
