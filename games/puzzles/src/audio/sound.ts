// Короткие звуки на Web Audio: без файлов, уважают общий выключатель звука оболочки.

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.18) {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export function createSound(isMuted: () => boolean) {
  const play = (fn: () => void) => {
    if (isMuted()) return;
    try {
      fn();
    } catch {
      /* звук — не главное */
    }
  };
  return {
    pick: () => play(() => tone(660, 0, 0.08, 'triangle', 0.12)),
    snap: () => play(() => (tone(523, 0, 0.12), tone(784, 0.07, 0.16))),
    miss: () => play(() => tone(196, 0, 0.18, 'sine', 0.12)),
    win: () => play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle'))),
    dispose: () => {
      void ctx?.close();
      ctx = null;
    },
  };
}
export type Sound = ReturnType<typeof createSound>;
