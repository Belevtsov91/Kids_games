/** Общий «вид» 3D-сцен оболочки: мягкое окружение вместо плоской заливки и мягкие тени. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Окружение даёт гладким персонажам живые блики и подсвечивает тени снизу — сцена выглядит
 * «пластилиновой», а не плоской. Карта считается один раз на сцену (несколько миллисекунд).
 */
export function applyLook(renderer: THREE.WebGLRenderer, scene: THREE.Scene, envIntensity = 0.35) {
  renderer.shadowMap.type = THREE.PCFShadowMap; // в three 0.18x PCFShadowMap уже мягкий; PCFSoftShadowMap удалён
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = envIntensity;
  room.traverse((o) => {
    const m = o as Partial<THREE.Mesh>;
    m.geometry?.dispose();
    const mat = m.material;
    if (mat && !Array.isArray(mat)) mat.dispose();
  });
  pmrem.dispose();
  // Если видеокарта отобрала контекст (перегрузка, сон вкладки), браузер рисует на холсте белую «грустную» заглушку.
  // Прячем холст — под ним фон страницы того же цвета; three сам восстановит сцену и холст вернётся.
  const canvas = renderer.domElement;
  canvas.addEventListener('webglcontextlost', () => (canvas.style.visibility = 'hidden'));
  canvas.addEventListener('webglcontextrestored', () => (canvas.style.visibility = ''));
}

/** Пушистое облако из гладких шаров: вместо многогранников — мягкие, «ватные» формы. */
export function puffyCloud(material: THREE.Material, parts: [number, number, number, number][]): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1, 3);
  for (const [x, y, z, r] of parts) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.scale.set(r, r * 0.86, r);
    g.add(m);
  }
  return g;
}
