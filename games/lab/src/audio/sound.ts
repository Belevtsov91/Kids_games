// Звуки лаборатории на Web Audio. Молчит, когда звук выключен в оболочке.

let ctx: AudioContext | null = null;

function blip(from: number, to: number, duration: number, volume = 0.15) {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function createSound(isMuted: () => boolean) {
  const safe = (fn: () => void) => () => {
    if (isMuted()) return;
    try {
      fn();
    } catch {
      /* без звука тоже играем */
    }
  };
  return {
    place: safe(() => blip(520, 260, 0.14)),
    turn: safe(() => blip(400, 600, 0.1, 0.1)),
    start: safe(() => blip(300, 900, 0.25, 0.1)),
    tick: safe(() => blip(900, 700, 0.05, 0.06)),
    lit: safe(() => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => {
      try {
        blip(f, f, 0.35, 0.12);
      } catch {
        /* тихо */
      }
    }, i * 110))),
    lost: safe(() => blip(500, 180, 0.4, 0.1)),
    clear: safe(() => blip(800, 200, 0.3, 0.1)),
    dispose: () => {
      void ctx?.close();
      ctx = null;
    },
  };
}
export type Sound = ReturnType<typeof createSound>;
