import { PRESET_IDS, type PresetId } from '../game/presets';
import { tr } from '../i18n';
import { el } from './dom';

// Верхняя панель: играть/стоп, запись, темп, свинг, заготовки, очистить, сохранить, мои биты.

export interface TransportHandlers {
  play(): void;
  rec(): void;
  tempo(delta: number): void;
  swing(): void;
  preset(id: PresetId): void;
  clear(): void;
  save(): void;
  shelf(): void;
}

export class Transport {
  readonly el = el('header', { className: 'st-top' });
  private readonly playBtn: HTMLButtonElement;
  private readonly recBtn: HTMLButtonElement;
  private readonly swingBtn: HTMLButtonElement;
  private readonly clearBtn: HTMLButtonElement;
  private readonly bpm = el('output', { className: 'st-bpm' });
  private readonly notes = el('span', { className: 'st-notes' });
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(h: TransportHandlers, canSave: boolean) {
    const t = tr();
    const btn = (className: string, text: string, onClick: () => void, label?: string) => {
      const b = el('button', { type: 'button', className, attrs: label ? { 'aria-label': label } : {} }, text);
      b.addEventListener('click', onClick);
      return b;
    };
    this.playBtn = btn('st-btn st-play', '', h.play);
    this.recBtn = btn('st-btn st-rec', `● ${t.rec}`, h.rec);
    this.recBtn.setAttribute('aria-pressed', 'false');
    this.swingBtn = btn('st-btn st-toggle', `〰 ${t.swing}`, h.swing);
    this.swingBtn.setAttribute('aria-pressed', 'false');
    this.clearBtn = btn('st-btn', `🧽 ${t.clear}`, () => this.confirmClear(h.clear));

    const tempo = el(
      'div',
      { className: 'st-tempo', attrs: { role: 'group', 'aria-label': t.tempo } },
      btn('st-btn st-round', '−', () => h.tempo(-1), t.slower),
      this.bpm,
      btn('st-btn st-round', '+', () => h.tempo(1), t.faster),
    );

    const presets = el('select', { className: 'st-select', attrs: { 'aria-label': t.presets } });
    presets.append(el('option', { value: '', disabled: true, selected: true }, `🎛 ${t.presets}`));
    for (const id of PRESET_IDS) presets.append(el('option', { value: id }, t.presetNames[id]));
    presets.addEventListener('change', () => {
      if (presets.value) h.preset(presets.value as PresetId);
      presets.value = '';
    });

    const files = canSave ? [btn('st-btn st-accent', `💾 ${t.save}`, h.save), btn('st-btn', `🎧 ${t.shelf}`, h.shelf)] : [];
    this.el.append(
      el('h1', { className: 'st-title' }, `🎛️ ${t.title}`),
      el('div', { className: 'st-transport' }, this.playBtn, this.recBtn, tempo, this.swingBtn),
      el('div', { className: 'st-actions' }, presets, this.clearBtn, ...files, this.notes),
    );
    this.setPlaying(false);
  }

  setPlaying(playing: boolean) {
    const t = tr();
    this.playBtn.textContent = playing ? `■ ${t.stop}` : `▶ ${t.play}`;
    this.playBtn.classList.toggle('is-on', playing);
  }

  setRec(on: boolean) {
    this.recBtn.classList.toggle('is-on', on);
    this.recBtn.setAttribute('aria-pressed', String(on));
  }

  setTempo(bpm: number, swing: number) {
    this.bpm.textContent = `${bpm} BPM`;
    this.swingBtn.classList.toggle('is-on', swing > 0);
    this.swingBtn.setAttribute('aria-pressed', String(swing > 0));
  }

  setNotes(n: number) {
    this.notes.textContent = tr().notes(n);
  }

  /** Очистить — в два касания: первое спрашивает «Точно?». */
  private confirmClear(clear: () => void) {
    const t = tr();
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
      this.clearBtn.textContent = `🧽 ${t.clear}`;
      clear();
      return;
    }
    this.clearBtn.textContent = `❓ ${t.clearSure}`;
    this.clearTimer = setTimeout(() => {
      this.clearTimer = null;
      this.clearBtn.textContent = `🧽 ${t.clear}`;
    }, 2500);
  }

  dispose() {
    if (this.clearTimer) clearTimeout(this.clearTimer);
  }
}
