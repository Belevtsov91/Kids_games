import { locales, type Language } from '../i18n';
export class CountingAudio {
  muted = false;
  paused = false;
  private audio: AudioContext | null = null;
  hasVoice(language: Language) {
    return 'speechSynthesis' in window && speechSynthesis.getVoices().some((voice) => voice.lang.toLowerCase().startsWith(language));
  }
  say(text: string, language: Language) {
    if (this.muted || this.paused || !this.hasVoice(language)) return;
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = locales[language];
    speech.rate = 0.85;
    speech.voice = speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(language)) ?? null;
    speechSynthesis.speak(speech);
  }
  reward() {
    if (this.muted || this.paused) return;
    this.audio ??= new AudioContext();
    void this.audio.resume();
    const now = this.audio.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const oscillator = this.audio!.createOscillator();
      const gain = this.audio!.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.045, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.35);
      oscillator.connect(gain).connect(this.audio!.destination);
      oscillator.start(now + i * 0.09);
      oscillator.stop(now + i * 0.09 + 0.4);
    });
  }
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    void this.audio?.suspend();
  }
  dispose() {
    this.stop();
    void this.audio?.close();
  }
}
