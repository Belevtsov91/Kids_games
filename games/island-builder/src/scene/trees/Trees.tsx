// Деревья: вырастают с пружинкой и покачиваются на ветру.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { cellToWorld, parseKey, type Cell, type TreeKind, type World } from '../../game/world';
import { isTap, toVec } from '../pointer';
import type { TapTarget } from '../types';
import { TreeModel } from './TreeModel';

export function Trees({ trees, onTap }: { trees: World['trees']; onTap(target: TapTarget): void }) {
  return (
    <>
      {[...trees].map(([key, kind]) => (
        <Tree key={key} cell={parseKey(key)} kind={kind} onTap={onTap} />
      ))}
    </>
  );
}

export function Tree({ cell, kind, onTap }: { cell: Cell; kind: TreeKind; onTap(target: TapTarget): void }) {
  const group = useRef<Group>(null);
  const born = useRef(-1);
  const phase = useMemo(() => cell.x * 1.7 + cell.z * 2.3, [cell.x, cell.z]);
  const [wx, , wz] = cellToWorld(cell);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (born.current < 0) born.current = t;
    // Вырастает с лёгким «пружинящим» перехлёстом, потом покачивается на ветру.
    const age = Math.min(1, (t - born.current) / 0.45);
    const grow = age < 1 ? 1 - Math.cos(age * Math.PI * 1.5) * (1 - age) : 1;
    g.scale.setScalar(Math.max(0.01, grow));
    g.rotation.z = Math.sin(t * 1.3 + phase) * 0.04;
    g.rotation.x = Math.cos(t * 1.1 + phase) * 0.03;
  });

  return (
    <group
      ref={group}
      position={[wx, cell.y, wz]}
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        onTap({ kind: 'tree', cell, point: toVec(e.point) });
      }}
    >
      <TreeModel kind={kind} />
    </group>
  );
}
