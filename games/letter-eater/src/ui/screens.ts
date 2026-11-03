import { isUnlocked } from '../game/logic';
import { LEVELS, type Level } from '../game/words';
import { h, starRow } from './dom';
import { tr } from '../i18n';

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
        'aria-label': tr().level(level.id, level.title, unlocked),
        click: () => onPick(i),
      },
      h('span', { class: 'le-level-num' }, String(level.id)),
      h('span', { class: 'le-level-emoji' }, unlocked ? level.emoji : '🔒'),
      h('span', { class: 'le-level-title' }, level.title),
      h('span', { class: 'le-level-sample' }, level.words.slice(0, 3).map((w) => w.emoji).join(' ')),
      h('span', { class: 'le-level-stars', 'aria-label': tr().starsOf(got) }, ...starRow(got)),
    );
  });

  const hero = h(
    'div',
    { class: 'le-hero' },
    h('div', { class: 'le-speech' }, tr().feedMe(childName)),
    monster,
  );

  return h(
    'div',
    { class: 'le-levels' },
    h(
      'header',
      { class: 'le-top' },
      button('✕', onExit, 'le-btn--round', tr().exit),
      h('h1', { class: 'le-title' }, tr().title),
      h('div', { class: 'le-total', 'aria-label': tr().totalStars(total) }, `★ ${total}`),
    ),
    h('div', { class: 'le-levels-body' }, hero, h('div', { class: 'le-level-grid' }, ...cards)),
    loginNote ? h('p', { class: 'le-note' }, tr().loginNote) : null,
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
    { class: 'le-overlay', role: 'dialog', 'aria-label': tr().levelDone },
    h(
      'div',
      { class: 'le-win' },
      h('div', { class: 'le-win-emoji' }, level.emoji),
      h('h2', {}, title),
      h('p', {}, tr().ate(wordCount)),
      h('div', { class: 'le-win-stars' }, ...starRow(stars, true)),
      unlocked ? h('p', { class: 'le-unlock' }, tr().unlocked(unlocked.title)) : null,
      h(
        'div',
        { class: 'le-win-actions' },
        button(tr().retry, onRetry, 'le-btn--soft'),
        hasNext ? button(tr().next, onNext, 'le-btn--main') : button(tr().toLevels, onLevels, 'le-btn--main'),
      ),
      hasNext ? button(tr().allLevels, onLevels, 'le-btn--link') : null,
    ),
  );
}
