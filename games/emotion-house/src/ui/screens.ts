// Стартовый экран с домиком: шесть окон-комнат, каждая зажигается, когда эмоцию узнали три раза.
import { EMOTIONS, COLOR, FACE } from '../game/emotions';
import { ROOM_FULL, litRooms, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { button, el } from './dom';

export function houseView(p: Progress) {
  const house = el('div', 'eh-house');
  house.append(el('div', 'eh-roof'));
  const rooms = el('div', 'eh-rooms');
  for (const e of EMOTIONS) {
    const level = p.rooms[e] ?? 0;
    const room = el('div', `eh-room${level >= ROOM_FULL ? ' is-lit' : ''}`);
    room.style.setProperty('--eh-room', COLOR[e]);
    room.style.setProperty('--eh-fill', String(level / ROOM_FULL));
    room.append(el('span', 'eh-room-face', FACE[e]), el('small', '', tr().emotions[e]));
    rooms.append(room);
  }
  house.append(rooms);
  return house;
}

export function startScreen(name: string | undefined, p: Progress, onPlay: () => void, onFeel: () => void) {
  const screen = el('section', 'eh-start');
  const actions = el('div', 'eh-actions');
  actions.append(button('eh-btn eh-btn-play', tr().play, onPlay), button('eh-btn eh-btn-soft', tr().feel, onFeel));
  screen.append(houseView(p), el('p', 'eh-rooms-count', tr().rooms(litRooms(p))), el('p', 'eh-lead', tr().lead(name)), actions);
  return screen;
}

/** Карточка-вариант: большая картинка и подпись. */
export function choiceCard(art: string, label: string, onPick: (card: HTMLButtonElement) => void, color?: string) {
  const card = button('eh-choice', '', () => onPick(card));
  card.append(el('span', 'eh-choice-art', art), el('span', 'eh-choice-label', label));
  card.setAttribute('aria-label', label);
  if (color) card.style.setProperty('--eh-choice', color);
  return card;
}
