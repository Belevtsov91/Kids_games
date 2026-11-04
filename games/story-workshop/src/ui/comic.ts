// Комикс из трёх картинок: фон места, герой и то, что с ним случилось. Подписи можно открыть позже.
import { EMOJI, panelsOf, type Tale } from '../game/story';
import { el } from './dom';

export class Comic {
  readonly node = el('div', 'st-comic');
  private readonly panels: HTMLElement[] = [];
  private readonly captions: HTMLElement[] = [];

  constructor(tale: Tale, lines: string[], open: boolean) {
    panelsOf(tale).forEach((p, i) => {
      const panel = el('figure', `st-panel st-scene-${p.scene}`);
      const actors = el('div', 'st-actors');
      actors.append(el('span', 'st-scene-emoji', EMOJI[tale.place]));
      p.actors.forEach((a, k) => actors.append(el('span', `st-actor st-actor-${k}`, a)));
      const caption = el('figcaption', 'st-caption', lines[i] ?? '');
      caption.hidden = !open;
      panel.append(el('span', 'st-num', String(i + 1)), actors, caption);
      this.panels.push(panel);
      this.captions.push(caption);
      this.node.append(panel);
    });
  }

  /** Какая картинка сейчас рассказывается (остальные притушены). */
  focus(i: number) {
    this.panels.forEach((p, k) => {
      p.classList.toggle('is-active', k === i);
      p.classList.toggle('is-later', k > i);
    });
  }

  reveal(i: number) {
    const c = this.captions[i];
    if (c) c.hidden = false;
  }

  openAll() {
    this.captions.forEach((c) => (c.hidden = false));
    this.panels.forEach((p) => p.classList.remove('is-active', 'is-later'));
  }
}
