/** Праздник и непогода: золотой ключ, радуга и шарики после регистрации, снег при блокировке. */
import * as THREE from 'three';
import { getGlowTexture, glow, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

export function buildCelebrate(scene: THREE.Scene, island: THREE.Group) {
  // ключ: кольцо, стержень, две бородки
  const key = new THREE.Group();
  const gold = mat('#ffd25a', { metalness: 0.5, roughness: 0.3, emissive: '#ffb000', emissiveIntensity: 0.5 });
  key.add(mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 14), gold, 0, 0, 0, false));
  key.add(mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), gold, 0.46, 0, 0, false));
  key.add(mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), gold, 0.62, -0.08, 0, false));
  key.add(mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), gold, 0.52, -0.06, 0, false));
  key.add(glow('#ffd25a', 1.2));
  key.visible = false;
  scene.add(key);
  const from = new THREE.Vector3(), to = new THREE.Vector3();

  const rainbow = new THREE.Group();
  rainbow.position.set(0.2, -0.6, -4.2);
  ['#ff5c7a', '#ff9f43', '#ffd25a', '#7ef09a', '#7ee7ff', '#c49bff'].forEach((c, i) => {
    const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, fog: false });
    rainbow.add(mesh(new THREE.TorusGeometry(5.4 - i * 0.22, 0.12, 5, 48, Math.PI), m, 0, 0, 0, false));
  });
  rainbow.scale.setScalar(0.0001);
  island.add(rainbow);

  const balloons = new THREE.Group();
  ['#ff7eb6', '#ffd25a', '#7ee7ff', '#7ef09a', '#c49bff'].forEach((c, i) => {
    const b = mesh(new THREE.SphereGeometry(0.24, 12, 10), mat(c, { roughness: 0.35, flatShading: false }), (i - 2) * 0.28, 0.4 + (i % 2) * 0.25, (i % 3) * 0.12, false);
    b.scale.y = 1.2;
    balloons.add(b);
    const s = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.8, 3), mat('#ffffff'), (i - 2) * 0.14, -0.2, 0, false);
    s.rotation.z = (i - 2) * -0.25;
    balloons.add(s);
  });
  balloons.visible = false;
  island.add(balloons);

  const SNOW = 220, snowPos = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i++) snowPos.set([(Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 6], i * 3);
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({ map: getGlowTexture(), color: '#ffffff', size: 0.16, transparent: true, depthWrite: false, opacity: 0 });
  island.add(new THREE.Points(snowGeo, snowMat));

  let rainbowS = 0, balloonT = -1;

  /** Запомнить, откуда и куда летит ключ: от лапы мишки к замку. */
  const startKey = (paw: THREE.Object3D, lock: THREE.Object3D, register: boolean) => {
    paw.localToWorld(from.set(0, -0.7, 0));
    lock.localToWorld(to.set(0, 0, 0)).add(new THREE.Vector3(0, 0, 0.25));
    balloonT = register ? 0 : -1;
  };

  const update = (f: Frame, bearPos: THREE.Vector3, frost: number) => {
    if (f.win && !f.reduce && f.sinceWin < 1.45) {
      key.visible = true;
      const k = Math.min(1, f.sinceWin / 0.95);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const mid = from.clone().lerp(to, 0.5);
      mid.y += 1.6;
      const a = from.clone().lerp(mid, e), b = mid.clone().lerp(to, e);
      key.position.copy(a.lerp(b, e));
      key.rotation.set(0, (1 - e) * Math.PI * 3, -e * 0.3);
      key.scale.setScalar(f.sinceWin < 0.95 ? 0.9 + Math.sin(k * Math.PI) * 0.4 : Math.max(0.01, 1 - (f.sinceWin - 0.95) / 0.5));
    } else key.visible = false;

    rainbowS = damp(rainbowS, f.win && f.fx.mode === 'register' && f.sinceWin > 1.2 ? 1 : 0, 2.5, f.dt);
    rainbow.scale.setScalar(Math.max(0.0001, rainbowS));

    balloons.visible = f.win && balloonT >= 0 && balloonT < 12;
    if (balloons.visible) {
      balloonT += f.dt;
      balloons.position.set(bearPos.x + Math.sin(balloonT * 1.3) * 0.3, 2.6 + balloonT * 1.1, bearPos.z);
      balloons.rotation.z = Math.sin(balloonT * 2) * 0.1;
    }

    snowMat.opacity = frost * 0.95;
    if (frost > 0.01) {
      const p = snowGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < SNOW; i++) {
        let y = p.getY(i) - f.dt * (0.6 + (i % 5) * 0.12);
        if (y < 0) y = 6;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(f.t + i) * f.dt * 0.2);
      }
      p.needsUpdate = true;
    }
  };

  return { startKey, update };
}
