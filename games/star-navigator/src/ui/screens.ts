// Экраны вокруг полёта: карта уровней и окно с результатом.
import type { FlightStatus } from '../game/flight';
import { LEVELS } from '../game/levels';
import { isUnlocked, totalStars, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { button, el } from './dom';

/** Карта рейсов: десять кнопок со звёздами, закрытые — серые. */
export const levelMap = (name: string | undefined, p: Progress, onPick: (index: number) => void) => {
  const t = tr();
  const root = el('section', 'sn-map');
  root.append(el('p', 'sn-lead', t.lead(name)), el('p', 'sn-total', t.totalStars(totalStars(p), LEVELS.length * 3)));
  const grid = el('div', 'sn-grid');
  LEVELS.forEach((l, i) => {
    const open = isUnlocked(p, i);
    const stars = p.stars[l.id] ?? 0;
    const b = button('sn-level', '', () => onPick(i));
    b.disabled = !open;
    if (!open) b.title = t.locked;
    b.append(
      el('span', 'sn-level-num', open ? String(i + 1) : '🔒'),
      el('span', 'sn-level-name', t.levels[l.id]),
      el('span', 'sn-level-stars', '★'.repeat(stars) + '☆'.repeat(3 - stars)),
    );
    grid.append(b);
  });
  root.append(grid);
  return root;
};

export interface WinInfo {
  orbit: boolean;
  got: number;
  total: number;
  attempts: number;
  stars: number;
  last: boolean;
}

const card = (title: string, text: string) => {
  const overlay = el('div', 'sn-overlay');
  const box = el('div', 'sn-card');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.append(el('h2', 'sn-card-title', title));
  if (text) box.append(el('p', 'sn-card-text', text));
  overlay.append(box);
  return { overlay, box };
};

/** Победа: три звезды с подписями, «Дальше» и «Уровни». */
export const winOverlay = (w: WinInfo, onNext: () => void, onRetry: () => void, onMap: () => void) => {
  const t = tr();
  const { overlay, box } = card(w.orbit ? t.orbitTitle : t.wonTitle, '');
  const row = el('ul', 'sn-stars');
  const items: [boolean, string][] = [
    [true, t.starWin],
    [w.got >= w.total, w.total ? `${t.starCrystals} ${t.crystals(w.got, w.total)}` : t.starCrystals],
    [w.attempts <= 3, t.starTries],
  ];
  for (const [ok, label] of items) {
    const li = el('li', ok ? 'sn-star sn-star-on' : 'sn-star');
    li.append(el('span', 'sn-star-icon', ok ? '★' : '☆'), el('span', '', label));
    row.append(li);
  }
  const actions = el('div', 'sn-actions');
  const next = button('sn-btn sn-btn-main', w.last ? t.levelsBtn : t.next, w.last ? onMap : onNext);
  actions.append(button('sn-btn', t.retry, onRetry), next);
  if (!w.last) actions.append(button('sn-btn', t.levelsBtn, onMap));
  box.append(row, actions);
  return { overlay, focus: () => next.focus() };
};

/** Неудача: почему не вышло и подсказка, что поменять. */
export const failOverlay = (status: FlightStatus, onRetry: () => void) => {
  const t = tr();
  const reason = status === 'burned' ? t.burned : status === 'fell' ? t.fell : status === 'lost' ? t.lost : t.crashed;
  const { overlay, box } = card('💥', reason);
  const again = button('sn-btn sn-btn-main', t.retry, onRetry);
  const actions = el('div', 'sn-actions');
  actions.append(again);
  box.append(actions);
  return { overlay, focus: () => again.focus() };
};

/** Все рейсы пройдены. */
export const finaleOverlay = (onMap: () => void) => {
  const t = tr();
  const { overlay, box } = card(`🌌 ${t.allDoneTitle}`, t.allDoneText);
  const ok = button('sn-btn sn-btn-main', t.levelsBtn, onMap);
  const actions = el('div', 'sn-actions');
  actions.append(ok);
  box.append(actions);
  return { overlay, focus: () => ok.focus() };
};
