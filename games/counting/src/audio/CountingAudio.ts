// Озвучка счёта — общий голос SDK (по голосу на каждый язык речи: его можно сменить в игре),
// награда — короткий аккорд Web Audio.
import { GameVoice, Tones } from '@ig/sdk/audio';
import type { Language } from '../i18n';

export class CountingAudio {
  private mutedNow = false;
  paused = false;
  private readonly voices = new Map<Language, GameVoice>();
  private readonly tones = new Tones();

  get muted() {
    return this.mutedNow;
  }

  set muted(muted: boolean) {
    this.mutedNow = muted;
    for (const voice of this.voices.values()) voice.setMuted(muted);
  }

  private voice(language: Language) {
    let voice = this.voices.get(language);
    if (!voice) this.voices.set(language, (voice = new GameVoice({ lang: language, rate: 0.85, muted: this.mutedNow })));
    return voice;
  }

  hasVoice(language: Language) {
    return this.voice(language).hasVoice;
  }

  say(text: string, language: Language) {
    if (this.mutedNow || this.paused) return;
    this.voice(language).say(text);
  }

  reward() {
    if (this.mutedNow || this.paused) return;
    this.tones.unlock();
    this.tones.play([523.25, 659.25, 783.99].map((freq, i) => ({ freq, at: i * 0.09, dur: 0.35, gain: 0.045 })));
  }

  stop() {
    for (const voice of this.voices.values()) voice.cancel();
    this.tones.pause();
  }

  dispose() {
    for (const voice of this.voices.values()) voice.dispose();
    this.tones.close();
  }
}
