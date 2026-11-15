// Выбор главы, панель вопроса (светофор или варианты ответа) и окно «Тёпа справился».
import type { Progress } from '../game/progress';
import { CHAPTERS, type Chapter, type Round } from '../game/rounds';
import type { Answer } from '../game/play';
import { tr } from '../i18n';
import { bearSvg } from './bear';
import { button, el } from './dom';

const starsText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function menuScreen(name: string | undefined, p: Progress, onPick: (c: Chapter) => void) {
  const screen = el('section', 'sr-menu');
  const hero = el('div', 'sr-hero');
  hero.innerHTML = bearSvg();
  const grid = el('div', 'sr-grid');
  for (const c of CHAPTERS) {
    const card = button('sr-chapter', '', () => onPick(c));
    const stars = p.stars[c.id] ?? 0;
    card.append(el('span', 'sr-chapter-art', c.art), el('span', 'sr-chapter-name', tr().chapters[c.id]), el('span', 'sr-stars', starsText(stars)));
    card.setAttribute('aria-label', `${tr().chapters[c.id]} ${stars}/3`);
    grid.append(card);
  }
  screen.append(hero, el('p', 'sr-lead', tr().lead(name)), grid);
  return screen;
}

/** Текст вопроса для озвучки и заголовка. */
export const questionOf = (round: Round) => (round.kind === 'light' ? tr().lightQ : tr().rounds[round.id].q);

/** Правило, которое Тёпа запоминает после верного ответа. */
export const ruleOf = (round: Round) => (round.kind === 'light' ? tr().lights[round.id] : tr().rounds[round.id].rule);

export class RoundPanel {
  readonly node = el('section', 'sr-panel');
  private buttons: HTMLButtonElement[] = [];

  /** Показать вопрос; onAnswer получает «go»/«wait» или id варианта и нажатую кнопку. */
  show(round: Round, onAnswer: (a: Answer, btn: HTMLButtonElement) => void) {
    const q = el('h2', 'sr-q', questionOf(round));
    const answers = el('div', round.kind === 'light' ? 'sr-answers sr-answers-light' : 'sr-answers');
    const add = (a: Answer, cls: string, art: string, label: string) => {
      const b = button(cls, '', () => onAnswer(a, b));
      if (art) b.append(el('span', 'sr-opt-art', art));
      b.append(el('span', 'sr-opt-label', label));
      answers.append(b);
      return b;
    };
    if (round.kind === 'light') {
      this.buttons = [add('go', 'sr-btn sr-btn-go', '', tr().go), add('wait', 'sr-btn sr-btn-wait', '', tr().wait)];
      this.node.replaceChildren(q, answers);
    } else {
      this.buttons = round.options.map((o) => add(o.id, 'sr-opt', o.art, tr().options[o.id]));
      const head = el('div', 'sr-q-row');
      head.append(el('span', 'sr-q-art', round.art), q);
      this.node.replaceChildren(head, answers);
    }
  }

  shake(btn: HTMLElement) {
    btn.classList.remove('is-shake');
    void btn.offsetWidth;
    btn.classList.add('is-shake');
  }

  /** Верный ответ: остальные кнопки гаснут, ниже — правило и кнопка «Дальше». */
  right(btn: HTMLElement, rule: string, onNext: () => void) {
    for (const b of this.buttons) {
      b.disabled = true;
      if (b !== btn) b.classList.add('is-faded');
    }
    btn.classList.add('is-right');
    const card = el('div', 'sr-rule');
    const next = button('sr-btn sr-btn-next', tr().next, onNext);
    card.append(el('p', '', rule), next);
    this.node.append(card);
    next.focus({ preventScroll: true });
  }
}

export function doneOverlay(stars: number, onAgain: () => void, onMenu: () => void) {
  const overlay = el('div', 'sr-done');
  const card = el('div', 'sr-done-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().doneTitle);
  const bear = el('div', 'sr-done-bear');
  bear.innerHTML = bearSvg(undefined, true);
  const again = button('sr-btn sr-btn-go', tr().again, onAgain);
  const actions = el('div', 'sr-actions');
  actions.append(again, button('sr-btn sr-btn-soft', tr().menu, onMenu));
  card.append(bear, el('h2', '', tr().doneTitle), el('div', 'sr-done-stars', starsText(stars)), actions);
  overlay.append(card);
  return { overlay, focus: () => again.focus({ preventScroll: true }) };
}
