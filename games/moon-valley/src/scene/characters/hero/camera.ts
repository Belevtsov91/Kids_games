// Камера от третьего лица: следует за героем и не проваливается в дома и деревья (луч Rapier от героя к камере).

import { Vector3, type Camera } from 'three';
import type { RapierRigidBody, useRapier } from '@react-three/rapier';
import type { Runtime } from '../../../app/runtime';

type Physics = Pick<ReturnType<typeof useRapier>, 'world' | 'rapier'>;

const camTarget = new Vector3();
const camPos = new Vector3();
const look = new Vector3();

export function followCamera(
  camera: Camera,
  { world, rapier }: Physics,
  runtime: Runtime,
  rb: RapierRigidBody,
  position: { x: number; y: number; z: number },
  camDist: { current: number },
  delta: number,
) {
  const yaw = runtime.camYaw;
  const pitch = runtime.camPitch;
  camTarget.set(position.x, Math.max(0, position.y) + 1.25, position.z);
  // Камера не проваливается в дома и деревья: луч от героя к камере.
  const dir = { x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
  const hit = world.castRay(new rapier.Ray(camTarget, dir), runtime.camDist, true, undefined, undefined, undefined, rb);
  const wanted = hit ? Math.max(1.6, hit.timeOfImpact - 0.35) : runtime.camDist;
  camDist.current += (wanted - camDist.current) * Math.min(1, delta * (wanted < camDist.current ? 14 : 3));
  const dist = camDist.current;
  camPos.set(
    camTarget.x + Math.sin(yaw) * Math.cos(pitch) * dist,
    camTarget.y + Math.sin(pitch) * dist,
    camTarget.z + Math.cos(yaw) * Math.cos(pitch) * dist,
  );
  const follow = 1 - Math.exp(-delta * 7);
  camera.position.lerp(camPos, follow);
  look.lerp(camTarget, follow);
  if (look.lengthSq() === 0) look.copy(camTarget);
  camera.lookAt(look);
}
