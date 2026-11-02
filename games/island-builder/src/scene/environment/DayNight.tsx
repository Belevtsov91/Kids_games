// День и ночь: небо, туман, солнце/луна и свет плавно перетекают друг в друга.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog, type AmbientLight, type DirectionalLight, type HemisphereLight, type Mesh, type MeshStandardMaterial } from 'three';

const DAY = { sky: new Color('#9ad8ff'), fog: new Color('#bfe6ff'), hemi: 0.9, sun: 1.6, sunColor: new Color('#fff4dd') };
const NIGHT = { sky: new Color('#0f1d47'), fog: new Color('#16295a'), hemi: 0.55, sun: 0.7, sunColor: new Color('#a8bdff') };

/** Плавный переход дня в ночь: всё освещение подкручивается каждый кадр. */
export function DayNight({ night }: { night: boolean }) {
  const { scene } = useThree();
  const hemi = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const orb = useRef<Mesh>(null);
  const k = useRef(night ? 1 : 0);
  const background = useMemo(() => new Color(), []);
  const fog = useMemo(() => new Fog('#bfe6ff', 55, 150), []);

  useLayoutEffect(() => {
    scene.background = background;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, background, fog]);

  useFrame((_, dt) => {
    k.current += ((night ? 1 : 0) - k.current) * Math.min(1, dt * 2.5);
    const t = k.current;
    background.copy(DAY.sky).lerp(NIGHT.sky, t);
    fog.color.copy(DAY.fog).lerp(NIGHT.fog, t);
    if (hemi.current) hemi.current.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * t;
    if (ambient.current) ambient.current.intensity = 0.35 - 0.1 * t;
    if (sun.current) {
      sun.current.intensity = DAY.sun + (NIGHT.sun - DAY.sun) * t;
      sun.current.color.copy(DAY.sunColor).lerp(NIGHT.sunColor, t);
    }
    if (orb.current) {
      const material = orb.current.material as MeshStandardMaterial;
      material.emissive.set(t > 0.5 ? '#e8eeff' : '#ffd25a');
      orb.current.scale.setScalar(t > 0.5 ? 0.7 : 1);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} />
      <hemisphereLight ref={hemi} args={['#dff3ff', '#5a7d45', 0.9]} />
      <directionalLight
        ref={sun}
        position={[14, 22, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
      />
      <mesh ref={orb} position={[40, 45, -60]} raycast={() => null}>
        <sphereGeometry args={[4, 24, 24]} />
        <meshStandardMaterial color="#000" emissive="#ffd25a" emissiveIntensity={1.4} fog={false} />
      </mesh>
    </>
  );
}
