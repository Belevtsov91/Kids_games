// Без DOM: мелодия — список нот со временем; общий формат для записи, проигрывания и сервера.

export type SoundMode = 'instrument' | 'voice';

export interface SongNote {
  /** id зверя из ANIMALS. */
  a: string;
  /** Время от начала мелодии, мс. */
  t: number;
  /** Чем играли: инструментом или голосом. */
  m: SoundMode;
}

export const MAX_NOTES = 120;
export const MAX_SONG_MS = 60_000;

/** Записывает нажатия. Время берётся снаружи (`now`), чтобы логику было легко проверить. */
export class SongRecorder {
  private start: number | null = null;
  private readonly notes: SongNote[] = [];

  constructor(private readonly now: () => number) {}

  /** Возвращает false, когда мелодия уже полная и нота не записана. */
  add(animalId: string, mode: SoundMode): boolean {
    const now = this.now();
    if (this.start === null) this.start = now;
    const t = Math.round(now - this.start);
    if (this.notes.length >= MAX_NOTES || t > MAX_SONG_MS) return false;
    this.notes.push({ a: animalId, t, m: mode });
    return true;
  }

  get length() {
    return this.notes.length;
  }

  get full() {
    return this.notes.length >= MAX_NOTES;
  }

  result(): SongNote[] {
    return this.notes.slice();
  }
}

/**
 * Готовит мелодию к проигрыванию: сортирует, первую ноту ставит в 0,
 * слишком длинные паузы (ребёнок задумался) сжимает до `maxGap`.
 */
export function normalizeSong(notes: readonly SongNote[], maxGap = 1500): SongNote[] {
  const sorted = [...notes].sort((x, y) => x.t - y.t);
  const out: SongNote[] = [];
  let shift = 0;
  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    if (i === 0) shift = note.t;
    else {
      const gap = note.t - sorted[i - 1].t;
      if (gap > maxGap) shift += gap - maxGap;
    }
    out.push({ ...note, t: note.t - shift });
  }
  return out;
}

export const songDuration = (notes: readonly SongNote[]) => (notes.length ? notes[notes.length - 1].t : 0);
