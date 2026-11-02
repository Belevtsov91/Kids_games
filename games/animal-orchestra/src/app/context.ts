import type { OrchestraAudio } from '../audio/OrchestraAudio';
import type { Animal } from '../game/animals';
import type { SoundMode } from '../game/song';
import type { Effects } from '../ui/Effects';
import type { Stage } from '../ui/Stage';
import type { Toast } from '../ui/Toast';
import type { Playback } from './Playback';

/** Общее для всех режимов: звук, сцена, панель кнопок внизу и проигрыватель. */
export interface OrchestraContext {
  readonly root: HTMLElement;
  readonly panel: HTMLElement;
  readonly audio: OrchestraAudio;
  readonly fx: Effects;
  readonly stage: Stage;
  readonly playback: Playback;
  readonly toast: Toast;
  /** Выбранный звук: инструменты или голоса. */
  readonly soundMode: SoundMode;
  setSoundMode(mode: SoundMode): void;
  /** Звук + анимация + ноты. */
  hit(animal: Animal, sound: SoundMode): void;
}

/** Режим игры. Каждый строит свою панель внизу и по-своему отвечает на нажатие зверя. */
export interface Mode {
  enter(): void;
  leave(): void;
  onAnimal(animal: Animal): void;
  pause(): void;
  /** Проигрывание началось или закончилось: обновить кнопки. */
  onPlaybackChange?(): void;
  /** Сколько зверей играет (остальные притушены). */
  readonly poolSize: number;
}
