import { ANIMALS, type Animal } from '../game/animals';
import type { SoundMode } from '../game/song';
import { el, replayClass } from './dom';
import { animalArt } from './art';
import drum from '../../assets/icons/drum.svg';

// Сцена: занавес, огни, зверята полукругом и пузырь-подсказка над ними.

export class Stage {
  readonly el = el('main', { className: 'ao-stage' });
  private readonly bubble = el('div', { className: 'ao-bubble', attrs: { 'aria-live': 'polite' } });
  private readonly buttons = new Map<string, HTMLButtonElement>();

  /** `onAnimal` — нажали на зверя (пальцем, мышью или с клавиатуры). */
  constructor(onAnimal: (animal: Animal) => void, unlockAudio: () => void) {
    const animals = el('div', { className: 'ao-animals' });
    const center = (ANIMALS.length - 1) / 2;
    ANIMALS.forEach((animal, i) => {
      const button = el(
        'button',
        {
          className: 'ao-animal',
          type: 'button',
          dataset: { animal: animal.id },
          attrs: { 'aria-label': animal.name, style: `--c:${animal.color};--lift:${Math.abs(i - center) ** 1.6};--i:${i}` },
        },
        el(
          'span',
          { className: 'ao-body', attrs: { 'aria-hidden': 'true' } },
          el('span', { className: 'ao-spot' }),
          el('img', { className: 'ao-emoji', src: animalArt[animal.id], alt: '', draggable: false }),
          el('span', { className: 'ao-badge' }, animal.id === 'bear' ? el('img', { src: drum, alt: '', draggable: false }) : animal.instrumentEmoji),
        ),
      );
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        unlockAudio();
        onAnimal(animal);
      });
      // Клавиатура и экранные читалки: Enter/Space дают click без pointerdown.
      button.addEventListener('click', (e) => {
        if (e.detail === 0) onAnimal(animal);
      });
      this.buttons.set(animal.id, button);
      animals.append(button);
    });

    this.el.append(
      el('div', { className: 'ao-curtain ao-curtain-left', attrs: { 'aria-hidden': 'true' } }),
      el('div', { className: 'ao-curtain ao-curtain-right', attrs: { 'aria-hidden': 'true' } }),
      el('div', { className: 'ao-lights', attrs: { 'aria-hidden': 'true' } }),
      this.bubble,
      animals,
      el('div', { className: 'ao-floor', attrs: { 'aria-hidden': 'true' } }),
    );
  }

  /** Зверь подпрыгивает и подсвечивается. Возвращает его экранный прямоугольник (для летящих нот). */
  bounce(animalId: string): DOMRect | null {
    const button = this.buttons.get(animalId);
    if (!button) return null;
    button.querySelector('.ao-body')?.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(4%) scale(1.18, 0.86)', offset: 0.18 },
        { transform: 'translateY(-14%) scale(0.94, 1.1)', offset: 0.5 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
    replayClass(button, 'is-lit');
    return button.getBoundingClientRect();
  }

  /** Зверь мотает головой: «не тот». */
  shake(animalId: string) {
    this.buttons.get(animalId)?.querySelector('.ao-body')?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8%)' }, { transform: 'translateX(8%)' }, { transform: 'translateX(0)' }],
      { duration: 300 },
    );
  }

  /** Значок у зверя: его инструмент или 💬 для голосов. */
  setBadges(mode: SoundMode) {
    for (const animal of ANIMALS) {
      const badge = this.buttons.get(animal.id)?.querySelector('.ao-badge');
      if (badge) badge.replaceChildren(mode === 'voice' ? '💬' : animal.id === 'bear' ? el('img', { src: drum, alt: '', draggable: false }) : animal.instrumentEmoji);
    }
  }

  /** Играют только первые `pool` зверей, остальные притушены. */
  setResting(pool: number) {
    ANIMALS.forEach((a, i) => this.buttons.get(a.id)?.toggleAttribute('data-resting', i >= pool));
  }

  setBubble(icon: string | null, text = '') {
    if (!icon) {
      this.bubble.hidden = true;
      return;
    }
    this.bubble.hidden = false;
    this.bubble.replaceChildren(
      el('span', { className: 'ao-bubble-icon', attrs: { 'aria-hidden': 'true' } }, icon),
      el('span', { className: 'ao-bubble-text' }, text),
      el('span', { className: 'ao-dots', attrs: { 'aria-hidden': 'true' } }),
    );
    this.bubble.animate([{ transform: 'translateX(-50%) scale(0.85)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 220, easing: 'ease-out' });
  }

  /** Точки прогресса фразы в пузыре: `done` из `total` уже отмечены. */
  setDots(total: number, done: number) {
    const dots = this.bubble.querySelector('.ao-dots');
    if (!dots) return;
    dots.replaceChildren(...Array.from({ length: total }, (_, i) => el('span', { className: `ao-dot${i < done ? ' is-done' : ''}` })));
  }
}
