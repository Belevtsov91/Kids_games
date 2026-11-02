import type { GameSdk } from '@ig/sdk';
import { ANIMALS, ANIMAL_IDS, animalById, type Animal } from '../game/animals';
import { RepeatGame } from '../game/repeat';
import { normalizeSong, SongRecorder, MAX_NOTES, type SongNote, type SoundMode } from '../game/song';
import { OrchestraAudio } from '../audio/OrchestraAudio';
import { melodiesApi, type MelodiesApi, type Melody } from '../api/melodies';
import { Effects } from './effects';

type Mode = 'free' | 'record' | 'repeat';
type RepeatPhase = 'idle' | 'listen' | 'turn' | 'bravo';

const MODES: { id: Mode; emoji: string; label: string }[] = [
  { id: 'free', emoji: '🎵', label: 'Играть' },
  { id: 'record', emoji: '🔴', label: 'Запись' },
  { id: 'repeat', emoji: '🎯', label: 'Повтори' },
];

const PRAISE = ['Ура!', 'Молодец!', 'Здорово!', 'Супер!', 'Браво!'];

/** Короткая запись для DOM: тег, классы, атрибуты, дети. */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { className?: string; dataset?: Record<string, string>; attrs?: Record<string, string> } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { dataset, attrs, ...rest } = props;
  Object.assign(node, rest);
  if (dataset) Object.assign(node.dataset, dataset);
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export class OrchestraApp {
  readonly root: HTMLDivElement;
  private readonly audio = new OrchestraAudio();
  private readonly fx = new Effects();
  private readonly animalButtons = new Map<string, HTMLButtonElement>();
  private readonly cleanups: (() => void)[] = [];
  private readonly melodies: MelodiesApi | null;

  private mode: Mode = 'free';
  private soundMode: SoundMode = 'instrument';
  private recorder: SongRecorder | null = null;
  private take: SongNote[] = [];
  private playbackTimers: ReturnType<typeof setTimeout>[] = [];
  private playing = false;
  private repeat = new RepeatGame({ animals: ANIMAL_IDS });
  private repeatPhase: RepeatPhase = 'idle';
  private saved: Melody[] | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Части интерфейса, которые меняются.
  private readonly stage: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly bubble: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly sheet: HTMLElement;
  private readonly modeButtons = new Map<Mode, HTMLButtonElement>();

  constructor(sdk: GameSdk) {
    // Полка и сохранение — только когда выбран ребёнок; кто он, сервер знает по сессии.
    this.melodies = sdk.profile ? melodiesApi(sdk.api) : null;

    this.root = el('div', { className: 'ao-root' });
    this.stage = el('main', { className: 'ao-stage' });
    this.panel = el('footer', { className: 'ao-panel' });
    this.bubble = el('div', { className: 'ao-bubble', attrs: { 'aria-live': 'polite' } });
    this.toast = el('div', { className: 'ao-toast', attrs: { role: 'status' } });
    this.sheet = el('div', { className: 'ao-sheet', hidden: true });

    this.root.append(this.buildHeader(), this.buildStage(), this.panel, this.sheet, this.fx.canvas, this.toast);

    this.audio.setMuted(sdk.audio.muted);
    this.cleanups.push(sdk.audio.onMuteChange((muted) => this.audio.setMuted(muted)));

    // Первое касание где угодно включает звук (политика автозапуска браузеров).
    const unlock = () => this.audio.unlock();
    this.root.addEventListener('pointerdown', unlock, { capture: true });
    this.cleanups.push(() => this.root.removeEventListener('pointerdown', unlock, { capture: true }));

    const onKey = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.cleanups.push(() => window.removeEventListener('keydown', onKey));

    this.setMode('free');
  }

  pause() {
    this.stopPlayback();
    this.audio.pause();
    this.updateBeatButton();
    // Таймеры фразы сняты: начнём с новой фразы, когда ребёнок вернётся.
    if (this.mode === 'repeat' && this.repeatPhase !== 'turn') this.setRepeatPhase('idle');
  }

  resume() {
    this.audio.resume();
  }

  dispose() {
    this.stopPlayback();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.cleanups.forEach((fn) => fn());
    this.audio.dispose();
    this.fx.dispose();
    this.root.remove();
  }

  // ---------- построение ----------

  private buildHeader() {
    const tabs = el('nav', { className: 'ao-modes', attrs: { 'aria-label': 'Режим' } });
    for (const m of MODES) {
      const button = el(
        'button',
        { className: 'ao-mode', type: 'button', dataset: { mode: m.id }, attrs: { 'aria-pressed': 'false' } },
        el('span', { className: 'ao-mode-emoji', attrs: { 'aria-hidden': 'true' } }, m.emoji),
        el('span', { className: 'ao-mode-label' }, m.label),
      );
      button.addEventListener('click', () => {
        this.audio.click();
        this.setMode(m.id);
      });
      this.modeButtons.set(m.id, button);
      tabs.append(button);
    }
    return el('header', { className: 'ao-bar' }, tabs);
  }

  private buildStage() {
    const animals = el('div', { className: 'ao-animals' });
    ANIMALS.forEach((animal, i) => {
      const center = (ANIMALS.length - 1) / 2;
      const button = el(
        'button',
        {
          className: 'ao-animal',
          type: 'button',
          dataset: { animal: animal.id },
          attrs: { 'aria-label': animal.name, style: `--c:${animal.color};--lift:${Math.abs(i - center) ** 1.6};--i:${i}` },
        },
        el(
          'span',
          { className: 'ao-body', attrs: { 'aria-hidden': 'true' } },
          el('span', { className: 'ao-spot' }),
          el('span', { className: 'ao-emoji' }, animal.emoji),
          el('span', { className: 'ao-badge' }, animal.instrumentEmoji),
        ),
      );
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.onAnimal(animal);
      });
      // Клавиатура и экранные читалки: Enter/Space дают click без pointerdown.
      button.addEventListener('click', (e) => {
        if (e.detail === 0) this.onAnimal(animal);
      });
      this.animalButtons.set(animal.id, button);
      animals.append(button);
    });

    this.stage.append(
      el('div', { className: 'ao-curtain ao-curtain-left', attrs: { 'aria-hidden': 'true' } }),
      el('div', { className: 'ao-curtain ao-curtain-right', attrs: { 'aria-hidden': 'true' } }),
      el('div', { className: 'ao-lights', attrs: { 'aria-hidden': 'true' } }),
      this.bubble,
      animals,
      el('div', { className: 'ao-floor', attrs: { 'aria-hidden': 'true' } }),
    );
    return this.stage;
  }

  // ---------- режимы ----------

  private setMode(mode: Mode) {
    this.stopPlayback();
    this.closeSheet();
    if (mode === 'repeat') this.audio.stopBeat();
    if (this.mode === 'record' && mode !== 'record') this.recorder = null;
    this.mode = mode;
    this.root.dataset.mode = mode;
    for (const [id, button] of this.modeButtons) button.setAttribute('aria-pressed', String(id === mode));

    this.panel.replaceChildren();
    if (mode === 'free') this.buildFreePanel();
    if (mode === 'record') this.buildRecordPanel();
    if (mode === 'repeat') {
      this.repeat = new RepeatGame({ animals: ANIMAL_IDS });
      this.setSoundMode('instrument');
      this.buildRepeatPanel();
      this.setRepeatPhase('idle');
    } else {
      this.setBubble(null);
    }
    this.root.dataset.listening = 'false';
    this.updatePool();
  }

  private soundToggle() {
    const group = el('div', { className: 'ao-segment', attrs: { role: 'group', 'aria-label': 'Звук' } });
    const options: { id: SoundMode; emoji: string; label: string }[] = [
      { id: 'instrument', emoji: '🎺', label: 'Музыка' },
      { id: 'voice', emoji: '🐾', label: 'Голоса' },
    ];
    for (const o of options) {
      const b = el(
        'button',
        { className: 'ao-chip', type: 'button', dataset: { sound: o.id }, attrs: { 'aria-pressed': String(this.soundMode === o.id), 'aria-label': o.label } },
        el('span', { attrs: { 'aria-hidden': 'true' } }, o.emoji),
        el('span', { className: 'ao-chip-label' }, o.label),
      );
      b.addEventListener('click', () => {
        this.setSoundMode(o.id);
        this.audio.click();
      });
      group.append(b);
    }
    return group;
  }

  private beatButton() {
    const b = el(
      'button',
      { className: 'ao-chip ao-beat', type: 'button', attrs: { 'aria-pressed': String(this.audio.beating), 'aria-label': 'Ритм' } },
      el('span', { attrs: { 'aria-hidden': 'true' } }, '🥁'),
      el('span', { className: 'ao-chip-label' }, 'Ритм'),
    );
    b.addEventListener('click', () => {
      this.audio.unlock();
      if (this.audio.beating) this.audio.stopBeat();
      else this.audio.startBeat((beat) => this.onBeat(beat));
      this.updateBeatButton();
    });
    return b;
  }

  private buildFreePanel() {
    this.panel.append(this.soundToggle(), this.beatButton());
  }

  private buildRecordPanel() {
    const rec = el('button', { className: 'ao-big ao-rec', type: 'button', attrs: { 'aria-label': 'Записать' } }, el('span', { className: 'ao-rec-dot' }));
    const play = el('button', { className: 'ao-big ao-play', type: 'button', attrs: { 'aria-label': 'Послушать' } }, '▶');
    const save = el('button', { className: 'ao-big ao-save', type: 'button', attrs: { 'aria-label': 'Сохранить' } }, '💾');
    const shelf = el('button', { className: 'ao-big ao-shelf', type: 'button', attrs: { 'aria-label': 'Мои мелодии' } }, '📚');
    const meter = el('div', { className: 'ao-meter', attrs: { 'aria-hidden': 'true' } }, el('div', { className: 'ao-meter-fill' }));

    rec.addEventListener('click', () => (this.recorder ? this.stopRecording() : this.startRecording()));
    play.addEventListener('click', () => {
      if (this.playing) this.stopPlayback();
      else if (this.take.length) this.playSong(this.take);
    });
    save.addEventListener('click', () => void this.saveTake());
    shelf.addEventListener('click', () => void this.openSheet());

    const extras: HTMLElement[] = this.melodies ? [save, shelf] : [];
    this.panel.append(this.soundToggle(), rec, play, ...extras, meter);
    this.updateRecordPanel();
  }

  private buildRepeatPanel() {
    const again = el('button', { className: 'ao-big ao-again', type: 'button', attrs: { 'aria-label': 'Послушать ещё раз' } }, '👂');
    again.addEventListener('click', () => {
      if (this.repeatPhase === 'idle') this.nextPhrase();
      else if (this.repeatPhase === 'turn') this.listenAgain();
    });
    const stars = el('div', { className: 'ao-stars', attrs: { 'aria-label': 'Звёзды' } });
    this.panel.append(again, stars);
    this.updateStars();
  }

  // ---------- игра ----------

  private onAnimal(animal: Animal) {
    if (this.mode === 'repeat') {
      if (this.repeatPhase === 'idle') return this.nextPhrase();
      if (this.repeatPhase !== 'turn') return;
      this.hit(animal, 'instrument');
      const result = this.repeat.answer(animal.id);
      if (result === 'miss') this.onMiss(animal);
      else if (result === 'done') this.onPhraseDone();
      else this.updateProgressDots();
      return;
    }

    if (this.playing) this.stopPlayback();
    this.hit(animal, this.soundMode);
    if (this.recorder) {
      if (!this.recorder.add(animal.id, this.soundMode)) this.stopRecording();
      this.updateRecordPanel();
    }
  }

  /** Звук + анимация + ноты. */
  private hit(animal: Animal, sound: SoundMode) {
    this.audio.play(animal, sound);
    const button = this.animalButtons.get(animal.id);
    if (!button) return;
    button.querySelector('.ao-body')?.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(4%) scale(1.18, 0.86)', offset: 0.18 },
        { transform: 'translateY(-14%) scale(0.94, 1.1)', offset: 0.5 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
    button.classList.remove('is-lit');
    void button.offsetWidth;
    button.classList.add('is-lit');
    const box = button.getBoundingClientRect();
    const host = this.root.getBoundingClientRect();
    this.fx.notes(box.left + box.width / 2 - host.left, box.top + box.height * 0.2 - host.top, animal.color);
  }

  private onBeat(beat: number) {
    this.root.dataset.beat = String(beat % 2);
  }

  private onKey(e: KeyboardEvent) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const animal = ANIMALS.find((a) => a.key === e.key);
    if (animal) {
      this.audio.unlock();
      this.onAnimal(animal);
    }
  }

  private setSoundMode(mode: SoundMode) {
    this.soundMode = mode;
    this.root.dataset.sound = mode;
    for (const b of this.panel.querySelectorAll<HTMLButtonElement>('[data-sound]')) b.setAttribute('aria-pressed', String(b.dataset.sound === mode));
    for (const animal of ANIMALS) {
      const badge = this.animalButtons.get(animal.id)?.querySelector('.ao-badge');
      if (badge) badge.textContent = mode === 'voice' ? '💬' : animal.instrumentEmoji;
    }
  }

  private updateBeatButton() {
    this.panel.querySelector('.ao-beat')?.setAttribute('aria-pressed', String(this.audio.beating));
    if (!this.audio.beating) delete this.root.dataset.beat;
  }

  // ---------- запись ----------

  private startRecording() {
    this.stopPlayback();
    this.recorder = new SongRecorder(() => performance.now());
    this.take = [];
    this.audio.click();
    this.updateRecordPanel();
    this.showToast('🎙️ Играй!');
  }

  private stopRecording() {
    if (!this.recorder) return;
    this.take = normalizeSong(this.recorder.result());
    this.recorder = null;
    this.updateRecordPanel();
    if (this.take.length) {
      this.audio.praise();
      this.playSong(this.take);
    }
  }

  private updateRecordPanel() {
    if (this.mode !== 'record') return;
    const recording = this.recorder !== null;
    this.root.dataset.recording = String(recording);
    const rec = this.panel.querySelector<HTMLButtonElement>('.ao-rec');
    rec?.setAttribute('aria-label', recording ? 'Стоп' : 'Записать');
    rec?.setAttribute('aria-pressed', String(recording));
    const hasTake = this.take.length > 0 && !recording;
    const play = this.panel.querySelector<HTMLButtonElement>('.ao-play');
    if (play) {
      play.disabled = !hasTake;
      play.textContent = this.playing ? '⏹' : '▶';
      play.setAttribute('aria-label', this.playing ? 'Стоп' : 'Послушать');
    }
    const save = this.panel.querySelector<HTMLButtonElement>('.ao-save');
    if (save) save.disabled = !hasTake;
    const count = recording ? this.recorder!.length : this.take.length;
    this.panel.querySelector<HTMLElement>('.ao-meter-fill')?.style.setProperty('width', `${(count / MAX_NOTES) * 100}%`);
  }

  private playSong(notes: readonly SongNote[], onDone?: () => void) {
    this.stopPlayback();
    this.playing = true;
    for (const note of notes) {
      const animal = animalById(note.a);
      if (!animal) continue;
      this.playbackTimers.push(setTimeout(() => this.hit(animal, note.m), note.t + 150));
    }
    const end = (notes.length ? notes[notes.length - 1].t : 0) + 700;
    this.playbackTimers.push(
      setTimeout(() => {
        this.playing = false;
        this.playbackTimers = [];
        this.updateRecordPanel();
        this.renderSheetPlaying(null);
        onDone?.();
      }, end),
    );
    this.updateRecordPanel();
  }

  private stopPlayback() {
    this.playbackTimers.forEach(clearTimeout);
    this.playbackTimers = [];
    if (this.playing) {
      this.playing = false;
      this.updateRecordPanel();
      this.renderSheetPlaying(null);
    }
  }

  private async saveTake() {
    if (!this.melodies || !this.take.length) return;
    const save = this.panel.querySelector<HTMLButtonElement>('.ao-save');
    if (save) save.disabled = true;
    try {
      const melody = await this.melodies.save(this.take, 'Моя мелодия');
      this.saved = this.saved ? [melody, ...this.saved] : null;
      this.take = [];
      this.audio.praise();
      this.fx.confetti();
      this.showToast('💾 Сохранили!');
    } catch {
      this.showToast('😕 Не получилось сохранить');
    }
    this.updateRecordPanel();
  }

  // ---------- полка «Мои мелодии» ----------

  private async openSheet() {
    if (!this.melodies) return;
    this.stopPlayback();
    this.sheet.hidden = false;
    this.root.dataset.sheet = 'open';
    this.renderSheet();
    if (this.saved === null) {
      try {
        this.saved = await this.melodies.list();
      } catch {
        this.saved = null;
        this.showToast('😕 Не получилось загрузить');
        this.closeSheet();
        return;
      }
      this.renderSheet();
    }
  }

  private closeSheet() {
    this.sheet.hidden = true;
    delete this.root.dataset.sheet;
  }

  private renderSheet() {
    const close = el('button', { className: 'ao-sheet-close', type: 'button', attrs: { 'aria-label': 'Закрыть' } }, '✖');
    close.addEventListener('click', () => {
      this.stopPlayback();
      this.closeSheet();
    });
    const list = el('div', { className: 'ao-songs' });

    if (this.saved === null) list.append(el('div', { className: 'ao-empty' }, '⏳'));
    else if (!this.saved.length) list.append(el('div', { className: 'ao-empty' }, '🎼 Пока пусто'));
    else for (const melody of this.saved) list.append(this.songCard(melody));

    const panel = el('div', { className: 'ao-sheet-panel', attrs: { role: 'dialog', 'aria-label': 'Мои мелодии' } }, el('h2', {}, '📚 Мои мелодии'), close, list);
    this.sheet.replaceChildren(panel);
    this.sheet.onclick = (e) => {
      if (e.target === this.sheet) {
        this.stopPlayback();
        this.closeSheet();
      }
    };
  }

  private songCard(melody: Melody) {
    const faces = melody.notes
      .slice(0, 6)
      .map((n) => animalById(n.a)?.emoji ?? '')
      .join('');
    const date = new Date(melody.createdAt).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const play = el(
      'button',
      { className: 'ao-song-play', type: 'button', attrs: { 'aria-label': `Играть: ${melody.title}, ${date}` } },
      el('span', { className: 'ao-song-icon', attrs: { 'aria-hidden': 'true' } }, '▶'),
      el('span', { className: 'ao-song-faces', attrs: { 'aria-hidden': 'true' } }, faces + (melody.notes.length > 6 ? '…' : '')),
      el('span', { className: 'ao-song-date' }, date),
    );
    play.addEventListener('click', () => {
      if (this.sheet.querySelector(`[data-id="${melody.id}"].is-playing`)) return this.stopPlayback();
      this.renderSheetPlaying(melody.id);
      this.playSong(melody.notes);
    });

    const remove = el('button', { className: 'ao-song-remove', type: 'button', attrs: { 'aria-label': 'Удалить' } }, '🗑');
    remove.addEventListener('click', () => {
      // Двойное подтверждение: первое касание спрашивает, второе удаляет.
      if (!card.classList.contains('is-confirm')) {
        card.classList.add('is-confirm');
        remove.textContent = '✔';
        remove.setAttribute('aria-label', 'Точно удалить');
        setTimeout(() => {
          card.classList.remove('is-confirm');
          remove.textContent = '🗑';
          remove.setAttribute('aria-label', 'Удалить');
        }, 3000);
        return;
      }
      void this.removeMelody(melody.id);
    });

    const card = el('div', { className: 'ao-song', dataset: { id: melody.id } }, play, remove);
    return card;
  }

  private renderSheetPlaying(id: string | null) {
    for (const card of this.sheet.querySelectorAll<HTMLElement>('.ao-song')) {
      const on = card.dataset.id === id;
      card.classList.toggle('is-playing', on);
      const icon = card.querySelector('.ao-song-icon');
      if (icon) icon.textContent = on ? '⏹' : '▶';
    }
  }

  private async removeMelody(id: string) {
    if (!this.melodies) return;
    this.stopPlayback();
    try {
      await this.melodies.remove(id);
      this.saved = (this.saved ?? []).filter((m) => m.id !== id);
      this.renderSheet();
    } catch {
      this.showToast('😕 Не получилось удалить');
    }
  }

  // ---------- «Повтори за мной» ----------

  private nextPhrase() {
    this.repeat.newPhrase();
    this.updatePool();
    this.playPhrase();
  }

  private listenAgain() {
    this.repeat.restartPhrase();
    this.playPhrase();
  }

  private playPhrase() {
    this.setRepeatPhase('listen');
    const notes: SongNote[] = this.repeat.phrase.map((a, i) => ({ a, t: 400 + i * 650, m: 'instrument' }));
    this.playSong(notes, () => {
      if (this.mode === 'repeat' && this.repeatPhase === 'listen') this.setRepeatPhase('turn');
    });
  }

  private onMiss(animal: Animal) {
    this.audio.oops();
    this.animalButtons.get(animal.id)?.querySelector('.ao-body')?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8%)' }, { transform: 'translateX(8%)' }, { transform: 'translateX(0)' }],
      { duration: 300 },
    );
    this.setBubble('🙈', 'Ой! Послушай ещё');
    this.repeatPhase = 'bravo';
    this.root.dataset.listening = 'true';
    this.playbackTimers.push(setTimeout(() => this.listenAgain(), 1300));
  }

  private onPhraseDone() {
    this.setRepeatPhase('bravo');
    this.playbackTimers.push(
      setTimeout(() => {
        this.audio.praise();
        this.fx.confetti();
      }, 250),
    );
    this.updateStars();
    this.playbackTimers.push(setTimeout(() => this.nextPhrase(), 2300));
  }

  private setRepeatPhase(phase: RepeatPhase) {
    this.repeatPhase = phase;
    this.root.dataset.listening = String(phase === 'listen' || phase === 'bravo');
    if (phase === 'idle') this.setBubble('🐧', 'Нажми на зверя — начнём!');
    if (phase === 'listen') this.setBubble('👂', 'Слушай…');
    if (phase === 'turn') this.setBubble('👆', 'Теперь ты!');
    if (phase === 'bravo') this.setBubble('🎉', PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    this.updateProgressDots();
    const again = this.panel.querySelector<HTMLButtonElement>('.ao-again');
    if (again) {
      again.disabled = phase === 'listen' || phase === 'bravo';
      again.textContent = phase === 'idle' ? '▶️' : '👂';
      again.setAttribute('aria-label', phase === 'idle' ? 'Начать' : 'Послушать ещё раз');
    }
  }

  /** В «Повтори» сначала играют не все звери: остальные притушены. */
  private updatePool() {
    const pool = this.mode === 'repeat' ? this.repeat.poolSize : ANIMALS.length;
    ANIMALS.forEach((a, i) => this.animalButtons.get(a.id)?.toggleAttribute('data-resting', i >= pool));
  }

  private updateStars() {
    const stars = this.panel.querySelector('.ao-stars');
    if (!stars) return;
    const n = this.repeat.stars;
    stars.replaceChildren(el('span', { className: 'ao-star', attrs: { 'aria-hidden': 'true' } }, '⭐'), el('span', { className: 'ao-star-count' }, String(n)));
    stars.setAttribute('aria-label', `Звёзды: ${n}`);
    if (n) stars.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 450 });
  }

  private updateProgressDots() {
    const dots = this.bubble.querySelector('.ao-dots');
    if (!dots || this.mode !== 'repeat') return;
    const showing = this.repeatPhase === 'turn';
    dots.replaceChildren(
      ...this.repeat.phrase.map((_, i) => el('span', { className: `ao-dot${showing && i < this.repeat.progress ? ' is-done' : ''}` })),
    );
  }

  // ---------- подсказки ----------

  private setBubble(icon: string | null, text = '') {
    if (!icon) {
      this.bubble.hidden = true;
      return;
    }
    this.bubble.hidden = false;
    this.bubble.replaceChildren(
      el('span', { className: 'ao-bubble-icon', attrs: { 'aria-hidden': 'true' } }, icon),
      el('span', { className: 'ao-bubble-text' }, text),
      el('span', { className: 'ao-dots', attrs: { 'aria-hidden': 'true' } }),
    );
    this.bubble.animate([{ transform: 'translateX(-50%) scale(0.85)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 220, easing: 'ease-out' });
  }

  private showToast(text: string) {
    this.toast.textContent = text;
    this.toast.classList.add('is-shown');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.classList.remove('is-shown'), 1800);
  }
}
