import { Howl, Howler } from 'howler';

// Реестр звуков. Файлы кладём в games/drawing/src/assets/sounds и подключаем через import:
//   import clickUrl from './assets/sounds/click.mp3';
//   const sources = { click: [clickUrl] };
const sources: Record<string, string[]> = {};

const cache = new Map<string, Howl>();

export const sound = {
  play(name: string) {
    const src = sources[name];
    if (!src) return;
    let howl = cache.get(name);
    if (!howl) {
      howl = new Howl({ src });
      cache.set(name, howl);
    }
    howl.play();
  },
  setMuted(muted: boolean) {
    Howler.mute(muted);
  },
};
