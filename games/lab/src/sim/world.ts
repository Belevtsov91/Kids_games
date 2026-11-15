// Физический мир уровня на Rapier. Чистый модуль без React: его же гоняют тесты.
// Машина плоская: всё движется только в плоскости XY (ось Z заблокирована).
import type RAPIER_NS from '@dimforge/rapier3d-compat';
import { cellX, cellY, type Level, type Shelf } from '../game/levels/types';
import { GEAR_SPEEDS, LEVER_ANGLES, PENDULUM_ANGLES, RAMP_ANGLES, SIZE, SPRING_ANGLES, type Placed } from '../game/parts';

export type Rapier = typeof RAPIER_NS;
type Body = RAPIER_NS.RigidBody;

const DEPTH = 0.4;
const zQuat = (a: number) => ({ x: 0, y: 0, z: Math.sin(a / 2), w: Math.cos(a / 2) });

/** Тело, которое двигается: его позу каждый кадр забирает сцена. */
export interface Mover {
  id: number;
  body: Body;
  /** Для шестерёнки: угловая скорость, сцена её не трогает, крутит симуляция. */
  spin?: number;
}

export interface LabWorld {
  world: RAPIER_NS.World;
  ball: Body;
  movers: Mover[];
}

function plank(R: Rapier, world: RAPIER_NS.World, s: Shelf, opts: { restitution?: number; friction?: number } = {}) {
  const body = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(s.x, s.y, 0).setRotation(zQuat(s.angle)));
  const desc = R.ColliderDesc.cuboid(s.half, SIZE.plank, DEPTH)
    .setRestitution(opts.restitution ?? 0.15)
    .setFriction(opts.friction ?? 0.6);
  if (opts.restitution && opts.restitution > 0.5) desc.setRestitutionCombineRule(R.CoefficientCombineRule.Max);
  world.createCollider(desc, body);
}

const planar = (desc: RAPIER_NS.RigidBodyDesc) => desc.enabledTranslations(true, true, false).enabledRotations(false, false, true);

function addPart(R: Rapier, world: RAPIER_NS.World, part: Placed, movers: Mover[]) {
  const x = cellX(part.col);
  const y = cellY(part.row);
  switch (part.kind) {
    case 'ramp':
      return plank(R, world, { x, y, half: SIZE.rampHalf, angle: RAMP_ANGLES[part.variant] });
    case 'spring':
      return plank(R, world, { x, y: y - 0.3, half: SIZE.springHalf, angle: SPRING_ANGLES[part.variant] }, { restitution: 1.05, friction: 0.2 });
    case 'block': {
      const body = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, 0));
      return void world.createCollider(R.ColliderDesc.cuboid(SIZE.block, SIZE.block, DEPTH).setFriction(0.6), body);
    }
    case 'lever': {
      const pivot = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, 0));
      const angle = LEVER_ANGLES[part.variant];
      const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x, y, 0).setRotation(zQuat(angle)).setAngularDamping(0.4));
      world.createCollider(R.ColliderDesc.cuboid(SIZE.leverHalf, SIZE.plank, DEPTH).setDensity(0.6).setFriction(0.6), body);
      const joint = world.createImpulseJoint(R.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), pivot, body, true);
      (joint as RAPIER_NS.RevoluteImpulseJoint).setLimits(-0.45, 0.45);
      return void movers.push({ id: part.id, body });
    }
    case 'pendulum': {
      const pivot = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y + 0.4, 0));
      const a = PENDULUM_ANGLES[part.variant];
      const bx = x + Math.sin(a) * SIZE.rope;
      const by = y + 0.4 - Math.cos(a) * SIZE.rope;
      const body = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(bx, by, 0).setRotation(zQuat(a)));
      world.createCollider(R.ColliderDesc.ball(SIZE.bob).setDensity(6).setRestitution(0.3), body);
      world.createImpulseJoint(R.JointData.revolute({ x: 0, y: 0, z: 0 }, { x: 0, y: SIZE.rope, z: 0 }, { x: 0, y: 0, z: 1 }), pivot, body, true);
      return void movers.push({ id: part.id, body });
    }
    case 'gear': {
      const body = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, 0));
      world.createCollider(R.ColliderDesc.cylinder(DEPTH, SIZE.gear).setRotation({ x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }).setFriction(1), body);
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * Math.PI * 2;
        const r = SIZE.gear + SIZE.tooth / 2;
        world.createCollider(
          R.ColliderDesc.cuboid(SIZE.tooth / 2, SIZE.tooth / 2, DEPTH).setTranslation(Math.cos(t) * r, Math.sin(t) * r, 0).setRotation(zQuat(t)),
          body,
        );
      }
      return void movers.push({ id: part.id, body, spin: GEAR_SPEEDS[part.variant] });
    }
  }
}

export function buildWorld(R: Rapier, level: Level, machine: Placed[]): LabWorld {
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  // Пол острова — широкая плита; бортов нет: укатившийся шарик падает с острова.
  const floor = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.25, 0));
  world.createCollider(R.ColliderDesc.cuboid(7.2, 0.25, 2).setFriction(0.9), floor);
  for (const shelf of level.shelves) plank(R, world, shelf);
  const movers: Mover[] = [];
  for (const part of machine) addPart(R, world, part, movers);
  const ball = world.createRigidBody(
    planar(R.RigidBodyDesc.dynamic()).setTranslation(level.ball.x, level.ball.y, 0).setLinvel(level.ball.vx, 0, 0).setCcdEnabled(true),
  );
  world.createCollider(R.ColliderDesc.ball(SIZE.ball).setRestitution(0.35).setFriction(0.5).setDensity(1.5), ball);
  return { world, ball, movers };
}

export { zQuat };
