import { describe, expect, it } from 'vitest';
import {
  GRID,
  MAX_HEIGHT,
  applyChanges,
  cellKey,
  cellToWorld,
  columnHeight,
  columns,
  deserialize,
  emptyStats,
  emptyWorld,
  flatIsland,
  generateIsland,
  maxHeight,
  paintBlock,
  placeBlock,
  plantTree,
  removeBlock,
  serialize,
  worldToCell,
  type World,
} from '../src/game/world';

const build = (world: World, ...cells: [number, number, number][]) =>
  cells.reduce((w, [x, y, z]) => applyChanges(w, placeBlock(w, { x, y, z }, 'grass')), world);

describe('блоки', () => {
  it('ставит блок в пустую клетку и не ставит в занятую или за пределами', () => {
    const w = build(emptyWorld(), [1, 0, 1]);
    expect(w.blocks.get(cellKey(1, 0, 1))).toBe('grass');
    expect(placeBlock(w, { x: 1, y: 0, z: 1 }, 'stone')).toEqual([]);
    expect(placeBlock(w, { x: -1, y: 0, z: 0 }, 'stone')).toEqual([]);
    expect(placeBlock(w, { x: 0, y: MAX_HEIGHT, z: 0 }, 'stone')).toEqual([]);
    expect(placeBlock(w, { x: GRID, y: 0, z: 0 }, 'stone')).toEqual([]);
  });

  it('отмена возвращает мир как был', () => {
    const before = build(emptyWorld(), [2, 0, 2]);
    const changes = placeBlock(before, { x: 2, y: 1, z: 2 }, 'brick');
    const after = applyChanges(before, changes);
    expect(after.blocks.size).toBe(2);
    const undone = applyChanges(after, changes, true);
    expect([...undone.blocks]).toEqual([...before.blocks]);
  });

  it('не мутирует исходный мир', () => {
    const w = emptyWorld();
    applyChanges(w, placeBlock(w, { x: 0, y: 0, z: 0 }, 'sand'));
    expect(w.blocks.size).toBe(0);
  });

  it('убирает блок вместе с деревом на нём, отмена возвращает оба', () => {
    let w = build(emptyWorld(), [3, 0, 3]);
    w = applyChanges(w, plantTree(w, { x: 3, y: 1, z: 3 }, 'pine'));
    expect(w.trees.size).toBe(1);
    const changes = removeBlock(w, { x: 3, y: 0, z: 3 });
    expect(changes).toHaveLength(2);
    const removed = applyChanges(w, changes);
    expect(removed.blocks.size + removed.trees.size).toBe(0);
    const back = applyChanges(removed, changes, true);
    expect(back.trees.get(cellKey(3, 1, 3))).toBe('pine');
    expect(back.blocks.get(cellKey(3, 0, 3))).toBe('grass');
  });

  it('перекрашивает, а камень под деревом убивает дерево', () => {
    let w = build(emptyWorld(), [4, 0, 4]);
    w = applyChanges(w, plantTree(w, { x: 4, y: 1, z: 4 }, 'round'));
    expect(paintBlock(w, { x: 4, y: 0, z: 4 }, 'grass')).toEqual([]);
    expect(paintBlock(w, { x: 4, y: 0, z: 4 }, 'snow')).toHaveLength(1);
    const stone = applyChanges(w, paintBlock(w, { x: 4, y: 0, z: 4 }, 'stone'));
    expect(stone.blocks.get(cellKey(4, 0, 4))).toBe('stone');
    expect(stone.trees.size).toBe(0);
  });
});

describe('деревья', () => {
  it('растут только на траве, песке и снеге и не в занятой клетке', () => {
    let w = build(emptyWorld(), [5, 0, 5]);
    w = applyChanges(w, placeBlock(w, { x: 6, y: 0, z: 6 }, 'stone'));
    expect(plantTree(w, { x: 5, y: 1, z: 5 }, 'palm')).toHaveLength(1);
    expect(plantTree(w, { x: 6, y: 1, z: 6 }, 'palm')).toEqual([]);
    expect(plantTree(w, { x: 7, y: 1, z: 7 }, 'palm')).toEqual([]);
    w = applyChanges(w, plantTree(w, { x: 5, y: 1, z: 5 }, 'palm'));
    expect(plantTree(w, { x: 5, y: 1, z: 5 }, 'pine')).toEqual([]);
    expect(placeBlock(w, { x: 5, y: 1, z: 5 }, 'stone')).toEqual([]);
  });
});

describe('высоты и коллайдеры', () => {
  it('считает высоту столба и общую высоту', () => {
    const w = build(emptyWorld(), [0, 0, 0], [0, 1, 0], [0, 4, 0], [1, 0, 1]);
    expect(columnHeight(w, 0, 0)).toBe(5);
    expect(columnHeight(w, 1, 1)).toBe(1);
    expect(columnHeight(w, 2, 2)).toBe(0);
    expect(maxHeight(w)).toBe(5);
    expect(columns(w).sort((a, b) => a.x - b.x)).toEqual([
      { x: 0, z: 0, height: 5 },
      { x: 1, z: 1, height: 1 },
    ]);
  });

  it('клетка ↔ мировые координаты', () => {
    const cell = { x: 3, y: 2, z: 17 };
    const [wx, wy, wz] = cellToWorld(cell);
    expect(worldToCell(wx, wy, wz)).toEqual(cell);
  });
});

describe('генератор', () => {
  it('один seed — один остров, разные seed — разные', () => {
    const a = generateIsland(42);
    const b = generateIsland(42);
    const c = generateIsland(7);
    expect([...a.blocks]).toEqual([...b.blocks]);
    expect([...a.blocks]).not.toEqual([...c.blocks]);
  });

  it('остров в границах, не упирается в потолок, деревья стоят на земле', () => {
    for (const seed of [1, 99, 12345]) {
      const w = generateIsland(seed);
      expect(w.blocks.size).toBeGreaterThan(50);
      expect(maxHeight(w)).toBeLessThanOrEqual(MAX_HEIGHT - 2);
      for (const key of w.trees.keys()) {
        const [x, y, z] = key.split(',').map(Number);
        expect(w.blocks.has(cellKey(x, y - 1, z))).toBe(true);
        expect(w.blocks.has(key)).toBe(false);
      }
    }
  });

  it('ровная поляна — один слой', () => {
    expect(maxHeight(flatIsland())).toBe(1);
  });
});

describe('сохранение', () => {
  it('serialize → deserialize без потерь', () => {
    const world = generateIsland(5);
    const stats = { ...emptyStats(), placed: 3, boats: 2 };
    const data = JSON.parse(JSON.stringify(serialize({ world, stats, night: true, achieved: ['builder'] })));
    const back = deserialize(data)!;
    expect([...back.world.blocks].sort()).toEqual([...world.blocks].sort());
    expect([...back.world.trees].sort()).toEqual([...world.trees].sort());
    expect(back.stats).toEqual(stats);
    expect(back.night).toBe(true);
    expect(back.achieved).toEqual(['builder']);
  });

  it('отбрасывает мусор вместо падения', () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize({ v: 2 })).toBeNull();
    const back = deserialize({
      v: 1,
      blocks: [[0, 0, 0, 0], [99, 0, 0, 0], [0, 0, 0.5, 1], [1, 1, 1, 42], 'oops'],
      trees: [[0, 0, 0, 0], [0, 1, 0, 1]],
      stats: { placed: -5, boats: 'many', crates: 4 },
      night: 'yes',
      achieved: ['ok', 5],
    })!;
    expect([...back.world.blocks.keys()]).toEqual(['0,0,0']);
    // Дерево в клетке с блоком отброшено, на блоке — осталось.
    expect([...back.world.trees.keys()]).toEqual(['0,1,0']);
    expect(back.stats).toEqual({ ...emptyStats(), crates: 4 });
    expect(back.night).toBe(false);
    expect(back.achieved).toEqual(['ok']);
  });
});
