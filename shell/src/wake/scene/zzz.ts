/** «Z-z-z» над спящим мишкой: буквы поднимаются от головы и тают. */
import * as THREE from 'three';

function letterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#3b2a66';
    ctx.strokeText('Z', 32, 34);
    ctx.fillStyle = '#fff8ec';
    ctx.fillText('Z', 32, 34);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildZzz() {
  const tex = letterTexture();
  const group = new THREE.Group();
  const sprites = [0, 1, 2].map(() => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    group.add(s);
    return s;
  });

  /** from — голова мишки в мире; strength — 1 крепко спит, 0 проснулся. */
  const update = (t: number, from: THREE.Vector3, strength: number) => {
    group.visible = strength > 0.01;
    sprites.forEach((s, i) => {
      const k = (t * 0.35 + i / 3) % 1;
      s.position.set(from.x + 0.25 + k * 0.6 + Math.sin(k * 6 + i) * 0.08, from.y + 0.3 + k * 1.1, from.z + k * 0.2);
      s.scale.setScalar(0.18 + k * 0.22);
      s.material.opacity = Math.sin(k * Math.PI) * strength;
    });
  };
  return { group, update };
}
