// Блоки острова: по одному InstancedMesh на тип, чтобы тысячи кубиков рисовались быстро.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Color, Matrix4, type BoxGeometry, type InstancedMesh, type MeshStandardMaterial } from 'three';
import { BLOCKS } from '../../game/blocks';
import { BLOCK_TYPES, cellToWorld, parseKey, type BlockType, type Cell, type World } from '../../game/world';
import { isTap, toVec } from '../pointer';
import type { TapTarget } from '../types';
import { blockGeometry, blockMaterial, shade } from './blockAssets';

interface BlockEvents {
  onTap(target: TapTarget): void;
  onHover(target: TapTarget | null): void;
}

export function Blocks({ world, night, ...events }: { world: World; night: boolean } & BlockEvents) {
  const assets = useMemo(
    () => Object.fromEntries(BLOCK_TYPES.map((type) => [type, { geometry: blockGeometry(BLOCKS[type]), material: blockMaterial(BLOCKS[type]) }])) as Record<
      BlockType,
      { geometry: BoxGeometry; material: MeshStandardMaterial }
    >,
    [],
  );
  useEffect(
    () => () => {
      for (const { geometry, material } of Object.values(assets)) {
        geometry.dispose();
        material.dispose();
      }
    },
    [assets],
  );

  const groups = useMemo(() => {
    const byType = Object.fromEntries(BLOCK_TYPES.map((t) => [t, [] as Cell[]])) as Record<BlockType, Cell[]>;
    for (const [key, type] of world.blocks) byType[type].push(parseKey(key));
    return byType;
  }, [world.blocks]);

  // Фонари разгораются ночью.
  const glow = useRef(night ? 1 : 0);
  useFrame((state, dt) => {
    glow.current += ((night ? 1 : 0) - glow.current) * Math.min(1, dt * 2.5);
    assets.lantern.material.emissiveIntensity = 0.4 + glow.current * (1.8 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
  });

  return (
    <>
      {BLOCK_TYPES.map((type) => (
        <BlockLayer key={type} cells={groups[type]} {...assets[type]} transparent={!!BLOCKS[type].transparent} {...events} />
      ))}
    </>
  );
}

export function BlockLayer({
  cells,
  geometry,
  material,
  transparent,
  onTap,
  onHover,
}: { cells: Cell[]; geometry: BoxGeometry; material: MeshStandardMaterial; transparent: boolean } & BlockEvents) {
  const ref = useRef<InstancedMesh>(null);
  // Ёмкость растёт ступенями: пересоздавать меш на каждый блок незачем.
  const capacity = Math.max(64, Math.ceil(cells.length / 128) * 128);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const color = new Color();
    cells.forEach((cell, i) => {
      matrix.makeTranslation(...cellToWorld(cell));
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.setScalar(shade(cell)));
    });
    mesh.count = cells.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [cells, capacity]);

  const target = (e: ThreeEvent<PointerEvent | MouseEvent>): TapTarget | null => {
    const cell = e.instanceId === undefined ? undefined : cells[e.instanceId];
    if (!cell || !e.face) return null;
    const n = e.face.normal;
    return { kind: 'block', cell, normal: { x: Math.round(n.x), y: Math.round(n.y), z: Math.round(n.z) }, point: toVec(e.point) };
  };

  return (
    <instancedMesh
      key={capacity}
      ref={ref}
      args={[geometry, material, capacity]}
      castShadow={!transparent}
      receiveShadow
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        const t = target(e);
        if (t) onTap(t);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover(e.pointerType === 'touch' ? null : target(e));
      }}
      onPointerOut={() => onHover(null)}
    />
  );
}
