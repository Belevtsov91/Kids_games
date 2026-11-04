// Персонажи с костями: своя копия скелета и микшер анимаций, подгонка роста, перекраска наряда,
// поиск клипа по имени и плавная смена анимаций (useAnimator).

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Material,
} from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { modelUrl, prepare } from './load';

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
