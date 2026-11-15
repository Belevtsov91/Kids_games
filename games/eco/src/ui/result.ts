// Окно итога суток: звёзды, сколько потрачено, кнопки «перестроить» и «дальше».
import { tr } from '../i18n';
import { bearSvg } from './art';
import { button, el, esc } from './dom';

export interface ResultView {
  stars: number;
  cost: number;
  budget: number;
  hasNext: boolean;
  onAgain: () => void;
  onNext: () => void;
  onMenu: () => void;
}

export function renderResult(view: ResultView): HTMLElement {
  const t = tr();
  const root = el('div', 'eco-result');
  const card = el('div', 'eco-result-card');
  card.append(
    el('div', 'eco-bear eco-bear-win', bearSvg()),
    el('h2', 'eco-result-title', esc(t.bear.win)),
    el('div', 'eco-result-stars', `${'★'.repeat(view.stars)}<i>${'★'.repeat(3 - view.stars)}</i>`),
    el('p', 'eco-result-note', esc(t.stars(view.stars))),
    el('p', 'eco-result-cost', esc(t.spent(view.cost, view.budget))),
  );
  const actions = el('div', 'eco-result-actions');
  actions.append(button('eco-btn eco-btn-ghost', t.again, view.onAgain));
  actions.append(view.hasNext ? button('eco-btn eco-btn-main', t.next, view.onNext) : button('eco-btn eco-btn-main', t.back, view.onMenu));
  card.appendChild(actions);
  root.appendChild(card);
  return root;
}
