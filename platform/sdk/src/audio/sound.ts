// Основа звука игры: эффекты (Web Audio) + голос (GameVoice). Игра наследует класс
// и описывает свои эффекты через this.play(...). Всё молчит, когда в оболочке выключен звук.
import { Tones, type Note } from './tones';
import { GameVoice, type SayOptions, type VoiceOptions } from './voice';

export interface SoundOptions extends Omit<VoiceOptions, 'muted' | 'volume'> {
  muted: boolean;
  /** Громкость эффектов (и голоса) и музыки 0–1, обычно из sdk.comfort. */
  volume?: number | { effects: number; music: number };
}

export class GameSound {
  readonly voice: GameVoice;
  private readonly tones = new Tones();
  protected muted: boolean;
  protected effects: number;
  protected music: number;

  constructor(options: SoundOptions) {
    const v = options.volume ?? 1;
    this.muted = options.muted;
    this.effects = typeof v === 'number' ? v : v.effects;
    this.music = typeof v === 'number' ? v : v.music;
    this.voice = new GameVoice({ ...options, volume: this.effects });
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.voice.setMuted(muted);
  }

  /** Громкость эффектов и голоса 0–1. */
  setVolume(volume: number) {
    this.effects = Math.min(1, Math.max(0, volume));
    this.voice.setVolume(this.effects);
  }

  unlock() {
    this.tones.unlock();
  }

  pause() {
    this.tones.pause();
    this.voice.cancel();
  }

  resume() {
    this.tones.resume();
  }

  dispose() {
    this.voice.dispose();
    this.tones.close();
  }

  say(text: string, opts?: SayOptions | number) {
    return this.voice.say(text, typeof opts === 'number' ? { rate: opts } : opts);
  }

  stopSpeech() {
    this.voice.cancel();
  }

  /** Сыграть ноты эффекта; volume — для музыки передать this.music. */
  protected play(notes: Note[], volume = this.effects) {
    if (this.muted) return;
    this.tones.play(notes, volume);
  }
}
