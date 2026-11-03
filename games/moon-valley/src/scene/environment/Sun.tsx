// Солнце (или луна) следует за героем, чтобы тени были чёткими рядом с ним.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, type DirectionalLight } from 'three';
import { useRuntime } from '../../app/runtime';
import type { Quality } from '../quality';

export function Sun({ night, quality }: { night: boolean; quality: Quality }) {
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
        intensity={night ? 1.4 : 2.5}
        color={night ? '#a9c0ff' : '#ffe2b8'}
        castShadow
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-intensity={night ? 0.75 : 0.85}
        shadow-radius={quality.high ? 5 : 3}
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
