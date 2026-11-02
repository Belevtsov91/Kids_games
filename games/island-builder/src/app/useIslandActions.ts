import { useState } from 'react';
import { BLOCKS, type Tool } from '../game/blocks';
import {
  GRID,
  MAX_TREES,
  applyChanges,
  columnHeight,
  emptyWorld,
  flatIsland,
  generateIsland,
  paintBlock,
  placeBlock,
  plantTree,
  removeBlock,
  removeTree,
  worldToCell,
  type BlockType,
  type Cell,
  type Change,
  type Stats,
  type TreeKind,
} from '../game/world';
import { sound } from '../audio/sound';
import type { TapTarget } from '../scene/types';
import type { IslandState } from './useIslandSave';
import type { SceneObjects } from './useSceneObjects';

// Что происходит по нажатию на сцену с выбранным инструментом, а также «Отменить», день/ночь и новый остров.

const HISTORY = 100;

export type NewIslandKind = 'random' | 'flat' | 'empty';

interface Options {
  island: IslandState;
  objects: SceneObjects;
  tool: Tool;
  material: BlockType;
  treeKind: TreeKind;
  showHint(text: string): void;
}

export function useIslandActions({ island, objects, tool, material, treeKind, showHint }: Options) {
  const { world, setWorld, setStats, setNight } = island;
  const { puff, spawn } = objects;
  const [past, setPast] = useState<Change[][]>([]);

  const commit = (changes: Change[]) => {
    if (!changes.length) return false;
    setWorld((w) => applyChanges(w, changes));
    setPast((p) => [...p.slice(-(HISTORY - 1)), changes]);
    return true;
  };

  const bump = (key: keyof Stats) => setStats((s) => ({ ...s, [key]: s[key] + 1 }));

  const build = (target: TapTarget) => {
    let cell: Cell | null = null;
    if (target.kind === 'block') cell = { x: target.cell.x + target.normal.x, y: target.cell.y + target.normal.y, z: target.cell.z + target.normal.z };
    else if (target.kind === 'seabed') cell = { ...worldToCell(target.point[0], 0, target.point[2]), y: 0 };
    if (!cell || !commit(placeBlock(world, cell, material))) return false;
    bump('placed');
    sound.place(BLOCKS[material].pitch);
    puff(cell, BLOCKS[material].top);
    return true;
  };

  const paint = (target: TapTarget) => {
    if (target.kind !== 'block' || !commit(paintBlock(world, target.cell, material))) return false;
    bump('painted');
    sound.paint();
    puff(target.cell, BLOCKS[material].top);
    return true;
  };

  const dig = (target: TapTarget) => {
    const changes = target.kind === 'block' ? removeBlock(world, target.cell) : target.kind === 'tree' ? removeTree(world, target.cell) : [];
    if (!commit(changes)) return false;
    if (target.kind === 'block') {
      bump('dug');
      puff(target.cell, BLOCKS[world.blocks.get(changes[0].key) as BlockType].side);
    } else if (target.kind === 'tree') puff(target.cell, '#4cbb4c');
    sound.dig();
    return true;
  };

  const plant = (target: TapTarget) => {
    if (target.kind !== 'block' || target.normal.y !== 1) return false;
    const cell = { ...target.cell, y: target.cell.y + 1 };
    if (world.trees.size >= MAX_TREES) {
      showHint('Деревьев уже очень много — выкопай какое-нибудь');
      return false;
    }
    if (!commit(plantTree(world, cell, treeKind))) return false;
    bump('planted');
    sound.plant();
    puff(cell, '#7be07b');
    return true;
  };

  const launchBoat = (target: TapTarget) => {
    if (target.kind === 'water') {
      const cell = worldToCell(target.point[0], 0, target.point[2]);
      const onIsland = cell.x >= 0 && cell.x < GRID && cell.z >= 0 && cell.z < GRID && columnHeight(world, cell.x, cell.z) > 0;
      if (!onIsland) {
        spawn('boat', [target.point[0], 1.6, target.point[2]]);
        bump('boats');
        sound.boat();
        return true;
      }
    }
    showHint('Лодку можно спустить только на воду');
    return false;
  };

  const dropCrate = (target: TapTarget) => {
    spawn('crate', [target.point[0], 10, target.point[2]]);
    bump('crates');
    sound.crate();
    return true;
  };

  const byTool: Record<Tool, (target: TapTarget) => boolean> = {
    build,
    paint,
    dig,
    tree: plant,
    boat: launchBoat,
    crate: dropCrate,
  };

  const handleTap = (target: TapTarget) => {
    if (!byTool[tool](target)) sound.denied();
  };

  const undo = () => {
    const last = past[past.length - 1];
    if (!last) return sound.denied();
    setPast((p) => p.slice(0, -1));
    setWorld((w) => applyChanges(w, last, true));
    sound.undo();
  };

  const toggleNight = () => {
    setNight((n) => {
      sound.dayNight(!n);
      return !n;
    });
  };

  const newIsland = (kind: NewIslandKind) => {
    setWorld(kind === 'random' ? generateIsland(Math.floor(Math.random() * 100000)) : kind === 'flat' ? flatIsland() : emptyWorld());
    setPast([]);
    objects.clearFloaters();
    sound.dayNight(false);
  };

  return { canUndo: past.length > 0, handleTap, undo, toggleNight, newIsland };
}
