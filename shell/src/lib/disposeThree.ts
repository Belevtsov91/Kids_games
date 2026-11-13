/** Полная уборка three.js-сцены: геометрии, материалы, текстуры и сам WebGL-контекст. */
import * as THREE from 'three';

function disposeMaterial(m: THREE.Material) {
  for (const value of Object.values(m)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  m.dispose();
}

/**
 * Браузер держит около 16 WebGL-контекстов; без forceContextLoss старый живёт до сборки мусора,
 * и после нескольких переходов «/ → /login → /» браузер гасит самый старый (иногда — текущую игру).
 */
export function disposeThree(scene: THREE.Object3D, renderer: THREE.WebGLRenderer) {
  scene.traverse((o) => {
    const mesh = o as Partial<THREE.Mesh>;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach(disposeMaterial);
    else if (mat) disposeMaterial(mat);
  });
  if (scene instanceof THREE.Scene) {
    if (scene.background instanceof THREE.Texture) scene.background.dispose();
    if (scene.environment) scene.environment.dispose();
  }
  renderer.dispose();
  // Контекст отпускаем сразу, только если холст уже убран со страницы. Если холст остался (повторный
  // запуск эффекта в StrictMode, пересоздание сцены), потерянный контекст достался бы новой сцене — и она не нарисуется.
  if (!renderer.domElement.isConnected) renderer.forceContextLoss();
}
