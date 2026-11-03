/** Картинки для карточек «Самые яркие миры»: снимаем каждый большой остров отдельной камерой. */
import * as THREE from 'three';
import { BIG_IDS, type BigId } from '../showcase';

export function renderThumbnails(
  scene: THREE.Scene,
  worlds: Record<BigId, THREE.Object3D>,
  hide: THREE.Object3D[],
): Partial<Record<BigId, string>> {
  const out: Partial<Record<BigId, string>> = {};
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(520, 400);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    const cam = new THREE.PerspectiveCamera(34, 520 / 400, 0.1, 400);
    const pos = new THREE.Vector3();
    hide.forEach((o) => (o.visible = false));
    for (const id of BIG_IDS) {
      worlds[id].getWorldPosition(pos);
      const out3 = new THREE.Vector3(pos.x, 0, pos.z).normalize();
      const side = new THREE.Vector3(-out3.z, 0, out3.x);
      const space = id === 'space-gardener';
      cam.position.copy(pos).addScaledVector(out3, space ? 7.6 : 8.2).addScaledVector(side, 1.4);
      cam.position.y += space ? 2.6 : 3.6;
      cam.lookAt(pos.x, pos.y + (space ? 0.6 : 0.7), pos.z);
      renderer.render(scene, cam);
      out[id] = renderer.domElement.toDataURL('image/jpeg', 0.86);
    }
  } catch (err) {
    console.warn('welcome thumbnails', err);
  } finally {
    hide.forEach((o) => (o.visible = true));
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
  return out;
}
