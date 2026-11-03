import type { SoundMode } from '../game/song';
import { el } from './dom';
import { tr } from '../i18n';

// Общие кнопки панели: переключатель «Музыка / Голоса» и «Ритм».

const SOUND_OPTIONS = (): { id: SoundMode; emoji: string; label: string }[] => [
  { id: 'instrument', emoji: '🎺', label: tr().music },
  { id: 'voice', emoji: '🐾', label: tr().voices },
];

export function soundToggle(current: SoundMode, onPick: (mode: SoundMode) => void) {
  const group = el('div', { className: 'ao-segment', attrs: { role: 'group', 'aria-label': tr().sound } });
  for (const o of SOUND_OPTIONS()) {
    const b = el(
      'button',
      { className: 'ao-chip', type: 'button', dataset: { sound: o.id }, attrs: { 'aria-pressed': String(current === o.id), 'aria-label': o.label } },
      el('span', { attrs: { 'aria-hidden': 'true' } }, o.emoji),
      el('span', { className: 'ao-chip-label' }, o.label),
    );
    b.addEventListener('click', () => onPick(o.id));
    group.append(b);
  }
  return group;
}

/** Подсвечивает выбранный звук на уже построенной панели. */
export function markSound(panel: HTMLElement, mode: SoundMode) {
  for (const b of panel.querySelectorAll<HTMLButtonElement>('[data-sound]')) b.setAttribute('aria-pressed', String(b.dataset.sound === mode));
}

export function beatButton(beating: boolean, onToggle: () => void) {
  const b = el(
    'button',
    { className: 'ao-chip ao-beat', type: 'button', attrs: { 'aria-pressed': String(beating), 'aria-label': tr().beat } },
    el('span', { attrs: { 'aria-hidden': 'true' } }, '🥁'),
    el('span', { className: 'ao-chip-label' }, tr().beat),
  );
  b.addEventListener('click', onToggle);
  return b;
}

/** Кнопка ритма показывает, играет ли он сейчас; без ритма сцена не пульсирует. */
export function syncBeat(panel: HTMLElement, root: HTMLElement, beating: boolean) {
  panel.querySelector('.ao-beat')?.setAttribute('aria-pressed', String(beating));
  if (!beating) delete root.dataset.beat;
}
