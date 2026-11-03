import { el } from './dom';
import { tr } from '../i18n';

// Вкладки режимов в шапке: «Играть», «Запись», «Повтори».

export type ModeId = 'free' | 'record' | 'repeat';

const MODES: { id: ModeId; emoji: string }[] = [
  { id: 'free', emoji: '🎵' },
  { id: 'record', emoji: '🔴' },
  { id: 'repeat', emoji: '🎯' },
];

export class ModeTabs {
  readonly el: HTMLElement;
  private readonly buttons = new Map<ModeId, HTMLButtonElement>();

  constructor(onSelect: (mode: ModeId) => void) {
    const tabs = el('nav', { className: 'ao-modes', attrs: { 'aria-label': tr().mode } });
    for (const m of MODES) {
      const button = el(
        'button',
        { className: 'ao-mode', type: 'button', dataset: { mode: m.id }, attrs: { 'aria-pressed': 'false' } },
        el('span', { className: 'ao-mode-emoji', attrs: { 'aria-hidden': 'true' } }, m.emoji),
        el('span', { className: 'ao-mode-label' }, tr().modes[m.id]),
      );
      button.addEventListener('click', () => onSelect(m.id));
      this.buttons.set(m.id, button);
      tabs.append(button);
    }
    this.el = el('header', { className: 'ao-bar' }, tabs);
  }

  setActive(mode: ModeId) {
    for (const [id, button] of this.buttons) button.setAttribute('aria-pressed', String(id === mode));
  }
}
