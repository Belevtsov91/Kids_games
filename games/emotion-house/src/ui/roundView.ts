// Экран ситуации: зверёк, его история и варианты ответа (сначала эмоция, потом что поможет).
import type { Scenario } from '../game/scenarios';
import { tr } from '../i18n';
import { button, el } from './dom';

export class RoundView {
  readonly node = el('section', 'eh-round');
  private readonly face = el('span', 'eh-hero-face');
  private readonly hero = el('div', 'eh-hero');
  private readonly question = el('h2', 'eh-question');
  readonly choices = el('div', 'eh-choices');
  private readonly footer = el('div', 'eh-actions');

  constructor(readonly scenario: Scenario, faceArt: string | null, onSpeak: () => void) {
    this.hero.append(el('span', 'eh-hero-animal', scenario.hero), this.face);
    this.setFace(faceArt);
    const story = button('eh-story', `🔊 ${tr().scenarios[scenario.id]}`, onSpeak);
    this.node.append(this.hero, story, this.question, this.choices, this.footer);
  }

  setFace(art: string | null) {
    this.face.textContent = art ?? '❔';
    this.face.classList.toggle('is-hidden', !art);
    this.face.classList.remove('is-pop');
    void this.face.offsetWidth;
    this.face.classList.add('is-pop');
  }

  ask(text: string, cards: HTMLElement[]) {
    this.question.textContent = text;
    this.choices.replaceChildren(...cards);
  }

  cheer() {
    this.hero.classList.add('is-happy');
  }

  showNext(onNext: () => void, onHome: () => void) {
    const next = button('eh-btn eh-btn-play', tr().next, onNext);
    this.footer.replaceChildren(next, button('eh-btn eh-btn-soft', tr().home, onHome));
    next.focus({ preventScroll: true });
  }
}
