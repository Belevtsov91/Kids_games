// Общие движения персонажей: плавный поворот к цели и удар по герою (минус сердечко, отбросить, мигание).

import type { Group } from 'three';
import type { Runtime } from '../../app/runtime';

/** Плавно повернуть группу к углу angle; k — доля поворота за кадр (1 — сразу). */
export const turn = (group: Group, angle: number, k: number) => {
  let diff = angle - group.rotation.y;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  group.rotation.y += diff * Math.min(1, k);
};

/** Удар по герою: минус сердечко, отбросить, мигание. */
export function hurtHero(runtime: Runtime, fromX: number, fromZ: number, power = 7) {
  if (runtime.time < runtime.invulnerableUntil || runtime.hearts <= 0) return false;
  runtime.hearts -= 1;
  runtime.invulnerableUntil = runtime.time + 1.6;
  const dx = runtime.hero.x - fromX;
  const dz = runtime.hero.z - fromZ;
  const d = Math.hypot(dx, dz) || 1;
  runtime.knock = { x: (dx / d) * power, z: (dz / d) * power, until: runtime.time + 0.22 };
  runtime.action = { name: 'hit', until: runtime.time + 0.35 };
  return true;
}
