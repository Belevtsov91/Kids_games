import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { cellToWorld, columns, type World } from '../../game/world';

/** Коллайдеры острова: дно и по столбу на каждую клетку. */
export function Terrain({ world }: { world: World }) {
  const cols = useMemo(() => columns(world), [world]);
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[90, 0.5, 90]} position={[0, -0.5, 0]} />
      {cols.map(({ x, z, height }) => {
        const [wx, , wz] = cellToWorld({ x, y: 0, z });
        return <CuboidCollider key={`${x},${z},${height}`} args={[0.5, height / 2, 0.5]} position={[wx, height / 2, wz]} />;
      })}
    </RigidBody>
  );
}
