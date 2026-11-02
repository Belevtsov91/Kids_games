import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Fog,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type AmbientLight,
  type DirectionalLight,
  type HemisphereLight,
} from 'three';
import { BLOCKS, type Tool } from './blocks';
import { BLOCK_TYPES, WATER_Y, cellToWorld, columns, parseKey, type BlockType, type Cell, type TreeKind, type World } from './world';

export type Vec3 = [number, number, number];

export type TapTarget =
  | { kind: 'block'; cell: Cell; normal: Cell; point: Vec3 }
  | { kind: 'tree'; cell: Cell; point: Vec3 }
  | { kind: 'seabed'; point: Vec3 }
  | { kind: 'water'; point: Vec3 };

export interface Floater {
  id: number;
  kind: 'boat' | 'crate';
  pos: Vec3;
  rot: number;
  color: string;
}

export interface Effect {
  id: number;
  pos: Vec3;
  color: string;
}

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

/** Нажатие, а не поворот камеры: палец почти не сдвинулся. */
const isTap = (e: ThreeEvent<MouseEvent>) => e.delta < 8;
const toVec = (v: Vector3): Vec3 => [v.x, v.y, v.z];

export default function Scene(props: SceneProps) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [15, 13, 15], fov: 45, near: 0.1, far: 300 }} style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
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

const add = (a: Cell, b: Cell): Cell => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const seabedCell = (p: Vec3): Cell => ({ x: Math.floor(p[0] + 10), y: 0, z: Math.floor(p[2] + 10) });

/** На узком экране (телефон вертикально) отодвигаем камеру, чтобы остров влез целиком. */
function CameraFit() {
  const { camera, size } = useThree();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const aspect = size.width / size.height;
    if (aspect < 1) camera.position.multiplyScalar(Math.min(1.7, 1 / aspect));
  }, [camera, size]);
  return null;
}

// ---------- День и ночь ----------

const DAY = { sky: new Color('#9ad8ff'), fog: new Color('#bfe6ff'), hemi: 0.9, sun: 1.6, sunColor: new Color('#fff4dd') };
const NIGHT = { sky: new Color('#0f1d47'), fog: new Color('#16295a'), hemi: 0.55, sun: 0.7, sunColor: new Color('#a8bdff') };

/** Плавный переход дня в ночь: всё освещение подкручивается каждый кадр. */
function DayNight({ night }: { night: boolean }) {
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

// ---------- Блоки ----------

/** Куб с цветами вершин: верх, бока (темнее книзу) и низ своего цвета. */
function blockGeometry(look: (typeof BLOCKS)[BlockType]) {
  const geometry = new BoxGeometry(1, 1, 1);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const top = new Color(look.top);
  const side = new Color(look.side);
  const bottom = new Color(look.bottom);
  const c = new Color();
  for (let i = 0; i < position.count; i++) {
    const face = Math.floor(i / 4); // порядок граней BoxGeometry: +x, -x, +y, -y, +z, -z
    if (face === 2) c.copy(top);
    else if (face === 3) c.copy(bottom);
    else c.copy(side).multiplyScalar(position.getY(i) < 0 ? 0.82 : 1);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

function blockMaterial(look: (typeof BLOCKS)[BlockType]) {
  return new MeshStandardMaterial({
    vertexColors: true,
    roughness: look.transparent ? 0.1 : 0.85,
    metalness: look.transparent ? 0.1 : 0,
    transparent: look.transparent,
    opacity: look.transparent ? 0.5 : 1,
    depthWrite: !look.transparent,
    emissive: look.glow ? new Color('#ffae2b') : new Color('#000'),
    emissiveIntensity: look.glow ? 0.4 : 0,
  });
}

/** Псевдослучайный оттенок блока: так стена не выглядит плоской. */
const shade = ({ x, y, z }: Cell) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return 0.9 + (h - Math.floor(h)) * 0.14;
};

interface BlockEvents {
  onTap(target: TapTarget): void;
  onHover(target: TapTarget | null): void;
}

function Blocks({ world, night, ...events }: { world: World; night: boolean } & BlockEvents) {
  const assets = useMemo(
    () => Object.fromEntries(BLOCK_TYPES.map((type) => [type, { geometry: blockGeometry(BLOCKS[type]), material: blockMaterial(BLOCKS[type]) }])) as Record<
      BlockType,
      { geometry: BoxGeometry; material: MeshStandardMaterial }
    >,
    [],
  );
  useEffect(
    () => () => {
      for (const { geometry, material } of Object.values(assets)) {
        geometry.dispose();
        material.dispose();
      }
    },
    [assets],
  );

  const groups = useMemo(() => {
    const byType = Object.fromEntries(BLOCK_TYPES.map((t) => [t, [] as Cell[]])) as Record<BlockType, Cell[]>;
    for (const [key, type] of world.blocks) byType[type].push(parseKey(key));
    return byType;
  }, [world.blocks]);

  // Фонари разгораются ночью.
  const glow = useRef(night ? 1 : 0);
  useFrame((state, dt) => {
    glow.current += ((night ? 1 : 0) - glow.current) * Math.min(1, dt * 2.5);
    assets.lantern.material.emissiveIntensity = 0.4 + glow.current * (1.8 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
  });

  return (
    <>
      {BLOCK_TYPES.map((type) => (
        <BlockLayer key={type} cells={groups[type]} {...assets[type]} transparent={!!BLOCKS[type].transparent} {...events} />
      ))}
    </>
  );
}

function BlockLayer({
  cells,
  geometry,
  material,
  transparent,
  onTap,
  onHover,
}: { cells: Cell[]; geometry: BoxGeometry; material: MeshStandardMaterial; transparent: boolean } & BlockEvents) {
  const ref = useRef<InstancedMesh>(null);
  // Ёмкость растёт ступенями: пересоздавать меш на каждый блок незачем.
  const capacity = Math.max(64, Math.ceil(cells.length / 128) * 128);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const color = new Color();
    cells.forEach((cell, i) => {
      matrix.makeTranslation(...cellToWorld(cell));
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.setScalar(shade(cell)));
    });
    mesh.count = cells.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [cells, capacity]);

  const target = (e: ThreeEvent<PointerEvent | MouseEvent>): TapTarget | null => {
    const cell = e.instanceId === undefined ? undefined : cells[e.instanceId];
    if (!cell || !e.face) return null;
    const n = e.face.normal;
    return { kind: 'block', cell, normal: { x: Math.round(n.x), y: Math.round(n.y), z: Math.round(n.z) }, point: toVec(e.point) };
  };

  return (
    <instancedMesh
      key={capacity}
      ref={ref}
      args={[geometry, material, capacity]}
      castShadow={!transparent}
      receiveShadow
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        const t = target(e);
        if (t) onTap(t);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover(e.pointerType === 'touch' ? null : target(e));
      }}
      onPointerOut={() => onHover(null)}
    />
  );
}

/** Коллайдеры острова: дно и по столбу на каждую клетку. */
function Terrain({ world }: { world: World }) {
  const cols = useMemo(() => columns(world), [world]);
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[90, 0.5, 90]} position={[0, -0.5, 0]} />
      {cols.map(({ x, z, height }) => {
        const [wx, , wz] = cellToWorld({ x, y: 0, z });
        return <CuboidCollider key={`${x},${z},${height}`} args={[0.5, height / 2, 0.5]} position={[wx, height / 2, wz]} />;
      })}
    </RigidBody>
  );
}

// ---------- Деревья ----------

function Trees({ trees, onTap }: { trees: World['trees']; onTap(target: TapTarget): void }) {
  return (
    <>
      {[...trees].map(([key, kind]) => (
        <Tree key={key} cell={parseKey(key)} kind={kind} onTap={onTap} />
      ))}
    </>
  );
}

function Tree({ cell, kind, onTap }: { cell: Cell; kind: TreeKind; onTap(target: TapTarget): void }) {
  const group = useRef<Group>(null);
  const born = useRef(-1);
  const phase = useMemo(() => cell.x * 1.7 + cell.z * 2.3, [cell.x, cell.z]);
  const [wx, , wz] = cellToWorld(cell);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (born.current < 0) born.current = t;
    // Вырастает с лёгким «пружинящим» перехлёстом, потом покачивается на ветру.
    const age = Math.min(1, (t - born.current) / 0.45);
    const grow = age < 1 ? 1 - Math.cos(age * Math.PI * 1.5) * (1 - age) : 1;
    g.scale.setScalar(Math.max(0.01, grow));
    g.rotation.z = Math.sin(t * 1.3 + phase) * 0.04;
    g.rotation.x = Math.cos(t * 1.1 + phase) * 0.03;
  });

  return (
    <group
      ref={group}
      position={[wx, cell.y, wz]}
      onClick={(e) => {
        if (!isTap(e)) return;
        e.stopPropagation();
        onTap({ kind: 'tree', cell, point: toVec(e.point) });
      }}
    >
      <TreeModel kind={kind} />
    </group>
  );
}

function TreeModel({ kind }: { kind: TreeKind }): ReactNode {
  switch (kind) {
    case 'palm':
      return (
        <>
          <mesh castShadow position={[0.08, 0.7, 0]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.07, 0.11, 1.4, 6]} />
            <meshStandardMaterial color="#a0794a" roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <group key={i} position={[0.16, 1.42, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
              <mesh castShadow position={[0, -0.12, 0.42]} rotation={[0.45, 0, 0]} scale={[1, 0.12, 1]}>
                <boxGeometry args={[0.28, 1, 0.9]} />
                <meshStandardMaterial color={i % 2 ? '#3fae4a' : '#4cc257'} roughness={0.8} flatShading />
              </mesh>
            </group>
          ))}
          <mesh position={[0.16, 1.32, 0.1]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#7a4e24" />
          </mesh>
        </>
      );
    case 'pine':
      return (
        <>
          <mesh castShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
            <meshStandardMaterial color="#7a5230" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} castShadow position={[0, 0.65 + i * 0.38, 0]}>
              <coneGeometry args={[0.55 - i * 0.14, 0.7, 7]} />
              <meshStandardMaterial color={i === 2 ? '#2f9a55' : '#24804a'} roughness={0.85} flatShading />
            </mesh>
          ))}
        </>
      );
    case 'round':
      return (
        <>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
            <meshStandardMaterial color="#8a5a33" />
          </mesh>
          <mesh castShadow position={[0, 1.0, 0]}>
            <icosahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial color="#4cbb4c" roughness={0.8} flatShading />
          </mesh>
          <mesh castShadow position={[0.22, 1.25, 0.1]}>
            <icosahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#5fd15a" roughness={0.8} flatShading />
          </mesh>
        </>
      );
    case 'flowers':
      return (
        <>
          {[
            [-0.2, -0.15, '#ff5c8a'],
            [0.18, -0.1, '#ffd23f'],
            [0, 0.2, '#b27cff'],
            [-0.15, 0.22, '#ff8c42'],
            [0.22, 0.2, '#ff5c8a'],
          ].map(([x, z, color], i) => (
            <group key={i} position={[x as number, 0, z as number]}>
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.28, 4]} />
                <meshStandardMaterial color="#3c9a3c" />
              </mesh>
              <mesh castShadow position={[0, 0.3, 0]}>
                <icosahedronGeometry args={[0.08, 0]} />
                <meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={0.15} flatShading />
              </mesh>
            </group>
          ))}
        </>
      );
  }
}

// ---------- Вода ----------

function Water({ clickable, onTap }: { clickable: boolean; onTap(point: Vec3): void }) {
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

// ---------- Облака ----------

function Clouds() {
  const group = useRef<Group>(null);
  const clouds = useMemo(
    () =>
      // Кольцом вдали: камера (максимум ~50 от центра) в облако не залетит.
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const r = 72 + (i % 3) * 8;
        return { a, r, y: 26 + (i % 3) * 4, s: 2 + (i % 3) * 0.6 };
      }),
    [],
  );
  // Облака медленно плывут по кругу.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.01;
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r]} scale={c.s}>
          {[
            [0, 0, 0, 1.6],
            [1.5, -0.2, 0.3, 1.2],
            [-1.4, -0.3, -0.2, 1.1],
            [0.4, 0.6, -0.3, 1.1],
          ].map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]} raycast={() => null}>
              <icosahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---------- Лодки и ящики ----------

const UP = new Vector3(0, 1, 0);
const WIND = { x: 0.25, z: 0.12 };

function FloatingBody({
  floater,
  paused,
  tool,
  onGone,
  onPush,
  onLand,
}: {
  floater: Floater;
  paused: boolean;
  tool: Tool;
  onGone(id: number): void;
  onPush(): void;
  onLand(): void;
}) {
  const body = useRef<RapierRigidBody>(null);
  const gone = useRef(false);
  const landed = useRef(false);
  const camera = useThree((s) => s.camera);
  const boat = floater.kind === 'boat';
  const halfHeight = boat ? 0.2 : 0.4;
  const temp = useMemo(() => ({ q: new Quaternion(), up: new Vector3(), torque: new Vector3() }), []);

  useFrame((_, rawDt) => {
    const b = body.current;
    if (!b || paused || gone.current) return;
    const dt = Math.min(rawDt, 1 / 30);
    const p = b.translation();
    if (p.y < -4 || Math.abs(p.x) > 70 || Math.abs(p.z) > 70) {
      gone.current = true;
      onGone(floater.id);
      return;
    }
    // Архимед: чем глубже погружено тело, тем сильнее его выталкивает.
    const submerged = Math.min(1, Math.max(0, (WATER_Y - (p.y - halfHeight)) / (halfHeight * 2)));
    if (submerged <= 0) return;
    const m = b.mass();
    const v = b.linvel();
    const lift = (boat ? 2.1 : 1.7) * 9.81 * submerged;
    const drag = 1.6 * submerged;
    const wind = boat ? 1 : 0.3;
    b.applyImpulse(
      { x: (WIND.x * wind - v.x * drag) * m * dt, y: (lift - v.y * drag * 1.5) * m * dt, z: (WIND.z * wind - v.z * drag) * m * dt },
      true,
    );
    // Неваляшка: лодка сама выравнивается.
    const r = b.rotation();
    temp.q.set(r.x, r.y, r.z, r.w);
    temp.up.copy(UP).applyQuaternion(temp.q);
    temp.torque.crossVectors(temp.up, UP).multiplyScalar((boat ? 2.5 : 0.6) * m * dt * submerged);
    b.applyTorqueImpulse({ x: temp.torque.x, y: 0, z: temp.torque.z }, true);
  });

  const push = (e: ThreeEvent<MouseEvent>) => {
    if (!isTap(e) || tool === 'crate') return;
    e.stopPropagation();
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    const dir = new Vector3(p.x - camera.position.x, 0, p.z - camera.position.z).normalize();
    const m = b.mass();
    b.applyImpulse({ x: dir.x * 4 * m, y: 1.2 * m, z: dir.z * 4 * m }, true);
    onPush();
  };

  return (
    <RigidBody
      ref={body}
      position={floater.pos}
      rotation={[0, floater.rot, 0]}
      colliders={false}
      angularDamping={boat ? 1.2 : 0.6}
      linearDamping={0.15}
      onCollisionEnter={() => {
        if (!boat && !landed.current) {
          landed.current = true;
          onLand();
        }
      }}
    >
      {boat ? (
        <CuboidCollider args={[0.45, 0.2, 0.9]} density={0.6} />
      ) : (
        <CuboidCollider args={[0.4, 0.4, 0.4]} density={0.35} friction={0.8} />
      )}
      <group onClick={push}>{boat ? <BoatModel color={floater.color} /> : <CrateModel />}</group>
    </RigidBody>
  );
}

function BoatModel({ color }: { color: string }) {
  return (
    <>
      <mesh castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[0.9, 0.3, 1.8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, -0.05, 1.0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.636, 0.3, 0.636]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.78, 0.04, 1.65]} />
        <meshStandardMaterial color="#d9a066" />
      </mesh>
      <mesh castShadow position={[0, 0.25, -0.45]}>
        <boxGeometry args={[0.55, 0.3, 0.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow position={[0, 0.8, 0.2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.4, 6]} />
        <meshStandardMaterial color="#7a5230" />
      </mesh>
      <mesh castShadow position={[0.02, 0.85, 0.42]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.06]}>
        <coneGeometry args={[0.45, 1.1, 3]} />
        <meshStandardMaterial color="#fffaf0" side={2} />
      </mesh>
    </>
  );
}

function CrateModel() {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#c98b47" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, s * 0.405]}>
          <boxGeometry args={[0.82, 0.14, 0.02]} />
          <meshStandardMaterial color="#8a5a2b" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[s * 0.405, 0, 0]}>
          <boxGeometry args={[0.02, 0.14, 0.82]} />
          <meshStandardMaterial color="#8a5a2b" />
        </mesh>
      ))}
    </>
  );
}

// ---------- Эффекты ----------

/** Облачко кубиков-искр там, где что-то построили или сломали. */
function Puff({ effect, onDone }: { effect: Effect; onDone(id: number): void }) {
  const group = useRef<Group>(null);
  const age = useRef(0);
  const finished = useRef(false);
  const parts = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return new Vector3(Math.cos(a) * (1 + Math.random()), 1.5 + Math.random() * 2, Math.sin(a) * (1 + Math.random()));
      }),
    [],
  );
  useFrame((_, dt) => {
    const g = group.current;
    if (!g || finished.current) return;
    age.current += dt;
    const life = age.current / 0.6;
    if (life >= 1) {
      finished.current = true;
      onDone(effect.id);
      return;
    }
    g.children.forEach((child, i) => {
      const v = parts[i];
      child.position.set(v.x * age.current, v.y * age.current - 4.9 * age.current ** 2, v.z * age.current);
      child.scale.setScalar(1 - life);
      child.rotation.x += dt * 6;
      child.rotation.y += dt * 4;
    });
  });
  return (
    <group ref={group} position={effect.pos}>
      {parts.map((_, i) => (
        <mesh key={i} raycast={() => null}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial color={effect.color} />
        </mesh>
      ))}
    </group>
  );
}
