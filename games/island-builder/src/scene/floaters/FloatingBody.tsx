// Лодки и ящики: физические тела, которые держатся на воде и сносятся ветром.
import { useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { Quaternion, Vector3 } from 'three';
import type { Tool } from '../../game/blocks';
import { WATER_Y } from '../../game/world';
import { isTap } from '../pointer';
import type { Floater } from '../types';
import { BoatModel } from './BoatModel';
import { CrateModel } from './CrateModel';

const UP = new Vector3(0, 1, 0);
const WIND = { x: 0.25, z: 0.12 };

export function FloatingBody({
  floater,
  paused,
  tool,
  onGone,
  onPush,
  onLand,
}: {
  floater: Floater;
  paused: boolean;
  tool: Tool;
  onGone(id: number): void;
  onPush(): void;
  onLand(): void;
}) {
  const body = useRef<RapierRigidBody>(null);
  const gone = useRef(false);
  const landed = useRef(false);
  const camera = useThree((s) => s.camera);
  const boat = floater.kind === 'boat';
  const halfHeight = boat ? 0.2 : 0.4;
  const temp = useMemo(() => ({ q: new Quaternion(), up: new Vector3(), torque: new Vector3() }), []);

  useFrame((_, rawDt) => {
    const b = body.current;
    if (!b || paused || gone.current) return;
    const dt = Math.min(rawDt, 1 / 30);
    const p = b.translation();
    if (p.y < -4 || Math.abs(p.x) > 70 || Math.abs(p.z) > 70) {
      gone.current = true;
      onGone(floater.id);
      return;
    }
    // Архимед: чем глубже погружено тело, тем сильнее его выталкивает.
    const submerged = Math.min(1, Math.max(0, (WATER_Y - (p.y - halfHeight)) / (halfHeight * 2)));
    if (submerged <= 0) return;
    const m = b.mass();
    const v = b.linvel();
    const lift = (boat ? 2.1 : 1.7) * 9.81 * submerged;
    const drag = 1.6 * submerged;
    const wind = boat ? 1 : 0.3;
    b.applyImpulse(
      { x: (WIND.x * wind - v.x * drag) * m * dt, y: (lift - v.y * drag * 1.5) * m * dt, z: (WIND.z * wind - v.z * drag) * m * dt },
      true,
    );
    // Неваляшка: лодка сама выравнивается.
    const r = b.rotation();
    temp.q.set(r.x, r.y, r.z, r.w);
    temp.up.copy(UP).applyQuaternion(temp.q);
    temp.torque.crossVectors(temp.up, UP).multiplyScalar((boat ? 2.5 : 0.6) * m * dt * submerged);
    b.applyTorqueImpulse({ x: temp.torque.x, y: 0, z: temp.torque.z }, true);
  });

  const push = (e: ThreeEvent<MouseEvent>) => {
    if (!isTap(e) || tool === 'crate') return;
    e.stopPropagation();
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    const dir = new Vector3(p.x - camera.position.x, 0, p.z - camera.position.z).normalize();
    const m = b.mass();
    b.applyImpulse({ x: dir.x * 4 * m, y: 1.2 * m, z: dir.z * 4 * m }, true);
    onPush();
  };

  return (
    <RigidBody
      ref={body}
      position={floater.pos}
      rotation={[0, floater.rot, 0]}
      colliders={false}
      angularDamping={boat ? 1.2 : 0.6}
      linearDamping={0.15}
      onCollisionEnter={() => {
        if (!boat && !landed.current) {
          landed.current = true;
          onLand();
        }
      }}
    >
      {boat ? (
        <CuboidCollider args={[0.45, 0.2, 0.9]} density={0.6} />
      ) : (
        <CuboidCollider args={[0.4, 0.4, 0.4]} density={0.35} friction={0.8} />
      )}
      <group onClick={push}>{boat ? <BoatModel color={floater.color} /> : <CrateModel />}</group>
    </RigidBody>
  );
}
