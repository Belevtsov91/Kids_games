import { expect, it } from 'vitest';
import { findGame, games } from './catalog';

it('каталог собран из манифестов папки games/', () => {
  expect(games.map((g) => g.id)).toEqual(expect.arrayContaining(['drawing', 'playground3d']));
  expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
});

it('ищет игру по id', () => {
  expect(findGame('drawing')?.title).toBe('Рисовалка');
  expect(findGame('nope')).toBeUndefined();
});
