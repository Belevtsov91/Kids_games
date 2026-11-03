/** Мишка-страж: следит за курсором и вводом, закрывает глаза на пароле, мотает головой при ошибке, прыгает при успехе. */
import * as THREE from 'three';
import { mat, mesh } from '@/welcome/scene/kit';
import { bounceDrop, damp, type AuthMode, type Frame } from './state';

const SPOT: Record<AuthMode, THREE.Vector3> = { login: new THREE.Vector3(-1.25, 0.28, 0.75), register: new THREE.Vector3(0.75, 0.28, 1.25) };

function arm(body: THREE.Group, side: number, fur: THREE.Material, light: THREE.Material) {
  const p = new THREE.Group();
  p.position.set(side * 0.55, 1.2, 0);
  p.add(mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.6, 8), fur, 0, -0.3, 0));
  p.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), light, 0, -0.66, 0));
  body.add(p);
  return p;
}

export function buildBear(mode: AuthMode) {
  const fur = mat('#b8743c'), light = mat('#f0c48c'), dark = mat('#2a1a12');
  const group = new THREE.Group();
  group.position.copy(SPOT[mode]);
  group.rotation.y = 0.35;
  const body = new THREE.Group();
  group.add(body);
  body.add(mesh(new THREE.SphereGeometry(0.62, 14, 12), fur, 0, 0.85, 0));
  body.add(mesh(new THREE.SphereGeometry(0.42, 12, 10), light, 0, 0.8, 0.3));
  const scarf = mesh(new THREE.TorusGeometry(0.4, 0.1, 6, 14), mat('#ff7eb6'), 0, 1.33, 0);
  scarf.rotation.x = Math.PI / 2;
  body.add(scarf);

  const head = new THREE.Group();
  head.position.y = 1.78;
  body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.52, 16, 14), fur));
  const eyes: THREE.Mesh[] = [];
  [-1, 1].forEach((s) => {
    head.add(mesh(new THREE.SphereGeometry(0.17, 10, 8), fur, s * 0.38, 0.4, 0));
    head.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), light, s * 0.38, 0.4, 0.08));
    const eye = mesh(new THREE.SphereGeometry(0.07, 10, 8), dark, s * 0.18, 0.08, 0.45);
    head.add(eye);
    eyes.push(eye);
    head.add(mesh(new THREE.SphereGeometry(0.022, 6, 5), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.6 }), s * 0.18 + 0.02, 0.11, 0.51, false));
  });
  head.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), light, 0, -0.1, 0.42));
  head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), dark, 0, -0.03, 0.6));
  const cheeks = [-1, 1].map((s) => {
    const c = mesh(new THREE.SphereGeometry(0.075, 8, 6), mat('#ff8fa8'), s * 0.32, -0.12, 0.38);
    head.add(c);
    return c;
  });
  const mouth = mesh(new THREE.TorusGeometry(0.06, 0.016, 4, 10, Math.PI), dark, 0, -0.17, 0.58, false);
  mouth.rotation.z = Math.PI;
  head.add(mouth);
  const armL = arm(body, -1, fur, light), armR = arm(body, 1, fur, light);
  [-1, 1].forEach((s) => body.add(mesh(new THREE.SphereGeometry(0.22, 10, 8), fur, s * 0.3, 0.22, 0.25)));

  let blink = 2;

  const update = (f: Frame) => {
    const { fx, t, dt } = f;
    const err = f.sinceErr < 1.6 && !f.win;
    blink -= dt;
    let lid = 1;
    if (blink < 0) {
      lid = Math.max(0.1, Math.abs(blink * 12 - 1));
      if (blink < -0.17) blink = 2 + Math.random() * 3;
    }
    eyes.forEach((e) => (e.scale.y = lid));

    const cover = fx.focus === 'pass' && !f.win;
    const typing = (fx.focus === 'email' || fx.focus === 'name') && !f.win;
    // поза по умолчанию: смотрит на курсор
    let lx = 0, lz = -0.15, rx = 0, rz = 0.15, hy = f.pointerX * 0.55 + Math.sin(t * 0.9) * 0.12, hp = 0, hr = Math.sin(t * 1.7) * 0.05, hop = 0, yaw = 0.35;
    if (typing) [hy, hp, hr, rz, rx] = [0.45 + Math.min(fx.typeLen, 28) * 0.016, 0.18, -0.08, 1.25 + Math.sin(t * 6) * 0.12, -0.2];
    if (cover) [lx, lz, rx, rz, hp, hy, hr] = [-2.55, 0.5, fx.peek ? -0.7 : -2.55, fx.peek ? -0.1 : -0.5, 0.22, 0, fx.peek ? -0.18 : 0];
    if (fx.thinking) [hr, hy, hp, rx, rz, lx, lz] = [Math.sin(t * 3) * 0.2, 0.25, -0.15, -1.9, -0.9, 0, -0.2];
    if (err) [hy, hp, lx, lz, rx, rz, hr] = [Math.sin(t * 22) * 0.55 * (1 - f.sinceErr / 1.6), 0.25, -1.4, 0.9, -1.4, -0.9, 0];
    if (f.win) {
      yaw = 0.35 - Math.min(f.sinceWin, 1) * 0.7;
      hop = f.reduce ? 0 : f.sinceWin < 3.2 ? Math.abs(Math.sin(f.sinceWin * 7)) * 0.55 : Math.abs(Math.sin(t * 3)) * 0.06;
      [lx, lz, rx, rz, hy, hp, hr] = [0, -2.5 + Math.sin(t * 9) * 0.15, 0, 2.5 + Math.sin(t * 9 + 1) * 0.35, -0.2, -0.2, Math.sin(t * 5) * 0.12];
    }
    armL.rotation.x = damp(armL.rotation.x, lx, 10, dt);
    armL.rotation.z = damp(armL.rotation.z, lz, 10, dt);
    armR.rotation.x = damp(armR.rotation.x, rx, 10, dt);
    armR.rotation.z = damp(armR.rotation.z, rz, 10, dt);
    head.rotation.y = err ? hy : damp(head.rotation.y, hy, 7, dt);
    head.rotation.x = damp(head.rotation.x, hp, 7, dt);
    head.rotation.z = damp(head.rotation.z, hr, 7, dt);
    body.position.y = (f.win ? hop : Math.abs(Math.sin(t * 2.2)) * 0.035) + (f.reduce ? 0 : bounceDrop(t - 1.7));
    body.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
    mouth.scale.set(1, f.win ? 1.8 : err ? -1 : 1, 1);
    mouth.position.y = err ? -0.2 : -0.17;
    cheeks.forEach((c) => c.scale.setScalar(cover ? 1.5 : 1));

    // переход на своё место при смене вкладки — вперевалочку
    const spot = SPOT[fx.mode];
    const dx = spot.x - group.position.x, dz = spot.z - group.position.z, dist = Math.hypot(dx, dz);
    if (dist > 0.03) {
      const step = f.reduce ? dist : Math.min(dist, dt * 2.2);
      group.position.x += (dx / dist) * step;
      group.position.z += (dz / dist) * step;
      body.position.y += Math.abs(Math.sin(t * 12)) * 0.14;
      yaw = Math.atan2(dx, dz);
      armL.rotation.x = Math.sin(t * 12) * 0.7;
      armR.rotation.x = -Math.sin(t * 12) * 0.7;
    }
    group.rotation.y = damp(group.rotation.y, yaw, 6, dt);
  };

  return { group, head, paw: armR, update };
}
