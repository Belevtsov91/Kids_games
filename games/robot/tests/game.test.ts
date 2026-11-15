import { describe, expect, it } from 'vitest';
import { hintFor } from '../src/game/hint';
import { introduces, LEVELS } from '../src/game/levels';
import { parseIsland, turn } from '../src/game/map';
import { at, canNestBlock, insert, make, nextTimes, remove, size, update, type Cmd } from '../src/game/program';
import { run } from '../src/game/run';

const F: Cmd = { k: 'fwd' };
const R: Cmd = { k: 'right' };
const loop = (n: number, ...body: Cmd[]): Cmd => ({ k: 'loop', n, body });

describe('остров', () => {
  it('разбирает карту и поворачивает', () => {
    const m = parseIsland(['Rb.T', '~#..'], 's');
    expect(m.start).toEqual({ x: 0, y: 0 });
    expect(m.heading).toBe('s');
    expect(m.friends).toEqual([{ id: 'bear', pos: { x: 3, y: 0 } }]);
    expect(m.water.has('0,1') && m.trees.has('1,1')).toBe(true);
    expect(turn('n', 'left')).toBe('w');
    expect(turn('w', 'right')).toBe('n');
    expect(() => parseIsland(['RbbT'])).toThrow();
  });
});

describe('программа', () => {
  it('кладёт команды в блоки и убирает их', () => {
    let p = insert([], [], make('loop'));
    p = insert(p, [0], F);
    p = insert(p, [0], make('if'));
    p = insert(p, [0, 1], R);
    expect(size(p)).toBe(4);
    expect(at(p, [0, 1, 0])).toEqual(R);
    expect(canNestBlock([0, 1])).toBe(false);
    expect(insert(p, [0, 1], make('loop'))).toEqual(p);
    expect(size(remove(p, [0, 1]))).toBe(2);
    expect(update(p, [0], (c) => c.k === 'loop' && (c.n = 5))[0]).toMatchObject({ n: 5 });
  });
  it('число повторов по кругу', () => {
    expect(nextTimes(2, false)).toBe(3);
    expect(nextTimes(9, false)).toBe(2);
    expect(nextTimes(9, true)).toBe(0);
    expect(nextTimes(0, true)).toBe(2);
  });
});

describe('исполнитель', () => {
  const m = parseIsland(['Rb.T']);
  it('доставка, удар, не хватило команд, бесконечный круг', () => {
    expect(run(m, [loop(3, F)]).outcome).toBe('win');
    expect(run(m, [R, F]).outcome).toBe('bump');
    expect(run(m, [F, F]).outcome).toBe('undelivered');
    expect(run(m, [loop(0, R)]).outcome).toBe('too-long');
    expect(run(m, [loop(0)]).outcome).toBe('too-long');
  });
  it('не отдаёт посылку, пока её не подобрал', () => {
    const r = run(parseIsland(['RTb']), [F, F]);
    expect(r.outcome).toBe('undelivered');
    expect(r.steps[0]).toMatchObject({ kind: 'move', delivered: null });
  });
  it('условие смотрит вперёд', () => {
    const r = run(parseIsland(['RbT']), [loop(0, { k: 'if', cond: 'free', body: [F] })]);
    expect(r.outcome).toBe('win');
    expect(r.steps.filter((s) => s.kind === 'check')).toHaveLength(2);
  });
});

describe('подсказка', () => {
  const sample = [loop(4, F, R)];
  it('оставляет верное начало и показывает следующую команду', () => {
    expect(hintFor(sample, [])).toEqual({ program: [], container: [], next: 'loop' });
    expect(hintFor(sample, [loop(2, F, F)])).toEqual({ program: [loop(4, F)], container: [0], next: 'right' });
    expect(hintFor(sample, [loop(4, F, R), F]).next).toBeNull();
  });
});

describe('уровни', () => {
  it.each(LEVELS.map((l) => [l.n, l] as const))('уровень %i: решение проходит и влезает', (_, level) => {
    expect(run(level.island, level.sample).outcome).toBe('win');
    expect(size(level.sample)).toBeLessThanOrEqual(level.slots);
    const kinds = JSON.stringify(level.sample).match(/"k":"(\w+)"/g)!.map((s) => s.slice(5, -1));
    expect(kinds.every((k) => level.tools.includes(k as never))).toBe(true);
  });
  it('главы вводят новые блоки', () => {
    expect(introduces(5)).toBe('loop');
    expect(introduces(9)).toBe('if');
    expect(introduces(3)).toBeNull();
  });
});
