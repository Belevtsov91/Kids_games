// Внешний вид героя: цвета наряда Хранителя и волшебный жезл, который крепится к правой руке модели.

import { useEffect } from 'react';
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, OctahedronGeometry, Vector3, type Object3D } from 'three';

/** Наряд Хранителя: тёплые лесные цвета вместо тёмных. */
export const OUTFIT: Record<string, string> = {
  Green: '#2f7f73',
  LightGreen: '#5fc0a5',
  Brown: '#9a6a3c',
  Brown2: '#6e4529',
  Gold: '#f3c45c',
  Black: '#3a3346',
  Grey: '#77809a',
  Hair: '#8a4a22',
};

/** Волшебный жезл в правой руке: палочка и сияющий кристалл. */
function makeWand() {
  const wand = new Group();
  const stick = new Mesh(new CylinderGeometry(0.018, 0.026, 0.62, 8), new MeshStandardMaterial({ color: '#8a5a2b', roughness: 0.7 }));
  stick.position.y = 0.2;
  const gem = new Mesh(new OctahedronGeometry(0.075, 0), new MeshStandardMaterial({ color: '#c9f6ff', emissive: '#7fe0ff', emissiveIntensity: 2.2 }));
  gem.position.y = 0.55;
  wand.add(stick, gem);
  wand.traverse((child) => (child.castShadow = true));
  return wand;
}

/** Найти кость правого запястья и прикрепить к ней жезл; при размонтировании — снять. */
export function useWand(object: Object3D) {
  useEffect(() => {
    let hand: Object3D | undefined;
    object.traverse((child) => {
      if (!hand && /wrist\.?r$/i.test(child.name)) hand = child;
    });
    if (!hand) return;
    const wand = makeWand();
    object.updateMatrixWorld(true);
    const scale = new Vector3();
    hand.getWorldScale(scale);
    wand.scale.setScalar(1 / (scale.x || 1));
    wand.rotation.set(Math.PI / 2, 0, 0);
    wand.position.set(0, 0.08 / (scale.x || 1), 0);
    hand.add(wand);
    return () => void hand?.remove(wand);
  }, [object]);
}
