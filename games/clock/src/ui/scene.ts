// Остров с башней: небо меняется с утра до ночи, Тёпа рядом с облачком-подсказкой.
import type { DayPart, EventId } from '../game/day';
import { bearSvg, type BearMood } from './bear';
import { el } from './dom';
import { createTower, type Tower } from './tower';

/** Значок дела в облачке: понятно и тем, кто ещё плохо читает. */
export const EVENT_ICON: Record<EventId, string> = {
  wake: '⏰', breakfast: '🥣', garden: '🌻', walk: '🌳', lunch: '🍲',
  nap: '😴', play: '⚽', dinner: '🍝', bath: '🛁', sleep: '🌙',
};

export interface Scene {
  node: HTMLElement;
  tower: Tower;
  /** Нижняя полоса: варианты ответа или кнопка «Проверить». */
  answers: HTMLElement;
  bear(mood: BearMood): void;
  bubble(icon: string, text: string): void;
  part(part: DayPart): void;
  progress(done: number, total: number): void;
}

export function createScene(minuteLabels: boolean, repeat: HTMLElement): Scene {
  const node = el('div', 'wc-scene wc-morning');
  const sky = el('div', 'wc-sky', '<span class="wc-sun"></span><span class="wc-moon"></span><span class="wc-cloud"></span><span class="wc-cloud wc-cloud-2"></span>');
  const island = el('div', 'wc-island');
  const tower = createTower(minuteLabels);
  const side = el('div', 'wc-side');
  const bubble = el('div', 'wc-bubble');
  const bearBox = el('div', 'wc-bear', bearSvg());
  side.append(bubble, bearBox);
  const dots = el('div', 'wc-dots');
  const answers = el('div', 'wc-answers');
  const top = el('div', 'wc-top');
  top.append(dots, repeat);
  node.append(sky, island, tower.node, side, top, answers);
  return {
    node,
    tower,
    answers,
    bear: (mood) => void (bearBox.innerHTML = bearSvg(mood)),
    bubble(icon, text) {
      bubble.replaceChildren(el('span', 'wc-bubble-icon', icon), el('span', 'wc-bubble-text', text));
      bubble.classList.remove('is-pop');
      void bubble.offsetWidth;
      bubble.classList.add('is-pop');
    },
    part(part) {
      node.classList.remove('wc-morning', 'wc-day', 'wc-evening', 'wc-night');
      node.classList.add(`wc-${part}`);
    },
    progress(done, total) {
      dots.replaceChildren(...Array.from({ length: total }, (_, i) => el('span', i < done ? 'is-on' : '', i < done ? '☀️' : '')));
    },
  };
}
