/** Эффекты у двери: кристаллы пароля вокруг замка, грозовая тучка при ошибке, сосульки при блокировке. */
import * as THREE from 'three';
import { getGlowTexture, jitter, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

const GEM_COLORS = ['#7ee7ff', '#c49bff', '#ff7eb6', '#7ef09a', '#ffd25a'];
const MAX_GEMS = 14;

export function buildGateFx(gate: THREE.Group) {
  // кристаллы: по одному на символ пароля
  const gems = new THREE.Group();
  gems.position.set(0, 2.55, 0);
  gate.add(gems);
  const gemScale: number[] = [];
  for (let i = 0; i < MAX_GEMS; i++) {
    const c = GEM_COLORS[i % 5];
    gems.add(mesh(new THREE.OctahedronGeometry(0.075, 0), mat(c, { emissive: c, emissiveIntensity: 0.9, roughness: 0.2 }), 0, 0, 0, false));
    gemScale.push(0);
  }

  // тучка с молнией и дождём
  const storm = new THREE.Group();
  storm.position.set(0, 3.55, 0.2);
  gate.add(storm);
  for (let i = 0; i < 5; i++) {
    const m = mesh(jitter(new THREE.IcosahedronGeometry(0.32 + 0.08 * (i % 2), 1), 0.06), mat(i % 2 ? '#5b4f86' : '#6e639c', { roughness: 1 }), (i - 2) * 0.36, (i % 2) * 0.14, ((i % 3) - 1) * 0.12, false);
    m.scale.y = 0.75;
    storm.add(m);
  }
  const boltMat = new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0, side: THREE.DoubleSide });
  const boltGeo = new THREE.BufferGeometry().setFromPoints(
    [[0, 0], [0.12, -0.35], [-0.05, -0.38], [0.1, -0.8], [-0.12, -0.3], [0.04, -0.28]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  );
  boltGeo.setIndex([0, 1, 4, 1, 5, 4, 2, 3, 5, 1, 2, 5]);
  const bolt = new THREE.Mesh(boltGeo, boltMat);
  bolt.position.set(0.1, -0.2, 0.15);
  storm.add(bolt);
  const RAIN = 70, rainPos = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) rainPos.set([(Math.random() - 0.5) * 1.6, -Math.random() * 2, (Math.random() - 0.5) * 0.6], i * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({ map: getGlowTexture(), color: '#9fd4ff', size: 0.1, transparent: true, depthWrite: false, opacity: 0 });
  storm.add(new THREE.Points(rainGeo, rainMat));
  storm.scale.setScalar(0.0001);

  // сосульки под аркой
  const icicles = new THREE.Group();
  gate.add(icicles);
  const ice = mat('#dff1ff', { emissive: '#a8d8ff', emissiveIntensity: 0.5, roughness: 0.1 });
  for (let i = 0; i < 9; i++) {
    const a = (Math.PI * (i + 0.5)) / 9;
    const c = mesh(new THREE.ConeGeometry(0.05, 0.22 + (i % 3) * 0.08, 5), ice, Math.cos(a) * 0.82, 1.7 + Math.sin(a) * 0.82, 0.12, false);
    c.rotation.x = Math.PI;
    icicles.add(c);
  }
  icicles.scale.setScalar(0.0001);

  let stormS = 0, frostS = 0;

  const update = (f: Frame) => {
    const count = f.fx.mode === 'login' ? Math.min(f.fx.gems, MAX_GEMS) : 0;
    const hideAfterErr = f.sinceErr < 1.6 && !f.win;
    const conv = f.win ? Math.max(0, 1 - f.sinceWin / 0.9) : 1; // при успехе кристаллы стягиваются в замок
    gems.children.forEach((g, i) => {
      gemScale[i] = damp(gemScale[i], i < count && !hideAfterErr ? 1 : 0, 10, f.dt);
      const a = (i / Math.max(count, 1)) * Math.PI * 2 + f.t * 1.6;
      g.position.set(Math.cos(a) * 0.62 * conv, Math.sin(a * 2 + f.t) * 0.12 * conv, Math.sin(a) * 0.62 * conv);
      g.scale.setScalar(Math.max(0.0001, gemScale[i] * conv));
      g.rotation.y += f.dt * 3;
    });

    const stormOn = !f.win && f.sinceErr < 1.9;
    stormS = damp(stormS, stormOn ? 1 : 0, stormOn ? 10 : 4, f.dt);
    storm.scale.setScalar(Math.max(0.0001, stormS));
    storm.position.x = Math.sin(f.t * 9) * 0.05 * stormS;
    rainMat.opacity = stormS * 0.9;
    boltMat.opacity = f.sinceErr < 0.5 && Math.sin(f.t * 40) > 0 ? 1 : 0;
    if (stormS > 0.01) {
      const rp = rainGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < RAIN; i++) {
        let y = rp.getY(i) - f.dt * 4.5;
        if (y < -2.2) y = -0.1;
        rp.setY(i, y);
      }
      rp.needsUpdate = true;
    }

    frostS = damp(frostS, f.fx.frozen ? 1 : 0, 4, f.dt);
    icicles.scale.set(1, Math.max(0.0001, frostS), 1);
  };

  return { update, frost: () => frostS };
}
