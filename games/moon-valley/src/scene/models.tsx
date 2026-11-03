// Модели из assets/models: загрузка (meshopt), копии для персонажей с костями и инстансинг для леса.

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  AnimationMixer,
  InstancedMesh,
  LoopOnce,
  LoopRepeat,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Material,
} from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Placed } from '../game/world';
import { windMaterial, type WindOptions } from './wind';

const files = import.meta.glob<string>('../../assets/models/*.glb', { eager: true, query: '?url', import: 'default' });

export const MODEL_URL: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]),
);

export const modelUrl = (name: string) => {
  const url = MODEL_URL[name];
  if (!url) throw new Error(`Нет модели ${name}`);
  return url;
};

const converted = new WeakMap<Material, Material>();

/**
 * Без освещения (KHR_materials_unlit) модели выглядят плоско: меняем на обычный материал с тенями.
 * Металлические материалы без карты окружения почти чёрные: делаем их матовыми.
 */
function litMaterial(material: Material): Material {
  const ready = converted.get(material);
  if (ready) return ready;
  const result = convert(material);
  converted.set(material, result);
  return result;
}

function convert(material: Material): Material {
  if (material instanceof MeshStandardMaterial) {
    if (material.metalness <= 0.05) return material;
    const matte = material.clone();
    matte.metalness = 0;
    matte.roughness = Math.max(0.55, matte.roughness);
    return matte;
  }
  if (!(material instanceof MeshBasicMaterial)) return material;
  return new MeshStandardMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    vertexColors: material.vertexColors,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    roughness: 0.85,
  });
}

function prepare(root: Object3D, shadows = true) {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = shadows;
      child.receiveShadow = true;
      child.material = Array.isArray(child.material) ? child.material.map(litMaterial) : litMaterial(child.material);
    }
  });
  return root;
}

export const preloadModels = (names: string[]) => names.forEach((name) => useGLTF.preload(modelUrl(name)));

/** Неподвижная модель: одна копия сцены (геометрия и материалы общие). */
export function Model({
  name,
  position,
  rotation = 0,
  scale = 1,
  shadows = true,
}: {
  name: string;
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  shadows?: boolean;
}) {
  const { scene } = useGLTF(modelUrl(name));
  const object = useMemo(() => prepare(scene.clone(true), shadows), [scene, shadows]);
  return <primitive object={object} position={position} rotation-y={rotation} scale={scale} />;
}

export function Placement({ item }: { item: Placed }) {
  return <Model name={item.model} position={[item.at[0], 0, item.at[1]]} rotation={item.rot} scale={item.scale} />;
}

/**
 * Персонаж с костями и анимациями: отдельная копия скелета, свой микшер.
 * Высота модели подгоняется под `height` метров, ноги — на землю.
 */
export function useCharacter(name: string, height: number, palette?: Record<string, string>) {
  const gltf = useGLTF(modelUrl(name));
  const { object, mixer, clips } = useMemo(() => {
    const copy = prepare(cloneSkinned(gltf.scene));
    if (palette) recolor(copy, palette);
    const holder = new Object3D();
    holder.add(copy);
    copy.updateMatrixWorld(true);
    const box = measure(copy);
    const size = box.max.y - box.min.y || 1;
    const k = height / size;
    copy.scale.multiplyScalar(k);
    copy.position.y = -box.min.y * k;
    return { object: holder, mixer: new AnimationMixer(copy), clips: gltf.animations };
    // palette — постоянный объект у вызывающего, в зависимости не берём.
  }, [gltf, height]);
  useFrame((_, delta) => mixer.update(Math.min(delta, 0.1)));
  useEffect(() => () => void mixer.stopAllAction(), [mixer]);
  return { object, mixer, clips };
}

/** Перекрасить материалы по имени: свой наряд у героя. */
function recolor(root: Object3D, palette: Record<string, string>) {
  const done = new Map<Material, Material>();
  root.traverse((child) => {
    if (!(child instanceof Mesh) || Array.isArray(child.material)) return;
    const source = child.material as Material;
    const color = palette[source.name];
    if (!color || !(source instanceof MeshStandardMaterial)) return;
    let material = done.get(source);
    if (!material) {
      const copy = source.clone();
      copy.color.set(color);
      material = copy;
      done.set(source, material);
    }
    child.material = material;
  });
}

/** Габариты с учётом костей (у персонажей обычный bounding box бывает в 100 раз больше). */
function measure(root: Object3D) {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const v = new Vector3();
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const position = child.geometry.getAttribute('position');
    if (!position) return;
    const step = Math.max(1, Math.floor(position.count / 400));
    for (let i = 0; i < position.count; i += step) {
      child.getVertexPosition(i, v);
      child.localToWorld(v);
      min.min(v);
      max.max(v);
    }
  });
  return { min, max };
}

/** Найти клип по концу имени: 'Run' найдёт 'CharacterArmature|Run'. */
export function findClip(clips: AnimationClip[], ...names: string[]) {
  for (const name of names) {
    const exact = clips.find((clip) => clip.name === name);
    if (exact) return exact;
    const tail = clips.find((clip) => clip.name.endsWith(`|${name}`));
    if (tail) return tail;
  }
  return null;
}

/** Плавная смена анимации: play('Run') — переход за fade секунд, повторный вызов ничего не делает. */
export function useAnimator(mixer: AnimationMixer, clips: AnimationClip[]) {
  const current = useRef<{ key: string; action: AnimationAction } | null>(null);
  return useMemo(() => {
    const cache = new Map<string, AnimationAction | null>();
    const action = (names: string[]) => {
      const key = names.join(',');
      if (!cache.has(key)) {
        const clip = findClip(clips, ...names);
        cache.set(key, clip ? mixer.clipAction(clip) : null);
      }
      return cache.get(key) ?? null;
    };
    return {
      play(names: string[], { fade = 0.2, once = false, speed = 1 } = {}) {
        const key = names.join(',');
        if (current.current?.key === key && !once) return;
        const next = action(names);
        if (!next) return;
        next.reset();
        next.timeScale = speed;
        next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
        next.clampWhenFinished = once;
        next.fadeIn(fade).play();
        if (current.current && current.current.action !== next) current.current.action.fadeOut(fade);
        current.current = { key, action: next };
      },
      get key() {
        return current.current?.key ?? '';
      },
    };
  }, [mixer, clips]);
}

/**
 * Много одинаковых моделей (лес, камни, цветы) одним вызовом отрисовки на каждую часть модели.
 */
export function Instanced({
  name,
  items,
  shadows = true,
  wind,
}: {
  name: string;
  items: Placed[];
  shadows?: boolean;
  /** Качание на ветру (трава, цветы, кроны). */
  wind?: WindOptions;
}) {
  const { scene } = useGLTF(modelUrl(name));
  const parts = useMemo(() => {
    const root = prepare(scene.clone(true), shadows);
    root.updateMatrixWorld(true);
    const list: { mesh: Mesh; matrix: Matrix4 }[] = [];
    root.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      if (wind && !Array.isArray(child.material)) child.material = windMaterial(child.material, wind);
      list.push({ mesh: child, matrix: child.matrixWorld.clone() });
    });
    return list;
    // wind — постоянный объект у вызывающего.
  }, [scene, shadows]);
  return (
    <>
      {parts.map((part, index) => (
        <InstancedPart key={index} mesh={part.mesh} local={part.matrix} items={items} shadows={shadows} />
      ))}
    </>
  );
}

const up = new Vector3(0, 1, 0);

function InstancedPart({ mesh, local, items, shadows }: { mesh: Mesh; local: Matrix4; items: Placed[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const instanced = ref.current;
    if (!instanced) return;
    const m = new Matrix4();
    const q = new Quaternion();
    items.forEach((item, i) => {
      q.setFromAxisAngle(up, item.rot ?? 0);
      const s = item.scale ?? 1;
      m.compose(new Vector3(item.at[0], 0, item.at[1]), q, new Vector3(s, s, s)).multiply(local);
      instanced.setMatrixAt(i, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [items, local]);
  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, mesh.material, items.length]}
      castShadow={shadows}
      receiveShadow
      frustumCulled={false}
    />
  );
}
