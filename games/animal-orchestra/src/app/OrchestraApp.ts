import type { GameSdk } from '@ig/sdk';
import { melodiesApi } from '../api/melodies';
import { OrchestraAudio } from '../audio/OrchestraAudio';
import { ANIMALS, type Animal } from '../game/animals';
import type { SoundMode } from '../game/song';
import { markSound, syncBeat } from '../ui/controls';
import { el } from '../ui/dom';
import { Effects } from '../ui/Effects';
import { MelodyShelf } from '../ui/MelodyShelf';
import { ModeTabs, type ModeId } from '../ui/ModeTabs';
import { Stage } from '../ui/Stage';
import { Toast } from '../ui/Toast';
import type { Mode, OrchestraContext } from './context';
import { FreeMode } from './modes/FreeMode';
import { RecordMode } from './modes/RecordMode';
import { RepeatMode } from './modes/RepeatMode';
import { Playback } from './Playback';

// Корень игры: собирает сцену, вкладки, панель и полку, переключает режимы.

export class OrchestraApp implements OrchestraContext {
  readonly root = el('div', { className: 'ao-root' });
  readonly panel = el('footer', { className: 'ao-panel' });
  readonly audio = new OrchestraAudio();
  readonly fx = new Effects();
  readonly toast = new Toast();
  readonly stage: Stage;
  readonly playback: Playback;
  soundMode: SoundMode = 'instrument';

  private readonly tabs: ModeTabs;
  private readonly shelf: MelodyShelf | null;
  private readonly modes: Record<ModeId, Mode>;
  private mode: Mode;
  private readonly cleanups: (() => void)[] = [];

  constructor(sdk: GameSdk) {
    this.stage = new Stage((animal) => this.mode.onAnimal(animal), () => this.audio.unlock());
    this.playback = new Playback(
      (animal, sound) => this.hit(animal, sound),
      (playing) => {
        this.mode.onPlaybackChange?.();
        if (!playing) this.shelf?.markPlaying(null);
      },
    );
    // Полка и сохранение — только когда выбран ребёнок; кто он, сервер знает по сессии.
    const melodies = sdk.profile ? melodiesApi(sdk.api) : null;
    this.shelf = melodies ? new MelodyShelf(this.root, melodies, this.playback, this.toast) : null;
    this.modes = { free: new FreeMode(this), record: new RecordMode(this, melodies, this.shelf), repeat: new RepeatMode(this) };
    this.mode = this.modes.free;
    this.tabs = new ModeTabs((id) => {
      this.audio.click();
      this.setMode(id);
    });

    const sheet = this.shelf?.el ?? el('div', { className: 'ao-sheet', hidden: true });
    this.root.append(this.tabs.el, this.stage.el, this.panel, sheet, this.fx.canvas, this.toast.el);

    this.audio.setMuted(sdk.audio.muted);
    this.cleanups.push(sdk.audio.onMuteChange((muted) => this.audio.setMuted(muted)));
    // Первое касание где угодно включает звук (политика автозапуска браузеров).
    this.on(this.root, 'pointerdown', () => this.audio.unlock(), true);
    this.on(window, 'keydown', (e) => this.onKey(e as KeyboardEvent));

    this.setMode('free');
  }

  pause() {
    this.playback.stop();
    this.audio.pause();
    syncBeat(this.panel, this.root, this.audio.beating);
    this.mode.pause();
  }

  resume() {
    this.audio.resume();
  }

  dispose() {
    this.playback.stop();
    this.toast.dispose();
    this.cleanups.forEach((fn) => fn());
    this.audio.dispose();
    this.fx.dispose();
    this.root.remove();
  }

  hit(animal: Animal, sound: SoundMode) {
    this.audio.play(animal, sound);
    const box = this.stage.bounce(animal.id);
    if (!box) return;
    const host = this.root.getBoundingClientRect();
    this.fx.notes(box.left + box.width / 2 - host.left, box.top + box.height * 0.2 - host.top, animal.color);
  }

  setSoundMode(mode: SoundMode) {
    this.soundMode = mode;
    this.root.dataset.sound = mode;
    markSound(this.panel, mode);
    this.stage.setBadges(mode);
  }

  private setMode(id: ModeId) {
    this.playback.stop();
    this.shelf?.close();
    if (this.modes[id] !== this.mode) this.mode.leave();
    this.mode = this.modes[id];
    this.root.dataset.mode = id;
    this.tabs.setActive(id);
    this.panel.replaceChildren();
    this.root.dataset.listening = 'false';
    this.mode.enter();
    this.stage.setResting(this.mode.poolSize);
  }

  private onKey(e: KeyboardEvent) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const animal = ANIMALS.find((a) => a.key === e.key);
    if (!animal) return;
    this.audio.unlock();
    this.mode.onAnimal(animal);
  }

  private on(target: HTMLElement | Window, type: string, fn: (e: Event) => void, capture = false) {
    target.addEventListener(type, fn, { capture });
    this.cleanups.push(() => target.removeEventListener(type, fn, { capture }));
  }
}
