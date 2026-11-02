import { isUnlocked } from '../game/logic';
import { LEVELS, type Level } from '../game/words';
import { h, starRow } from './dom';

// Экран выбора уровня и окно «Уровень пройден».

/** Кнопка интерфейса (со щелчком): подпись, действие, доп. класс, подпись для читалок. */
export type ButtonFactory = (label: string, onClick: () => void, cls?: string, ariaLabel?: string) => HTMLButtonElement;

interface LevelsOptions {
  stars: readonly number[];
  childName: string | undefined;
  /** Показать «Войдите в профиль…»: звёзды сейчас не сохраняются. */
  loginNote: boolean;
  monster: HTMLElement;
  button: ButtonFactory;
  onPick(levelIndex: number): void;
  onExit(): void;
}

export function levelsScreen({ stars, childName, loginNote, monster, button, onPick, onExit }: LevelsOptions) {
  const total = stars.reduce((a, b) => a + b, 0);
  const cards = LEVELS.map((level, i) => {
    const unlocked = isUnlocked(i, stars);
    const got = stars[i] ?? 0;
    return h(
      'button',
      {
        type: 'button',
        class: `le-level ${unlocked ? '' : 'is-locked'}`,
        '--i': i,
        disabled: !unlocked,
        'aria-label': `Уровень ${level.id}: ${level.title}${unlocked ? '' : ', закрыт'}`,
        click: () => onPick(i),
      },
      h('span', { class: 'le-level-num' }, String(level.id)),
      h('span', { class: 'le-level-emoji' }, unlocked ? level.emoji : '🔒'),
      h('span', { class: 'le-level-title' }, level.title),
      h('span', { class: 'le-level-sample' }, level.words.slice(0, 3).map((w) => w.emoji).join(' ')),
      h('span', { class: 'le-level-stars', 'aria-label': `${got} из 3 звёзд` }, ...starRow(got)),
    );
  });

  const hero = h(
    'div',
    { class: 'le-hero' },
    h('div', { class: 'le-speech' }, childName ? `${childName}, покорми меня буквами!` : 'Покорми меня буквами!'),
    monster,
  );

  return h(
    'div',
    { class: 'le-levels' },
    h(
      'header',
      { class: 'le-top' },
      button('✕', onExit, 'le-btn--round', 'Выйти из игры'),
      h('h1', { class: 'le-title' }, 'Буквоед'),
      h('div', { class: 'le-total', 'aria-label': `Всего звёзд: ${total}` }, `★ ${total}`),
    ),
    h('div', { class: 'le-levels-body' }, hero, h('div', { class: 'le-level-grid' }, ...cards)),
    loginNote ? h('p', { class: 'le-note' }, 'Войдите в профиль, чтобы звёзды сохранялись') : null,
  );
}

interface WinOptions {
  level: Level;
  title: string;
  wordCount: number;
  stars: number;
  /** Уровень, который только что открылся (если пройден впервые). */
  unlocked: Level | null;
  hasNext: boolean;
  button: ButtonFactory;
  onRetry(): void;
  onNext(): void;
  onLevels(): void;
}

export function winOverlay({ level, title, wordCount, stars, unlocked, hasNext, button, onRetry, onNext, onLevels }: WinOptions) {
  return h(
    'div',
    { class: 'le-overlay', role: 'dialog', 'aria-label': 'Уровень пройден' },
    h(
      'div',
      { class: 'le-win' },
      h('div', { class: 'le-win-emoji' }, level.emoji),
      h('h2', {}, title),
      h('p', {}, `Монстрик съел ${wordCount} слов!`),
      h('div', { class: 'le-win-stars' }, ...starRow(stars, true)),
      unlocked ? h('p', { class: 'le-unlock' }, `Открыт уровень «${unlocked.title}»`) : null,
      h(
        'div',
        { class: 'le-win-actions' },
        button('↻ Ещё раз', onRetry, 'le-btn--soft'),
        hasNext ? button('Дальше →', onNext, 'le-btn--main') : button('К уровням', onLevels, 'le-btn--main'),
      ),
      hasNext ? button('Все уровни', onLevels, 'le-btn--link') : null,
    ),
  );
}
