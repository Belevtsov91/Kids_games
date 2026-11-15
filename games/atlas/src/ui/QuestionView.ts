// Панель вопроса: что спрашиваем, варианты ответа и разбор после ответа.
import type { CountryId } from '../game/countries';
import type { Question } from '../game/quiz';
import { capitalOf, cityOf, nameOf, tr } from '../i18n';
import { button, el } from './dom';
import { flagSvg } from './flagSvg';

/** Текст вопроса на языке игры. */
export const promptOf = (q: Question) => {
  const ask = tr().ask;
  switch (q.kind) {
    case 'flag':
      return ask.flag();
    case 'flagOf':
      return ask.flagOf(nameOf(q.answer));
    case 'capital':
      return ask.capital(nameOf(q.answer));
    case 'capitalOf':
      return ask.capitalOf(capitalOf(q.answer));
    case 'city':
      return ask.city(cityOf(q.answer, q.city ?? 0));
    case 'globe':
      return ask.globe(nameOf(q.answer));
  }
};

/** Разбор после ответа: что это за страна и её столица (или город). */
export const factOf = (q: Question) =>
  q.kind === 'city' ? tr().cityFact(cityOf(q.answer, q.city ?? 0), nameOf(q.answer)) : tr().fact(nameOf(q.answer), capitalOf(q.answer));

export class QuestionView {
  readonly node = el('div', 'at-panel');
  private readonly buttons = new Map<CountryId, HTMLButtonElement>();
  private readonly feedback = el('div', 'at-feedback');
  private readonly nextBtn: HTMLButtonElement;

  constructor(q: Question, step: number, total: number, onPick: (id: CountryId) => void, onNext: () => void) {
    const head = el('div', 'at-step', tr().step(step, total));
    const dots = el('div', 'at-dots');
    for (let i = 1; i <= total; i++) dots.append(el('span', i < step ? 'is-done' : i === step ? 'is-now' : ''));
    head.append(dots);
    const prompt = el('h2', 'at-prompt', promptOf(q));
    this.node.append(head, prompt);
    if (q.kind === 'flag') {
      const big = el('div', 'at-bigflag');
      big.innerHTML = flagSvg(q.answer);
      this.node.append(big);
    }
    const grid = el('div', `at-options is-${q.kind}`);
    q.options.forEach((id, i) => {
      const b = button('at-option', '', () => onPick(id));
      if (q.kind === 'flagOf') {
        b.innerHTML = flagSvg(id);
        b.setAttribute('aria-label', String(i + 1));
      } else if (q.kind === 'globe') b.textContent = tr().marker(i + 1);
      else b.textContent = q.kind === 'capital' ? capitalOf(id) : nameOf(id);
      this.buttons.set(id, b);
      grid.append(b);
    });
    this.nextBtn = button('at-btn at-next', tr().next, onNext);
    this.nextBtn.hidden = true;
    this.feedback.hidden = true;
    this.node.append(grid, this.feedback, this.nextBtn);
  }

  /** Показать итог: верный вариант зелёный, ошибочный — красный, дальше — кнопка «Дальше». */
  reveal(q: Question, chosen: CountryId) {
    const ok = chosen === q.answer;
    for (const [id, b] of this.buttons) {
      b.disabled = true;
      if (id === q.answer) b.classList.add('is-right');
      else if (id === chosen) b.classList.add('is-wrong');
    }
    this.feedback.replaceChildren();
    const flag = el('span', 'at-feedback-flag');
    flag.innerHTML = flagSvg(q.answer);
    const text = el('div', 'at-feedback-text');
    text.append(el('strong', '', ok ? tr().right : tr().wrong), el('span', '', factOf(q)));
    this.feedback.append(flag, text);
    this.feedback.className = `at-feedback ${ok ? 'is-ok' : 'is-miss'}`;
    this.feedback.hidden = false;
    this.nextBtn.hidden = false;
    this.nextBtn.focus({ preventScroll: true });
  }
}
