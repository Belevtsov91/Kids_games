/** Частицы: конфетти при успехе, красные осколки при ошибке, салют. */
import * as THREE from 'three';
import { getGlowTexture } from '@/welcome/scene/kit';

const CONFETTI = ['#ffd25a', '#ff7eb6', '#7ee7ff', '#7ef09a', '#c49bff', '#ffffff', '#ff9f43'].map((c) => new THREE.Color(c));
const SHARDS = ['#ff5c7a', '#ff7eb6', '#ffb3c4'].map((c) => new THREE.Color(c));

interface Bit {
  p: THREE.Vector3;
  v: THREE.Vector3;
  r: THREE.Euler;
  rv: THREE.Vector3;
  life: number;
}

function instanced(scene: THREE.Scene, geo: THREE.BufferGeometry, count: number, colors: THREE.Color[], side: THREE.Side) {
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side }), count);
  m.frustumCulled = false;
  const o = new THREE.Object3D();
  o.scale.setScalar(0);
  o.updateMatrix();
  const bits: Bit[] = [];
  for (let i = 0; i < count; i++) {
    m.setColorAt(i, colors[i % colors.length]);
    m.setMatrixAt(i, o.matrix);
    bits.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3(), life: 0 });
  }
  scene.add(m);
  return { m, bits };
}

export function buildParticles(scene: THREE.Scene) {
  const conf = instanced(scene, new THREE.PlaneGeometry(0.1, 0.17), 240, CONFETTI, THREE.DoubleSide);
  const shard = instanced(scene, new THREE.TetrahedronGeometry(0.08), 46, SHARDS, THREE.FrontSide);

  const FN = 900;
  const fPos = new Float32Array(FN * 3).fill(-999), fCol = new Float32Array(FN * 3);
  const fire = Array.from({ length: FN }, () => ({ v: new THREE.Vector3(), c: new THREE.Color(), life: 0, max: 1 }));
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3));
  const fireworks = new THREE.Points(
    fGeo,
    new THREE.PointsMaterial({ map: getGlowTexture(), size: 0.32, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  );
  fireworks.frustumCulled = false;
  scene.add(fireworks);
  let nextFire = 0;
  const o = new THREE.Object3D();

  const confetti = (origin: THREE.Vector3, n = 240) => {
    for (let i = 0; i < n; i++) {
      const b = conf.bits[i];
      b.p.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.4, (Math.random() - 0.5) * 0.4));
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
      b.v.set(Math.cos(a) * sp * 0.7, 4 + Math.random() * 5, Math.sin(a) * sp * 0.5 + 1.2);
      b.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      b.rv.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      b.life = 4 + Math.random() * 2;
    }
  };
  const shatter = (origin: THREE.Vector3) => {
    for (const b of shard.bits) {
      b.p.copy(origin);
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - 0.3, sp = 2 + Math.random() * 3;
      b.v.set(Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 1, Math.sin(a) * Math.cos(e) * sp + 1);
      b.r.set(Math.random() * 6, Math.random() * 6, 0);
      b.rv.set(8, 6, 0);
      b.life = 1.2 + Math.random() * 0.5;
    }
  };
  const firework = (origin: THREE.Vector3, color: string) => {
    const c = new THREE.Color(color), white = new THREE.Color('#ffffff');
    for (let k = 0; k < 110; k++) {
      const i = nextFire;
      nextFire = (nextFire + 1) % FN;
      fPos.set([origin.x, origin.y, origin.z], i * 3);
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 2.2 + Math.random() * 0.9;
      fire[i].v.set(r * Math.cos(a) * sp, u * sp, r * Math.sin(a) * sp);
      fire[i].c.copy(c).lerp(white, Math.random() * 0.3);
      fire[i].life = fire[i].max = 1.3 + Math.random() * 0.6;
    }
  };

  const step = (set: ReturnType<typeof instanced>, dt: number, t: number, gravity: number, drag: number, flutter: boolean) => {
    set.bits.forEach((b, i) => {
      if (b.life > 0) {
        b.life -= dt;
        b.v.y -= gravity * dt;
        if (drag) b.v.multiplyScalar(1 - drag * dt);
        if (flutter) b.v.y = Math.max(b.v.y, -1.1);
        b.p.addScaledVector(b.v, dt);
        if (flutter) b.p.x += Math.sin(t * 3 + i) * dt * 0.4;
        b.r.set(b.r.x + b.rv.x * dt, b.r.y + b.rv.y * dt, b.r.z + b.rv.z * dt);
        o.position.copy(b.p);
        o.rotation.copy(b.r);
        o.scale.setScalar(Math.min(1, b.life * (flutter ? 1 : 1.5)));
      } else o.scale.setScalar(0);
      o.updateMatrix();
      set.m.setMatrixAt(i, o.matrix);
    });
    set.m.instanceMatrix.needsUpdate = true;
  };

  const update = (t: number, dt: number) => {
    step(conf, dt, t, 6, 1.6, true);
    step(shard, dt, t, 7, 0, false);
    for (let i = 0; i < FN; i++) {
      const d = fire[i];
      if (d.life <= 0) {
        if (fCol[i * 3] + fCol[i * 3 + 1] + fCol[i * 3 + 2] > 0) fCol.fill(0, i * 3, i * 3 + 3);
        continue;
      }
      d.life -= dt;
      d.v.y -= 1.6 * dt;
      d.v.multiplyScalar(1 - 1.2 * dt);
      fPos[i * 3] += d.v.x * dt;
      fPos[i * 3 + 1] += d.v.y * dt;
      fPos[i * 3 + 2] += d.v.z * dt;
      const k = Math.max(0, d.life / d.max);
      fCol.set([d.c.r * k, d.c.g * k, d.c.b * k], i * 3);
    }
    fGeo.attributes.position.needsUpdate = true;
    fGeo.attributes.color.needsUpdate = true;
  };

  return { confetti, shatter, firework, update };
}
