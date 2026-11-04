// Неподвижный пейзаж: дома, мебель деревни, лес и декор (инстансингом, с качанием на ветру), забор сада,
// обелиски у поляны босса, кристальные скалы и кувшинки на озере.

import { useMemo } from 'react';
import { BUILDINGS, FENCES, LAKE, OBELISKS, PROPS, type Placed } from '../../game/world';
import { Instanced, Model, Placement } from '../models';
import type { WindOptions } from '../environment/wind';

// Качание на ветру: постоянные объекты, чтобы не пересоздавать материалы.
const WIND: Record<string, WindOptions> = {
  grass: { height: 0.7, amount: 0.09 },
  'flower-red': { height: 0.7, amount: 0.07 },
  'bush-1': { height: 1.4, amount: 0.05 },
  'mushroom-red': { height: 0.5, amount: 0.01 },
};
const TREE_WIND: WindOptions = { height: 10, amount: 0.16 };

function Fences() {
  const posts = useMemo(() => {
    const list: Placed[] = [];
    for (const [a, b] of FENCES) {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const count = Math.round(length / 1.8);
      const rot = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        list.push({ model: 'fence', at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], rot, scale: 2.3 });
      }
    }
    return list;
  }, []);
  return <Instanced name="fence" items={posts} />;
}

function groupByModel(items: Placed[]) {
  const map = new Map<string, Placed[]>();
  for (const item of items) map.set(item.model, [...(map.get(item.model) ?? []), item]);
  return [...map.entries()];
}

export function Landscape({ trees, decor }: { trees: Placed[]; decor: Placed[] }) {
  return (
    <>
      {BUILDINGS.map((item, index) => (
        <Placement key={index} item={item} />
      ))}
      {PROPS.map((item, index) => (
        <Placement key={index} item={item} />
      ))}
      {groupByModel(trees).map(([name, items]) => (
        <Instanced key={name} name={name} items={items} wind={TREE_WIND} />
      ))}
      {groupByModel(decor).map(([name, items]) => (
        <Instanced key={name} name={name} items={items} shadows={name !== 'grass' && name !== 'flower-red'} wind={WIND[name]} />
      ))}
      <Fences />
      {OBELISKS.map((at, index) => (
        <Model key={index} name="obelisk" position={[at[0], 0, at[1]]} scale={3.4} rotation={index} />
      ))}
      <Model name="crystal-rock" position={[-3, 0, -34]} scale={2.4} />
      <Model name="crystal-rock" position={[4, 0, -35]} scale={1.8} rotation={1} />
      <Model name="rock-tall" position={[-7, 0, -36]} scale={3} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Model
          key={i}
          name="lilypad"
          position={[LAKE.center[0] + Math.cos(i * 1.9) * (2 + i), -0.3, LAKE.center[1] + Math.sin(i * 1.9) * (2 + i * 0.8)]}
          scale={0.9}
          shadows={false}
        />
      ))}
    </>
  );
}
