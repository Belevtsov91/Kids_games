/** Архипелаг: мишка в центре, кольцо больших островов и кольцо игрушек выше. */
import * as THREE from 'three';
import { BIG_IDS, SHOWCASE, SMALL_IDS, isBig, type BigId, type ShowcaseId } from '../showcase';
import { glow, type Built, type Updater } from './kit';
import { buildHub } from './hub';
import { buildMoonValley } from './moonValley';
import { buildIslandBuilder } from './islandBuilder';
import { buildPlayground } from './playground';
import { buildSpaceGardener } from './spaceGardener';
import { buildToy } from './toys';

export const RING_R = 8.6;

const BUILDERS: Record<BigId, () => Built> = {
  'moon-valley': buildMoonValley,
  'island-builder': buildIslandBuilder,
  playground3d: buildPlayground,
  'space-gardener': buildSpaceGardener,
};

/** Высота подписи над островом. */
export const labelHeight = (id: ShowcaseId) =>
  id === 'moon-valley' ? 4.3 : id === 'space-gardener' ? 3.6 : isBig(id) ? 3 : 0.9;

export interface Archipelago {
  root: THREE.Group;
  worlds: Record<ShowcaseId, THREE.Group>;
  pickables: THREE.Object3D[];
  /** t — время, yaw — поворот всего архипелага, selected — подсвеченные острова. */
  update: (t: number, yaw: number, selected: (id: ShowcaseId) => boolean) => void;
}

export function buildArchipelago(): Archipelago {
  const root = new THREE.Group();
  const ring = new THREE.Group();
  const toyRing = new THREE.Group();
  root.add(ring, toyRing);
  const updaters: Updater[] = [];
  const worlds = {} as Record<ShowcaseId, THREE.Group>;
  const phase = new Map<THREE.Object3D, number>();

  const hub = buildHub();
  root.add(hub.group);
  updaters.push(hub.update);

  BIG_IDS.forEach((id, i) => {
    const holder = new THREE.Group();
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    holder.position.set(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R);
    const built = BUILDERS[id]();
    holder.add(built.group);
    holder.userData.id = id;
    phase.set(holder, i * 1.7);
    updaters.push(built.update);
    ring.add(holder);
    worlds[id] = holder;
  });

  SMALL_IDS.forEach((id, i) => {
    const holder = new THREE.Group();
    const a = (i * Math.PI) / 3 + 0.25;
    const r = i % 2 ? 5.3 : 4.6;
    holder.position.set(Math.cos(a) * r, 2.4, Math.sin(a) * r);
    const toy = buildToy(id);
    toy.scale.setScalar(0.85);
    holder.add(toy, glow(SHOWCASE[id].color, 1.4, 0.5));
    holder.userData.id = id;
    phase.set(holder, i * 1.1);
    toyRing.add(holder);
    worlds[id] = holder;
  });

  const ease = (o: THREE.Object3D, target: number, k: number) => o.scale.setScalar(o.scale.x + (target - o.scale.x) * k);

  return {
    root,
    worlds,
    pickables: [...ring.children, ...toyRing.children],
    update: (t, yaw, selected) => {
      updaters.forEach((u) => u(t));
      root.rotation.y = yaw;
      toyRing.rotation.y = -yaw * 0.6;
      for (const h of ring.children) {
        h.position.y = Math.sin(t * 0.9 + (phase.get(h) ?? 0)) * 0.28;
        ease(h, selected(h.userData.id) ? 1.07 : 1, 0.12);
      }
      for (const h of toyRing.children) {
        const p = phase.get(h) ?? 0;
        h.children[0].rotation.y = t * 0.8 + p;
        h.position.y = 2.4 + (p % 3) * 0.5 + Math.sin(t * 1.3 + p) * 0.25;
        ease(h, selected(h.userData.id) ? 1.35 : 1, 0.15);
      }
    },
  };
}
