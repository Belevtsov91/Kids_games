/** Камера: общий план архипелага или подлёт к выбранному острову. Плавно смещает кадр под текст и карточку. */
import * as THREE from 'three';
import { RING_R } from './archipelago';

export interface CameraTarget {
  /** Мировая позиция острова. */
  pos: THREE.Vector3;
  /** Маленькая игрушка: подлетаем ближе. */
  small: boolean;
}

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
  mobile = false;
  private w = 1;
  private h = 1;
  private home = { dist: 24, height: 10 };
  private pos = new THREE.Vector3(0, 10, 24);
  private look = new THREE.Vector3(0, 0.4, 0);
  private shift = new THREE.Vector2();
  private first = true;

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.mobile = w < 760;
    const cam = this.camera;
    cam.aspect = w / h;
    const vf = (cam.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    const need = RING_R + 3.2;
    this.home.dist = this.mobile
      ? Math.max((need / Math.tan(hf / 2)) * 0.74, 22)
      : Math.max((need / Math.tan(hf / 2)) * 0.62, (need / Math.tan(vf / 2)) * 0.98);
    this.home.height = this.home.dist * (this.mobile ? 0.6 : 0.42);
    cam.updateProjectionMatrix();
  }

  /** instant — без плавности (первый кадр, prefers-reduced-motion). */
  update(target: CameraTarget | null, instant: boolean) {
    const m = this.mobile;
    let pos: THREE.Vector3, look: THREE.Vector3, sx: number, sy: number;
    if (target) {
      const out = new THREE.Vector3(target.pos.x, 0, target.pos.z);
      if (out.lengthSq() < 0.01) out.set(0, 0, 1);
      out.normalize();
      pos = target.pos.clone().addScaledVector(out, target.small ? 4.2 : m ? 15 : 9.5);
      pos.y += target.small ? 1.2 : m ? 7.5 : 4.2;
      look = target.pos.clone();
      look.y += target.small ? 0 : 0.9;
      sx = m ? 0 : -0.2; // остров левее, справа карточка
      sy = m ? -0.2 : 0; // на телефоне остров выше, снизу шторка
    } else {
      pos = new THREE.Vector3(0, this.home.height, this.home.dist);
      look = new THREE.Vector3(0, 0.4, 0);
      sx = m ? 0 : 0.2; // архипелаг правее, слева заголовок
      sy = m ? 0.17 : 0; // на телефоне ниже заголовка
    }
    const k = instant || this.first ? 1 : target ? 0.06 : 0.05;
    this.first = false;
    this.pos.lerp(pos, k);
    this.look.lerp(look, k);
    this.shift.lerp(new THREE.Vector2(sx, sy), instant ? 1 : 0.06);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    this.camera.setViewOffset(this.w, this.h, -this.shift.x * this.w, -this.shift.y * this.h, this.w, this.h);
  }
}
