// Грядка: росток растёт по стадиям, на последней распускается парящий цветок.
import { Float } from '@react-three/drei';
import type { Plot } from '../game/valley';
import { Flower } from './Flower';

export function Plant({ plot, position, onClick }: { plot: Plot; position: [number, number, number]; onClick(): void }) {
  const colors = ['#826c44', '#74d96d', '#ff8dbc', '#b9f8ff'];
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshStandardMaterial color="#6b5135" />
      </mesh>
      {plot.stage > 0 && (
        <mesh castShadow position={[0, 0.18 * plot.stage, 0]}>
          <coneGeometry args={[0.12 + plot.stage * 0.09, 0.35 * plot.stage, 8]} />
          <meshStandardMaterial
            color={colors[plot.stage]}
            emissive={plot.stage === 3 ? colors[plot.stage] : '#000'}
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      {plot.stage === 3 && (
        <Float speed={2} floatIntensity={0.35}>
          <Flower position={[0, 0.85, 0]} color="#d987ff" />
        </Float>
      )}
    </group>
  );
}
