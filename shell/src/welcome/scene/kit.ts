/** Общие детали low-poly сцены: материалы, меши, основа острова, деревья, свечение. */
import * as THREE from 'three';

/** Обновление анимации, вызывается каждый кадр со временем в секундах. */
export type Updater = (t: number) => void;
export interface Built {
  group: THREE.Group;
  update: Updater;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();
type MatOpts = THREE.MeshStandardMaterialParameters;

/** Матовый материал с плоскими гранями; одинаковые материалы переиспользуются. */
export function mat(color: string, opts: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = color + JSON.stringify(opts);
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, metalness: 0, ...opts });
    cache.set(key, m);
  }
  return m;
}

/** Светящийся материал (окна, фонари, светлячки). Не кешируется: яркость анимируется. */
export const glowMat = (color: string, intensity = 1.6) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4, flatShading: true });

export function mesh(geo: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

/** Сдвигает вершины псевдослучайно; совпадающие вершины сдвигаются одинаково, поэтому щелей нет. */
export function jitter<T extends THREE.BufferGeometry>(geo: T, amount: number, keepTop = false): T {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const fr = (v: number) => v - Math.floor(v);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    p.setXYZ(i, x + (fr(h) - 0.5) * amount, keepTop && y > 0 ? y : y + (fr(h * 1.7) - 0.5) * amount, z + (fr(h * 2.3) - 0.5) * amount);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Летающий остров: верх, слой земли, каменный конус и пара камушков под ним. */
export function islandBase(r: number, top: string, rock: string, seg = 9): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(jitter(new THREE.CylinderGeometry(r, r * 0.94, 0.55, seg, 1), 0.12, true), mat(top)));
  g.add(mesh(jitter(new THREE.CylinderGeometry(r * 0.95, r * 0.85, 0.5, seg, 1), 0.15), mat('#b07a52'), 0, -0.5, 0));
  const cone = new THREE.ConeGeometry(r * 0.86, r * 1.5, seg, 3);
  cone.rotateX(Math.PI);
  g.add(mesh(jitter(cone, (0.22 * r) / 2.4), mat(rock), 0, -0.75 - r * 0.75, 0));
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 0.4;
    g.add(mesh(new THREE.DodecahedronGeometry(0.25 + 0.12 * i, 0), mat(rock), Math.cos(a) * r * 0.6, -r * 1.3 - i * 0.35, Math.sin(a) * r * 0.6));
  }
  return g;
}

export function pine(height = 1.4, color = '#4fb3a1'): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.4, 5), mat('#7a5230'), 0, 0.2, 0));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.ConeGeometry(0.42 - 0.1 * i, 0.6, 6), mat(color), 0, 0.5 + i * 0.32 * height, 0));
  return g;
}

export function roundTree(color = '#6fcf6a'): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.45, 5), mat('#7a5230'), 0, 0.22, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.32, 0), mat(color), 0, 0.6, 0));
  return g;
}

export function palm(): THREE.Group {
  const g = new THREE.Group();
  let y = 0, x = 0;
  for (let i = 0; i < 5; i++) {
    const s = mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.26, 5), mat('#a5763d'), x, y + 0.13, 0);
    s.rotation.z = -0.12 * i;
    g.add(s);
    y += 0.24;
    x += 0.035 * i;
  }
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.ConeGeometry(0.14, 0.75, 4);
    geo.scale(1, 1, 0.3);
    const leaf = mesh(geo, mat('#3fbf5f'), x, y, 0);
    leaf.rotation.set(0, (i * Math.PI) / 3, 1.7);
    leaf.translateY(0.32);
    g.add(leaf);
  }
  return g;
}

let glowTexture: THREE.CanvasTexture | null = null;
/** Мягкое круглое пятно для свечений и частиц. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

/** Мягкое свечение-спрайт вокруг луны, фонарей, светлячков. */
export function glow(color: string, size: number, opacity = 1): THREE.Sprite {
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: getGlowTexture(), color, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  );
  sp.scale.set(size, size, size);
  return sp;
}

/** Текстура кубика с буквой или цифрой. */
export function letterTexture(ch: string, bg: string, fg: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = fg;
  ctx.font = '900 92px system-ui, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Кубик, у которого на всех гранях одна и та же картинка. */
export function letterBlock(ch: string, bg: string, fg: string, size = 0.6): THREE.Mesh {
  const m = new THREE.MeshStandardMaterial({ map: letterTexture(ch, bg, fg), roughness: 0.6 });
  return mesh(new THREE.BoxGeometry(size, size, size), m);
}
