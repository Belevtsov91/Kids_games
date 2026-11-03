// Физика мира (Rapier): неподвижные коллайдеры земли, озера, домов (по настоящим габаритам модели),
// мебели, деревьев, жителей, обелисков, забора и сундуков. Герой в них упирается.

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import { Box3 } from 'three';
import { BUILDINGS, CHESTS, FENCES, LAKE, NPCS, OBELISKS, PROPS, type Placed } from '../../game/world';
import { modelUrl } from '../models';

/** Коллайдер дома по его настоящим габаритам. */
function BuildingCollider({ item }: { item: Placed }) {
  const { scene } = useGLTF(modelUrl(item.model));
  const box = useMemo(() => new Box3().setFromObject(scene), [scene]);
  const s = item.scale ?? 1;
  const w = (box.max.x - box.min.x) * s * 0.46;
  const d = (box.max.z - box.min.z) * s * 0.46;
  const cx = ((box.max.x + box.min.x) / 2) * s;
  const cz = ((box.max.z + box.min.z) / 2) * s;
  const rot = item.rot ?? 0;
  const x = item.at[0] + cx * Math.cos(rot) + cz * Math.sin(rot);
  const z = item.at[1] - cx * Math.sin(rot) + cz * Math.cos(rot);
  return <CuboidCollider args={[w, 3, d]} position={[x, 3, z]} rotation={[0, rot, 0]} />;
}

export function Colliders({ trees }: { trees: Placed[] }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Земля */}
      <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} />
      {/* Озеро: в воду не заходим */}
      <CylinderCollider args={[2, LAKE.radius - 0.6]} position={[LAKE.center[0], 1, LAKE.center[1]]} />
      {BUILDINGS.map((item, index) => (
        <BuildingCollider key={index} item={item} />
      ))}
      {[...PROPS, ...trees].map((item, index) =>
        item.collider && 'r' in item.collider ? (
          <CylinderCollider key={index} args={[4, item.collider.r]} position={[item.at[0], 4, item.at[1]]} />
        ) : item.collider ? (
          <CuboidCollider
            key={index}
            args={[item.collider.w / 2, 2, item.collider.d / 2]}
            position={[item.at[0], 2, item.at[1]]}
            rotation={[0, item.rot ?? 0, 0]}
          />
        ) : null,
      )}
      {NPCS.map((npc) => (
        <CylinderCollider key={npc.id} args={[1, 0.45]} position={[npc.at[0], 1, npc.at[1]]} />
      ))}
      {OBELISKS.map((at, index) => (
        <CylinderCollider key={index} args={[1.5, 0.45]} position={[at[0], 1.5, at[1]]} />
      ))}
      {FENCES.map(([a, b], index) => {
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        return (
          <CuboidCollider
            key={index}
            args={[length / 2, 0.6, 0.12]}
            position={[(a[0] + b[0]) / 2, 0.6, (a[1] + b[1]) / 2]}
            rotation={[0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0]}
          />
        );
      })}
      {CHESTS.map((chest) => (
        <CuboidCollider key={chest.id} args={[0.55, 0.5, 0.4]} position={[chest.at[0], 0.5, chest.at[1]]} rotation={[0, chest.rot, 0]} />
      ))}
    </RigidBody>
  );
}
