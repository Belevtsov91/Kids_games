import { animalById, type Animal } from '../game/animals';
import type { SongNote, SoundMode } from '../game/song';

// Проигрывание мелодии по таймерам. Здесь же отложенные действия режима «Повтори»:
// stop() снимает всё разом, когда меняется режим или вкладка уходит в фон.

export class Playback {
  playing = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** `onNote` — сыграть ноту; `onChange` — началось или закончилось проигрывание. */
  constructor(
    private readonly onNote: (animal: Animal, sound: SoundMode) => void,
    private readonly onChange: (playing: boolean) => void,
  ) {}

  play(notes: readonly SongNote[], onDone?: () => void) {
    this.stop();
    this.playing = true;
    for (const note of notes) {
      const animal = animalById(note.a);
      if (animal) this.later(() => this.onNote(animal, note.m), note.t + 150);
    }
    const end = (notes.length ? notes[notes.length - 1].t : 0) + 700;
    this.later(() => {
      this.playing = false;
      this.timers = [];
      this.onChange(false);
      onDone?.();
    }, end);
    this.onChange(true);
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.playing) {
      this.playing = false;
      this.onChange(false);
    }
  }

  /** Отложенное действие, которое отменится вместе с проигрыванием. */
  later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }
}
