// Загрузка моделей из assets/models (*.glb) и подготовка материалов: тени, без «unlit», без чёрного металла.

import { useGLTF } from '@react-three/drei';
import { Mesh, MeshBasicMaterial, MeshStandardMaterial, type Material, type Object3D } from 'three';

const files = import.meta.glob<string>('../../../assets/models/*.glb', { eager: true, query: '?url', import: 'default' });

export const MODEL_URL: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]),
);

export const modelUrl = (name: string) => {
  const url = MODEL_URL[name];
  if (!url) throw new Error(`Нет модели ${name}`);
  return url;
};

const converted = new WeakMap<Material, Material>();

/**
 * Без освещения (KHR_materials_unlit) модели выглядят плоско: меняем на обычный материал с тенями.
 * Металлические материалы без карты окружения почти чёрные: делаем их матовыми.
 */
function litMaterial(material: Material): Material {
  const ready = converted.get(material);
  if (ready) return ready;
  const result = convert(material);
  converted.set(material, result);
  return result;
}

function convert(material: Material): Material {
  if (material instanceof MeshStandardMaterial) {
    if (material.metalness <= 0.05) return material;
    const matte = material.clone();
    matte.metalness = 0;
    matte.roughness = Math.max(0.55, matte.roughness);
    return matte;
  }
  if (!(material instanceof MeshBasicMaterial)) return material;
  return new MeshStandardMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    vertexColors: material.vertexColors,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    roughness: 0.85,
  });
}

export function prepare(root: Object3D, shadows = true) {
  root.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = shadows;
      child.receiveShadow = true;
      child.material = Array.isArray(child.material) ? child.material.map(litMaterial) : litMaterial(child.material);
    }
  });
  return root;
}

export const preloadModels = (names: string[]) => names.forEach((name) => useGLTF.preload(modelUrl(name)));
