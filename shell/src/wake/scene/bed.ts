/** Деревянная кровать с подушкой и одеялом-горкой, тумбочка с лампой и тапочки. */
import * as THREE from 'three';
import { glowMat, mat, mesh } from '@/welcome/scene/kit';
import { phase } from '../progress';

/** Верх матраса: на нём лежит и сидит мишка. */
export const MATTRESS_TOP = 0.62;
const FOOT_Z = 1.05;
const BLANKET_LEN = 1.45;

function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
}

/** Одеяло — половинка цилиндра вдоль кровати, привязана к изножью: при подъёме сползает к ногам. */
function buildBlanket() {
  const geo = new THREE.CylinderGeometry(0.6, 0.6, BLANKET_LEN, 12, 1, true, -Math.PI / 2, Math.PI);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -BLANKET_LEN / 2);
  const cloth = mat('#ff9cc7', { side: THREE.DoubleSide });
  const anchor = new THREE.Group();
  anchor.position.set(0, MATTRESS_TOP - 0.02, FOOT_Z);
  const dome = mesh(geo, cloth);
  anchor.add(dome);
  // белый отворот у края
  const hem = mesh(new THREE.TorusGeometry(0.6, 0.05, 4, 12, Math.PI), mat('#fff3d6'), 0, 0, -BLANKET_LEN);
  anchor.add(hem);
  return anchor;
}

export function buildBed() {
  const wood = mat('#9a6238'), woodDark = mat('#7a4a2a');
  const g = new THREE.Group();
  [-0.6, 0.6].forEach((x) => [-1.18, 1.08].forEach((z) => g.add(box(0.12, z < 0 ? 1.4 : 0.9, 0.12, woodDark, x, z < 0 ? 0.7 : 0.45, z))));
  g.add(box(1.3, 0.16, 2.3, wood, 0, 0.32, -0.05));
  g.add(box(1.2, 0.7, 0.08, wood, 0, 0.95, -1.18));
  g.add(box(1.2, 0.36, 0.08, wood, 0, 0.66, 1.08));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8, 1, false, 0, Math.PI), wood, 0, 1.3, -1.18).rotateZ(Math.PI / 2));
  g.add(box(1.2, 0.22, 2.2, mat('#fff8ec'), 0, MATTRESS_TOP - 0.11, -0.05));
  g.add(box(0.8, 0.16, 0.42, mat('#cfe3ff'), 0, MATTRESS_TOP + 0.08, -0.88));
  const blanket = buildBlanket();
  g.add(blanket);

  // тумбочка у изголовья с лампой: ночью светит, утром гаснет
  const stand = new THREE.Group();
  stand.position.set(-1.05, 0, -0.9);
  stand.add(box(0.5, 0.55, 0.45, wood, 0, 0.28, 0));
  stand.add(box(0.36, 0.05, 0.02, woodDark, 0, 0.36, 0.24));
  stand.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.3, 6), woodDark, 0, 0.7, 0));
  const shade = glowMat('#ffd27a', 1.4);
  stand.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.22, 8), shade, 0, 0.92, 0, false));
  const lamp = new THREE.PointLight('#ffc46b', 3.2, 6, 1.6);
  lamp.position.set(0, 0.95, 0.15);
  stand.add(lamp);
  g.add(stand);

  // тапочки — их мишка «ищет», пока сервер просыпается
  const slipper = mat('#ffd25a');
  [-0.13, 0.13].forEach((dx) => {
    const s = mesh(new THREE.CapsuleGeometry(0.07, 0.14, 3, 6), slipper, 1.25 + dx, 0.05, 0.55);
    s.rotation.x = Math.PI / 2;
    g.add(s);
  });

  /** p — насколько мишка проснулся; morning — насколько рассвело. */
  const update = (p: number, morning: number) => {
    const sit = phase(p, 0.28, 0.5), slide = phase(p, 0.55, 0.78);
    blanket.scale.set(1, 1.05 - sit * 0.6 - slide * 0.25, 1 - slide * 0.6);
    shade.emissiveIntensity = 1.4 * (1 - morning) + 0.15;
    lamp.intensity = 3.2 * (1 - morning);
  };
  return { group: g, update };
}
