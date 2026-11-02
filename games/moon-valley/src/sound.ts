let context: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export const valleySound = {
  start(muted: boolean) {
    if (muted || timer) return;
    context ??= new AudioContext();
    const play = (frequency: number, when: number, length: number, volume: number) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume, when + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
      oscillator.connect(gain).connect(context!.destination);
      oscillator.start(when);
      oscillator.stop(when + length + 0.03);
    };
    const phrase = () => {
      const now = context!.currentTime;
      [261.63, 329.63, 392, 523.25].forEach((note, index) => play(note, now + index * 0.42, 0.7, 0.025));
    };
    phrase();
    timer = setInterval(phrase, 4200);
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
  chime() {
    if (!context) return;
    const audio = context;
    const now = audio.currentTime;
    [659.25, 783.99].forEach((note, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = note;
      gain.gain.setValueAtTime(0.04, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now + index * 0.09);
      oscillator.stop(now + 0.6);
    });
  },
};
