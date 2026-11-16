// Детали машины в 3D. Неподвижные рисуются по данным, подвижные каждый кадр берут позу из физики.
import { useRef, type RefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { cellX, cellY } from '../game/levels/types';
import { LEVER_ANGLES, partInfo, PENDULUM_ANGLES, RAMP_ANGLES, SIZE, SPRING_ANGLES, type Placed } from '../game/parts';
import type { Run } from '../sim/run';

export type RunRef = RefObject<Run | null>;

interface Props {
  part: Placed;
  runRef: RunRef;
  ghost?: boolean;
  onTap?(part: Placed, event: ThreeEvent<MouseEvent>): void;
}

const zAngle = (q: { z: number; w: number }) => 2 * Math.atan2(q.z, q.w);

function Mat({ color, ghost }: { color: string; ghost?: boolean }) {
  return <meshStandardMaterial color={color} roughness={0.55} transparent={ghost} opacity={ghost ? 0.45 : 1} />;
}

function Plank({ half, color, ghost }: { half: number; color: string; ghost?: boolean }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[half * 2, SIZE.plank * 2, 0.8]} />
      <Mat color={color} ghost={ghost} />
    </mesh>
  );
}

/** Подвижная деталь: каждый кадр поворачиваем группу так, как повернуло её тело в физике. */
function useMoverAngle(group: RefObject<Group | null>, runRef: RunRef, rest: number, fromBody: (run: Run) => number | null) {
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const run = runRef.current;
    const angle = run ? fromBody(run) : null;
    g.rotation.z = angle ?? rest;
  });
}

function bodyOf(run: Run, id: number) {
  return run.lab.movers.find((m) => m.id === id)?.body ?? null;
}

function Lever({ part, runRef, ghost }: Props) {
  const group = useRef<Group>(null);
  useMoverAngle(group, runRef, LEVER_ANGLES[part.variant], (run) => {
    const body = bodyOf(run, part.id);
    return body ? zAngle(body.rotation()) : null;
  });
  return (
    <>
      <mesh position={[0, -0.25, 0]} castShadow>
        <coneGeometry args={[0.3, 0.5, 3]} />
        <Mat color="#8a6a4a" ghost={ghost} />
      </mesh>
      <group ref={group}>
        <Plank half={SIZE.leverHalf} color={partInfo('lever').color} ghost={ghost} />
      </group>
    </>
  );
}

function Pendulum({ part, runRef, ghost }: Props) {
  const group = useRef<Group>(null);
  const px = cellX(part.col);
  const py = cellY(part.row) + 0.4;
  useMoverAngle(group, runRef, PENDULUM_ANGLES[part.variant], (run) => {
    const body = bodyOf(run, part.id);
    if (!body) return null;
    const b = body.translation();
    return Math.atan2(b.x - px, py - b.y);
  });
  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[0.9, 0.12, 0.12]} />
        <Mat color="#8a6a4a" ghost={ghost} />
      </mesh>
      <group ref={group}>
        <mesh position={[0, -SIZE.rope / 2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, SIZE.rope, 6]} />
          <Mat color="#6b5b4b" ghost={ghost} />
        </mesh>
        <mesh position={[0, -SIZE.rope, 0]} castShadow>
          <sphereGeometry args={[SIZE.bob, 24, 16]} />
          <meshStandardMaterial color={partInfo('pendulum').color} metalness={0.5} roughness={0.3} transparent={ghost} opacity={ghost ? 0.45 : 1} />
        </mesh>
      </group>
    </group>
  );
}

function Gear({ part, runRef, ghost }: Props) {
  const group = useRef<Group>(null);
  useMoverAngle(group, runRef, 0, (run) => {
    const body = bodyOf(run, part.id);
    return body ? zAngle(body.rotation()) : null;
  });
  const color = partInfo('gear').color;
  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[SIZE.gear, SIZE.gear, 0.5, 24]} />
        <Mat color={color} ghost={ghost} />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const t = (i / 8) * Math.PI * 2;
        const r = SIZE.gear + SIZE.tooth / 2;
        return (
          <mesh key={i} position={[Math.cos(t) * r, Math.sin(t) * r, 0]} rotation={[0, 0, t]} castShadow>
            <boxGeometry args={[SIZE.tooth, SIZE.tooth, 0.5]} />
            <Mat color={color} ghost={ghost} />
          </mesh>
        );
      })}
    </group>
  );
}

function Body(props: Props) {
  const { part, ghost } = props;
  const color = partInfo(part.kind).color;
  switch (part.kind) {
    case 'ramp':
      return (
        <group rotation={[0, 0, RAMP_ANGLES[part.variant]]}>
          <Plank half={SIZE.rampHalf} color={color} ghost={ghost} />
        </group>
      );
    case 'spring':
      return (
        <group position={[0, -0.3, 0]} rotation={[0, 0, SPRING_ANGLES[part.variant]]}>
          <Plank half={SIZE.springHalf} color={color} ghost={ghost} />
          <mesh position={[0, -0.12, 0]}>
            <torusGeometry args={[0.16, 0.04, 8, 16]} />
            <Mat color="#c0c6d0" ghost={ghost} />
          </mesh>
        </group>
      );
    case 'block':
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[SIZE.block * 2, SIZE.block * 2, 0.8]} />
          <Mat color={color} ghost={ghost} />
        </mesh>
      );
    case 'lever':
      return <Lever {...props} />;
    case 'pendulum':
      return <Pendulum {...props} />;
    case 'gear':
      return <Gear {...props} />;
  }
}

export function PartView(props: Props) {
  const { part, onTap } = props;
  return (
    <group
      position={[cellX(part.col), cellY(part.row), 0]}
      onClick={(event) => {
        if (!onTap) return;
        event.stopPropagation();
        onTap(part, event);
      }}
    >
      <Body {...props} />
    </group>
  );
}
