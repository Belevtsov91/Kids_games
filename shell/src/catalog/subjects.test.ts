import { describe, expect, it } from 'vitest';
import type { GameManifest } from '@ig/sdk';
import { isNewGame, matchesFilter, subjectsIn, subjectsOf } from './subjects';

const game = (patch: Partial<GameManifest>): GameManifest => ({ id: 'g', title: 'G', emoji: '🎲', kind: '2d', ages: { min: 3, max: 15 }, ...patch });
const now = new Date('2026-11-20T12:00:00Z');

describe('предметы из навыков', () => {
  it('сводит навыки в предметы без повторов', () => {
    expect(subjectsOf(game({ skills: ['count', 'numbers', 'logic'] }))).toEqual(['math', 'logic']);
    expect(subjectsOf(game({}))).toEqual([]);
  });

  it('показывает только предметы, где есть игры, в постоянном порядке', () => {
    const list = [game({ skills: ['nature'] }), game({ skills: ['letters', 'count'] })];
    expect(subjectsIn(list)).toEqual(['math', 'reading', 'world']);
  });
});

describe('новые игры', () => {
  it('новая 30 дней после addedAt', () => {
    expect(isNewGame(game({ addedAt: '2026-11-15' }), now)).toBe(true);
    expect(isNewGame(game({ addedAt: '2026-10-01' }), now)).toBe(false);
    expect(isNewGame(game({ addedAt: '2026-12-01' }), now)).toBe(false);
    expect(isNewGame(game({}), now)).toBe(false);
  });

  it('фильтр: все, новые, предмет', () => {
    const fresh = game({ addedAt: '2026-11-15', skills: ['music'] });
    expect(matchesFilter(fresh, 'all', now)).toBe(true);
    expect(matchesFilter(fresh, 'new', now)).toBe(true);
    expect(matchesFilter(fresh, 'creative', now)).toBe(true);
    expect(matchesFilter(fresh, 'math', now)).toBe(false);
    expect(matchesFilter(fresh, '3d', now)).toBe(false);
    expect(matchesFilter(game({ kind: '3d' }), '3d', now)).toBe(true);
  });
});
