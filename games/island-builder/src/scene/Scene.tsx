// 3D-сцена острова: собирает окружение, физику, блоки, деревья и лодки.
// Подсветка клетки под курсором («призрак») показывает, что случится по нажатию.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Mesh, MeshStandardMaterial } from 'three';
import { BLOCKS, type Tool } from '../game/blocks';
import { cellToWorld, type BlockType, type Cell, type World } from '../game/world';
import { Blocks } from './blocks/Blocks';
import { CameraFit } from './CameraFit';
import { Puff } from './effects/Puff';
import { Clouds } from './environment/Clouds';
import { DayNight } from './environment/DayNight';
import { Water } from './environment/Water';
import { FloatingBody } from './floaters/FloatingBody';
import { Terrain } from './physics/Terrain';
import { add, isTap, seabedCell, toVec } from './pointer';
import { Trees } from './trees/Trees';
import type { Effect, Floater, TapTarget } from './types';

interface SceneProps {
  world: World;
  tool: Tool;
  material: BlockType;
  night: boolean;
  paused: boolean;
  floaters: Floater[];
  effects: Effect[];
  onTap(target: TapTarget): void;
  onFloaterGone(id: number): void;
  onFloaterPush(): void;
  onCrateLand(): void;
  onEffectDone(id: number): void;
}
export default function Scene(props: SceneProps) {
  return (
    <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: [15, 13, 15], fov: 45, near: 0.1, far: 300 }} style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
      <SceneContent {...props} />
    </Canvas>
  );
}

function SceneContent({ world, tool, material, night, paused, floaters, effects, onTap, onFloaterGone, onFloaterPush, onCrateLand, onEffectDone }: SceneProps) {
  const ghost = useRef<Mesh>(null);
  const ghostMaterial = useMemo(() => new MeshStandardMaterial({ transparent: true, opacity: 0.45, depthWrite: false }), []);
  useEffect(() => () => ghostMaterial.dispose(), [ghostMaterial]);

  const showGhost = (cell: Cell | null, color: string, wire: boolean) => {
    const mesh = ghost.current;
    if (!mesh) return;
    mesh.visible = !!cell;
    if (!cell) return;
    mesh.position.set(...cellToWorld(cell));
    ghostMaterial.color.set(color);
    ghostMaterial.wireframe = wire;
  };

  const hover = (target: TapTarget | null) => {
    if (!target) return showGhost(null, '', false);
    if (tool === 'build') {
      const cell = target.kind === 'block' ? add(target.cell, target.normal) : target.kind === 'seabed' ? seabedCell(target.point) : null;
      return showGhost(cell, BLOCKS[material].top, false);
    }
    if (target.kind !== 'block') return showGhost(null, '', false);
    if (tool === 'paint') return showGhost(target.cell, BLOCKS[material].top, true);
    if (tool === 'dig') return showGhost(target.cell, '#ff4d4d', true);
    if (tool === 'tree' && target.normal.y === 1) return showGhost(add(target.cell, target.normal), '#3ecf5a', true);
    showGhost(null, '', false);
  };

  const waterClickable = tool === 'boat' || tool === 'crate';

  return (
    <>
      <CameraFit />
      <DayNight night={night} />
      {night && <Stars radius={90} depth={40} count={1800} factor={3.5} fade speed={0.6} />}
      <Clouds />

      <Physics paused={paused} gravity={[0, -9.81, 0]}>
        <Terrain world={world} />
        {floaters.map((f) => (
          <FloatingBody key={f.id} floater={f} paused={paused} tool={tool} onGone={onFloaterGone} onPush={onFloaterPush} onLand={onCrateLand} />
        ))}
      </Physics>

      <Blocks world={world} night={night} onTap={onTap} onHover={hover} />
      <Trees trees={world.trees} onTap={onTap} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          if (!isTap(e)) return;
          e.stopPropagation();
          onTap({ kind: 'seabed', point: toVec(e.point) });
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          hover(e.pointerType === 'touch' ? null : { kind: 'seabed', point: toVec(e.point) });
        }}
        onPointerOut={() => hover(null)}
      >
        <circleGeometry args={[90, 48]} />
        <meshStandardMaterial color="#d9c48c" roughness={1} />
      </mesh>

      <Water
        clickable={waterClickable}
        onTap={(point) => onTap({ kind: 'water', point })}
      />

      <mesh ref={ghost} visible={false} material={ghostMaterial} raycast={() => null}>
        <boxGeometry args={[1.04, 1.04, 1.04]} />
      </mesh>

      {effects.map((fx) => (
        <Puff key={fx.id} effect={fx} onDone={onEffectDone} />
      ))}

      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        enableDamping
        dampingFactor={0.12}
        minDistance={7}
        maxDistance={48}
        maxPolarAngle={Math.PI / 2.15}
        panSpeed={0.8}
      />
    </>
  );
}
