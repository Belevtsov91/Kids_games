import { emptyPattern, fromSteps, SWING_ON, type Groove } from './pattern';

// Заготовки: с них удобно начать и посмотреть, как устроен ритм. Строки — 16 шагов, x — удар.

export type PresetId = 'basic' | 'hiphop' | 'dance' | 'reggae';
export const PRESET_IDS: PresetId[] = ['basic', 'hiphop', 'dance', 'reggae'];

type Rows = Partial<Record<number, string>>;

const RAW: Record<PresetId, { bpm: number; swing: number; rows: Rows }> = {
  basic: {
    bpm: 100,
    swing: 0,
    rows: {
      0: 'x.......x.......',
      1: '....x.......x...',
      2: 'x.x.x.x.x.x.x.x.',
      4: 'x.......x.......',
    },
  },
  hiphop: {
    bpm: 88,
    swing: SWING_ON,
    rows: {
      0: 'x......x..x.....',
      1: '....x.......x...',
      2: 'x.xxx.x.x.xxx.x.',
      4: 'x......x..x.....',
      8: 'x...............',
      9: '........x.......',
      15: '..............x.',
    },
  },
  dance: {
    bpm: 124,
    swing: 0,
    rows: {
      0: 'x...x...x...x...',
      3: '....x.......x...',
      2: '..x...x...x...x.',
      6: 'x.x...x.x.x...x.',
      10: '..x.....x.....x.',
      13: '...............x',
    },
  },
  reggae: {
    bpm: 76,
    swing: 0,
    rows: {
      0: '........x.......',
      1: '........x.......',
      2: 'x.x.x.x.x.x.x.x.',
      4: 'x.....x.....x...',
      8: '....x.......x...',
      14: 'x...............',
    },
  },
};

export function preset(id: PresetId): Groove {
  const { bpm, swing, rows } = RAW[id];
  const pattern = emptyPattern();
  for (const [pad, steps] of Object.entries(rows)) pattern[Number(pad)] = fromSteps(steps!);
  return { bpm, swing, pattern };
}
