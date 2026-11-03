/** Волшебная дверь с кристаллом-замком: светится, думает, краснеет при ошибке, открывается при успехе. */
import * as THREE from 'three';
import { glow, jitter, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

const COLORS = {
  idle: new THREE.Color('#7ee7ff'),
  think: new THREE.Color('#c49bff'),
  err: new THREE.Color('#ff3d64'),
  ok: new THREE.Color('#ffd25a'),
  frozen: new THREE.Color('#bcd6ff'),
};

/** Дверь открывается не сразу: сначала прилетает ключ. */
export const DOOR_DELAY = 1.05;

function door(gate: THREE.Group, side: number, panel: THREE.Material, gold: THREE.Material) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.65, 0, 0);
  const leaf = new THREE.Group();
  leaf.position.x = -side * 0.325;
  pivot.add(leaf);
  leaf.add(mesh(new THREE.BoxGeometry(0.64, 1.78, 0.1), panel, 0, 0.92, 0));
  leaf.add(mesh(new THREE.BoxGeometry(0.66, 0.06, 0.12), gold, 0, 0.4, 0));
  leaf.add(mesh(new THREE.BoxGeometry(0.66, 0.06, 0.12), gold, 0, 1.45, 0));
  const star = mat('#ffe9a8', { emissive: '#ffd25a', emissiveIntensity: 1.2 });
  leaf.add(mesh(new THREE.OctahedronGeometry(0.08, 0), star, -side * 0.1, 0.95, 0.07, false));
  gate.add(pivot);
  return pivot;
}

export function buildGate() {
  const group = new THREE.Group();
  group.position.set(0.9, 0.27, -0.75);
  group.rotation.y = -0.18;
  const stone = mat('#c9bde8'), stoneDark = mat('#9d8fd0'), gold = mat('#ffcf5a', { metalness: 0.4, roughness: 0.35 });
  [-1, 1].forEach((s) => {
    group.add(mesh(jitter(new THREE.BoxGeometry(0.34, 1.9, 0.38), 0.04), stone, s * 0.82, 0.95, 0));
    group.add(mesh(new THREE.BoxGeometry(0.46, 0.18, 0.48), stoneDark, s * 0.82, 0.09, 0));
    group.add(mesh(new THREE.BoxGeometry(0.44, 0.14, 0.46), stoneDark, s * 0.82, 1.93, 0));
  });
  group.add(mesh(new THREE.TorusGeometry(0.82, 0.17, 6, 14, Math.PI), stone, 0, 1.9, 0));

  // свет за дверью
  const portalMat = new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0, fog: false });
  const portal = new THREE.Mesh(new THREE.CircleGeometry(0.66, 24), portalMat);
  portal.scale.y = 1.6;
  portal.position.set(0, 1.05, -0.05);
  group.add(portal);
  const portalGlow = glow('#ffd25a', 0);
  portalGlow.position.set(0, 1.1, 0.2);
  group.add(portalGlow);

  const panel = mat('#6b5bd6', { roughness: 0.6 });
  const doorL = door(group, -1, panel, gold), doorR = door(group, 1, panel, gold);

  // кристалл-замок
  const lockMat = new THREE.MeshStandardMaterial({ color: '#7ee7ff', emissive: '#7ee7ff', emissiveIntensity: 1.3, flatShading: true, roughness: 0.2, metalness: 0.1 });
  const lock = mesh(new THREE.OctahedronGeometry(0.26, 0), lockMat, 0, 2.55, 0);
  lock.scale.y = 1.35;
  group.add(lock);
  const lockGlow = glow('#7ee7ff', 1.8);
  lockGlow.position.set(0, 2.55, 0);
  group.add(lockGlow);
  const light = new THREE.PointLight('#7ee7ff', 1.4 * Math.PI, 6, 2);
  light.position.set(0, 2.4, 0.6);
  group.add(light);

  // искры по кругу, пока сервер проверяет пароль
  const orbit = new THREE.Group();
  orbit.position.set(0, 2.55, 0);
  for (let i = 0; i < 10; i++) {
    const s = glow('#c49bff', 0.35);
    const a = (i / 10) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.55, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.55);
    orbit.add(s);
  }
  orbit.visible = false;
  group.add(orbit);

  const cur = COLORS.idle.clone();
  let open = 0;

  const update = (f: Frame) => {
    const err = f.sinceErr < 1.4 && !f.win;
    const target = f.win ? COLORS.ok : err ? COLORS.err : f.fx.frozen ? COLORS.frozen : f.fx.thinking ? COLORS.think : COLORS.idle;
    cur.lerp(target, 1 - Math.exp(-8 * f.dt));
    lockMat.color.copy(cur);
    lockMat.emissive.copy(cur);
    lockGlow.material.color.copy(cur);
    light.color.copy(cur);
    const pulse = f.fx.thinking ? 1 + Math.sin(f.t * 10) * 0.25 : 1;
    lockMat.emissiveIntensity = (err ? 2 : 1.3) * pulse;
    const insert = f.win && f.sinceWin > 0.95 && f.sinceWin < 1.6 ? Math.sin(((f.sinceWin - 0.95) / 0.65) * Math.PI) * 3 : 0;
    const flash = f.sinceErr < 0.4 ? 1.5 * (1 - f.sinceErr / 0.4) : 0;
    lockGlow.scale.setScalar((f.win ? 3.2 : 1.8) * pulse + flash + insert);
    lock.rotation.y += f.dt * (f.fx.thinking ? 6 : f.win ? 4 : 0.9);
    lock.position.set(f.sinceErr < 0.6 ? Math.sin(f.t * 60) * 0.06 * (1 - f.sinceErr / 0.6) : 0, 2.55 + Math.sin(f.t * 2) * 0.06, 0);
    orbit.visible = f.fx.thinking;
    orbit.rotation.y += f.dt * 4;

    const opening = f.win && f.sinceWin > (f.reduce ? 0 : DOOR_DELAY);
    open = damp(open, opening ? 1 : 0, opening ? 2.2 : 5, f.dt);
    const rattle = err && f.sinceErr < 0.5 ? Math.sin(f.t * 50) * 0.04 : 0;
    doorL.rotation.y = -open * 1.95 + rattle;
    doorR.rotation.y = open * 1.95 - rattle;
    portalMat.opacity = open * 0.95;
    portalGlow.scale.setScalar(open * 3 + (f.win ? Math.sin(f.t * 3) * 0.3 : 0));
  };

  return { group, lock, update };
}
