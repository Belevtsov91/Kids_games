/** Что стоит на острове: мишка, кровать и всё вокруг. Основной набор — модель из Blender (wake.glb,
 *  собирается скриптом tools/blender/build_wake.py), запасной — простые фигуры из кода. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { phase } from '../progress';
import { BEAR_SCALE, buildSleepyBear, type BearRig } from './bear';
import { buildBed } from './bed';
import { buildPlainIsland } from './world';
import modelUrl from './wake.glb?url';

export interface WakeSet {
  group: THREE.Object3D;
  bear: BearRig;
  /** p — насколько мишка проснулся; morning — насколько рассвело. */
  update: (p: number, morning: number) => void;
}

/** Запасной набор: тот же мишка и кровать, собранные из простых фигур. */
export function buildPlainSet(): WakeSet {
  const group = buildPlainIsland();
  const bed = buildBed();
  const bear = buildSleepyBear();
  group.add(bed.group, bear.root);
  return { group, bear, update: bed.update };
}

/** Модель из Blender: плюшевый мишка, кровать, остров. Суставы в файле названы так же, как поля BearRig. */
export async function loadModelSet(): Promise<WakeSet> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const group = (await loader.loadAsync(modelUrl)).scene;
  const need = (name: string) => {
    const o = group.getObjectByName(name);
    if (!o) throw new Error(`wake.glb: нет узла ${name}`);
    return o;
  };
  let shade: THREE.MeshStandardMaterial | null = null;
  group.traverse((o) => {
    const m = o as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    if (!m.isMesh) return;
    const glow = m.material.name === 'LampShade';
    if (glow) shade = m.material;
    m.castShadow = !glow;
    m.receiveShadow = !glow;
  });

  const bear: BearRig = {
    root: need('BearRoot'), hips: need('Hips'), torso: need('Torso'), head: need('Head'),
    armL: need('ArmL'), armR: need('ArmR'), legL: need('LegL'), legR: need('LegR'),
    eyes: [need('EyeL'), need('EyeR')], mouth: need('Mouth'), cap: need('Cap'),
  };
  bear.root.scale.setScalar(BEAR_SCALE);
  const blanket = need('Blanket');
  // лампа на тумбочке: ночью светит, утром гаснет
  const lamp = new THREE.PointLight('#ffc46b', 3.2, 6, 1.6);
  lamp.position.set(-1.05, 0.95, -0.72);
  group.add(lamp);

  const update = (p: number, morning: number) => {
    const sit = phase(p, 0.28, 0.5), slide = phase(p, 0.55, 0.78);
    blanket.scale.set(1, 1.05 - sit * 0.6 - slide * 0.25, 1 - slide * 0.6);
    if (shade) shade.emissiveIntensity = 2.2 * (1 - morning) + 0.2;
    lamp.intensity = 3.2 * (1 - morning);
  };
  return { group, bear, update };
}
