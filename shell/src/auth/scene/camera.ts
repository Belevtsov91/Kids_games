/** Камера сцены входа: свой ракурс для каждой вкладки, подлёт при загрузке, наезд на дверь при успехе, тряска при ошибке. */
import * as THREE from 'three';
import type { AuthMode, Frame } from './state';

const BASE: Record<AuthMode, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  login: { pos: new THREE.Vector3(1.2, 4.2, 12.6), look: new THREE.Vector3(0.2, 1.15, 0) },
  register: { pos: new THREE.Vector3(3.4, 6.4, 12), look: new THREE.Vector3(-0.3, 1.1, 0) },
};
const WIN_POS = new THREE.Vector3(1.2, 2.6, 7.2), WIN_LOOK = new THREE.Vector3(0.85, 1.5, -0.6);
/** Ширина, начиная с которой карточка стоит справа от острова, а не под ним. */
export const WIDE = 880;

const easeOut = (x: number) => 1 - (1 - Math.min(Math.max(x, 0), 1)) ** 3;

export function buildCamera() {
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
  let dist = 1, winK = 0, first = true;
  const pos = new THREE.Vector3(), look = new THREE.Vector3();

  const resize = (w: number, h: number) => {
    camera.aspect = w / h;
    const phone = w <= WIDE;
    // на телефоне остров в верхней части экрана, на десктопе — левее карточки
    if (phone) {
      dist = Math.max(1, 8.6 / (0.65 * camera.aspect * 12.6));
      camera.setViewOffset(w, h, 0, h * 0.27, w, h);
    } else {
      dist = Math.max(1, 1.35 / camera.aspect);
      camera.setViewOffset(w, h, w * 0.2, 0, w, h);
    }
    camera.updateProjectionMatrix();
  };

  const update = (f: Frame, pointerY: number) => {
    const base = BASE[f.fx.mode];
    const target = base.pos.clone().multiplyScalar(dist);
    target.y = base.pos.y + (dist - 1) * 1.2;
    const k = first ? 1 : 1 - Math.exp(-2.5 * f.dt);
    pos.lerp(target, k);
    look.lerp(base.look, k);
    first = false;
    winK += ((f.win && !f.reduce ? 1 : 0) - winK) * (1 - Math.exp(-1.6 * f.dt));
    const p = pos.clone().lerp(WIN_POS.clone().multiplyScalar(Math.max(1, dist * 0.8)), winK * 0.55);
    const l = look.clone().lerp(WIN_LOOK, winK * 0.7);
    p.x += f.pointerX * 0.5;
    p.y -= pointerY * 0.3;
    if (!f.reduce && f.t < 2.6) {
      const intro = 1 - easeOut(f.t / 2.6);
      p.add(new THREE.Vector3(-4 * intro, 3 * intro, 9 * intro));
    }
    if (!f.reduce && f.sinceErr < 0.5) {
      const s = (1 - f.sinceErr / 0.5) * 0.12;
      p.x += (Math.random() - 0.5) * s;
      p.y += (Math.random() - 0.5) * s;
    }
    camera.position.copy(p);
    camera.lookAt(l);
  };

  return { camera, resize, update };
}
