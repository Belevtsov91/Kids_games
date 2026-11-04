// Неподвижные модели: одна модель по имени (Model) и модель, поставленная по данным карты (Placement).

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { Placed } from '../../game/world';
import { modelUrl, prepare } from './load';

/** Неподвижная модель: одна копия сцены (геометрия и материалы общие). */
export function Model({
  name,
  position,
  rotation = 0,
  scale = 1,
  shadows = true,
}: {
  name: string;
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  shadows?: boolean;
}) {
  const { scene } = useGLTF(modelUrl(name));
  const object = useMemo(() => prepare(scene.clone(true), shadows), [scene, shadows]);
  return <primitive object={object} position={position} rotation-y={rotation} scale={scale} />;
}

export function Placement({ item }: { item: Placed }) {
  return <Model name={item.model} position={[item.at[0], 0, item.at[1]]} rotation={item.rot} scale={item.scale} />;
}
