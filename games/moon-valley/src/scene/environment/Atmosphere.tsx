// Небо и воздух: цвет фона, дымка, небо, свет неба и земли, солнце, ветер, звёзды, светлячки, пыльца и облака.
// Меняется днём и ночью.

import { Sky, Sparkles, Stars } from '@react-three/drei';
import type { Quality } from '../quality';
import { WindClock } from './GrassField';
import { SoftCloud } from './SoftCloud';
import { Sun } from './Sun';

export function Atmosphere({ night, quality }: { night: boolean; quality: Quality }) {
  return (
    <>
      <color attach="background" args={[night ? '#101a38' : '#9fd9f0']} />
      {/* Дымка цвета горизонта: даль мягко растворяется, лес за ней выглядит глубже. */}
      <fog attach="fog" args={[night ? '#1b2a58' : '#cfe6ee', 34, 115]} />
      <Sky
        distance={4000}
        sunPosition={night ? [-10, -2, -30] : [30, 18, 10]}
        turbidity={night ? 10 : 5}
        rayleigh={night ? 0.15 : 1.1}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />
      {/* Небо голубое, отражённый от земли свет тёплый: тени получаются цветными, а не серыми. */}
      <hemisphereLight args={[night ? '#6a7fc0' : '#bcdcff', night ? '#2a2550' : '#8a7a5a', night ? 0.95 : 0.85]} />
      <Sun night={night} quality={quality} />
      <WindClock />
      {night && <Stars radius={120} depth={40} count={2500} factor={4} fade speed={0.5} />}
      {night && <Sparkles count={220} scale={[80, 5, 80]} position={[0, 2.2, 0]} size={6} speed={0.35} color="#fff3a0" />}
      <Sparkles count={60} scale={[30, 4, 30]} position={[-20, 2, -20]} size={4} speed={0.3} color="#b7f9d0" />
      {/* Днём — пыльца и пушинки над лугом. */}
      {!night && <Sparkles count={120} scale={[70, 6, 70]} position={[0, 2.5, 0]} size={2.5} speed={0.2} opacity={0.7} color="#fffbe0" />}

      <SoftCloud position={[-30, 14, -50]} scale={4} />
      <SoftCloud position={[40, 18, -40]} scale={5} speed={0.08} />
      <SoftCloud position={[10, -6, 60]} scale={7} speed={0.05} />
      <SoftCloud position={[-55, -4, 20]} scale={6} speed={0.06} />
    </>
  );
}
