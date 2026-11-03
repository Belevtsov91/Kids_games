// Звуки долины: тихая музыкальная фраза на Web Audio и короткие эффекты Kenney (CC0, assets/sounds).
// Всё молчит, когда звук выключен в оболочке.

import gemUrl from '../../assets/sounds/gem.ogg';
import levelUrl from '../../assets/sounds/level_up.ogg';
import hurtUrl from '../../assets/sounds/hurt.ogg';
import confirmUrl from '../../assets/sounds/confirm.ogg';
import coinUrl from '../../assets/sounds/coin.ogg';
import dashUrl from '../../assets/sounds/dash.ogg';
import killUrl from '../../assets/sounds/kill.ogg';
import uiUrl from '../../assets/sounds/ui.ogg';

const EFFECTS = { gem: gemUrl, level: levelUrl, hurt: hurtUrl, quest: confirmUrl, coin: coinUrl, cast: dashUrl, poof: killUrl, ui: uiUrl };
export type Effect = keyof typeof EFFECTS;

let context: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let muted = false;
const buffers = new Map<Effect, AudioBuffer | null>();

const audio = () => {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
};

function tone(frequency: number, when: number, length: number, volume: number) {
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

const PHRASES = [
  [261.63, 329.63, 392, 523.25],
  [293.66, 349.23, 440, 587.33],
  [246.94, 329.63, 392, 493.88],
  [261.63, 392, 329.63, 440],
];
let phraseIndex = 0;
const phrase = () => {
  const now = audio().currentTime;
  PHRASES[phraseIndex++ % PHRASES.length].forEach((note, index) => tone(note, now + index * 0.5, 0.9, 0.02));
};

async function load(effect: Effect) {
  if (buffers.has(effect)) return buffers.get(effect);
  buffers.set(effect, null);
  try {
    const data = await (await fetch(EFFECTS[effect])).arrayBuffer();
    const buffer = await audio().decodeAudioData(data);
    buffers.set(effect, buffer);
    return buffer;
  } catch {
    return null;
  }
}

export const valleySound = {
  setMuted(value: boolean) {
    muted = value;
    if (value) this.stop();
  },
  /** Заранее подгрузить эффекты (после первого нажатия, когда звук уже разрешён). */
  warmUp() {
    if (muted) return;
    (Object.keys(EFFECTS) as Effect[]).forEach((effect) => void load(effect));
  },
  /** Фоновая музыка. Повторный вызов ничего не делает. */
  start() {
    if (muted || timer) return;
    try {
      phrase();
      timer = setInterval(phrase, 5200);
    } catch {
      /* без звука игра тоже работает */
    }
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
  play(effect: Effect, volume = 0.5) {
    if (muted) return;
    try {
      const ctx = audio();
      const buffer = buffers.get(effect);
      if (!buffer) {
        void load(effect);
        return;
      }
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain).connect(ctx.destination);
      source.start();
    } catch {
      /* без звука игра тоже работает */
    }
  },
  chime() {
    if (muted) return;
    try {
      const now = audio().currentTime;
      [659.25, 783.99].forEach((note, index) => tone(note, now + index * 0.09, 0.5, 0.04));
    } catch {
      /* без звука игра тоже работает */
    }
  },
  dispose() {
    this.stop();
    void context?.close();
    context = null;
    buffers.clear();
  },
};
