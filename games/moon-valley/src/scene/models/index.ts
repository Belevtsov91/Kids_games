// Модели из assets/models.
//   load.ts       — адреса .glb и подготовка материалов
//   Model.tsx     — одна неподвижная модель / модель по данным карты
//   character.ts  — персонажи с костями и анимациями
//   Instanced.tsx — сотни одинаковых моделей одним вызовом отрисовки

export { MODEL_URL, modelUrl, preloadModels } from './load';
export { Model, Placement } from './Model';
export { findClip, useAnimator, useCharacter } from './character';
export { Instanced } from './Instanced';
