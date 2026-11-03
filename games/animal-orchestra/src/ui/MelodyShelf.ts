import type { Melody, MelodiesApi } from '../api/melodies';
import type { Playback } from '../app/Playback';
import { animalById } from '../game/animals';
import { el } from './dom';
import type { Toast } from './Toast';
import { formatDate, tr } from '../i18n';

// Полка «Мои мелодии»: список сохранённых мелодий с сервера — послушать или удалить.

export class MelodyShelf {
  readonly el = el('div', { className: 'ao-sheet', hidden: true });
  /** Кэш списка; null — ещё не загружали (или загрузка не удалась). */
  private saved: Melody[] | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly api: MelodiesApi,
    private readonly playback: Playback,
    private readonly toast: Toast,
  ) {
    this.el.onclick = (e) => {
      if (e.target === this.el) this.dismiss();
    };
  }

  async open() {
    this.playback.stop();
    this.el.hidden = false;
    this.root.dataset.sheet = 'open';
    this.render();
    if (this.saved !== null) return;
    try {
      this.saved = await this.api.list();
    } catch {
      this.saved = null;
      this.toast.show(tr().loadFailed);
      this.close();
      return;
    }
    this.render();
  }

  close() {
    this.el.hidden = true;
    delete this.root.dataset.sheet;
  }

  /** Новая мелодия сохранена: попадает на полку сверху (если список уже загружен). */
  added(melody: Melody) {
    this.saved = this.saved ? [melody, ...this.saved] : null;
  }

  /** Отмечает играющую мелодию (null — ни одна не играет). */
  markPlaying(id: string | null) {
    for (const card of this.el.querySelectorAll<HTMLElement>('.ao-song')) {
      const on = card.dataset.id === id;
      card.classList.toggle('is-playing', on);
      const icon = card.querySelector('.ao-song-icon');
      if (icon) icon.textContent = on ? '⏹' : '▶';
    }
  }

  private dismiss() {
    this.playback.stop();
    this.close();
  }

  private render() {
    const close = el('button', { className: 'ao-sheet-close', type: 'button', attrs: { 'aria-label': tr().close } }, '✖');
    close.addEventListener('click', () => this.dismiss());
    const list = el('div', { className: 'ao-songs' });
    if (this.saved === null) list.append(el('div', { className: 'ao-empty' }, '⏳'));
    else if (!this.saved.length) list.append(el('div', { className: 'ao-empty' }, tr().empty));
    else for (const melody of this.saved) list.append(this.songCard(melody));
    const panel = el('div', { className: 'ao-sheet-panel', attrs: { role: 'dialog', 'aria-label': tr().shelf } }, el('h2', {}, `📚 ${tr().shelf}`), close, list);
    this.el.replaceChildren(panel);
  }

  private songCard(melody: Melody) {
    const faces = melody.notes
      .slice(0, 6)
      .map((n) => animalById(n.a)?.emoji ?? '')
      .join('');
    const date = formatDate(melody.createdAt);
    const play = el(
      'button',
      { className: 'ao-song-play', type: 'button', attrs: { 'aria-label': tr().playMelody(melody.title, date) } },
      el('span', { className: 'ao-song-icon', attrs: { 'aria-hidden': 'true' } }, '▶'),
      el('span', { className: 'ao-song-faces', attrs: { 'aria-hidden': 'true' } }, faces + (melody.notes.length > 6 ? '…' : '')),
      el('span', { className: 'ao-song-date' }, date),
    );
    play.addEventListener('click', () => {
      if (this.el.querySelector(`[data-id="${melody.id}"].is-playing`)) return this.playback.stop();
      this.markPlaying(melody.id);
      this.playback.play(melody.notes);
    });

    const remove = el('button', { className: 'ao-song-remove', type: 'button', attrs: { 'aria-label': tr().remove } }, '🗑');
    const card = el('div', { className: 'ao-song', dataset: { id: melody.id } }, play, remove);
    remove.addEventListener('click', () => {
      // Двойное подтверждение: первое касание спрашивает, второе удаляет.
      if (card.classList.contains('is-confirm')) return void this.remove(melody.id);
      card.classList.add('is-confirm');
      remove.textContent = '✔';
      remove.setAttribute('aria-label', tr().removeSure);
      setTimeout(() => {
        card.classList.remove('is-confirm');
        remove.textContent = '🗑';
        remove.setAttribute('aria-label', tr().remove);
      }, 3000);
    });
    return card;
  }

  private async remove(id: string) {
    this.playback.stop();
    try {
      await this.api.remove(id);
      this.saved = (this.saved ?? []).filter((m) => m.id !== id);
      this.render();
    } catch {
      this.toast.show(tr().removeFailed);
    }
  }
}
