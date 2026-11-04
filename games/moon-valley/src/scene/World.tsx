// 3D-мир Лунной Долины: холст three.js (тени, тон-маппинг, качество под устройство) и сцена внутри.
// Содержимое сцены — в Scene.tsx; папки рядом:
//   environment/ — небо, солнце, земля, трава, ветер, облака, пост-обработка
//   village/     — пейзаж (дома, лес, декор, забор) и места (сад, теплица, кристаллы, сундуки)
//   characters/  — герой, питомцы, жители, олени, слаймы, Грибной король
//   physics/     — коллайдеры Rapier
//   targeting/   — поиск цели рядом с героем и подсветка под ней
//   models/      — загрузка моделей, персонажи с анимациями, инстансинг

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AgXToneMapping, SRGBColorSpace } from 'three';
import type { PetKind, ValleyState } from '../game/valley';
import type { NpcId } from '../game/quests';
import type { Target } from '../app/runtime';
import { detectQuality } from './quality';
import { Scene } from './Scene';

export interface WorldProps {
  state: ValleyState;
  night: boolean;
  paused: boolean;
  /** Время последней ласки питомца / разговора с жителем — для анимации. */
  happy: Record<PetKind, number>;
  talk: Record<NpcId, number>;
  bossActive: boolean;
  onTarget(target: Target | null): void;
  onCleanse(big: boolean): void;
  onHurt(): void;
  onBossHit(left: number): void;
  onCalmBoss(): void;
}

export function World(props: WorldProps) {
  const quality = useMemo(detectQuality, []);
  return (
    <Canvas
      shadows="soft"
      dpr={quality.dpr}
      camera={{ position: [0, 6, 14], fov: 50, near: 0.1, far: 600 }}
      frameloop={props.paused ? 'never' : 'always'}
      gl={{
        // Сглаживание делает пост-обработка (MSAA в своей цели рендера).
        antialias: false,
        powerPreference: 'high-performance',
        // AgX мягче ACES: яркие цвета не «выгорают», небо и трава остаются сочными.
        toneMapping: AgXToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: SRGBColorSpace,
      }}
    >
      <Suspense fallback={null}>
        <Scene {...props} quality={quality} />
      </Suspense>
    </Canvas>
  );
}

