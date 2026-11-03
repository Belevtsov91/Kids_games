// Подсветка того, с чем сейчас можно взаимодействовать: светящееся кольцо на земле и искорки.
// Ребёнку сразу видно, к чему относится кнопка действия.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { useRuntime } from '../app/runtime';

export function TargetHalo({ night }: { night: boolean }) {
  const runtime = useRuntime();
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const shown = useRef(0);
  const color = useMemo(() => new Color(night ? '#ffe9a0' : '#fff2b0').multiplyScalar(night ? 2.0 : 2.6), [night]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !ring.current || !glow.current) return;
    const active = runtime.target !== null;
    shown.current += ((active ? 1 : 0) - shown.current) * Math.min(1, delta * 10);
    g.visible = shown.current > 0.02;
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    const size = runtime.targetSize;
    g.position.set(runtime.targetAt.x, 0.04, runtime.targetAt.z);
    const pulse = 1 + Math.sin(t * 3.2) * 0.06;
    ring.current.scale.setScalar(size * pulse * (0.7 + shown.current * 0.3));
    glow.current.scale.setScalar(size * 1.1);
    ring.current.rotation.z = t * 0.6;
    (ring.current.material as MeshBasicMaterial).opacity = 0.85 * shown.current;
    (glow.current.material as MeshBasicMaterial).opacity = 0.2 * shown.current * (0.8 + Math.sin(t * 3.2) * 0.2);
  });

  return (
    <group ref={group} visible={false} userData={{ noAO: true }}>
      <mesh ref={glow} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.86, 1, 48, 1, 0, Math.PI * 1.7]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}
