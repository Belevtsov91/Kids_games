// Экран выбора района: карточки по порядку, звёзды за лучшие решения, закрытые — с замком.
import { LEVELS } from '../game/levels';
import { isOpen, type Stars } from '../game/save';
import { tr } from '../i18n';
import { bearSvg, toolSvg } from './art';
import { button, el, esc } from './dom';

export function renderMenu(stars: Stars, onPick: (id: number) => void, onExit: () => void): HTMLElement {
  const t = tr();
  const root = el('div', 'eco-screen eco-menu');
  const head = el('header', 'eco-menu-head');
  head.append(el('h1', 'eco-title', esc(t.title)), button('eco-btn eco-btn-ghost', t.exit, onExit));
  root.appendChild(head);

  const intro = el('div', 'eco-menu-intro');
  intro.append(el('div', 'eco-bear', bearSvg()), el('p', 'eco-bubble', esc(`${t.bear.intro} ${t.pick}.`)));
  root.appendChild(intro);

  const grid = el('div', 'eco-levels');
  for (const level of LEVELS) {
    const open = isOpen(stars, level.id);
    const got = stars[level.id] ?? 0;
    const card = el('button', `eco-level${open ? '' : ' is-locked'}${got ? ' is-done' : ''}`);
    card.type = 'button';
    const name = t.levels[level.key]?.name ?? level.key;
    const icons = level.tools.map((tool) => `<span class="eco-level-tool">${toolSvg(tool)}</span>`).join('');
    card.innerHTML = `
      <span class="eco-level-num">${open ? level.id : '🔒'}</span>
      <span class="eco-level-name">${esc(name)}</span>
      <span class="eco-level-tools">${icons}</span>
      <span class="eco-level-stars" aria-label="${got}/3">${'★'.repeat(got)}<i>${'★'.repeat(3 - got)}</i></span>`;
    card.title = open ? t.levels[level.key]?.goal ?? '' : t.locked;
    card.disabled = !open;
    card.addEventListener('click', () => open && onPick(level.id));
    grid.appendChild(card);
  }
  root.appendChild(grid);
  return root;
}
