/** Позы мишки по ходу пробуждения: лежит → садится → садится на край → спрыгивает и машет. */
import { phase } from '../progress';
import { BEAR_SCALE, LEG_LEN, type BearRig } from './bear';
import { MATTRESS_TOP } from './bed';

interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Наклон тела: -π/2 — лежит на спине, 0 — сидит или стоит. */
  tilt: number;
  /** Ноги относительно тела: 0 — вдоль тела, -π/2 — вперёд. */
  leg: number;
}

const S = BEAR_SCALE;
const LIE: Pose = { x: 0, y: MATTRESS_TOP + 0.3, z: 0.1, yaw: 0, tilt: -Math.PI / 2, leg: 0 };
const SIT: Pose = { x: 0, y: MATTRESS_TOP + 0.04, z: -0.35, yaw: 0, tilt: 0, leg: -Math.PI / 2 };
const EDGE: Pose = { x: 0.5, y: MATTRESS_TOP + 0.04, z: 0, yaw: Math.PI / 2, tilt: 0, leg: -0.35 };
const STAND: Pose = { x: 1.35, y: LEG_LEN * S, z: 0.5, yaw: 1.0, tilt: 0, leg: 0 };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (a: Pose, b: Pose, k: number): Pose => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  z: lerp(a.z, b.z, k),
  yaw: lerp(a.yaw, b.yaw, k),
  tilt: lerp(a.tilt, b.tilt, k),
  leg: lerp(a.leg, b.leg, k),
});
/** Горка: 0 → 1 → 0 на отрезке [a, b]. */
const bump = (p: number, a: number, b: number) => Math.sin(Math.min(1, Math.max(0, (p - a) / (b - a))) * Math.PI);

/** p — насколько проснулся, t — время в секундах (для дыхания и покачиваний), stood — сколько секунд уже стоит. */
export function applyPose(b: BearRig, p: number, t: number, stood: number) {
  const k1 = phase(p, 0.28, 0.5), k2 = phase(p, 0.55, 0.78), k3 = phase(p, 0.88, 0.98);
  let pose = mix(LIE, SIT, k1);
  pose = mix(pose, EDGE, k2);
  pose = mix(pose, STAND, k3);
  const hop = Math.sin(k3 * Math.PI) * 0.35;
  b.root.position.set(pose.x, pose.y + hop, pose.z);
  b.root.rotation.y = pose.yaw;
  b.hips.rotation.x = pose.tilt;

  // дыхание: во сне глубокое и медленное
  const asleep = 1 - phase(p, 0.15, 0.35);
  const breath = Math.sin(t * (asleep > 0.5 ? 1.4 : 2.4));
  b.torso.scale.set(1 + breath * 0.025 * (1 + asleep), 1 + breath * 0.015, 1 + breath * 0.025 * (1 + asleep));

  // ноги: на краю кровати болтает ими по очереди
  const swing = phase(p, 0.74, 0.8) * (1 - k3) * Math.sin(t * 2.6) * 0.3;
  b.legL.rotation.x = pose.leg + swing;
  b.legR.rotation.x = pose.leg - swing;

  // лапы: потягивается во сне, трёт глаза сидя, большое потягивание перед прыжком, потом машет
  const yawn = bump(p, 0.16, 0.3), rub = bump(p, 0.42, 0.62), stretch = bump(p, 0.84, 0.92);
  const wave = Math.min(1, stood * 2);
  const reach = Math.max(yawn, stretch);
  b.armL.rotation.x = lerp(-0.15, -2.9, reach) - rub * 0.4;
  b.armL.rotation.z = lerp(-0.25, -0.35, reach);
  b.armR.rotation.x = lerp(-0.15, -2.9, reach) - rub * 2.2 + Math.sin(t * 9) * rub * 0.12;
  b.armR.rotation.z = lerp(0.25 + rub * 0.25, 0.35, reach) * (1 - wave) + wave * (2.6 + Math.sin(t * 8) * 0.35);
  if (wave > 0) b.armR.rotation.x *= 1 - wave;

  // голова: во сне чуть набок, на краю кровати оглядывается, стоя смотрит на нас
  const look = phase(p, 0.7, 0.8) * (1 - k3);
  b.head.rotation.y = Math.sin(t * 0.7) * 0.5 * look;
  b.head.rotation.z = asleep * 0.25 + Math.sin(t * 1.3) * 0.04;
  b.head.rotation.x = -yawn * 0.25 + rub * 0.2 - wave * 0.1;
  b.cap.rotation.z = -0.45 + Math.sin(t * 1.7) * 0.06 + hop * 0.6;

  // глаза: закрыты во сне, приоткрываются, потом моргают
  const open = phase(p, 0.22, 0.5);
  const blinkCycle = (t % 3.2) / 3.2;
  const blink = open > 0.9 && blinkCycle > 0.95 ? 0.15 : 1;
  const sleepy = 0.12 + open * 0.88 - rub * 0.6;
  b.eyes.forEach((e) => (e.scale.y = Math.max(0.1, sleepy * blink)));

  // рот: зевает (открытый кружок), потом улыбается
  b.mouth.scale.set(1 + yawn * 0.6, 1 + yawn * 2.2 + wave * 0.5, 1);
}
