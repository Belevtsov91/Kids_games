/** Центральный остров: мишка-талисман машет лапой, шарики и указатель. */
import * as THREE from 'three';
import { islandBase, mat, mesh, type Built } from './kit';

const BALLOONS = ['#ff7eb6', '#ffd25a', '#7ee7ff', '#7ef09a'];

function bear() {
  const fur = mat('#b8743c'), light = mat('#f0c48c'), dark = mat('#2a1a12');
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.62, 12, 10), fur, 0, 0.85, 0));
  g.add(mesh(new THREE.SphereGeometry(0.42, 12, 10), light, 0, 0.8, 0.3));

  const head = new THREE.Group();
  head.position.y = 1.75;
  head.add(mesh(new THREE.SphereGeometry(0.52, 14, 12), fur));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), fur, s * 0.38, 0.4, 0));
    head.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), light, s * 0.38, 0.4, 0.08));
    head.add(mesh(new THREE.SphereGeometry(0.065, 8, 6), dark, s * 0.18, 0.08, 0.45));
    head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('#ff8fa8'), s * 0.32, -0.12, 0.38));
  }
  head.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), light, 0, -0.1, 0.42));
  head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), dark, 0, -0.03, 0.6));
  g.add(head);

  const armL = new THREE.Group();
  armL.position.set(-0.55, 1.15, 0);
  armL.rotation.z = -0.4;
  armL.add(mesh(new THREE.CapsuleGeometry(0.14, 0.4, 4, 8), fur, 0, -0.3, 0));
  g.add(armL);
  const armR = new THREE.Group();
  armR.position.set(0.55, 1.15, 0);
  armR.add(mesh(new THREE.CapsuleGeometry(0.14, 0.4, 4, 8), fur, 0, 0.32, 0));
  g.add(armR);
  for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.22, 10, 8), fur, s * 0.3, 0.25, 0.25));
  g.position.y = 0.28;
  return { g, head, armR };
}

export function buildHub(): Built {
  const group = new THREE.Group();
  group.add(islandBase(2.1, '#8fdc6e', '#6a5a94', 10));
  const b = bear();
  group.add(b.g);

  BALLOONS.forEach((c, i) => {
    const ball = mesh(new THREE.SphereGeometry(0.24, 12, 10), mat(c, { roughness: 0.35 }), 0.75 + (i % 2) * 0.32, 2.9 + i * 0.22, -0.1 + i * 0.12);
    ball.scale.y = 1.2;
    group.add(ball);
  });
  const string = mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.5, 3), mat('#ffffff'), 0.85, 2.2, 0, false);
  string.rotation.z = 0.15;
  group.add(string);

  group.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 6), mat('#8a5a2b'), -1.25, 0.95, 0.4));
  ['#ffd25a', '#7ee7ff', '#ff7eb6'].forEach((c, i) => {
    const sign = mesh(new THREE.BoxGeometry(0.75, 0.2, 0.06), mat(c), -1.25 + (i % 2 ? -0.2 : 0.2), 1.45 - i * 0.27, 0.42);
    sign.rotation.y = (i - 1) * 0.6;
    group.add(sign);
  });
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 2.2;
    group.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(BALLOONS[i % 4]), Math.cos(a) * 1.5, 0.33, Math.sin(a) * 1.5));
  }

  return {
    group,
    update: (t) => {
      b.armR.rotation.z = -0.35 + Math.sin(t * 5) * 0.45;
      b.head.rotation.z = Math.sin(t * 2.5) * 0.08;
      b.head.rotation.y = Math.sin(t * 0.9) * 0.25;
      b.g.position.y = 0.28 + Math.abs(Math.sin(t * 2.5)) * 0.06;
      group.position.y = Math.sin(t * 0.8) * 0.15;
    },
  };
}
