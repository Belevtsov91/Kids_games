// Программа робота: команды «вперёд / налево / направо» и блоки «повтори» и «если».
// Блок держит внутри другие команды. Адрес команды — путь индексов: [2, 0] — первая команда внутри третьей.

export type Cond = 'wall' | 'free';
export type Cmd =
  | { k: 'fwd' }
  | { k: 'left' }
  | { k: 'right' }
  /** n — сколько раз (2–9); 0 — «пока не доставлю всё». */
  | { k: 'loop'; n: number; body: Cmd[] }
  | { k: 'if'; cond: Cond; body: Cmd[] };
export type Kind = Cmd['k'];
export type Path = readonly number[];

/** Блок внутри блока — можно, а глубже — уже нет: малышам хватает двух уровней. */
export const MAX_DEPTH = 2;
export const MAX_TIMES = 9;
export const UNTIL_DONE = 0;

export const isBlock = (c: Cmd): c is Extract<Cmd, { body: Cmd[] }> => c.k === 'loop' || c.k === 'if';

/** Новая команда по виду: повтор начинается с ×2, условие — с «впереди стена». */
export function make(kind: Kind): Cmd {
  if (kind === 'loop') return { k: 'loop', n: 2, body: [] };
  if (kind === 'if') return { k: 'if', cond: 'wall', body: [] };
  return { k: kind };
}

/** Команда по адресу или undefined. */
export function at(program: readonly Cmd[], path: Path): Cmd | undefined {
  let list: readonly Cmd[] = program;
  let cmd: Cmd | undefined;
  for (const i of path) {
    cmd = list[i];
    if (!cmd) return undefined;
    list = isBlock(cmd) ? cmd.body : [];
  }
  return cmd;
}

/** Список, куда кладём новые команды: корень программы или тело блока. */
function bodyOf(program: Cmd[], path: Path): Cmd[] | null {
  if (!path.length) return program;
  const cmd = at(program, path);
  return cmd && isBlock(cmd) ? cmd.body : null;
}

/** Можно ли положить блок в контейнер по этому адресу. */
export const canNestBlock = (container: Path) => container.length < MAX_DEPTH;

/** Добавить команду в конец контейнера. Возвращает новую программу (старая не меняется). */
export function insert(program: readonly Cmd[], container: Path, cmd: Cmd): Cmd[] {
  const next = structuredClone(program) as Cmd[];
  if (isBlock(cmd) && !canNestBlock(container)) return next;
  bodyOf(next, container)?.push(cmd);
  return next;
}

/** Убрать команду (вместе с её телом, если это блок). */
export function remove(program: readonly Cmd[], path: Path): Cmd[] {
  const next = structuredClone(program) as Cmd[];
  const list = bodyOf(next, path.slice(0, -1));
  if (list && path.length) list.splice(path[path.length - 1], 1);
  return next;
}

/** Поменять блок по адресу (число повторов или условие). */
export function update(program: readonly Cmd[], path: Path, change: (c: Cmd) => void): Cmd[] {
  const next = structuredClone(program) as Cmd[];
  const cmd = at(next, path);
  if (cmd) change(cmd);
  return next;
}

/** Следующее число повторов по кругу: 2 → 3 → … → 9 → (∞, если открыто) → 2. */
export function nextTimes(n: number, withUntil: boolean): number {
  if (n === UNTIL_DONE) return 2;
  if (n >= MAX_TIMES) return withUntil ? UNTIL_DONE : 2;
  return n + 1;
}

export const flipCond = (c: Cond): Cond => (c === 'wall' ? 'free' : 'wall');

/** Сколько клеточек занимает программа: каждая команда и каждый блок — по одной. */
export const size = (program: readonly Cmd[]): number =>
  program.reduce((sum, c) => sum + 1 + (isBlock(c) ? size(c.body) : 0), 0);

/** Одинаковые ли программы (для подсказки). */
export const same = (a: Cmd | undefined, b: Cmd | undefined) => JSON.stringify(a) === JSON.stringify(b);
