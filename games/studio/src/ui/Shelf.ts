import type { Beat, BeatsApi } from '../api/beats';
import { TITLE_MAX } from '../game/pattern';
import { formatDate, tr } from '../i18n';
import { el } from './dom';

// «Мои биты»: сохранить текущий бит под названием, открыть старый, показать родителям, удалить.

export interface ShelfHandlers {
  save(title: string): Promise<boolean>;
  open(beat: Beat): void;
  toast(text: string): void;
  shared(): void;
}

export class Shelf {
  readonly el = el('div', { className: 'st-sheet', hidden: true, attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': tr().shelf } });
  private readonly list = el('ul', { className: 'st-list' });
  private readonly input = el('input', { className: 'st-input', type: 'text', maxLength: TITLE_MAX });

  constructor(
    private readonly api: BeatsApi,
    private readonly h: ShelfHandlers,
  ) {
    const t = tr();
    this.input.setAttribute('aria-label', t.nameLabel);
    const saveBtn = el('button', { type: 'button', className: 'st-btn st-accent' }, `💾 ${t.save}`);
    const closeBtn = el('button', { type: 'button', className: 'st-btn st-round', attrs: { 'aria-label': t.close } }, '✕');
    const form = el('form', { className: 'st-save' }, el('label', {}, t.nameLabel, this.input), saveBtn);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.save();
    });
    saveBtn.addEventListener('click', () => void this.save());
    closeBtn.addEventListener('click', () => this.close());
    this.el.addEventListener('keydown', (e) => e.key === 'Escape' && this.close());
    this.el.append(
      el('div', { className: 'st-card' }, el('div', { className: 'st-card-head' }, el('h2', {}, `🎧 ${t.shelf}`), closeBtn), form, this.list),
    );
  }

  get isOpen() {
    return !this.el.hidden;
  }

  async open(focusSave: boolean) {
    this.el.hidden = false;
    this.input.value = this.input.value || tr().defaultTitle;
    if (focusSave) this.input.select();
    await this.refresh();
  }

  close() {
    this.el.hidden = true;
  }

  private async save() {
    const title = this.input.value.trim().slice(0, TITLE_MAX) || tr().defaultTitle;
    if (await this.h.save(title)) await this.refresh();
  }

  private async refresh() {
    try {
      this.draw(await this.api.list());
    } catch {
      this.h.toast(tr().loadFailed);
    }
  }

  private draw(beats: Beat[]) {
    this.list.replaceChildren();
    if (!beats.length) this.list.append(el('li', { className: 'st-empty' }, tr().empty));
    for (const beat of beats) this.list.append(this.item(beat));
  }

  private item(beat: Beat) {
    const t = tr();
    const open = el('button', { type: 'button', className: 'st-btn' }, `▶ ${t.open}`);
    open.addEventListener('click', () => {
      this.h.open(beat);
      this.close();
    });
    const share = el('button', { type: 'button', className: 'st-btn st-share', attrs: { 'aria-pressed': String(beat.shared) } }, beat.shared ? t.shared : `👪 ${t.share}`);
    share.classList.toggle('is-on', beat.shared);
    share.addEventListener('click', async () => {
      try {
        const next = await this.api.share(beat.id, !beat.shared);
        if (next.shared) {
          this.h.toast(t.sharedToast);
          this.h.shared();
        }
        await this.refresh();
      } catch {
        this.h.toast(t.shareFailed);
      }
    });
    const remove = el('button', { type: 'button', className: 'st-btn st-danger', attrs: { 'aria-label': t.remove } }, '🗑');
    remove.addEventListener('click', async () => {
      if (!remove.classList.contains('is-sure')) {
        remove.classList.add('is-sure');
        remove.textContent = t.removeSure;
        return;
      }
      try {
        await this.api.remove(beat.id);
        await this.refresh();
      } catch {
        this.h.toast(t.removeFailed);
      }
    });
    return el(
      'li',
      { className: 'st-item' },
      el('div', { className: 'st-item-text' }, el('strong', {}, beat.title), el('small', {}, `${formatDate(beat.createdAt)} · ${beat.bpm} BPM`)),
      el('div', { className: 'st-item-actions' }, open, share, remove),
    );
  }
}
