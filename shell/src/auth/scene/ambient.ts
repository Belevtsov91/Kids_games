/** Жизнь вокруг острова: маленькие острова-игрушки, облака рядом, искорки и бабочки. */
import * as THREE from 'three';
import { getGlowTexture, islandBase, jitter, letterBlock, mat, mesh } from '@/welcome/scene/kit';
import type { Frame } from './state';

function cloud(s: number) {
  const g = new THREE.Group();
  const n = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const m = mesh(jitter(new THREE.IcosahedronGeometry((0.6 + Math.random() * 0.6) * s, 1), 0.12 * s), mat(i % 3 ? '#f4eefe' : '#e2d6f6', { roughness: 1 }), (i - n / 2) * 0.75 * s, Math.random() * 0.4 * s, (Math.random() - 0.5) * 0.8 * s, false);
    m.scale.y = 0.7;
    g.add(m);
  }
  return g;
}

function toyPlanet() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.IcosahedronGeometry(0.32, 1), mat('#c49bff'), 0, 0.75, 0));
  const ring = mesh(new THREE.TorusGeometry(0.5, 0.04, 4, 24), mat('#ffd25a'), 0, 0.75, 0);
  ring.rotation.x = 1.2;
  g.add(ring);
  return g;
}

function toyRocket() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(0.2, 0.45, 5), mat('#ff7eb6'), 0, 0.5, 0));
  g.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), mat('#fff3dc'), 0, 0.82, 0));
  return g;
}

export function buildAmbient(world: THREE.Group, island: THREE.Group) {
  const cube = letterBlock('А', '#ffd25a', '#e5484d', 0.5);
  cube.position.y = 0.55;
  cube.rotation.y = 0.6;
  const sats = ([
    [0.8, '#9be26a', 6.2, 2.5, 1.4, 0.05, cube],
    [0.7, '#7fd1c0', 6.8, 0.6, 2.4, 0.04, toyPlanet()],
    [0.6, '#f2c26b', 5.6, 4.1, -0.6, 0.06, toyRocket()],
  ] as const).map(([r, top, dist, ang, y, speed, toy]) => {
    const g = new THREE.Group();
    g.add(islandBase(r, top, '#6a5a94', 8), toy);
    world.add(g);
    return { g, dist, ang, y, speed };
  });

  const clouds = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3, d = 7 + Math.random() * 8;
    const c = cloud(0.8 + Math.random() * 1.1);
    const z = Math.sin(a) * d - 2;
    // спереди облака ниже: на телефоне камера выше и иначе они закрывают остров
    c.position.set(Math.cos(a) * d, (z > 2 ? -4.5 : -2.6) - Math.random() * 2.2, z);
    world.add(c);
    return { c, v: 0.05 + Math.random() * 0.08 };
  });

  const SP = 140, spPos = new Float32Array(SP * 3), spV: number[] = [];
  for (let i = 0; i < SP; i++) {
    spPos.set([(Math.random() - 0.5) * 16, Math.random() * 8 - 2, (Math.random() - 0.5) * 10], i * 3);
    spV.push(0.1 + Math.random() * 0.25);
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  world.add(new THREE.Points(spGeo, new THREE.PointsMaterial({ map: getGlowTexture(), color: '#ffe9a8', size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  const flies = ['#ff7eb6', '#ffd25a', '#7ee7ff', '#c49bff'].map((c, i) => {
    const g = new THREE.Group();
    const wing = new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.3, flatShading: true });
    const geo = new THREE.CircleGeometry(0.13, 5);
    geo.translate(0.12, 0, 0);
    const wl = new THREE.Group(), wr = new THREE.Group();
    wl.add(new THREE.Mesh(geo, wing));
    wr.add(new THREE.Mesh(geo, wing));
    g.add(wl, wr);
    island.add(g);
    return { g, wl, wr, ph: i * 1.7, r: 2.2 + i * 0.45, h: 1.2 + (i % 2) * 0.7, sp: 0.35 + i * 0.07 };
  });

  return (f: Frame) => {
    const { t, dt } = f;
    sats.forEach((s, i) => {
      const a = s.ang + t * s.speed;
      // острова-игрушки плавают только позади главного, чтобы не заслонять дверь
      s.g.position.set(Math.cos(a) * s.dist, s.y + Math.sin(t * 0.9 + i) * 0.2, -3 - Math.abs(Math.sin(a)) * s.dist * 0.6);
      s.g.rotation.y += dt * 0.2;
    });
    clouds.forEach((c) => {
      c.c.position.x += c.v * dt;
      if (c.c.position.x > 17) c.c.position.x = -17;
    });
    const p = spGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < SP; i++) {
      let y = p.getY(i) + spV[i] * dt;
      if (y > 6) y = -2;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    flies.forEach((b) => {
      const a = t * b.sp + b.ph;
      b.g.position.set(Math.cos(a) * b.r, b.h + Math.sin(a * 2.3) * 0.35, Math.sin(a) * b.r * 0.75);
      b.g.rotation.y = -a;
      const flap = Math.sin(t * 18 + b.ph) * 1.1;
      b.wl.rotation.y = flap;
      b.wr.rotation.y = Math.PI - flap;
    });
  };
}
