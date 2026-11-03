/** Остров «Остров-конструктор»: воксельный остров в бухте, башня, лодка, фонари и падающий ящик. */
import * as THREE from 'three';
import { glow, glowMat, islandBase, mat, mesh, palm, roundTree, type Built } from './kit';

const S = 0.38; // размер блока
const BLOCK = { grass: '#6ed36a', sand: '#f2d38a', stone: '#9aa3b2', snow: '#ffffff' };
const TOWER = ['#e5484d', '#ffd25a', '#2f8ef0', '#30a46c', '#ff7eb6', '#8e4ec6'];

function boat() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.14, 0.24), mat('#e5484d')));
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), mat('#5a3a1a'), 0, 0.3, 0));
  const sail = new THREE.Shape();
  sail.moveTo(0, 0);
  sail.lineTo(0.3, 0);
  sail.lineTo(0, 0.42);
  sail.lineTo(0, 0);
  g.add(mesh(new THREE.ShapeGeometry(sail), mat('#ffffff', { side: THREE.DoubleSide }), 0.02, 0.08, 0));
  return g;
}

export function buildIslandBuilder(): Built {
  const group = new THREE.Group();
  const base = islandBase(2.9, '#33c3e6', '#5b6aa0', 12);
  (base.children[0] as THREE.Mesh).material = mat('#3cc8e8', { roughness: 0.2, transparent: true, opacity: 0.92 });
  group.add(base);

  const box = new THREE.BoxGeometry(S, S, S);
  const top = 0.3 + S / 2; // центр нижнего блока
  for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
      const d = Math.hypot(x, z);
      if (d > 4.3) continue;
      if (x >= 1 && x <= 2 && z >= 1 && z <= 3) continue; // выкопанная бухта
      const noise = Math.sin(x * 1.3) * Math.cos(z * 1.1);
      const h = d > 3.6 ? 1 : Math.max(1, Math.round(3.2 - d * 0.65 + noise * 0.7));
      for (let y = 0; y < h; y++) {
        const isTop = y === h - 1;
        const color = !isTop ? BLOCK.stone : h >= 4 ? BLOCK.snow : d > 3 ? BLOCK.sand : BLOCK.grass;
        group.add(mesh(box, mat(color), x * S, top + y * S, z * S));
      }
    }
  }
  TOWER.forEach((c, i) => group.add(mesh(box, mat(c), -2 * S, top + (3 + i) * S, -1 * S)));

  const trees: [number, number][] = [[-1, -2], [2, -2], [-3, 1], [0, 2.5]];
  trees.forEach(([x, z], i) => {
    const tree = i % 2 ? roundTree('#58c25a') : palm();
    tree.position.set(x * S, 0.3 + 3 * S, z * S);
    group.add(tree);
  });

  const lanterns = ([[-3, -1], [3, 0], [-1, 3]] as const).map(([x, z]) => {
    group.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), mat('#3a3a4a'), x * S, 0.3 + 2 * S + 0.25, z * S));
    const m = glowMat('#ffd36b', 2);
    const l = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), m, x * S, 0.3 + 2 * S + 0.55, z * S, false);
    l.add(glow('#ffcf6b', 0.6));
    group.add(l);
    return m;
  });

  const b = boat();
  group.add(b);
  const crate = mesh(box, mat('#c48a4a'), S, 3, -2 * S);
  group.add(crate);
  const landed = top + 4 * S;

  return {
    group,
    update: (t) => {
      const a = t * 0.35;
      b.position.set(Math.cos(a) * 2.45, 0.36 + Math.sin(t * 2) * 0.03, Math.sin(a) * 2.45);
      b.rotation.y = -a;
      const c = (t * 0.6) % 1;
      crate.position.y = c < 0.7 ? 3.2 - (c / 0.7) * (3.2 - landed) : landed;
      crate.rotation.y = c * 3;
      crate.visible = c < 0.95;
      lanterns.forEach((m, i) => (m.emissiveIntensity = 1.8 + Math.sin(t * 3 + i) * 0.4));
    },
  };
}
