// Стартовый экран: выбор картинки, способа дыхания, темпа и цвета дракончика. Окно «дракончик спокоен».
import { COLORS, SCENES, unlockedColors, type Progress, type Scene } from '../game/progress';
import type { Mode } from '../game/breath';
import { tr } from '../i18n';
import { button, el } from './dom';

export interface Choice {
  scene: Scene;
  mode: Mode;
  slow: boolean;
  color: number;
}

export const dragon = (color: number, className = 'db-dragon') => {
  const d = el('div', className, '🐉');
  d.style.setProperty('--db-hue', `${COLORS[color] ?? 0}deg`);
  d.setAttribute('aria-hidden', 'true');
  return d;
};

/** Ряд переключателей: выбран ровно один. */
function toggles<T>(items: { value: T; label: string }[], current: T, onPick: (v: T) => void) {
  const row = el('div', 'db-toggles');
  row.setAttribute('role', 'radiogroup');
  for (const item of items) {
    const b = button(`db-toggle${item.value === current ? ' is-on' : ''}`, item.label, () => {
      row.querySelectorAll('.db-toggle').forEach((n) => n.classList.remove('is-on'));
      b.classList.add('is-on');
      b.setAttribute('aria-checked', 'true');
      onPick(item.value);
    });
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(item.value === current));
    row.append(b);
  }
  return row;
}

export function startScreen(name: string | undefined, p: Progress, choice: Choice, onStart: (c: Choice) => void) {
  const c = { ...choice };
  const screen = el('section', 'db-start');
  const hero = dragon(c.color);
  const colors = el('div', 'db-colors');
  for (let i = 0; i < unlockedColors(p); i++) {
    const swatch = button(`db-swatch${i === c.color ? ' is-on' : ''}`, '', () => {
      c.color = i;
      hero.style.setProperty('--db-hue', `${COLORS[i]}deg`);
      colors.querySelectorAll('.db-swatch').forEach((n, j) => n.classList.toggle('is-on', j === i));
    });
    swatch.style.setProperty('--db-hue', `${COLORS[i]}deg`);
    swatch.setAttribute('aria-label', `${tr().colors} ${i + 1}`);
    colors.append(swatch);
  }
  const scenes = el('div', 'db-scenes');
  for (const s of SCENES) scenes.append(button('db-scene', tr().scenes[s], () => onStart({ ...c, scene: s })));
  screen.append(
    hero,
    el('p', 'db-lead', tr().lead(name)),
    scenes,
    toggles<Mode>([{ value: 'hold', label: tr().modeHold }, { value: 'follow', label: tr().modeFollow }], c.mode, (v) => (c.mode = v)),
    toggles<boolean>([{ value: true, label: tr().paceSlow }, { value: false, label: tr().paceEasy }], c.slow, (v) => (c.slow = v)),
    colors,
    el('p', 'db-sessions', tr().sessions(p.sessions)),
  );
  return screen;
}

export function doneOverlay(color: number, newColor: boolean, onAgain: () => void, onHome: () => void) {
  const overlay = el('div', 'db-done');
  const card = el('div', 'db-done-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().doneTitle);
  const sleepy = dragon(color, 'db-dragon db-dragon-sleep');
  sleepy.append(el('span', 'db-zzz', '💤'));
  const again = button('db-btn db-btn-play', tr().again, onAgain);
  const actions = el('div', 'db-actions');
  actions.append(again, button('db-btn db-btn-soft', tr().home, onHome));
  card.append(sleepy, el('h2', '', tr().doneTitle), el('p', '', tr().doneText));
  if (newColor) card.append(el('p', 'db-new', `🎨 ${tr().newColor}`));
  card.append(actions);
  overlay.append(card);
  return { overlay, focus: () => again.focus({ preventScroll: true }) };
}
