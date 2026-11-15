// Экран начала (выбор уровня) и экран конца дня с наклейками.
import type { GameManifest } from '@ig/sdk';
import { LEVELS, type Level } from '../game/clock';
import { tr } from '../i18n';
import { bearSvg } from './bear';
import { button, el } from './dom';

/** Маленькие часики на кнопке уровня: какое время учим. */
const LEVEL_FACE = ['🕗', '🕣', '🕘', '🕥'];

export function startScreen(opts: { days: number; unlocked: Level; current: Level; onPlay: (level: Level) => void; onLocked: () => void }) {
  const t = tr();
  const screen = el('div', 'wc-screen wc-start');
  const days = el('div', 'wc-days', `☀️ ${opts.days}`);
  days.setAttribute('aria-label', String(opts.days));
  const bear = el('div', 'wc-bear wc-bear-start', bearSvg('happy'));
  const levels = el('div', 'wc-levels');
  for (const level of LEVELS) {
    const open = level <= opts.unlocked;
    const label = `${LEVEL_FACE[level]} ${t.levels[level]}`;
    const b = button(`wc-level${open ? '' : ' is-locked'}${level === opts.current ? ' is-current' : ''}`, open ? label : `🔒 ${t.levels[level]}`, t.levels[level], () =>
      open ? opts.onPlay(level) : opts.onLocked(),
    );
    levels.appendChild(b);
  }
  screen.append(days, bear, levels);
  return screen;
}

export function finaleScreen(opts: {
  days: number;
  stickers: string[];
  levelUp: boolean;
  manifest: GameManifest;
  onAgain: () => void;
  onExit: () => void;
}) {
  const t = tr();
  const screen = el('div', 'wc-screen wc-finale');
  const days = el('div', 'wc-days', `☀️ ${opts.days}`);
  const prizes = el('div', 'wc-prizes');
  for (const id of opts.stickers) {
    const def = opts.manifest.stickers?.find((s) => s.id === id);
    if (def) prizes.appendChild(el('span', 'wc-prize', def.emoji));
  }
  const text = el('p', 'wc-finale-text', opts.levelUp ? `${t.dayDone} ${t.levelUp}` : t.dayDone);
  const bear = el('div', 'wc-bear wc-bear-start', bearSvg('asleep'));
  const buttons = el('div', 'wc-buttons');
  buttons.append(button('wc-big-btn', '↻', t.again, opts.onAgain, true), button('wc-big-btn wc-soft-btn', '🏠', t.exit, opts.onExit, true));
  screen.append(days, prizes, text, bear, buttons);
  return screen;
}
