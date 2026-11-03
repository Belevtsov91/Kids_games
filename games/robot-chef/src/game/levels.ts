// Уровни: от одной прямой дорожки до кухни со столами и повторами.
// `slots` — сколько команд помещается в программу; `repeat` — открыт ли повтор ×2/×3.
import { parseKitchen, type Kitchen } from './grid';

export interface Level {
  n: number;
  kitchen: Kitchen;
  slots: number;
  repeat: boolean;
}

const RAW: { map: string[]; slots: number; repeat?: boolean }[] = [
  { map: ['R.c.P'], slots: 6 },
  { map: ['R..', '..c', '..P'], slots: 6 },
  { map: ['R.t', '...', 'c.P'], slots: 10 },
  { map: ['R#P', '.#.', 'c..'], slots: 8 },
  { map: ['Rm..', '##.#', 'e...', '.#P.'], slots: 9 },
  { map: ['c...R', '.###.', '..t..', '.###.', 'P...o'], slots: 18 },
  { map: ['R....c', '#####.', 'P.....'], slots: 6, repeat: true },
  { map: ['R..t', '...#', 'c..#', '.#.P'], slots: 7, repeat: true },
  { map: ['R.....', '.####.', '.#..#.', 'k#P.#h', '......'], slots: 10, repeat: true },
  { map: ['R..m..', '.##.##', '......', '##.##.', 'e.....', 'P####.'], slots: 10, repeat: true },
  { map: ['c.#..p', '..#...', 'R...#.', '###.#.', 'P....o'], slots: 10, repeat: true },
  { map: ['R....#c', '.###...', '...#.#.', 't#...#.', '.#.###.', 'P.....h'], slots: 12, repeat: true },
];

export const LEVELS: Level[] = RAW.map((r, i) => ({
  n: i + 1,
  kitchen: parseKitchen(r.map),
  slots: r.slots,
  repeat: Boolean(r.repeat),
}));

export const levelAt = (n: number) => LEVELS[Math.min(Math.max(n, 1), LEVELS.length) - 1];
