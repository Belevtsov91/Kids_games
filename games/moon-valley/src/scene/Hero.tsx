// Герой: капсула Rapier (не проходит сквозь дома и деревья), модель с анимациями и камера от третьего лица.

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import { Sparkles } from '@react-three/drei';
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, OctahedronGeometry, Vector3, type MeshBasicMaterial, type Object3D } from 'three';
import { HERO_SPAWN, WALK_RADIUS } from '../game/world';
import { useRuntime } from '../app/runtime';
import { useAnimator, useCharacter } from './models';

const RUN = 6.2;
const WALK = 2.6;
const JUMP = 5.4;
const HEIGHT = 1.55;

/** Наряд Хранителя: тёплые лесные цвета вместо тёмных. */
const OUTFIT: Record<string, string> = {
  Green: '#2f7f73',
  LightGreen: '#5fc0a5',
  Brown: '#9a6a3c',
  Brown2: '#6e4529',
  Gold: '#f3c45c',
  Black: '#3a3346',
  Grey: '#77809a',
  Hair: '#8a4a22',
};

/** Волшебный жезл в правой руке: палочка и сияющий кристалл. */
function makeWand() {
  const wand = new Group();
  const stick = new Mesh(new CylinderGeometry(0.018, 0.026, 0.62, 8), new MeshStandardMaterial({ color: '#8a5a2b', roughness: 0.7 }));
  stick.position.y = 0.2;
  const gem = new Mesh(new OctahedronGeometry(0.075, 0), new MeshStandardMaterial({ color: '#c9f6ff', emissive: '#7fe0ff', emissiveIntensity: 2.2 }));
  gem.position.y = 0.55;
  wand.add(stick, gem);
  wand.traverse((child) => (child.castShadow = true));
  return wand;
}

const camTarget = new Vector3();
const camPos = new Vector3();
const look = new Vector3();

export function Hero() {
  const runtime = useRuntime();
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const { object, mixer, clips } = useCharacter('hero', HEIGHT, OUTFIT);
  useEffect(() => {
    let hand: Object3D | undefined;
    object.traverse((child) => {
      if (!hand && /wrist\.?r$/i.test(child.name)) hand = child;
    });
    if (!hand) return;
    const wand = makeWand();
    object.updateMatrixWorld(true);
    const scale = new Vector3();
    hand.getWorldScale(scale);
    wand.scale.setScalar(1 / (scale.x || 1));
    wand.rotation.set(Math.PI / 2, 0, 0);
    wand.position.set(0, 0.08 / (scale.x || 1), 0);
    hand.add(wand);
    return () => void hand?.remove(wand);
  }, [object]);
  const anim = useAnimator(mixer, clips);
  const camera = useThree((state) => state.camera);
  const { world, rapier } = useRapier();
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
    const action = runtime.action && runtime.action.until > now ? runtime.action.name : null;
    if (runtime.cast !== lastCast.current) {
      lastCast.current = runtime.cast;
      anim.play(['Sword_Slash'], { once: true, fade: 0.08, speed: 1.6 });
    } else if (action === 'hit') anim.play(['HitRecieve'], { fade: 0.08 });
    else if (action === 'interact') anim.play(['Interact']);
    else if (action === 'wave') anim.play(['Wave']);
    else if (action === 'cast') {
      /* доигрывается взмах */
    } else if (!grounded.current && vy > 0.5) anim.play(['Roll'], { fade: 0.1, speed: 1.3 });
    else if (moving > 4) anim.play(['Run']);
    else if (moving > 0.3) anim.play(['Walk']);
    else anim.play(['Idle']);

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
