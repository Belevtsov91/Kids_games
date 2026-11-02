import type { MelodiesApi } from '../../api/melodies';
import { ANIMALS, type Animal } from '../../game/animals';
import { MAX_NOTES, normalizeSong, SongRecorder, type SongNote } from '../../game/song';
import { soundToggle } from '../../ui/controls';
import { el } from '../../ui/dom';
import type { MelodyShelf } from '../../ui/MelodyShelf';
import type { Mode, OrchestraContext } from '../context';

// «Запись»: записать мелодию, послушать, сохранить на сервер и открыть полку «Мои мелодии».

const bigButton = (className: string, label: string, ...children: (Node | string)[]) =>
  el('button', { className: `ao-big ${className}`, type: 'button', attrs: { 'aria-label': label } }, ...children);

export class RecordMode implements Mode {
  readonly poolSize = ANIMALS.length;
  private recorder: SongRecorder | null = null;
  private take: SongNote[] = [];

  /** `melodies` и `shelf` — null, если ребёнок не выбран: тогда без сохранения. */
  constructor(
    private readonly ctx: OrchestraContext,
    private readonly melodies: MelodiesApi | null,
    private readonly shelf: MelodyShelf | null,
  ) {}

  enter() {
    const { ctx } = this;
    ctx.stage.setBubble(null);
    const rec = bigButton('ao-rec', 'Записать', el('span', { className: 'ao-rec-dot' }));
    const play = bigButton('ao-play', 'Послушать', '▶');
    const save = bigButton('ao-save', 'Сохранить', '💾');
    const shelf = bigButton('ao-shelf', 'Мои мелодии', '📚');
    const meter = el('div', { className: 'ao-meter', attrs: { 'aria-hidden': 'true' } }, el('div', { className: 'ao-meter-fill' }));

    rec.addEventListener('click', () => (this.recorder ? this.stop() : this.start()));
    play.addEventListener('click', () => {
      if (ctx.playback.playing) ctx.playback.stop();
      else if (this.take.length) ctx.playback.play(this.take);
    });
    save.addEventListener('click', () => void this.save());
    shelf.addEventListener('click', () => void this.shelf?.open());

    const toggle = soundToggle(ctx.soundMode, (mode) => {
      ctx.setSoundMode(mode);
      ctx.audio.click();
    });
    ctx.panel.append(toggle, rec, play, ...(this.melodies ? [save, shelf] : []), meter);
    this.onPlaybackChange();
  }

  leave() {
    this.recorder = null;
  }

  onAnimal(animal: Animal) {
    const { ctx } = this;
    if (ctx.playback.playing) ctx.playback.stop();
    ctx.hit(animal, ctx.soundMode);
    if (this.recorder) {
      if (!this.recorder.add(animal.id, ctx.soundMode)) this.stop();
      this.onPlaybackChange();
    }
  }

  pause() {}

  private start() {
    this.ctx.playback.stop();
    this.recorder = new SongRecorder(() => performance.now());
    this.take = [];
    this.ctx.audio.click();
    this.onPlaybackChange();
    this.ctx.toast.show('🎙️ Играй!');
  }

  private stop() {
    if (!this.recorder) return;
    this.take = normalizeSong(this.recorder.result());
    this.recorder = null;
    this.onPlaybackChange();
    if (this.take.length) {
      this.ctx.audio.praise();
      this.ctx.playback.play(this.take);
    }
  }

  private async save() {
    if (!this.melodies || !this.take.length) return;
    const save = this.ctx.panel.querySelector<HTMLButtonElement>('.ao-save');
    if (save) save.disabled = true;
    try {
      const melody = await this.melodies.save(this.take, 'Моя мелодия');
      this.shelf?.added(melody);
      this.take = [];
      this.ctx.audio.praise();
      this.ctx.fx.confetti();
      this.ctx.toast.show('💾 Сохранили!');
    } catch {
      this.ctx.toast.show('😕 Не получилось сохранить');
    }
    this.onPlaybackChange();
  }

  /** Обновляет кнопки записи, проигрывания, сохранения и шкалу заполненности. */
  onPlaybackChange() {
    const { root, panel, playback } = this.ctx;
    const recording = this.recorder !== null;
    root.dataset.recording = String(recording);
    const rec = panel.querySelector<HTMLButtonElement>('.ao-rec');
    rec?.setAttribute('aria-label', recording ? 'Стоп' : 'Записать');
    rec?.setAttribute('aria-pressed', String(recording));
    const hasTake = this.take.length > 0 && !recording;
    const play = panel.querySelector<HTMLButtonElement>('.ao-play');
    if (play) {
      play.disabled = !hasTake;
      play.textContent = playback.playing ? '⏹' : '▶';
      play.setAttribute('aria-label', playback.playing ? 'Стоп' : 'Послушать');
    }
    const save = panel.querySelector<HTMLButtonElement>('.ao-save');
    if (save) save.disabled = !hasTake;
    const count = recording ? this.recorder!.length : this.take.length;
    panel.querySelector<HTMLElement>('.ao-meter-fill')?.style.setProperty('width', `${(count / MAX_NOTES) * 100}%`);
  }
}
