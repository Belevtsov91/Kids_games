import tyopaArt from '../../assets/tyopa.svg';
import { tr } from '../i18n';
import { el, replayClass } from './dom';

// Медвежонок Тёпа в наушниках: кивает в такт и подсказывает в облачке.

const HEADPHONES = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 58 C14 22 86 22 86 58" fill="none" stroke="#ff7ab0" stroke-width="7" stroke-linecap="round"/><rect x="4" y="50" width="18" height="28" rx="8" fill="#ff5c9a"/><rect x="78" y="50" width="18" height="28" rx="8" fill="#ff5c9a"/></svg>`;

export class Tyopa {
  readonly el = el('div', { className: 'st-tyopa' });
  private readonly bubble = el('p', { className: 'st-bubble', attrs: { 'aria-live': 'polite' } });
  private readonly body = el('div', { className: 'st-bear' });
  private tip = 0;

  constructor(private readonly calm: boolean) {
    const img = el('img', { src: tyopaArt, alt: tr().tyopa, draggable: false });
    const phones = el('div', { className: 'st-phones' });
    phones.innerHTML = HEADPHONES;
    this.body.append(img, phones);
    this.body.addEventListener('click', () => this.nextTip());
    this.el.append(this.bubble, this.body);
    this.say(tr().tips[0]!);
  }

  say(text: string) {
    this.bubble.textContent = text;
    if (!this.calm) replayClass(this.bubble, 'is-new');
  }

  nextTip() {
    const tips = tr().tips;
    this.tip = (this.tip + 1) % tips.length;
    this.say(tips[this.tip]!);
  }

  cheer() {
    const cheers = tr().cheers;
    this.say(cheers[Math.floor(Math.random() * cheers.length)]!);
  }

  /** Кивок на сильную долю. С «меньше движения» Тёпа стоит спокойно. */
  bob() {
    if (!this.calm) replayClass(this.body, 'is-bob');
  }
}
