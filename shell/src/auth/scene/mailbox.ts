/** Почтовый ящик: каждая введённая буква почты прилетает в него кубиком; флажок поднимается, когда адрес верный. */
import * as THREE from 'three';
import { glow, letterTexture, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame, type PopIn } from './state';

const PALETTE: [string, string][] = [['#ffd25a', '#e5484d'], ['#7ee7ff', '#1d5fb0'], ['#7ef09a', '#1f6b3a'], ['#ff7eb6', '#7a1f4a'], ['#c49bff', '#3a2378']];

export function buildMailbox(scene: THREE.Scene, pop: PopIn) {
  const group = new THREE.Group();
  group.position.set(-2.45, 0.27, 0.35);
  group.rotation.y = 0.55;
  pop.add(group, 1.35);
  const blue = mat('#4aa8ff');
  group.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.75, 6), mat('#7a5230'), 0, 0.37, 0));
  group.add(mesh(new THREE.BoxGeometry(0.42, 0.3, 0.56), blue, 0, 0.86, 0));
  const top = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.56, 10, 1, false, 0, Math.PI), blue, 0, 1.01, 0);
  top.rotation.set(0, Math.PI / 2, Math.PI / 2);
  group.add(top);
  group.add(mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), mat('#1d3a6b'), 0, 1.0, 0.285, false));
  const flag = new THREE.Group();
  flag.position.set(0.23, 0.8, -0.1);
  flag.add(mesh(new THREE.BoxGeometry(0.03, 0.36, 0.03), mat('#e8e8f0'), 0, 0.18, 0));
  flag.add(mesh(new THREE.BoxGeometry(0.03, 0.14, 0.2), mat('#ff5c7a'), 0, 0.3, 0.1));
  group.add(flag);
  const shine = glow('#7ee7ff', 0);
  shine.position.set(0, 1, 0.3);
  group.add(shine);

  const mats = new Map<string, THREE.Material>();
  const matFor = (ch: string) => {
    let m = mats.get(ch);
    if (!m) {
      const [bg, fg] = PALETTE[ch.charCodeAt(0) % PALETTE.length];
      m = new THREE.MeshStandardMaterial({ map: letterTexture(ch, bg, fg), roughness: 0.6 });
      mats.set(ch, m);
    }
    return m;
  };
  const pool = Array.from({ length: 14 }, () => {
    const m = mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat('#ffffff'), 0, -99, 0, false);
    m.visible = false;
    scene.add(m);
    return { m, t: -1, from: new THREE.Vector3(), to: new THREE.Vector3() };
  });
  let next = 0, ping = -9, now = 0;

  /** Буква вылетает со стороны карточки (справа на экране) и падает в щель ящика. */
  const fly = (ch: string, camera: THREE.Camera) => {
    if (!ch.trim()) return;
    const l = pool[next];
    next = (next + 1) % pool.length;
    l.m.material = matFor(ch);
    l.m.visible = true;
    l.t = 0;
    const edge = new THREE.Vector3(1, 0.15, 0.35).unproject(camera);
    l.from.copy(camera.position).lerp(edge, 0.35);
    group.localToWorld(l.to.set(0, 1, 0));
  };

  const update = (f: Frame, emailOk: boolean) => {
    now = f.t;
    flag.rotation.x = damp(flag.rotation.x, emailOk ? -1.5 : 0, 6, f.dt);
    shine.scale.setScalar(Math.max(0, 1 - (now - ping) * 2) * 1.6 + (emailOk ? 0.6 : 0));
    for (const l of pool) {
      if (l.t < 0) continue;
      l.t += f.dt / 0.75;
      const k = Math.min(l.t, 1);
      l.m.position.copy(l.from).lerp(l.to, k);
      l.m.position.y += Math.sin(k * Math.PI) * 1.6;
      l.m.rotation.set(k * 6, k * 8, 0);
      l.m.scale.setScalar(k < 0.85 ? 1 : Math.max(0.01, (1 - k) / 0.15));
      if (l.t >= 1) {
        l.t = -1;
        l.m.visible = false;
        ping = now;
      }
    }
  };

  return { group, fly, update };
}
