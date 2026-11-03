/** Регистрация: табличка с именем взрослого и кристальная башня, которая растёт вместе с надёжностью пароля. */
import * as THREE from 'three';
import { glow, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

const STRENGTH = ['#ff5c7a', '#ff5c7a', '#ff9f43', '#ffd25a', '#7ef09a'].map((c) => new THREE.Color(c));

function signTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (text: string) => {
    ctx.fillStyle = '#f2c26b';
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#d9a54d';
    for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 40 + 36, 512, 3);
    ctx.fillStyle = '#5a3a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 74;
    const font = () => `900 ${size}px system-ui, "Arial Black", sans-serif`;
    ctx.font = font();
    while (ctx.measureText(text).width > 470 && size > 30) {
      size -= 4;
      ctx.font = font();
    }
    ctx.fillText(text, 256, 86);
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

export function buildSignTower(island: THREE.Group) {
  const label = signTexture();
  const sign = new THREE.Group();
  sign.position.set(-0.85, 0.27, 1.7);
  sign.rotation.y = 0.15;
  const wood = mat('#7a5230');
  sign.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6), wood, -0.5, 0.45, 0));
  sign.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6), wood, 0.5, 0.45, 0));
  sign.add(mesh(new THREE.BoxGeometry(1.25, 0.42, 0.06), mat('#a5763d'), 0, 0.74, -0.01));
  sign.add(mesh(new THREE.PlaneGeometry(1.2, 0.375), new THREE.MeshStandardMaterial({ map: label.tex, roughness: 0.8 }), 0, 0.74, 0.025, false));
  island.add(sign);

  const tower = new THREE.Group();
  tower.position.set(2.55, 0.27, -0.55);
  tower.add(mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.22, 7), mat('#9d8fd0'), 0, 0.11, 0));
  const segs = Array.from({ length: 4 }, (_, i) => {
    const m = new THREE.MeshStandardMaterial({ color: '#ff5c7a', emissive: '#ff5c7a', emissiveIntensity: 1, flatShading: true, roughness: 0.2, transparent: true, opacity: 0.92 });
    const c = mesh(new THREE.OctahedronGeometry(0.22, 0), m, 0, 0.45 + i * 0.42, 0);
    tower.add(c);
    return { c, m, s: 0 };
  });
  const towerGlow = glow('#ff5c7a', 0);
  towerGlow.position.y = 1;
  tower.add(towerGlow);
  island.add(tower);

  let signS = 0;
  const update = (f: Frame) => {
    const reg = f.fx.mode === 'register';
    sign.visible = tower.visible = reg;
    signS = damp(signS, reg && (f.fx.lit[0] || f.win) ? 1 : 0, 8, f.dt);
    sign.scale.set(1, Math.max(0.0001, signS), 1);
    const level = f.win ? 4 : f.fx.strength;
    const color = STRENGTH[level];
    segs.forEach((seg, i) => {
      seg.s = damp(seg.s, f.win || i < level ? 1 : 0, 9, f.dt);
      seg.c.scale.set(Math.max(0.0001, seg.s), Math.max(0.0001, seg.s * 1.5), Math.max(0.0001, seg.s));
      seg.c.rotation.y += f.dt * (1 + i * 0.3);
      seg.m.color.lerp(color, 0.1);
      seg.m.emissive.lerp(color, 0.1);
    });
    towerGlow.material.color.copy(segs[0].m.color);
    towerGlow.scale.setScalar(level * 0.7);
  };

  return { setName: (name: string) => label.draw(name), update };
}
