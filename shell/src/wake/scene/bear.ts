/** Сонный мишка в ночном колпаке: модель с суставами (таз, голова, лапы, ноги). Позы задаёт pose.ts. */
import * as THREE from 'three';
import { soft as mat, mesh } from '@/welcome/scene/kit';

export interface BearRig {
  /** Место и поворот мишки в мире. */
  root: THREE.Object3D;
  /** Таз: наклон всего тела (лежит / сидит / стоит). */
  hips: THREE.Object3D;
  /** Тело над тазом: дышит. */
  torso: THREE.Object3D;
  head: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  eyes: THREE.Object3D[];
  mouth: THREE.Object3D;
  cap: THREE.Object3D;
}

/** Мишка в мире меньше, чем в модели: так он помещается в кровать. */
export const BEAR_SCALE = 0.8;
/** Длина ноги в модели: стоящий мишка держит таз на этой высоте (до масштаба). */
export const LEG_LEN = 0.55;

function limb(parent: THREE.Object3D, x: number, y: number, z: number, r: number, len: number, fur: THREE.Material, paw: THREE.Material) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  p.add(mesh(new THREE.CylinderGeometry(r, r * 0.92, len, 20), fur, 0, -len / 2, 0));
  p.add(mesh(new THREE.SphereGeometry(r * 1.15, 24, 18), paw, 0, -len, r * 0.35));
  parent.add(p);
  return p;
}

function buildHead(fur: THREE.Material, light: THREE.Material, dark: THREE.Material) {
  const head = new THREE.Group();
  head.position.y = 1.2;
  head.add(mesh(new THREE.SphereGeometry(0.42, 32, 28), fur));
  [-1, 1].forEach((s) => {
    head.add(mesh(new THREE.SphereGeometry(0.14, 24, 18), fur, s * 0.3, 0.32, 0));
    head.add(mesh(new THREE.SphereGeometry(0.075, 24, 18), light, s * 0.3, 0.32, 0.07));
    head.add(mesh(new THREE.SphereGeometry(0.06, 24, 18), mat('#ff8fa8'), s * 0.26, -0.1, 0.32));
  });
  const eyes = [-1, 1].map((s) => {
    const e = mesh(new THREE.SphereGeometry(0.058, 24, 18), dark, s * 0.15, 0.07, 0.37);
    head.add(e);
    return e;
  });
  head.add(mesh(new THREE.SphereGeometry(0.16, 24, 18), light, 0, -0.08, 0.33));
  head.add(mesh(new THREE.SphereGeometry(0.058, 24, 18), dark, 0, -0.02, 0.48));
  const mouth = mesh(new THREE.TorusGeometry(0.05, 0.014, 12, 24, Math.PI), dark, 0, -0.14, 0.46, false);
  mouth.rotation.z = Math.PI;
  head.add(mouth);

  // ночной колпак с помпоном
  const cap = new THREE.Group();
  cap.position.set(0.02, 0.3, -0.04);
  cap.rotation.set(-0.25, 0, -0.45);
  cap.add(mesh(new THREE.TorusGeometry(0.31, 0.07, 12, 28), mat('#fff3d6'), 0, 0, 0).rotateX(Math.PI / 2));
  cap.add(mesh(new THREE.ConeGeometry(0.31, 0.62, 24), mat('#5b8cff'), 0, 0.3, 0));
  cap.add(mesh(new THREE.SphereGeometry(0.09, 24, 18), mat('#fff3d6'), 0, 0.64, 0));
  head.add(cap);
  return { head, eyes, mouth, cap };
}

export function buildSleepyBear(): BearRig {
  const fur = mat('#b8743c'), light = mat('#f0c48c'), dark = mat('#2a1a12');
  const root = new THREE.Group();
  root.scale.setScalar(BEAR_SCALE);
  const hips = new THREE.Group();
  root.add(hips);
  const torso = new THREE.Group();
  hips.add(torso);
  torso.add(mesh(new THREE.SphereGeometry(0.5, 28, 24), fur, 0, 0.45, 0));
  torso.add(mesh(new THREE.SphereGeometry(0.34, 24, 20), light, 0, 0.42, 0.22));
  const { head, eyes, mouth, cap } = buildHead(fur, light, dark);
  torso.add(head);
  const armL = limb(torso, -0.45, 0.75, 0, 0.12, 0.45, fur, light);
  const armR = limb(torso, 0.45, 0.75, 0, 0.12, 0.45, fur, light);
  const legL = limb(hips, -0.22, 0.05, 0.05, 0.15, 0.42, fur, light);
  const legR = limb(hips, 0.22, 0.05, 0.05, 0.15, 0.42, fur, light);
  return { root, hips, torso, head, armL, armR, legL, legR, eyes, mouth, cap };
}
