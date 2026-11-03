/** «Космический садовник»: планета с кольцами, горшок с цветком, комета, лиана с каплями, чёрная дыра и ракета. */
import * as THREE from 'three';
import { glow, glowMat, jitter, mat, mesh, type Built } from './kit';

function pot() {
  const g = new THREE.Group();
  g.position.set(0.3, 0.48, 0.2);
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.42, 10), mat('#e5484d'), 0, 0.21, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 10), mat('#c9363b'), 0, 0.43, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), mat('#30a46c'), 0, 0.8, 0));
  const bloom = new THREE.Group();
  bloom.position.y = 1.18;
  for (let i = 0; i < 6; i++) {
    const petal = mesh(new THREE.SphereGeometry(0.14, 8, 6), mat('#ff7eb6'), Math.cos(i * 1.047) * 0.17, 0, Math.sin(i * 1.047) * 0.17);
    petal.scale.y = 0.5;
    bloom.add(petal);
  }
  bloom.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), glowMat('#ffe066', 0.8)));
  g.add(bloom);
  for (const s of [-1, 1]) {
    const leaf = mesh(new THREE.SphereGeometry(0.12, 6, 4), mat('#4fd47a'), s * 0.14, 0.75, 0);
    leaf.scale.set(1.4, 0.4, 0.7);
    g.add(leaf);
  }
  return { g, bloom };
}

function rocket() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.42, 8), mat('#ffffff')));
  g.add(mesh(new THREE.ConeGeometry(0.1, 0.2, 8), mat('#e5484d'), 0, 0.31, 0));
  for (const a of [0, 2.1, 4.2]) {
    const fin = mesh(new THREE.BoxGeometry(0.02, 0.14, 0.12), mat('#2f8ef0'), Math.cos(a) * 0.11, -0.15, Math.sin(a) * 0.11);
    fin.rotation.y = -a;
    g.add(fin);
  }
  g.add(mesh(new THREE.CircleGeometry(0.05, 10), glowMat('#7ee7ff', 1), 0, 0.05, 0.105));
  const flame = mesh(new THREE.ConeGeometry(0.07, 0.25, 8), glowMat('#ff9f43', 2.5), 0, -0.32, 0, false);
  flame.rotation.x = Math.PI;
  g.add(flame);
  return { g, flame };
}

export function buildSpaceGardener(): Built {
  const group = new THREE.Group();
  const planet = mesh(jitter(new THREE.IcosahedronGeometry(1.5, 1), 0.15), mat('#8e4ec6'), 0, -0.9, 0);
  group.add(planet);
  const rings = (['#ffd25a', '#ff7eb6'] as const).map((c, i) => {
    const r = mesh(new THREE.TorusGeometry(i ? 2.5 : 2.2, i ? 0.035 : 0.08, 6, 48), mat(c, { roughness: 0.4 }), 0, -0.9, 0);
    r.rotation.set(Math.PI / 2.3, 0, 0.3);
    group.add(r);
    return r;
  });

  const p = pot();
  group.add(p.g);

  const comet = new THREE.Group();
  comet.position.set(-1.9, 2.6, -0.4);
  comet.add(mesh(new THREE.DodecahedronGeometry(0.28, 0), glowMat('#bfe6ff', 0.9)));
  comet.add(glow('#9ad8ff', 1.6));
  const tail = mesh(new THREE.ConeGeometry(0.22, 1.1, 8, 1, true), mat('#9ad8ff', { transparent: true, opacity: 0.45, emissive: '#9ad8ff', emissiveIntensity: 1, side: THREE.DoubleSide }), -0.55, 0.25, 0, false);
  tail.rotation.z = 1.15;
  comet.add(tail);
  group.add(comet);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.75, 2.35, -0.35), new THREE.Vector3(-1.4, 1.5, 0), new THREE.Vector3(-0.6, 1.7, 0.4), new THREE.Vector3(0, 1.25, 0.3), new THREE.Vector3(0.3, 1.1, 0.2),
  ]);
  group.add(mesh(new THREE.TubeGeometry(curve, 40, 0.06, 6), mat('#4fd47a', { flatShading: false })));
  for (let i = 1; i < 8; i++) {
    const pt = curve.getPoint(i / 8);
    const leaf = mesh(new THREE.SphereGeometry(0.07, 6, 4), mat('#30a46c'), pt.x, pt.y + 0.06, pt.z);
    leaf.scale.set(1.4, 0.5, 0.8);
    group.add(leaf);
  }
  const dropMat = mat('#2f8ef0', { emissive: '#1fa2d6', emissiveIntensity: 0.8, roughness: 0.1, flatShading: false });
  const drops = Array.from({ length: 6 }, () => {
    const d = mesh(new THREE.SphereGeometry(0.07, 8, 6), dropMat, 0, 0, 0, false);
    group.add(d);
    return d;
  });

  const hole = new THREE.Group();
  hole.position.set(1.9, 1.9, -0.6);
  hole.add(mesh(new THREE.SphereGeometry(0.26, 16, 12), mat('#0b0f2e', { flatShading: false })));
  const discs = ([[0.45, 0.07, '#8e4ec6'], [0.62, 0.025, '#ff7eb6']] as const).map(([r, tube, c]) => {
    const d = mesh(new THREE.TorusGeometry(r, tube, 6, 32), glowMat(c, 1.5), 0, 0, 0, false);
    d.rotation.x = 1.2;
    hole.add(d);
    return d;
  });
  hole.add(glow('#a56bff', 1.8));
  group.add(hole);

  const r = rocket();
  group.add(r.g);
  const sparkles = Array.from({ length: 10 }, (_, i) => {
    const s = mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat('#fff6c8', 2), Math.cos(i * 2.4) * 2.6, Math.sin(i * 1.7) * 1.6 + 0.8, Math.sin(i * 2.4) * 2.6, false);
    group.add(s);
    return s;
  });
  const orbit = (a: number) => new THREE.Vector3(Math.cos(a) * 2.3, -0.9 + Math.sin(a * 2) * 0.5, Math.sin(a) * 2.3);

  return {
    group,
    update: (t) => {
      planet.rotation.y = t * 0.15;
      rings[0].rotation.z = 0.3 + t * 0.1;
      drops.forEach((d, i) => {
        const pt = curve.getPoint((t * 0.35 + i / 6) % 1);
        d.position.set(pt.x, pt.y + 0.09, pt.z);
      });
      discs[0].rotation.z = t * 2;
      discs[1].rotation.z = -t * 1.4;
      p.bloom.scale.setScalar(0.85 + Math.sin(t * 1.5) * 0.15);
      p.bloom.rotation.y = t * 0.6;
      const a = t * 0.5;
      r.g.position.copy(orbit(a));
      r.g.lookAt(group.localToWorld(orbit(a + 0.3)));
      r.g.rotateX(Math.PI / 2);
      r.flame.scale.y = 0.8 + Math.random() * 0.5;
      comet.position.y = 2.6 + Math.sin(t * 1.3) * 0.08;
      sparkles.forEach((s, i) => s.scale.setScalar(0.6 + Math.sin(t * 3 + i) * 0.4));
    },
  };
}
