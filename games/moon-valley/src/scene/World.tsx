// 3D-мир Лунной Долины: свет, небо, физика Rapier, остров, деревня, лес, жители, питомцы и слаймы.

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Sparkles, Stars, useGLTF } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier';
import { Box3, type DirectionalLight, Object3D, ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { PetKind, ValleyState } from '../game/valley';
import { npcMarker, type NpcId } from '../game/quests';
import {
  BUILDINGS,
  CHESTS,
  CRYSTALS,
  DEER,
  FENCES,
  generateDecor,
  generateTrees,
  GREENHOUSE_SPOT,
  LAKE,
  NPCS,
  OBELISKS,
  PLOTS,
  PROPS,
  SLIMES,
  WELL,
  type Placed,
  type Vec2,
} from '../game/world';
import { useRuntime, type Target } from '../app/runtime';
import { Hero } from './Hero';
import { Deer, Fox, Frog, LockedPet, Npc, Owl } from './Creatures';
import { MushroomKing, Slime } from './Slimes';
import { Chest, Crystals, Garden, Greenhouse } from './Places';
import { Instanced, Model, modelUrl, Placement } from './models';
import { SoftCloud } from './SoftCloud';
import { Terrain } from './Terrain';

export interface WorldProps {
  state: ValleyState;
  night: boolean;
  paused: boolean;
  /** Время последней ласки питомца / разговора с жителем — для анимации. */
  happy: Record<PetKind, number>;
  talk: Record<NpcId, number>;
  bossActive: boolean;
  onTarget(target: Target | null): void;
  onCleanse(big: boolean): void;
  onHurt(): void;
  onBossHit(left: number): void;
  onCalmBoss(): void;
}

const FROG_HOME: Vec2 = [-8.5, -1.5];

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

function Colliders({ trees }: { trees: Placed[] }) {
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

function Fences() {
  const posts = useMemo(() => {
    const list: Placed[] = [];
    for (const [a, b] of FENCES) {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const count = Math.round(length / 1.8);
      const rot = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        list.push({ model: 'fence', at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], rot, scale: 2.3 });
      }
    }
    return list;
  }, []);
  return <Instanced name="fence" items={posts} />;
}

function groupByModel(items: Placed[]) {
  const map = new Map<string, Placed[]>();
  for (const item of items) map.set(item.model, [...(map.get(item.model) ?? []), item]);
  return [...map.entries()];
}

/** Солнце (или луна) следует за героем, чтобы тени были чёткими рядом с ним. */
function Sun({ night }: { night: boolean }) {
  const runtime = useRuntime();
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const { x, z } = runtime.hero;
    l.position.set(x + 14, 22, z + 9);
    target.position.set(x, 0, z);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        intensity={night ? 1.3 : 2.6}
        color={night ? '#9db8ff' : '#fff1d6'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
    </>
  );
}

/** Каждые 0.12 с ищет ближайшее, с чем можно взаимодействовать, и сообщает интерфейсу. */
function Interactor({ state, bossCalm, onTarget }: { state: ValleyState; bossCalm: boolean; onTarget(target: Target | null): void }) {
  const runtime = useRuntime();
  const timer = useRef(0);
  const last = useRef('');
  const scene = useThree((three) => three.scene);
  useEffect(() => {
    if (import.meta.env?.DEV) (runtime as { scene?: unknown }).scene = scene;
  }, [runtime, scene]);
  useFrame((_, delta) => {
    runtime.time += Math.min(delta, 0.1);
    timer.current += delta;
    if (timer.current < 0.12) return;
    timer.current = 0;
    const hx = runtime.hero.x;
    const hz = runtime.hero.z;
    let best: Target | null = null;
    let bestD = Infinity;
    const consider = (kind: Target['kind'], id: string, at: Vec2 | { x: number; z: number }, radius: number) => {
      const [x, z] = Array.isArray(at) ? at : [at.x, at.z];
      // Питомцы всё время рядом: уступают жителям и грядкам, если те тоже близко.
      const d = Math.hypot(x - hx, z - hz) + (kind === 'pet' ? 1 : 0);
      if (d < radius && d < bestD) {
        best = { kind, id };
        bestD = d;
      }
    };
    PLOTS.forEach((at, i) => consider('plot', String(i), at, 1.9));
    NPCS.forEach((npc) => consider('npc', npc.id, npc.at, 2.8));
    CRYSTALS.forEach((at, i) => {
      if (!runtime.crystalTaken.has(`c${i}`)) consider('crystal', `c${i}`, at, 1.8);
    });
    CHESTS.forEach((chest) => {
      if (!state.opened.includes(chest.id)) consider('chest', chest.id, chest.at, 2.2);
    });
    consider('well', 'well', WELL, 2.6);
    if (!state.buildings.includes('greenhouse')) consider('greenhouse', 'greenhouse', GREENHOUSE_SPOT, 3.2);
    for (const pet of state.pets) {
      const at = runtime.pets.get(pet.id);
      if (pet.unlocked && at) consider('pet', pet.id, at, pet.id === 'owl' ? 3.4 : 2.9);
    }
    if (bossCalm) consider('boss', 'king', { x: runtime.slimes.get('king')?.x ?? 0, z: runtime.slimes.get('king')?.z ?? -31 }, 3.5);
    const key = best ? `${(best as Target).kind}:${(best as Target).id}` : '';
    runtime.target = best;
    if (key !== last.current) {
      last.current = key;
      onTarget(best);
    }
  });
  return null;
}

function Scene(props: WorldProps) {
  const { state, night, happy, talk } = props;
  const trees = useMemo(generateTrees, []);
  const decor = useMemo(generateDecor, []);
  const unlocked = (id: PetKind) => state.pets.find((pet) => pet.id === id)?.unlocked ?? false;
  const bossCalm = state.stats.boss > 0;
  return (
    <>
      <color attach="background" args={[night ? '#101a38' : '#9fd9f0']} />
      <fog attach="fog" args={[night ? '#16234a' : '#bfe6f3', 40, 120]} />
      <Sky
        distance={4000}
        sunPosition={night ? [-10, -2, -30] : [30, 18, 10]}
        turbidity={night ? 10 : 5}
        rayleigh={night ? 0.15 : 1.1}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={[night ? '#5a6ea8' : '#d9f1ff', night ? '#1c2440' : '#6b8a4a', night ? 0.85 : 1.05]} />
      <Sun night={night} />
      {night && <Stars radius={120} depth={40} count={2500} factor={4} fade speed={0.5} />}
      {night && <Sparkles count={160} scale={[80, 5, 80]} position={[0, 2.2, 0]} size={5} speed={0.35} color="#fff3a0" />}
      <Sparkles count={60} scale={[30, 4, 30]} position={[-20, 2, -20]} size={4} speed={0.3} color="#b7f9d0" />

      <SoftCloud position={[-30, 14, -50]} scale={4} />
      <SoftCloud position={[40, 18, -40]} scale={5} speed={0.08} />
      <SoftCloud position={[10, -6, 60]} scale={7} speed={0.05} />
      <SoftCloud position={[-55, -4, 20]} scale={6} speed={0.06} />

      <Terrain night={night} />
      {BUILDINGS.map((item, index) => (
        <Placement key={index} item={item} />
      ))}
      {PROPS.map((item, index) => (
        <Placement key={index} item={item} />
      ))}
      {groupByModel(trees).map(([name, items]) => (
        <Instanced key={name} name={name} items={items} />
      ))}
      {groupByModel(decor).map(([name, items]) => (
        <Instanced key={name} name={name} items={items} shadows={name !== 'grass' && name !== 'flower-red'} />
      ))}
      <Fences />
      {OBELISKS.map((at, index) => (
        <Model key={index} name="obelisk" position={[at[0], 0, at[1]]} scale={3.4} rotation={index} />
      ))}
      <Model name="crystal-rock" position={[-3, 0, -34]} scale={2.4} />
      <Model name="crystal-rock" position={[4, 0, -35]} scale={1.8} rotation={1} />
      <Model name="rock-tall" position={[-7, 0, -36]} scale={3} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Model
          key={i}
          name="lilypad"
          position={[LAKE.center[0] + Math.cos(i * 1.9) * (2 + i), -0.3, LAKE.center[1] + Math.sin(i * 1.9) * (2 + i * 0.8)]}
          scale={0.9}
          shadows={false}
        />
      ))}

      <Garden plots={state.plots} />
      <Greenhouse built={state.buildings.includes('greenhouse')} />
      <Crystals />
      {CHESTS.map((chest) => (
        <Chest key={chest.id} at={chest.at} rot={chest.rot} opened={state.opened.includes(chest.id)} />
      ))}
      {NPCS.map((spot) => (
        <Npc key={spot.id} spot={spot} marker={npcMarker(state, spot.id)} talkAt={talk[spot.id]} />
      ))}
      <Fox happyAt={happy.fox} />
      {unlocked('owl') ? <Owl happyAt={happy.owl} /> : <LockedPet at={[-10, 1]} kind="owl" />}
      {unlocked('bunny') ? <Frog home={FROG_HOME} happyAt={happy.bunny} /> : <LockedPet at={FROG_HOME} kind="bunny" />}
      {DEER.map((home, index) => (
        <Deer key={index} home={home} />
      ))}
      {SLIMES.map((spawn) => (
        <Slime key={spawn.id} spawn={spawn} onCleanse={props.onCleanse} onHurt={props.onHurt} />
      ))}
      {(props.bossActive || bossCalm) && (
        <MushroomKing calm={bossCalm} onCalm={props.onCalmBoss} onHurt={props.onHurt} onHit={props.onBossHit} />
      )}

      <Physics gravity={[0, -18, 0]} paused={props.paused}>
        <Colliders trees={trees} />
        <Hero />
      </Physics>
      <Interactor state={state} bossCalm={bossCalm} onTarget={props.onTarget} />
      <KingTracker active={bossCalm} />
    </>
  );
}

/** Позиция успокоенного короля для «поговорить». Он стоит на поляне. */
function KingTracker({ active }: { active: boolean }) {
  const runtime = useRuntime();
  useEffect(() => {
    if (active) runtime.slimes.set('king', runtime.hero.clone().set(0, 0, -31));
  }, [active, runtime]);
  return null;
}

export function World(props: WorldProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.6]}
      camera={{ position: [0, 6, 14], fov: 50, near: 0.1, far: 600 }}
      frameloop={props.paused ? 'never' : 'always'}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}

