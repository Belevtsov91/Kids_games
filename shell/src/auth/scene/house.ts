/** Регистрация: домик строится по мере заполнения формы — стены, крыша, свет в окнах, флажок, дым из трубы. */
import * as THREE from 'three';
import { glow, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

export function buildHouse(island: THREE.Group) {
  const house = new THREE.Group();
  house.position.set(-1.7, 0.27, -1.0);
  house.rotation.y = 0.3;
  house.scale.setScalar(1.15);
  house.add(mesh(new THREE.BoxGeometry(1.35, 0.14, 1.1), mat('#9d8fd0'), 0, 0.07, 0));

  const walls = new THREE.Group();
  walls.add(mesh(new THREE.BoxGeometry(1.15, 0.8, 0.9), mat('#fff1d6'), 0, 0.54, 0));
  [-0.5, 0, 0.5].forEach((x) => walls.add(mesh(new THREE.BoxGeometry(0.06, 0.82, 0.92), mat('#c98b55'), x, 0.54, 0)));
  walls.add(mesh(new THREE.BoxGeometry(0.24, 0.42, 0.03), mat('#7a4a26'), 0, 0.35, 0.46, false));
  const windowMat = new THREE.MeshStandardMaterial({ color: '#5a5a8a', emissive: '#ffc95c', emissiveIntensity: 0, flatShading: true });
  [-0.32, 0.32].forEach((x) => walls.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 0.03), windowMat, x, 0.62, 0.46, false)));

  const roof = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.98, 0.7, 4), mat('#e5484d'), 0, 1.29, 0);
  cone.rotation.y = Math.PI / 4;
  cone.scale.set(1.12, 1, 0.95);
  roof.add(cone);
  roof.add(mesh(new THREE.BoxGeometry(0.16, 0.4, 0.16), mat('#9d8fd0'), 0.32, 1.45, -0.12));

  const flag = new THREE.Group();
  flag.position.set(0, 1.6, 0);
  flag.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), mat('#e8e8f0'), 0, 0.3, 0));
  const cloth = mesh(new THREE.BoxGeometry(0.32, 0.2, 0.02), mat('#ffd25a'), 0.17, 0.5, 0);
  flag.add(cloth);

  const light = glow('#ffc95c', 0);
  light.position.set(0, 0.6, 0.6);
  house.add(walls, roof, flag, light);
  const parts = [walls, roof, flag].map((o) => ({ o, s: 0 }));

  const smoke = Array.from({ length: 6 }, (_, i) => {
    const m = mat('#f4eefe', { transparent: true, opacity: 0.8 }).clone();
    const p = mesh(new THREE.IcosahedronGeometry(0.1, 0), m, 0, 0, 0, false);
    house.add(p);
    return { p, m, o: i / 6 };
  });
  island.add(house);

  const update = (f: Frame) => {
    house.visible = f.fx.mode === 'register';
    if (!house.visible) return;
    const [name, email, pass, agree] = f.fx.lit;
    const want = [name, email, agree];
    parts.forEach((part, i) => {
      part.s = damp(part.s, f.win || want[i] ? 1 : 0, 7, f.dt);
      part.o.scale.setScalar(Math.max(0.0001, part.s));
      if (i === 1) part.o.position.y = (1 - part.s) * 1.6; // крыша опускается сверху
    });
    cloth.rotation.y = Math.sin(f.t * 6) * 0.3;
    windowMat.emissiveIntensity = damp(windowMat.emissiveIntensity, f.win || pass ? 2.2 : 0, 5, f.dt);
    light.scale.setScalar(windowMat.emissiveIntensity * 0.8);
    smoke.forEach((s) => {
      const u = (f.t * 0.35 + s.o) % 1;
      s.p.position.set(0.32 + Math.sin(u * 6) * 0.08, 1.7 + u * 1.3, -0.12);
      s.p.scale.setScalar(parts[1].s > 0.5 ? 0.4 + u * 1.4 : 0.0001);
      s.m.opacity = 0.8 * (1 - u);
    });
  };
  return update;
}
