// Всё, что внутри 3D-холста: небо, земля, пейзаж, места (сад, теплица, кристаллы, сундуки),
// жители, питомцы, олени, слаймы и босс, физика с героем, поиск цели и пост-обработка.

import { useMemo } from 'react';
import { Physics } from '@react-three/rapier';
import type { PetKind } from '../game/valley';
import { npcMarker } from '../game/quests';
import { CHESTS, DEER, generateDecor, generateTrees, NPCS, SLIMES, type Vec2 } from '../game/world';
import { Hero } from './characters/hero/Hero';
import { Deer } from './characters/Deer';
import { MushroomKing } from './characters/MushroomKing';
import { Npc } from './characters/Npc';
import { Fox, Frog, LockedPet, Owl } from './characters/Pets';
import { Slime } from './characters/Slime';
import { Atmosphere } from './environment/Atmosphere';
import { Effects } from './environment/Effects';
import { GrassField } from './environment/GrassField';
import { Terrain } from './environment/Terrain';
import { Colliders } from './physics/Colliders';
import { Interactor, KingTracker } from './targeting/Interactor';
import { TargetHalo } from './targeting/TargetHalo';
import { Landscape } from './village/Landscape';
import { Chest, Crystals, Garden, Greenhouse } from './village/Places';
import type { Quality } from './quality';
import type { WorldProps } from './World';

const FROG_HOME: Vec2 = [-8.5, -1.5];

export function Scene(props: WorldProps & { quality: Quality }) {
  const { state, night, happy, talk } = props;
  const trees = useMemo(generateTrees, []);
  const decor = useMemo(generateDecor, []);
  const unlocked = (id: PetKind) => state.pets.find((pet) => pet.id === id)?.unlocked ?? false;
  const bossCalm = state.stats.boss > 0;
  return (
    <>
      <Atmosphere night={night} quality={props.quality} />

      <Terrain night={night} />
      <GrassField count={props.quality.grass} />
      <TargetHalo night={night} />
      <Landscape trees={trees} decor={decor} />

      <Garden plots={state.plots} />
      <Greenhouse built={state.buildings.includes('greenhouse')} />
      <Crystals />
      {CHESTS.map((chest) => (
        <Chest key={chest.id} at={chest.at} rot={chest.rot} opened={state.opened.includes(chest.id)} />
      ))}
      {NPCS.map((spot) => (
        <Npc key={spot.id} spot={spot} marker={npcMarker(state, spot.id)} talkAt={talk[spot.id]} />
      ))}
      <Fox happyAt={happy.fox} />
      {unlocked('owl') ? <Owl happyAt={happy.owl} /> : <LockedPet at={[-10, 1]} kind="owl" />}
      {unlocked('bunny') ? <Frog home={FROG_HOME} happyAt={happy.bunny} /> : <LockedPet at={FROG_HOME} kind="bunny" />}
      {DEER.map((home, index) => (
        <Deer key={index} home={home} />
      ))}
      {SLIMES.map((spawn) => (
        <Slime key={spawn.id} spawn={spawn} onCleanse={props.onCleanse} onHurt={props.onHurt} />
      ))}
      {(props.bossActive || bossCalm) && (
        <MushroomKing calm={bossCalm} onCalm={props.onCalmBoss} onHurt={props.onHurt} onHit={props.onBossHit} />
      )}

      <Physics gravity={[0, -18, 0]} paused={props.paused}>
        <Colliders trees={trees} />
        <Hero />
      </Physics>
      <Interactor state={state} bossCalm={bossCalm} onTarget={props.onTarget} />
      <KingTracker active={bossCalm} />
      <Effects night={night} quality={props.quality} />
    </>
  );
}
