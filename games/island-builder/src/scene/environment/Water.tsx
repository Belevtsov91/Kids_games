// Море: плоскость с бегущими волнами. Кликабельно, только когда выбрана лодка или ящик.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, PlaneGeometry } from 'three';
import { WATER_Y } from '../../game/world';
import { isTap, toVec } from '../pointer';
import type { Vec3 } from '../types';

export function Water({ clickable, onTap }: { clickable: boolean; onTap(point: Vec3): void }) {
  const geometry = useMemo(() => new PlaneGeometry(180, 180, 90, 90), []);
  const base = useMemo(() => Float32Array.from(geometry.getAttribute('position').array), [geometry]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const frame = useRef(0);

  useFrame((state) => {
    // Волны пересчитываем через кадр: глазу незаметно, процессору легче.
    if (frame.current++ % 2) return;
    const t = state.clock.elapsedTime;
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      position.setZ(i, Math.sin(x * 0.35 + t * 1.2) * 0.06 + Math.cos(y * 0.3 + t * 0.9) * 0.05 + Math.sin((x + y) * 0.8 + t * 2) * 0.015);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_Y, 0]}
      receiveShadow
      raycast={clickable ? Mesh.prototype.raycast : () => null}
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        onTap(toVec(e.point));
      }}
    >
      <meshStandardMaterial color="#1fa2d6" transparent opacity={0.72} roughness={0.12} metalness={0.15} depthWrite={false} />
    </mesh>
  );
}
