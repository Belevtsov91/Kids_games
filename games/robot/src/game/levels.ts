// Уровни: три главы. 1–4 — просто команды, 5–8 — «повтори», 9–12 — «если» и «пока не доставлю».
// `slots` — сколько клеточек в программе; `sample` — одно из решений (по нему строится подсказка, его проверяют тесты).
import { parseIsland, type Heading, type Island } from './map';
import { UNTIL_DONE, type Cmd, type Kind } from './program';

export interface Level {
  n: number;
  island: Island;
  slots: number;
  /** Какие команды есть в палитре. */
  tools: readonly Kind[];
  sample: Cmd[];
}

const F: Cmd = { k: 'fwd' };
const L: Cmd = { k: 'left' };
const R: Cmd = { k: 'right' };
const loop = (n: number, ...body: Cmd[]): Cmd => ({ k: 'loop', n, body });
const ifWall = (...body: Cmd[]): Cmd => ({ k: 'if', cond: 'wall', body });
const ifFree = (...body: Cmd[]): Cmd => ({ k: 'if', cond: 'free', body });

const MOVES: Kind[] = ['fwd', 'left', 'right'];
const LOOPS: Kind[] = [...MOVES, 'loop'];
const ALL: Kind[] = [...LOOPS, 'if'];

const RAW: { map: string[]; heading?: Heading; slots: number; tools: Kind[]; sample: Cmd[] }[] = [
  // Глава 1: вперёд, налево, направо.
  { map: ['Rb..T'], slots: 6, tools: MOVES, sample: [F, F, F, F] },
  { map: ['..T', '.#.', 'Rb.'], slots: 7, tools: MOVES, sample: [F, F, L, F, F] },
  { map: ['Rb.', '##.', 'T..'], slots: 10, tools: MOVES, sample: [F, F, R, F, F, R, F, F] },
  { map: ['RbT.', '###.', 'Zb..'], slots: 12, tools: MOVES, sample: [F, F, F, R, F, F, R, F, F, F] },
  // Глава 2: повтори.
  { map: ['Rb......T'], slots: 3, tools: LOOPS, sample: [loop(8, F)] },
  { map: ['####T', '###..', '##..#', '#..##', 'Rb###'], slots: 6, tools: LOOPS, sample: [loop(4, F, L, F, R)] },
  { map: ['Rb.T', '.~~.', '.~~.', 'Z.b.'], slots: 5, tools: LOOPS, sample: [loop(4, F, F, F, R)] },
  {
    map: ['R.b..T', '.~~~~.', 'H~~~~b', '.~~~~.', 'b~~~~.', '...Z..'],
    slots: 5,
    tools: LOOPS,
    sample: [loop(4, loop(5, F), R)],
  },
  // Глава 3: если впереди стена / путь свободен.
  { map: ['R..b.', '####.', 'T....'], slots: 6, tools: ALL, sample: [loop(UNTIL_DONE, ifFree(F), ifWall(R))] },
  {
    map: ['Rb....', '#####.', '..T.#.', '.####b', '..Z...'],
    slots: 6,
    tools: ALL,
    sample: [loop(UNTIL_DONE, ifFree(F), ifWall(R))],
  },
  {
    map: ['....bR', '.#####', '.#.T..', 'b####.', '...Z..'],
    heading: 'w',
    slots: 6,
    tools: ALL,
    sample: [loop(UNTIL_DONE, ifFree(F), ifWall(L))],
  },
  {
    map: ['####T#Z#H#', 'Rbbb......', '~~~~~~~~~~'],
    slots: 12,
    tools: ALL,
    sample: [loop(3, F), loop(3, F, L, F, R, R, F, L, F)],
  },
];

export const LEVELS: Level[] = RAW.map((r, i) => ({
  n: i + 1,
  island: parseIsland(r.map, r.heading),
  slots: r.slots,
  tools: r.tools,
  sample: r.sample,
}));

export const levelAt = (n: number) => LEVELS[Math.min(Math.max(n, 1), LEVELS.length) - 1];

/** Первый уровень главы — на нём робот рассказывает про новую команду. */
export const introduces = (n: number): Kind | null => {
  const now = LEVELS[n - 1]?.tools ?? [];
  const before = LEVELS[n - 2]?.tools ?? MOVES;
  return now.find((t) => !before.includes(t)) ?? null;
};
