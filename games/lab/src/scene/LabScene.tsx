// 3D-сцена лаборатории: камера смотрит на доску спереди, физика шагает ровно по 1/60 секунды.
import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import type { Mesh, MeshBasicMaterial } from 'three';
import { COLS, ROWS, cellX, cellY, type Level } from '../game/levels/types';
import type { Placed } from '../game/parts';
import { step, STEP, type Outcome } from '../sim/run';
import { Island, Pegboard } from './Island';
import { PartView, type RunRef } from './PartView';
import { Ball, Bulb, Shelves, Star } from './Props';
import { Teppa } from './Teppa';

export interface SceneProps {
  level: Level;
  machine: Placed[];
  runRef: RunRef;
  /** Идёт прогон: физика шагает, доска не принимает нажатий. */
  running: boolean;
  lit: boolean;
  paused: boolean;
  still: boolean;
  ghost: Placed | null;
  canPlace(col: number, row: number): boolean;
  onCell(col: number, row: number): void;
  onPart(part: Placed): void;
  onOutcome(outcome: Outcome): void;
  onHit(): void;
}

const isTap = (event: ThreeEvent<MouseEvent | PointerEvent>) => event.delta < 8;
const cellAt = (x: number, y: number) => ({ col: Math.floor(x + COLS / 2), row: Math.floor(y) });

/** Камера отъезжает на узком экране, чтобы доска помещалась по ширине. */
function Camera() {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const distance = Math.min(40, Math.max(17, 17 * Math.pow(1.6 / aspect, 0.95)));
  useEffect(() => {
    camera.position.set(0, 5.2, distance);
    camera.lookAt(0, 3.9, 0);
    camera.updateProjectionMatrix();
  }, [camera, distance]);
  return null;
}

function Stepper({ level, runRef, running, onOutcome, onHit }: Pick<SceneProps, 'level' | 'runRef' | 'running' | 'onOutcome' | 'onHit'>) {
  const acc = useRef(0);
  useFrame((_, dt) => {
    const run = runRef.current;
    if (!running || !run || run.outcome !== 'running') return void (acc.current = 0);
    acc.current = Math.min(acc.current + dt, 0.25);
    const hits = run.hits;
    while (acc.current >= STEP && run.outcome === 'running') {
      acc.current -= STEP;
      step(run, level);
    }
    if (run.hits > hits) onHit();
    if (run.outcome !== 'running') onOutcome(run.outcome);
  });
  return null;
}

/** Подсветка клетки под курсором: зелёная — можно ставить, красная — занято. */
function Board({ running, canPlace, onCell }: Pick<SceneProps, 'running' | 'canPlace' | 'onCell'>) {
  const marker = useRef<Mesh>(null);
  const show = (event: ThreeEvent<PointerEvent>) => {
    const m = marker.current;
    if (!m) return;
    const { col, row } = cellAt(event.point.x, event.point.y);
    m.visible = !running && col >= 0 && col < COLS && row >= 0 && row < ROWS;
    m.position.set(cellX(col), cellY(row), -0.55);
    (m.material as MeshBasicMaterial).color.set(canPlace(col, row) ? '#5cd68a' : '#ff8a8a');
  };
  return (
    <>
      <Pegboard />
      <mesh
        position={[0, ROWS / 2, -0.5]}
        onPointerMove={show}
        onPointerOut={() => marker.current && (marker.current.visible = false)}
        onClick={(event) => {
          if (running || !isTap(event)) return;
          const { col, row } = cellAt(event.point.x, event.point.y);
          onCell(col, row);
        }}
      >
        <planeGeometry args={[COLS, ROWS]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={marker} visible={false}>
        <planeGeometry args={[0.96, 0.96]} />
        <meshBasicMaterial transparent opacity={0.45} />
      </mesh>
    </>
  );
}

export function LabScene(props: SceneProps) {
  const { level, machine, runRef, running, lit, paused, still, ghost, onPart } = props;
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [0, 5.2, 17], fov: 42 }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <color attach="background" args={['#8fd3f4']} />
      <hemisphereLight args={['#ffffff', '#9ac79a', 0.9]} />
      <directionalLight position={[6, 14, 10]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 40]} />
      </directionalLight>
      <Camera />
      <Island />
      <Board running={running} canPlace={props.canPlace} onCell={props.onCell} />
      <Shelves level={level} />
      <Bulb level={level} lit={lit} />
      <Star level={level} runRef={runRef} still={still} />
      {machine.map((part) => (
        <PartView key={part.id} part={part} runRef={runRef} onTap={part.id >= 0 && !running ? (p) => onPart(p) : undefined} />
      ))}
      {ghost && <PartView part={ghost} runRef={{ current: null }} ghost />}
      <Ball level={level} runRef={runRef} />
      <Teppa cheer={lit} still={still} />
      <Stepper level={level} runRef={runRef} running={running} onOutcome={props.onOutcome} onHit={props.onHit} />
    </Canvas>
  );
}
