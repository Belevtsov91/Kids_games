/** Остров «3D песочница»: пирамидка, башня из кубиков, горка с мячиком и прыгающие кубики. */
import * as THREE from 'three';
import { islandBase, letterBlock, mat, mesh, type Built } from './kit';

const RINGS = ['#e5484d', '#ff9f43', '#ffd25a', '#30a46c', '#2f8ef0'];
const BLOCKS = ['#2f8ef0', '#e5484d', '#ffd25a', '#30a46c', '#ff7eb6'];

function stripedBall() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e5484d';
    ctx.fillRect(i * 16, 0, 16, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }), 0, 1, 1);
}

export function buildPlayground(): Built {
  const group = new THREE.Group();
  group.add(islandBase(2.5, '#9be36a', '#7b5a9a', 10));
  group.add(mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.05, 24), mat('#ffe48a', { flatShading: false }), 0, 0.3, 0, false));

  const pyramid = new THREE.Group();
  pyramid.position.set(-0.7, 0.32, -0.3);
  pyramid.add(mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 16), mat('#8e4ec6'), 0, 0.06, 0));
  RINGS.forEach((c, i) => {
    const ring = mesh(new THREE.TorusGeometry(0.36 - i * 0.055, 0.11 - i * 0.008, 10, 20), mat(c, { roughness: 0.35, flatShading: false }), 0, 0.2 + i * 0.2, 0);
    ring.rotation.x = Math.PI / 2;
    pyramid.add(ring);
  });
  pyramid.add(mesh(new THREE.SphereGeometry(0.12, 12, 10), mat('#ff7eb6', { flatShading: false }), 0, 1.25, 0));
  group.add(pyramid);

  const tower = new THREE.Group();
  tower.position.set(0.8, 0.33, -0.6);
  const offset = (i: number) => (((i * 37) % 5) - 2) * 0.025;
  BLOCKS.forEach((c, i) => {
    const b = mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat(c, { roughness: 0.5 }), offset(i), 0.21 + i * 0.42, 0);
    b.rotation.y = i * 0.25;
    tower.add(b);
  });
  group.add(tower);

  const letter = letterBlock('A', '#ffd25a', '#e5484d', 0.4);
  letter.position.set(0.3, 0.53, 0.8);
  letter.rotation.y = 0.5;
  group.add(letter);

  const ramp = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.5), mat('#2fb85b'), -0.5, 0.6, 0.9);
  ramp.rotation.z = -0.35;
  group.add(ramp);
  const ball = stripedBall();
  group.add(ball);

  const hops = ['#7ee7ff', '#ff7eb6', '#7ef09a'].map((c, i) => {
    const b = mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), mat(c), 1.2 - i * 0.35, 0.5, 0.5 + i * 0.25);
    group.add(b);
    return b;
  });

  return {
    group,
    update: (t) => {
      tower.rotation.z = Math.sin(t * 2.2) * 0.035;
      tower.children.forEach((b, i) => (b.position.x = offset(i) + Math.sin(t * 2.2 + i * 0.3) * 0.012 * i));
      const c = (t * 0.45) % 1;
      const y = c < 0.65 ? 1.05 - (c / 0.65) * 0.55 + 0.02 : 0.5 + Math.abs(Math.sin((c - 0.65) * 20)) * 0.12 * (1 - c);
      ball.position.set(-1.05 + c * 1.7, y, 0.9);
      ball.rotation.z = -c * 14;
      hops.forEach((b, i) => {
        const p = t * 2.6 + i * 1.2;
        b.position.y = 0.45 + Math.abs(Math.sin(p)) * 0.7;
        b.rotation.x = p * 0.9;
        b.rotation.z = p * 0.6;
      });
      pyramid.rotation.y = t * 0.4;
    },
  };
}
