/** Маленькие игрушки для 2D-игр: мелок, пазл, кубики «Б» и «3», нота, домик. */
import * as THREE from 'three';
import type { SmallId } from '../showcase';
import { letterBlock, mat, mesh } from './kit';

function crayon() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 6), mat('#ff7eb6')));
  g.add(mesh(new THREE.ConeGeometry(0.14, 0.28, 6), mat('#f3d9b0'), 0, 0.59, 0));
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.1, 6), mat('#c9366b'), 0, 0.7, 0));
  g.rotation.z = 0.7;
  return g;
}

function puzzle() {
  const g = new THREE.Group();
  const m = mat('#ff9f43');
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.6, 0.16), m));
  for (const [x, y] of [[0.38, 0], [0, 0.38]]) {
    const knob = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 10), m, x, y, 0);
    knob.rotation.x = Math.PI / 2;
    g.add(knob);
  }
  return g;
}

function note() {
  const g = new THREE.Group();
  const m = mat('#a99bff');
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), m);
  head.scale.set(1.3, 1, 1);
  g.add(head);
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), m, 0.22, 0.4, 0));
  const flag = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), m, 0.36, 0.75, 0);
  flag.rotation.z = -0.5;
  g.add(flag);
  return g;
}

function house() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.45, 0.5), mat('#fff1d6')));
  const roof = mesh(new THREE.ConeGeometry(0.5, 0.4, 4), mat('#30a46c'), 0, 0.43, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(0.14, 0.22, 0.02), mat('#8a5a2b'), 0, -0.11, 0.26));
  return g;
}

const BUILDERS: Record<SmallId, () => THREE.Object3D> = {
  drawing: crayon,
  puzzles: puzzle,
  'letter-eater': () => letterBlock('Б', '#ffd25a', '#2f6f73'),
  'animal-orchestra': note,
  counting: () => letterBlock('3', '#7ee7ff', '#1d5fb0'),
  'who-lives-where': house,
};

export const buildToy = (id: SmallId) => BUILDERS[id]();
