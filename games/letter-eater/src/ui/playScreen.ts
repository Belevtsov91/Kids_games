import { layoutBubbles, type Bubble } from '../game/logic';
import type { Word } from '../game/words';
import { h } from './dom';
import { wordArt } from './art';
import type { ButtonFactory } from './screens';
import { tr } from '../i18n';

// Экран слова: картинка, клеточки под буквы, поле с пузырями-буквами и монстрик.

interface PlayOptions {
  word: Word;
  /** Номер слова в уровне и сколько их всего. */
  index: number;
  total: number;
  /** Показывать бледные буквы-подсказки в клеточках. */
  ghostLetters: boolean;
  monster: HTMLElement;
  button: ButtonFactory;
  onBack(): void;
  onSay(): void;
  onHint(): void;
}

export function playScreen({ word, index, total, ghostLetters, monster, button, onBack, onSay, onHint }: PlayOptions) {
  const slots = [...word.word].map((letter, i) =>
    h('span', { class: 'le-slot', '--i': i }, h('span', { class: 'le-slot-ghost' }, ghostLetters ? letter : '')),
  );
  const dots = Array.from({ length: total }, (_, i) => h('i', { class: i < index ? 'done' : i === index ? 'now' : '' }));
  const field = h('div', { class: 'le-field', role: 'group', 'aria-label': tr().letters });
  const card = h(
    'div',
    { class: 'le-card' },
    h('button', { type: 'button', class: 'le-picture', 'aria-label': tr().listen, click: onSay }, wordArt[word.art ?? word.word] ? h('img', { src: wordArt[word.art ?? word.word], alt: '', draggable: 'false' }) : word.emoji),
    h('div', { class: 'le-slots', '--n': word.word.length }, ...slots),
  );
  const el = h(
    'div',
    { class: 'le-play' },
    h(
      'header',
      { class: 'le-top' },
      button('←', onBack, 'le-btn--round', tr().toLevels),
      h('div', { class: 'le-dots', 'aria-label': tr().progress(index + 1, total) }, ...dots),
      h('div', { class: 'le-tools' }, button('🔊', onSay, 'le-btn--round', tr().listen), button('💡', onHint, 'le-btn--round', tr().hint)),
    ),
    card,
    field,
    h('div', { class: 'le-stage' }, monster),
  );
  return { el, slots, field };
}

const HUES = [8, 32, 50, 140, 175, 200, 265, 300, 330];

/** Раскладывает пузыри-буквы по полю. Поле уже должно быть на странице: нужен его размер. */
export function placeBubbles(field: HTMLElement, bubbles: Bubble[], onTap: (bubble: Bubble, el: HTMLButtonElement) => void) {
  const rect = field.getBoundingClientRect();
  const aspect = rect.width && rect.height ? rect.width / rect.height : 1.4;
  const spots = layoutBubbles(bubbles.length, aspect);
  const els = new Map<number, HTMLButtonElement>();
  bubbles.forEach((bubble, i) => {
    const el: HTMLButtonElement = h(
      'button',
      {
        type: 'button',
        class: 'le-bubble',
        'aria-label': tr().letter(bubble.letter),
        '--x': spots[i].x.toFixed(3),
        '--y': spots[i].y.toFixed(3),
        '--hue': HUES[(bubble.letter.charCodeAt(0) + i) % HUES.length],
        '--delay': `${(i * 0.06).toFixed(2)}s`,
        '--drift': `${(3 + (i % 4) * 0.7).toFixed(1)}s`,
        pointerdown: (e: Event) => {
          e.preventDefault();
          onTap(bubble, el);
        },
      },
      h('span', { class: 'le-bubble-in' }, bubble.letter),
    );
    // Клавиатура и экранные читалки: Enter/пробел тоже «касание».
    el.addEventListener('click', (e) => {
      if (e.detail === 0) onTap(bubble, el);
    });
    els.set(bubble.id, el);
    field.append(el);
  });
  return els;
}
