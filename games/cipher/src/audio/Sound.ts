// Звуки: писк маяка, «верно», «ошибка». Без файлов — простые тоны WebAudio.
// Уважает общий выключатель звука и громкость эффектов из настроек взрослого.
import type { GameSdk } from '@ig/sdk';

export class Sound {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private readonly offMute: () => void;

  constructor(private readonly sdk: GameSdk) {
    this.muted = sdk.audio.muted;
    this.offMute = sdk.audio.onMuteChange((muted) => (this.muted = muted));
  }

  private tone(freq: number, ms: number, delay = 0, type: OscillatorType = 'sine') {
    const volume = this.sdk.comfort.effectsVolume;
    if (this.muted || volume <= 0 || typeof AudioContext === 'undefined') return;
    try {
      this.ctx ??= new AudioContext();
      const t = this.ctx.currentTime + delay / 1000;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18 * volume, t + 0.01);
      gain.gain.setValueAtTime(0.18 * volume, t + ms / 1000 - 0.02);
      gain.gain.linearRampToValueAtTime(0, t + ms / 1000);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + ms / 1000 + 0.02);
    } catch {
      // Без звука игра работает так же.
    }
  }

  /** Сигнал маяка заданной длины. */
  beep(ms: number) {
    this.tone(660, ms, 0, 'square');
  }
  click() {
    this.tone(880, 40, 0, 'triangle');
  }
  ok() {
    this.tone(523, 120);
    this.tone(784, 180, 110);
  }
  wrong() {
    this.tone(220, 200, 0, 'triangle');
  }
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 160, i * 130));
  }

  dispose() {
    this.offMute();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
