import type { Sfx } from '../audio/Sfx';
import type { Listeners } from '../ui/dom';

// Кнопки (атрибут data-act) и горячие клавиши: Z — убрать лиану, пробел — полить, R — заново.

export interface GameActions {
  openLevel(index: number): void;
  showLevels(): void;
  nextLevel(): void;
  undo(): void;
  showHint(): void;
  pour(): void;
  restart(): void;
  exit(): void;
  /** Открыт экран уровня (клавиши работают только там). */
  isPlaying(): boolean;
  /** Открыта карточка результата: пробел нажимает её кнопку, а не поливает. */
  isCardOpen(): boolean;
}

export function bindControls(root: HTMLElement, listeners: Listeners, sfx: Sfx, game: GameActions) {
  // Браузер разрешает звук только после касания.
  listeners.on(root, 'pointerdown', () => sfx.unlock(), true);

  listeners.on(root, 'click', (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    sfx.unlock();
    sfx.click();
    const byAct: Record<string, () => void> = {
      level: () => game.openLevel(Number(target.dataset.index)),
      levels: () => game.showLevels(),
      next: () => game.nextLevel(),
      undo: () => game.undo(),
      hint: () => game.showHint(),
      pour: () => game.pour(),
      restart: () => game.restart(),
      retry: () => game.restart(),
      exit: () => game.exit(),
    };
    byAct[target.dataset.act ?? '']?.();
  });

  listeners.on(window, 'keydown', (e: KeyboardEvent) => {
    if (!game.isPlaying() || e.repeat) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'KeyZ' && !e.altKey) {
      game.undo();
    } else if (e.code === 'Space' && !game.isCardOpen()) {
      e.preventDefault();
      sfx.unlock();
      game.pour();
    } else if (e.code === 'KeyR') {
      game.restart();
    }
  });
}
