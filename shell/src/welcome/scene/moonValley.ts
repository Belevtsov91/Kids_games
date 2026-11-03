/** Остров «Хранители Лунной Долины»: домик, ёлки, теплица, грядки, лиса Луна, месяц и светлячки. */
import * as THREE from 'three';
import { glow, glowMat, islandBase, mat, mesh, pine, type Built } from './kit';

function house() {
  const g = new THREE.Group();
  g.position.set(-0.5, 0.27, -0.6);
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.5, 0.9), mat('#8e8e9c'), 0, 0.25, 0));
  g.add(mesh(new THREE.BoxGeometry(1.08, 0.55, 0.88), mat('#f3e7d1'), 0, 0.77, 0));
  for (const x of [-0.45, 0, 0.45]) g.add(mesh(new THREE.BoxGeometry(0.06, 0.56, 0.9), mat('#5a3a1a'), x, 0.77, 0));
  const roof = mesh(new THREE.ConeGeometry(0.92, 0.75, 4), mat('#2f6f73'), 0, 1.42, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.92);
  g.add(roof);
  const windowMat = glowMat('#ffc95c', 2.2);
  for (const x of [-0.25, 0.25]) g.add(mesh(new THREE.BoxGeometry(0.18, 0.18, 0.02), windowMat, x, 0.8, 0.455, false));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.32, 0.02), mat('#5a3a1a'), 0, 0.16, 0.46, false));
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.4, 0.16), mat('#8e8e9c'), 0.3, 1.6, -0.15));
  return g;
}

function fox() {
  const g = new THREE.Group();
  g.position.set(0.6, 0.27, 1.2);
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.2, 0.18), mat('#e0782f'), 0, 0.22, 0));
  const head = mesh(new THREE.ConeGeometry(0.12, 0.3, 4), mat('#e0782f'), 0.28, 0.32, 0);
  head.rotation.z = -Math.PI / 2;
  g.add(head);
  for (const s of [-1, 1]) g.add(mesh(new THREE.ConeGeometry(0.04, 0.1, 3), mat('#3a2a20'), 0.22, 0.45, s * 0.05));
  const tail = mesh(new THREE.ConeGeometry(0.08, 0.36, 5), mat('#f6efe2'), -0.3, 0.3, 0);
  tail.rotation.z = 1.1;
  g.add(tail);
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), mat('#3a2a20'), i < 2 ? 0.13 : -0.13, 0.07, i % 2 ? 0.06 : -0.06));
  return { g, tail };
}

function crescent() {
  const shape = new THREE.Shape();
  const R = 0.55, k = 0.25;
  for (let i = 0; i <= 24; i++) {
    const t = -Math.PI / 2 + (Math.PI * i) / 24;
    if (i) shape.lineTo(-R * Math.cos(t), R * Math.sin(t));
    else shape.moveTo(-R * Math.cos(t), R * Math.sin(t));
  }
  for (let i = 24; i >= 0; i--) {
    const t = -Math.PI / 2 + (Math.PI * i) / 24;
    shape.lineTo(-R * k * Math.cos(t), R * Math.sin(t));
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  const m = mesh(geo, glowMat('#fff0a8', 0.7), 0, 3.4, 0, false);
  m.rotation.z = -0.4;
  return m;
}

export function buildMoonValley(): Built {
  const group = new THREE.Group();
  group.add(islandBase(2.7, '#5fae5c', '#5b4a86', 10));
  const path = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 8), mat('#e6c99a'), 0.2, 0.29, 0.4, false);
  path.scale.set(1.8, 1, 0.8);
  group.add(path);

  const pines: [number, number, string][] = [[-1.9, -0.6, '#4fb3a1'], [-1.5, -1.5, '#7fd1c0'], [-0.5, -2.1, '#4fb3a1'], [1.6, -1.6, '#7fd1c0'], [2.1, -0.5, '#4fb3a1'], [-2.1, 0.8, '#7fd1c0'], [0.9, -2.2, '#5bc0ad']];
  pines.forEach(([x, z, c], i) => {
    const p = pine(1 + ((i * 7) % 3) * 0.25, c);
    p.position.set(x, 0.27, z);
    p.scale.setScalar(0.85 + ((i * 5) % 3) * 0.18);
    group.add(p);
  });
  group.add(house());
  const lamp = new THREE.PointLight('#ffb84d', 8, 5, 2);
  lamp.position.set(-0.5, 1.2, 0.1);
  group.add(lamp);

  // теплица и грядки
  group.add(mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#bfe6ff', { transparent: true, opacity: 0.35, roughness: 0.1, flatShading: false }), 1.2, 0.32, 0.5, false));
  group.add(mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.08, 12), mat('#e6d6b8'), 1.2, 0.31, 0.5));
  for (let i = 0; i < 4; i++) group.add(mesh(new THREE.ConeGeometry(0.06, 0.25, 4), mat('#3fa34d'), 1.05 + (i % 2) * 0.3, 0.45, 0.35 + (i > 1 ? 0.3 : 0)));
  for (let i = 0; i < 3; i++) {
    group.add(mesh(new THREE.BoxGeometry(0.75, 0.1, 0.22), mat('#6b4425'), -1.2 + i * 0.05, 0.32, 0.65 + i * 0.32));
    for (let k = 0; k < 4; k++) group.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 4), mat('#5ccf5a'), -1.48 + k * 0.18 + i * 0.05, 0.42, 0.65 + i * 0.32));
  }
  // кристаллы и грибы
  for (const [x, z] of [[1.8, 0.9], [-1.9, 1.5], [2.2, 0.2]]) {
    const c = mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat('#a56bff', 0.8), x, 0.45, z);
    c.scale.y = 1.8;
    group.add(c);
  }
  for (const [x, z] of [[0.4, 1.7], [-0.4, 1.9]]) {
    group.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.15, 5), mat('#f3e7d1'), x, 0.35, z));
    group.add(mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e5484d'), x, 0.42, z));
  }

  const f = fox();
  group.add(f.g);
  const moon = crescent();
  group.add(moon);
  const moonGlow = glow('#ffe58a', 1.5, 0.55);
  moonGlow.position.set(-0.2, 3.4, 0);
  group.add(moonGlow);

  const flies = Array.from({ length: 14 }, () => {
    const m = glowMat('#fff27a', 1.6);
    const fly = mesh(new THREE.SphereGeometry(0.035, 6, 4), m, 0, 0, 0, false);
    fly.add(glow('#fff27a', 0.18));
    group.add(fly);
    return { fly, m, a: Math.random() * 6.28, r: 0.6 + Math.random() * 2, h: 0.6 + Math.random() * 1.4, s: 0.3 + Math.random() * 0.6 };
  });

  return {
    group,
    update: (t) => {
      moon.position.y = 3.4 + Math.sin(t * 1.2) * 0.12;
      moon.rotation.y = Math.sin(t * 0.7) * 0.4;
      f.tail.rotation.y = Math.sin(t * 6) * 0.5;
      f.g.position.x = 0.6 + Math.sin(t * 0.5) * 0.25;
      f.g.rotation.y = Math.cos(t * 0.5) > 0 ? 0 : Math.PI;
      for (const o of flies) {
        o.fly.position.set(Math.cos(o.a + t * o.s) * o.r, o.h + Math.sin(t * 2 + o.a) * 0.2, Math.sin(o.a + t * o.s) * o.r);
        o.m.emissiveIntensity = 1.2 + Math.sin(t * 6 + o.a) * 0.8;
      }
      lamp.intensity = 7.5 + Math.sin(t * 9) * 0.8;
    },
  };
}
