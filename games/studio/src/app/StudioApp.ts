import type { GameSdk } from '@ig/sdk';
import { beatsApi, type Beat } from '../api/beats';
import { StudioAudio } from '../audio/StudioAudio';
import { PAD_LIST } from '../game/kit';
import { BPM_STEP, clampBpm, emptyPattern, noteCount, padsAt, sanitizeGroove, setStep, SWING_ON, toggleStep, type Groove } from '../game/pattern';
import { preset, type PresetId } from '../game/presets';
import { playStickers, STICKERS } from '../game/stickers';
import { quantize } from '../game/timing';
import { tr } from '../i18n';
import { el } from '../ui/dom';
import { Matrix } from '../ui/Matrix';
import { Pads } from '../ui/Pads';
import { Shelf } from '../ui/Shelf';
import { Toast } from '../ui/Toast';
import { Transport } from '../ui/Transport';
import { Tyopa } from '../ui/Tyopa';
import { saveBeat } from './saveBeat';
import { Sequencer } from './Sequencer';
import { bindKeys } from './keys';

// Корень игры: состояние ритма, связка пульта, редактора шагов, секвенсора и полки.

const DRAFT_KEY = 'draft';

export class StudioApp {
  readonly root = el('div', { className: 'st-root' });
  private readonly audio: StudioAudio;
  private readonly seq: Sequencer;
  private readonly pads: Pads;
  private readonly matrix: Matrix;
  private readonly transport: Transport;
  private readonly tyopa: Tyopa;
  private readonly toast = new Toast();
  private readonly shelf: Shelf | null;
  private readonly cleanups: (() => void)[] = [];
  private groove: Groove;
  private rec = false;

  constructor(private readonly sdk: GameSdk) {
    this.groove = sanitizeGroove(sdk.storage.load(DRAFT_KEY) ?? preset('basic'));
    this.audio = new StudioAudio(sdk.comfort.effectsVolume);
    this.audio.setMuted(sdk.audio.muted);
    this.cleanups.push(sdk.audio.onMuteChange((muted) => this.audio.setMuted(muted)));

    this.seq = new Sequencer({
      tempo: () => this.groove,
      schedule: (step, t) => padsAt(this.groove.pattern, step).forEach((pad) => this.audio.play(PAD_LIST[pad]!.voice, t)),
      onStep: (step) => this.onStep(step),
    });
    this.pads = new Pads((pad) => this.hit(pad));
    this.matrix = new Matrix((pad, step) => this.toggle(pad, step), (pad) => this.select(pad));
    this.tyopa = new Tyopa(sdk.comfort.reduceMotion);
    // Сохранять можно, только когда выбран ребёнок: чей бит, сервер знает по сессии.
    this.shelf = sdk.profile
      ? new Shelf(beatsApi(sdk.api), {
          save: (title) => saveBeat(sdk, this.groove, title, (text) => this.toast.show(text)),
          open: (beat) => this.open(beat),
          toast: (text) => this.toast.show(text),
          shared: () => sdk.progress.sticker(STICKERS.forParents),
        })
      : null;
    this.transport = new Transport(
      {
        play: () => this.togglePlay(),
        rec: () => this.toggleRec(),
        tempo: (d) => this.update({ bpm: clampBpm(this.groove.bpm + d * BPM_STEP) }),
        swing: () => this.update({ swing: this.groove.swing > 0 ? 0 : SWING_ON }),
        preset: (id) => this.loadPreset(id),
        clear: () => this.clear(),
        save: () => void this.shelf?.open(true),
        shelf: () => void this.shelf?.open(false),
      },
      this.shelf !== null,
    );

    const left = el('section', { className: 'st-left' }, this.tyopa.el, this.pads.el);
    const main = el('main', { className: 'st-main' }, left, this.matrix.el);
    this.root.append(this.transport.el, main, this.toast.el);
    if (this.shelf) this.root.append(this.shelf.el);

    this.cleanups.push(
      bindKeys({
        pad: (pad) => this.hit(pad),
        play: () => this.togglePlay(),
        blocked: () => this.shelf?.isOpen === true,
      }),
      sdk.time.onEnding(() => this.seq.stop()),
    );
    this.select(0);
    this.refresh();
  }

  private hit(pad: number) {
    this.audio.play(PAD_LIST[pad]!.voice);
    this.pads.flash(pad);
    this.select(pad);
    if (this.rec && this.seq.playing && this.seq.current >= 0) {
      const step = quantize(this.seq.current, this.seq.sinceStep(), this.groove.bpm);
      this.update({ pattern: setStep(this.groove.pattern, pad, step, true) });
    }
  }

  private toggle(pad: number, step: number) {
    const pattern = toggleStep(this.groove.pattern, pad, step);
    if (!this.seq.playing && pattern[pad]! > this.groove.pattern[pad]!) this.audio.play(PAD_LIST[pad]!.voice);
    this.select(pad);
    this.update({ pattern });
  }

  private select(pad: number) {
    this.pads.select(pad);
    this.matrix.select(pad);
  }

  private onStep(step: number) {
    this.matrix.setPlayhead(step);
    padsAt(this.groove.pattern, step).forEach((pad) => this.pads.flash(pad));
    if (step % 4 === 0) this.tyopa.bob();
  }

  private togglePlay() {
    if (this.seq.playing) return this.stop();
    const ctx = this.audio.unlock();
    if (!ctx) return;
    this.seq.start(ctx);
    this.transport.setPlaying(true);
    const notes = noteCount(this.groove.pattern);
    if (notes) this.tyopa.cheer();
    else this.tyopa.say(tr().tips[1]!);
    if (notes >= 4) this.sdk.progress.skill('music', true);
    playStickers(this.groove).forEach((id) => this.sdk.progress.sticker(id));
  }

  private stop() {
    this.seq.stop();
    this.transport.setPlaying(false);
    this.matrix.setPlayhead(-1);
  }

  private toggleRec() {
    this.rec = !this.rec;
    this.transport.setRec(this.rec);
    if (this.rec) this.tyopa.say(tr().recHint);
    if (this.rec && !this.seq.playing) this.togglePlay();
  }

  private loadPreset(id: PresetId) {
    this.update(preset(id));
    this.tyopa.say(`🎛 ${tr().presetNames[id]}`);
  }

  private clear() {
    this.update({ pattern: emptyPattern() });
    this.toast.show(tr().cleared);
  }

  private open(beat: Beat) {
    this.update(sanitizeGroove(beat));
    this.toast.show(tr().opened(beat.title));
  }

  /** Любое изменение ритма: перерисовать и сохранить черновик, чтобы он пережил перезапуск. */
  private update(change: Partial<Groove>) {
    this.groove = { ...this.groove, ...change };
    this.sdk.storage.save(DRAFT_KEY, this.groove);
    this.refresh();
    if (change.pattern && this.seq.playing) playStickers(this.groove).forEach((id) => this.sdk.progress.sticker(id));
  }

  private refresh() {
    this.matrix.render(this.groove.pattern);
    this.transport.setTempo(this.groove.bpm, this.groove.swing);
    this.transport.setNotes(noteCount(this.groove.pattern));
  }

  pause() {
    this.stop();
    this.audio.suspend();
  }

  resume() {
    this.audio.resume();
  }

  dispose() {
    this.stop();
    this.cleanups.forEach((off) => off());
    this.transport.dispose();
    this.toast.dispose();
    this.audio.dispose();
    this.root.remove();
  }
}
