/** Главный остров сцены входа: трава, дорожка, деревья, цветы и грибы. */
import * as THREE from 'three';
import { islandBase, mat, mesh, pine, roundTree } from '@/welcome/scene/kit';
import type { PopIn } from './state';

const FLOWERS = ['#ff7eb6', '#ffd25a', '#7ee7ff', '#ffffff', '#c49bff'];
const TREES: [number, number, number][] = [[-0.4, -2.6, 1.2], [1.9, -2.4, 0.95], [-2.75, 0.05, 0.75], [-1.1, -2.3, 0.8], [0.5, -2.75, 0.8], [2.75, -1.7, 0.75]];

export function buildIsland(pop: PopIn): THREE.Group {
  const g = new THREE.Group();
  g.add(islandBase(3.1, '#8fdc6e', '#6a5a94', 11));

  // каменная дорожка от мишки к двери
  for (let i = 0; i < 6; i++) {
    const s = mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 7), mat('#efdcb4'), -1.3 + i * 0.42, 0.29, 1.1 - i * 0.33, false);
    s.rotation.y = i;
    g.add(s);
  }

  TREES.forEach(([x, z, s], i) => {
    const t = i % 2 ? pine(1.1, i % 3 ? '#4fb3a1' : '#7fd1c0') : roundTree(i % 3 ? '#6fcf6a' : '#9be26a');
    t.position.set(x, 0.27, z);
    t.scale.setScalar(s);
    g.add(pop.add(t, 1 + i * 0.08));
  });

  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 1.3 + (((i * 37) % 10) / 10) * 1.4;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z < -0.2 && Math.abs(x - 0.9) < 1.1) continue; // не сажаем цветы в проёме двери
    g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 3), mat('#3fa34d'), x, 0.36, z, false));
    g.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(FLOWERS[i % 5]), x, 0.47, z, false));
  }

  [[2.3, 0.9], [2.55, 0.55]].forEach(([x, z], i) => {
    g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6), mat('#fff3dc'), x, 0.38, z));
    g.add(mesh(new THREE.SphereGeometry(0.17 - i * 0.04, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ff6b81'), x, 0.48, z));
  });
  return g;
}
