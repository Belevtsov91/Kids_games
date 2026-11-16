// Остров в стиле сайта: зелёная макушка, земляной бок, ёлки, облака и маленькие острова вдали.
import { COLS, ROWS } from '../game/levels/types';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
        <meshStandardMaterial color="#7a4b2a" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.8 + i * 0.45, 0]} castShadow>
          <coneGeometry args={[0.6 - i * 0.15, 0.7, 12]} />
          <meshStandardMaterial color="#2f9e5b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [0, 0, 1.1],
        [1.1, -0.2, 0.8],
        [-1.1, -0.2, 0.85],
      ].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[r, 20, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function FarIsland({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.35, 20]} />
        <meshStandardMaterial color="#86d99a" />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.15, 0.9, 20]} />
        <meshStandardMaterial color="#b97a46" />
      </mesh>
      <Tree position={[0.3, 0.17, 0]} scale={0.6} />
    </group>
  );
}

/** Доска с клетками за машиной: видно, куда можно ставить детали. */
export function Pegboard() {
  const lines = [];
  for (let c = 0; c <= COLS; c++) lines.push(<mesh key={`c${c}`} position={[c - COLS / 2, ROWS / 2, 0.01]}><planeGeometry args={[0.03, ROWS]} /><meshBasicMaterial color="#d8c7a6" /></mesh>);
  for (let r = 0; r <= ROWS; r++) lines.push(<mesh key={`r${r}`} position={[0, r, 0.01]}><planeGeometry args={[COLS, 0.03]} /><meshBasicMaterial color="#d8c7a6" /></mesh>);
  return (
    <group position={[0, 0, -0.6]}>
      <mesh position={[0, ROWS / 2, 0]} receiveShadow>
        <planeGeometry args={[COLS, ROWS]} />
        <meshStandardMaterial color="#fff6e3" emissive="#fff3dc" emissiveIntensity={0.45} roughness={0.9} />
      </mesh>
      {lines}
    </group>
  );
}

export function Island() {
  return (
    <>
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[9, 9, 1, 48]} />
        <meshStandardMaterial color="#8fe0a0" roughness={0.9} />
      </mesh>
      <mesh position={[0, -2.6, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[8.9, 3.2, 48]} />
        <meshStandardMaterial color="#c58a52" roughness={1} />
      </mesh>
      <Tree position={[-7.6, 0, 2.2]} />
      <Tree position={[8.3, 0, -1.4]} scale={1.2} />
      <Tree position={[6.9, 0, -2.6]} scale={0.9} />
      <Cloud position={[-12, 1.5, -4]} />
      <Cloud position={[12.5, 2.5, -5]} />
      <FarIsland position={[-11, 8, -10]} />
      <FarIsland position={[11.5, 9.5, -12]} />
    </>
  );
}
