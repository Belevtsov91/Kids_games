/** Мир вокруг кровати: небо от ночи к рассвету, звёзды, луна и солнце, свет, летающий остров и облака. */
import * as THREE from 'three';
import { glowMat, islandBase, mat, mesh, pine, roundTree } from '@/welcome/scene/kit';

const SKY_VERTEX = 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const SKY_FRAGMENT = `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;
void main(){ float h = vP.y;
  vec3 c = h > 0.0 ? mix(hor, top, smoothstep(-0.05, 0.45, h)) : mix(hor, bot, smoothstep(0.0, -0.3, h));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const NIGHT = { top: '#0e0b38', hor: '#4a3488', bot: '#6b4a9a', fog: '#3a2b6e', hemi: '#8d9cff', key: '#a9b8ff' };
const DAWN = { top: '#4f74d8', hor: '#ffb9a6', bot: '#ffd8a8', fog: '#f0b3b8', hemi: '#fff1dc', key: '#ffe2bd' };

function stars() {
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, y = 0.03 + Math.random() * 0.9, r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 150, y * 150, Math.sin(a) * r * 150], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: '#fff6d8', size: 2, sizeAttenuation: false, transparent: true, fog: false });
  return { points: new THREE.Points(geo, m), m };
}

function cloudPuff(m: THREE.Material, x: number, y: number, z: number, s: number) {
  const g = new THREE.Group();
  [[0, 0, 0, 1], [0.8, 0.1, 0, 0.7], [-0.75, 0, 0.1, 0.65], [0.3, 0.4, 0, 0.6]].forEach(([cx, cy, cz, r]) =>
    g.add(mesh(new THREE.IcosahedronGeometry(r, 0), m, cx, cy, cz, false)),
  );
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  return g;
}

export function buildWorld(scene: THREE.Scene) {
  const uniforms = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT })));
  scene.fog = new THREE.Fog(NIGHT.fog, 30, 120);
  const sky = stars();
  scene.add(sky.points);

  // луна слева от кадра садится, солнце справа встаёт (камера смотрит в сторону -x, -z)
  const moonMat = glowMat('#fff2c4', 1.2);
  const moon = mesh(new THREE.IcosahedronGeometry(1.1, 1), moonMat, -30, 5.5, -8.5, false);
  const sun = mesh(new THREE.IcosahedronGeometry(2.6, 1), glowMat('#ffcf6e', 1.8), -24.5, -6, -26, false);
  scene.add(moon, sun);

  const hemi = new THREE.HemisphereLight(NIGHT.hemi, '#3b2a66', 0.55 * Math.PI);
  const key = new THREE.DirectionalLight(NIGHT.key, 1 * Math.PI);
  key.position.set(-6, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  key.shadow.bias = -0.001;
  scene.add(hemi, key);

  // остров: всё, что на нём, качается вместе с ним
  const island = new THREE.Group();
  const base = islandBase(3.1, '#79c983', '#8a6fb0', 10);
  base.position.y = -0.28;
  island.add(base);
  const trees: [THREE.Group, number, number][] = [[pine(1.5), -2.1, -1.4], [pine(1.1, '#3f9f8e'), -1.5, -2.2], [roundTree('#8fd36b'), 2.1, -1.5]];
  trees.forEach(([tree, x, z]) => {
    tree.position.set(x, 0, z);
    island.add(tree);
  });
  [[1.9, 1.6], [-1.9, 1.2], [0.4, 2.3]].forEach(([x, z], i) => island.add(mesh(new THREE.SphereGeometry(0.12, 6, 5), mat(['#ffd25a', '#ff7eb6', '#7ee7ff'][i]), x, 0.08, z)));
  scene.add(island);

  const puff = mat('#e9d6f2', { roughness: 1, transparent: true, opacity: 0.9 });
  const clouds = [cloudPuff(puff, -6, -2.5, -4, 1.3), cloudPuff(puff, 6.5, -1.5, -6, 1.6), cloudPuff(puff, 4, -4, 3, 1), cloudPuff(puff, -5, -5, 3, 1.2)];
  clouds.forEach((c) => scene.add(c));

  const c = new THREE.Color();
  const blend = (a: string, b: string, k: number) => c.set(a).lerp(new THREE.Color(b), k);

  /** morning: 0 — глубокая ночь, 1 — рассвет. */
  const update = (t: number, morning: number) => {
    uniforms.top.value.copy(blend(NIGHT.top, DAWN.top, morning));
    uniforms.hor.value.copy(blend(NIGHT.hor, DAWN.hor, morning));
    uniforms.bot.value.copy(blend(NIGHT.bot, DAWN.bot, morning));
    (scene.fog as THREE.Fog).color.copy(blend(NIGHT.fog, DAWN.fog, morning));
    hemi.color.copy(blend(NIGHT.hemi, DAWN.hemi, morning));
    hemi.intensity = (0.55 + morning * 0.35) * Math.PI;
    key.color.copy(blend(NIGHT.key, DAWN.key, morning));
    key.intensity = (1 + morning * 0.9) * Math.PI;
    key.position.set(-6 + morning * 14, 10, 6);
    sky.m.opacity = (1 - morning) * (0.75 + Math.sin(t * 1.5) * 0.15);
    moon.position.y = 5.5 - morning * 12;
    moonMat.emissiveIntensity = 1.2 * (1 - morning);
    moon.visible = morning < 0.6;
    sun.position.y = -5 + morning * 6.5;
    sun.visible = morning > 0.05;
    island.position.y = Math.sin(t * 0.6) * 0.06;
    clouds.forEach((cl, i) => (cl.position.x += Math.sin(t * 0.2 + i) * 0.002));
  };
  return { island, update };
}
