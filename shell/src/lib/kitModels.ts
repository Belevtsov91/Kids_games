/** Общие детали сцен из Blender (lib/kit.glb, собирается tools/blender/build_kit.py): основа острова, деревья,
 *  мишка Тёпа. Сцены сначала ждут loadKit(); если файл не пришёл — детали строятся из простых фигур, как раньше. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import kitUrl from './kit.glb?url';

interface Part {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

let scene: THREE.Object3D | null = null;
let pending: Promise<void> | null = null;
const parts = new Map<string, Part>();
const tints = new Map<string, THREE.MeshStandardMaterial>();

/** Сжатая сетка хранит координаты целыми числами и сдвиг в узле; переводим в обычные, чтобы деталь можно было растягивать. */
function unpack(mesh: THREE.Mesh): THREE.BufferGeometry {
  mesh.updateMatrix();
  const src = mesh.geometry, geo = new THREE.BufferGeometry();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrix);
  const v = new THREE.Vector3();
  const copy = (name: string, fix: (p: THREE.Vector3) => void) => {
    const a = src.getAttribute(name), out = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) {
      fix(v.fromBufferAttribute(a, i));
      v.toArray(out, i * 3);
    }
    geo.setAttribute(name, new THREE.BufferAttribute(out, 3));
  };
  copy('position', (p) => p.applyMatrix4(mesh.matrix));
  copy('normal', (p) => p.applyMatrix3(normalMatrix).normalize());
  if (src.getAttribute('color')) geo.setAttribute('color', src.getAttribute('color'));
  geo.setIndex(src.getIndex());
  return geo;
}

/** Загрузить детали. Никогда не падает: при ошибке или по таймауту сцены строятся из простых фигур. */
export function loadKit(timeoutMs = 3000): Promise<void> {
  pending ??= new Promise<void>((done) => {
    const timer = setTimeout(done, timeoutMs);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.loadAsync(kitUrl).then((gltf) => {
      gltf.scene.traverse((o) => {
        const m = o as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
        if (m.isMesh && m.name.startsWith('Kit')) parts.set(m.name, { geometry: unpack(m), material: m.material });
      });
      scene = gltf.scene;
    }).catch(() => undefined).finally(() => {
      clearTimeout(timer);
      done();
    });
  });
  return pending;
}

/** Деталь набора (например 'KitPineLeaves'), окрашенная в цвет; null — набор не загружен. */
export function kitPart(name: string, color?: string): THREE.Mesh | null {
  const part = parts.get(name);
  if (!part) return null;
  let material = part.material;
  if (color) {
    const key = `${part.material.name}:${color}`;
    material = tints.get(key) ?? part.material.clone();
    material.color.set(color);
    tints.set(key, material);
  }
  const mesh = new THREE.Mesh(part.geometry, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export interface BearParts {
  /** Всё тело: стоит ступнями в нуле. */
  body: THREE.Object3D;
  head: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  eyes: THREE.Object3D[];
  mouth: THREE.Object3D;
  cheeks: THREE.Object3D[];
}

/** Плюшевый мишка Тёпа с суставами; null — набор не загружен. */
export function kitBear(): BearParts | null {
  const src = scene?.getObjectByName('GBear');
  if (!src) return null;
  const body = src.clone(true);
  body.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  const get = (name: string) => body.getObjectByName(name)!;
  return {
    body, head: get('GHead'), armL: get('GArmL'), armR: get('GArmR'),
    eyes: [get('GEyeL'), get('GEyeR')], mouth: get('GMouth'), cheeks: [get('GCheekL'), get('GCheekR')],
  };
}
