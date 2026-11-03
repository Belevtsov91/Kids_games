import type { GameManifest, GameProgress, Skill } from '@ig/sdk';

// Успехи игры (sdk.progress). События копятся и уходят на сервер пачкой раз в пару секунд
// и при выходе из игры. Нет профиля или сети — молча теряем: игре это не мешает.

export interface ProgressEvent {
  kind: 'level' | 'skill';
  name: string;
  ok?: boolean;
}

const FLUSH_MS = 2000;
const MAX_BATCH = 50;

export interface ProgressQueue extends GameProgress {
  flush(): void;
}

export function createProgressQueue(manifest: GameManifest, enabled: boolean, onSticker?: (id: string) => void): ProgressQueue {
  let events: ProgressEvent[] = [];
  let stickers: string[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  const known = new Set((manifest.stickers ?? []).map((s) => s.id));
  const skills = new Set<Skill>(manifest.skills ?? []);

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!enabled || (!events.length && !stickers.length)) return;
    const body = JSON.stringify({ gameId: manifest.id, events: events.slice(0, MAX_BATCH), stickers });
    events = [];
    stickers = [];
    // keepalive: пачка дойдёт, даже если вкладку закрыли сразу после победы.
    void fetch('/api/kid/progress', { method: 'POST', body, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }).catch(() => undefined);
  };
  const later = () => {
    timer ??= setTimeout(flush, FLUSH_MS);
  };

  return {
    level(name) {
      events.push({ kind: 'level', name: String(name).slice(0, 40) });
      later();
    },
    skill(skill, ok) {
      if (!skills.has(skill)) return console.warn(`${manifest.id}: навыка «${skill}» нет в manifest.skills`);
      events.push({ kind: 'skill', name: skill, ok });
      later();
    },
    sticker(id) {
      if (!known.has(id)) return console.warn(`${manifest.id}: наклейки «${id}» нет в manifest.stickers`);
      if (!stickers.includes(id)) stickers.push(id);
      onSticker?.(id);
      later();
    },
    flush,
  };
}
