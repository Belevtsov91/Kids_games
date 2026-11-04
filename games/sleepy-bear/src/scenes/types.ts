import type { GameProgress } from '@ig/sdk';
import type { Rng } from '../game/logic';
import type { Sound } from '../audio/Sound';

/** Что сцена получает от игры. */
export interface SceneCtx {
  /** Сцена рисует себя сюда; игра очищает при смене сцены. */
  stage: HTMLElement;
  sound: Sound;
  progress: GameProgress;
  rng: Rng;
  /** Сколько ночей уже было: от этого пижама. */
  nights: number;
  /** Сказать фразу и запомнить её для повтора по подсказке. */
  say(text: string): void;
  /** Ребёнок что-то сделал: сбросить таймер подсказки. */
  touched(): void;
  /** Куда показывать подсказку, если ребёнок задумался. */
  setHintTarget(get: () => Element | null): void;
  /** Сцена закончена. */
  done(result?: { cleanPaws?: boolean }): void;
  /** Отложенный вызов, который игра отменит при выходе. */
  later(fn: () => void, ms: number): void;
}

export interface Scene {
  dispose(): void;
}
