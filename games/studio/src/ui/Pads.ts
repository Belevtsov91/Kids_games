import { PAD_LIST, ROW_COLORS } from '../game/kit';
import { tr } from '../i18n';
import { el, replayClass } from './dom';

// Пульт 4×4: касание играет звук и выбирает дорожку для редактора шагов.

export class Pads {
  readonly el = el('div', { className: 'st-pads', attrs: { role: 'group', 'aria-label': tr().title } });
  private readonly buttons: HTMLButtonElement[];

  constructor(onHit: (pad: number) => void) {
    const t = tr();
    this.buttons = PAD_LIST.map((pad) => {
      const button = el(
        'button',
        {
          type: 'button',
          className: 'st-pad',
          dataset: { row: pad.row },
          attrs: { 'aria-label': t.padLabel(t.pads[pad.index]!, pad.key), style: `--pad:${ROW_COLORS[pad.row]}` },
        },
        el('span', { className: 'st-pad-name' }, t.pads[pad.index]!),
        el('span', { className: 'st-pad-key', attrs: { 'aria-hidden': 'true' } }, pad.key.toUpperCase()),
      );
      // pointerdown, а не click: звук должен идти в момент касания, без задержки.
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onHit(pad.index);
      });
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onHit(pad.index);
        }
      });
      return button;
    });
    this.el.append(...this.buttons);
  }

  /** Вспышка пэда: от касания или когда его играет секвенсор. */
  flash(pad: number) {
    const b = this.buttons[pad];
    if (b) replayClass(b, 'is-hit');
  }

  select(pad: number) {
    this.buttons.forEach((b, i) => b.classList.toggle('is-selected', i === pad));
  }
}
