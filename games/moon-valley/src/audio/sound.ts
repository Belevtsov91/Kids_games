// Тихая музыкальная фраза и колокольчик на Web Audio. Всё молчит, когда звук выключен в оболочке.

let context: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let muted = false;

const audio = () => {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
};

function play(frequency: number, when: number, length: number, volume: number) {
  const ctx = audio();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + length + 0.03);
}

const phrase = () => {
  const now = audio().currentTime;
  [261.63, 329.63, 392, 523.25].forEach((note, index) => play(note, now + index * 0.42, 0.7, 0.025));
};

export const valleySound = {
  setMuted(value: boolean) {
    muted = value;
  },
  /** Фоновая музыка. Повторный вызов ничего не делает. */
  start() {
    if (muted || timer) return;
    try {
      phrase();
      timer = setInterval(phrase, 4200);
    } catch {
      /* без звука игра тоже работает */
    }
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
  chime() {
    if (muted) return;
    try {
      const now = audio().currentTime;
      [659.25, 783.99].forEach((note, index) => play(note, now + index * 0.09, 0.5, 0.04));
    } catch {
      /* без звука игра тоже работает */
    }
  },
  dispose() {
    this.stop();
    void context?.close();
    context = null;
  },
};
