// Уровни Эко-города: от одного домика под солнцем до целого квартала в облачную ветреную ночь.
import type { Level } from './types';

export const LEVELS: readonly Level[] = [
  {
    id: 1,
    key: 'school',
    map: ['t....t', '..s...', '......', '~....~'],
    tools: ['solar'],
    sun: 1,
    wind: 'none',
    budget: 9,
  },
  {
    id: 2,
    key: 'firstNight',
    map: ['t.....', '..h...', '......', '~~...t'],
    tools: ['solar', 'battery'],
    sun: 1,
    wind: 'none',
    budget: 18,
  },
  {
    id: 3,
    key: 'breeze',
    map: ['^...t.', '..h...', '.h....', '~~..^.'],
    tools: ['wind', 'battery'],
    sun: 1,
    wind: 'night',
    budget: 26,
  },
  {
    id: 4,
    key: 'mix',
    map: ['t..^..', '.h..h.', '...s..', '~....t'],
    tools: ['solar', 'wind', 'battery'],
    sun: 1,
    wind: 'night',
    budget: 24,
  },
  {
    id: 5,
    key: 'clouds',
    map: ['^^..tt', '.h..h.', '..h...', '~~..~~'],
    tools: ['solar', 'wind', 'battery'],
    sun: 0.5,
    wind: 'steady',
    budget: 30,
  },
  {
    id: 6,
    key: 'tower',
    map: ['tt..^.', '..H...', '.....^', '~.t...'],
    tools: ['solar', 'wind', 'battery'],
    sun: 1,
    wind: 'morning',
    budget: 30,
  },
  {
    id: 7,
    key: 'gusts',
    map: ['^.tt.^', '.h..h.', '..s...', '^.h..~'],
    tools: ['solar', 'wind', 'battery'],
    sun: 1,
    wind: 'gusty',
    budget: 30,
  },
  {
    id: 8,
    key: 'city',
    map: ['^t..t^', '.h.H..', '..s.h.', '~^..t~'],
    tools: ['solar', 'wind', 'battery'],
    sun: 0.5,
    wind: 'night',
    budget: 48,
  },
];

export const levelById = (id: number) => LEVELS.find((l) => l.id === id);
