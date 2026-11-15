// Экраны вне писем: почта (выбор режима) и итог мешка.
import cover from '../../assets/cover.webp';
import { MODES, type Mode } from '../game/rounds';
import type { Save } from '../game/save';
import { tr } from '../i18n';
import { button, h } from '../ui/dom';

const ICONS: Record<Mode, string> = { wheel: '🎡', lighthouse: '🗼', riddle: '🧩' };

export function menuScreen(save: Save, name: string | null, onPick: (mode: Mode) => void, onExit: () => void) {
  const t = tr();
  const card = (mode: Mode) =>
    h('button', { type: 'button', class: `cp-mode cp-mode-${mode}`, onclick: () => onPick(mode) }, [
      h('span', { class: 'cp-mode-icon', 'aria-hidden': 'true' }, [ICONS[mode]]),
      h('span', { class: 'cp-mode-name' }, [t.modes[mode].name]),
      h('span', { class: 'cp-mode-about' }, [t.modes[mode].about]),
      h('span', { class: 'cp-mode-meta' }, [h('b', {}, [t.bag(save.bags[mode] + 1)]), h('span', {}, [t.best(save.best[mode])])]),
    ]);

  return h('div', { class: 'cp-screen cp-menu' }, [
    h('header', { class: 'cp-bar' }, [button('✕', onExit, 'cp-btn cp-icon', t.exit), h('h1', { class: 'cp-title' }, [t.title]), h('span', { class: 'cp-total' }, ['✉️ ', String(save.letters)])]),
    h('div', { class: 'cp-hero' }, [
      h('img', { src: cover, alt: '', class: 'cp-hero-img', draggable: 'false' }),
      h('div', { class: 'cp-hero-say' }, [h('span', { class: 'cp-bear', 'aria-hidden': 'true' }, ['🐻']), h('p', { class: 'cp-bubble' }, [t.intro(name)])]),
    ]),
    h('div', { class: 'cp-modes' }, MODES.map(card)),
  ]);
}

export function doneScreen(stars: number, mistakes: number, onAgain: () => void, onMenu: () => void) {
  const t = tr();
  const again = button(t.again, onAgain, 'cp-btn cp-primary');
  const el = h('div', { class: 'cp-screen cp-done' }, [
    h('div', { class: 'cp-done-card' }, [
      h('div', { class: 'cp-done-mail', 'aria-hidden': 'true' }, ['📮']),
      h('h2', {}, [t.doneTitle(stars)]),
      h('div', { class: 'cp-stars', 'aria-label': `${stars}/3` }, [1, 2, 3].map((n) => h('span', { class: n <= stars ? 'is-on' : '' }, ['⭐']))),
      h('p', {}, [t.doneText(mistakes)]),
      h('div', { class: 'cp-done-actions' }, [again, button(t.toMenu, onMenu, 'cp-btn cp-ghost')]),
    ]),
  ]);
  queueMicrotask(() => again.focus());
  return el;
}
