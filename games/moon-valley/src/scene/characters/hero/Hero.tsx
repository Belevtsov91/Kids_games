// Герой: капсула Rapier (не проходит сквозь дома и деревья), движение относительно камеры, прыжок,
// отбрасывание от ударов, мигание и волна света от взмаха жезлом.
// Рядом: look.ts — наряд и жезл, animation.ts — выбор анимации, camera.ts — камера от третьего лица.

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import { Sparkles } from '@react-three/drei';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { HERO_SPAWN, WALK_RADIUS } from '../../../game/world';
import { useRuntime } from '../../../app/runtime';
import { useAnimator, useCharacter } from '../../models';
import { playHeroAnimation } from './animation';
import { followCamera } from './camera';
import { OUTFIT, useWand } from './look';

const RUN = 6.2;
const WALK = 2.6;
const JUMP = 5.4;
const HEIGHT = 1.55;

export function Hero() {
  const runtime = useRuntime();
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const { object, mixer, clips } = useCharacter('hero', HEIGHT, OUTFIT);
  useWand(object);
  const anim = useAnimator(mixer, clips);
  const camera = useThree((state) => state.camera);
  const physics = useRapier();
  const camDist = useRef(9);
  const lastCast = useRef(0);
  const grounded = useRef(true);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const rb = body.current;
    if (!rb) return;
    const now = runtime.time;
    if (runtime.teleport) {
      rb.setTranslation({ x: runtime.teleport.x, y: 0.5, z: runtime.teleport.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      runtime.teleport = null;
    }
    const position = rb.translation();
    const velocity = rb.linvel();
    const { input } = runtime;

    // Движение относительно камеры.
    const yaw = runtime.camYaw;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    let dirX = forwardX * input.moveY - forwardZ * input.moveX;
    let dirZ = forwardZ * input.moveY + forwardX * input.moveX;
    const length = Math.hypot(dirX, dirZ);
    if (length > 1) {
      dirX /= length;
      dirZ /= length;
    }
    const acting = runtime.action && runtime.action.until > now && runtime.action.name === 'interact';
    const speed = acting ? 0 : input.walk || length < 0.55 ? WALK : RUN;
    let vx = dirX * speed;
    let vz = dirZ * speed;
    if (runtime.knock) {
      if (now < runtime.knock.until) {
        vx = runtime.knock.x;
        vz = runtime.knock.z;
      } else runtime.knock = null;
    }
    grounded.current = position.y < 0.08 && Math.abs(velocity.y) < 0.6;
    let vy = velocity.y;
    if (input.jump && grounded.current) vy = JUMP;
    input.jump = false;
    rb.setLinvel({ x: vx, y: vy, z: vz }, true);

    // Край острова: мягко возвращаем внутрь.
    const r = Math.hypot(position.x, position.z);
    if (r > WALK_RADIUS) {
      const k = WALK_RADIUS / r;
      rb.setTranslation({ x: position.x * k, y: position.y, z: position.z * k }, true);
    }
    if (position.y < -3) rb.setTranslation({ x: HERO_SPAWN[0], y: 1, z: HERO_SPAWN[1] }, true);

    runtime.hero.set(position.x, Math.max(0, position.y), position.z);
    const moving = Math.hypot(vx, vz);
    runtime.heroSpeed = moving;

    // Поворот модели по направлению движения.
    if (length > 0.08 && !acting) runtime.heroFacing = Math.atan2(dirX, dirZ);
    const group = visual.current;
    if (group) {
      group.position.set(position.x, position.y - 0.02, position.z);
      let diff = runtime.heroFacing - group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      group.rotation.y += diff * Math.min(1, delta * 12);
      // Мигаем после удара слайма.
      group.visible = now > runtime.invulnerableUntil || Math.floor(now * 12) % 2 === 0;
    }

    // Анимации.
    playHeroAnimation(anim, runtime, lastCast, !grounded.current && vy > 0.5, moving);

    // Волна света от взмаха.
    if (ring.current) {
      const age = now - runtime.castTime;
      const visible = age < 0.45;
      ring.current.visible = visible;
      if (visible) {
        const s = 0.6 + age * 9;
        ring.current.scale.set(s, s, s);
        ring.current.position.set(position.x, 0.25, position.z);
        (ring.current.material as MeshBasicMaterial).opacity = 0.75 * (1 - age / 0.45);
      }
    }

    // Камера.
    followCamera(camera, physics, runtime, rb, position, camDist, delta);
  });

  return (
    <>
      <RigidBody
        ref={body}
        colliders={false}
        enabledRotations={[false, false, false]}
        position={[HERO_SPAWN[0], 0.2, HERO_SPAWN[1]]}
        friction={0}
        ccd
        canSleep={false}
      >
        <CapsuleCollider args={[0.42, 0.33]} position={[0, 0.76, 0]} />
      </RigidBody>
      <group ref={visual}>
        <primitive object={object} />
        <Sparkles count={6} scale={[0.8, 1.6, 0.8]} position={[0, 0.9, 0]} size={2.2} speed={0.4} color="#fff2a8" />
      </group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial color="#fff5b8" transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </>
  );
}
