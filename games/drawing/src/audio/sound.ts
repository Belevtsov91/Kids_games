// Короткие звуки на Web Audio: без файлов и без сети. Молчат, когда звук выключен в оболочке.

let ctx: AudioContext | null = null;
let muted = false;

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'triangle', volume = 0.12) {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

const sounds = {
  click: () => tone(880, 0, 0.06),
  undo: () => tone(520, 0, 0.1, 'sine'),
  clear: () => (tone(700, 0, 0.12, 'sine'), tone(350, 0.08, 0.2, 'sine')),
  save: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.25)),
};

export const sound = {
  play(name: keyof typeof sounds) {
    if (muted) return;
    try {
      sounds[name]();
    } catch {
      /* без звука рисовать тоже можно */
    }
  },
  setMuted(value: boolean) {
    muted = value;
  },
  dispose() {
    void ctx?.close();
    ctx = null;
  },
};
