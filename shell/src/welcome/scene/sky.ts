/** Закатное небо, звёзды, свет, облака и море облаков внизу. */
import * as THREE from 'three';
import { mat, mesh, type Updater } from './kit';

const SKY_VERTEX = 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const SKY_FRAGMENT = `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;
void main(){ float h = vP.y;
  vec3 c = h > 0.0 ? mix(hor, top, smoothstep(-0.05, 0.38, h)) : mix(hor, bot, smoothstep(0.0, -0.3, h));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

function cloud(scale: number): THREE.Group {
  const g = new THREE.Group();
  const m = mat('#ffffff', { roughness: 1 });
  const parts: [number, number, number, number][] = [[0, 0, 0, 1], [0.8, 0.1, 0.1, 0.75], [-0.8, 0, 0, 0.7], [0.35, 0.4, 0, 0.65], [-0.3, 0.35, 0.2, 0.6]];
  parts.forEach(([x, y, z, r]) => g.add(mesh(new THREE.IcosahedronGeometry(r, 0), m, x, y, z, false)));
  g.scale.setScalar(scale);
  return g;
}

export interface SkyParts {
  update: Updater;
  /** Облака рядом с островами: прячем их, когда снимаем картинки для карточек. */
  clouds: THREE.Group[];
}

export function addSky(scene: THREE.Scene): SkyParts {
  scene.fog = new THREE.Fog('#b77bc0', 55, 140);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(200, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#1c1858') }, hor: { value: new THREE.Color('#d873b4') }, bot: { value: new THREE.Color('#f7a582') } },
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
    }),
  );
  scene.add(sky);

  // звёзды в верхней полусфере
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, y = 0.18 + Math.random() * 0.8, r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 180, y * 180, Math.sin(a) * r * 180], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ color: '#fff6d8', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false });
  scene.add(new THREE.Points(starGeo, starMat));

  // свет (интенсивности в физических единицах three r155+)
  scene.add(new THREE.HemisphereLight('#d8e6ff', '#5a3f7f', 0.55 * Math.PI));
  const sun = new THREE.DirectionalLight('#ffe2bd', 1.9 * Math.PI);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#9a7bff', 0.6 * Math.PI);
  rim.position.set(-10, 6, -10);
  scene.add(rim);

  // облака вокруг архипелага
  const drift = Array.from({ length: 9 }, (_, i) => {
    const c = cloud(0.6 + Math.random() * 0.9);
    const a = (i / 9) * Math.PI * 2, r = 13 + Math.random() * 6, y = -1.5 + Math.random() * 5;
    scene.add(c);
    return { c, a, r, y, speed: 0.01 + Math.random() * 0.02 };
  });

  // море облаков внизу
  const sea = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#f3d3ea', { roughness: 1 }), 260);
  const d = new THREE.Object3D();
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 70;
    d.position.set(Math.cos(a) * r, -15 - Math.random() * 3, Math.sin(a) * r);
    d.scale.setScalar(1.6 + Math.random() * 2.6);
    d.scale.y *= 0.6;
    d.rotation.y = Math.random() * 3;
    d.updateMatrix();
    sea.setMatrixAt(i, d.matrix);
  }
  scene.add(sea);

  let last = 0;
  const update: Updater = (t) => {
    const dt = Math.min(t - last, 0.05);
    last = t;
    starMat.opacity = 0.7 + Math.sin(t * 1.5) * 0.15;
    drift.forEach((o) => {
      o.a += o.speed * dt;
      o.c.position.set(Math.cos(o.a) * o.r, o.y + Math.sin(t * 0.3 + o.a) * 0.3, Math.sin(o.a) * o.r);
    });
  };
  return { update, clouds: drift.map((o) => o.c) };
}
