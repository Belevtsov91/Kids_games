// Сетка карточек выбора: эмодзи и подпись. Нажатие сразу передаёт выбор.
import { EMOJI } from '../game/story';
import { el } from './dom';

export const picker = (ids: readonly string[], nameOf: (id: string) => string, onPick: (id: string, card: HTMLElement) => void) => {
  const grid = el('div', 'st-grid');
  for (const id of ids) {
    const card = el('button', 'st-card');
    card.type = 'button';
    card.append(el('span', 'st-card-emoji', EMOJI[id as keyof typeof EMOJI] ?? '❔'), el('span', 'st-card-name', nameOf(id)));
    card.addEventListener('click', () => onPick(id, card));
    grid.append(card);
  }
  return grid;
};
