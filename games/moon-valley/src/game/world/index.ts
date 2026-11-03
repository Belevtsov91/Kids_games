// Карта Лунной Долины. Вход в папку: всё, что раньше было в game/world.ts, импортируется отсюда.
//   map.ts         — остров, ориентиры, дома, мебель, забор, дорожки
//   inhabitants.ts — жители, кристаллы, сундуки, слаймы, олени, обелиски
//   geometry.ts    — rng, dist, nearPath, nearest
//   generate.ts    — деревья, декор и трава

export * from './map';
export * from './inhabitants';
export { dist, nearest } from './geometry';
export { generateDecor, generateGrass, generateTrees } from './generate';
