import type { GameManifest } from '@ig/sdk';
import { pajamaOf, SCENES } from '../game/logic';
import { tr } from '../i18n';
import { bearSvg } from './bear';
import { el } from './dom';

// Экран начала и экран «спокойной ночи». Слов почти нет: большие значки и голос.

const MOONS = 7;

/** Сколько ночей уже было — луны сверху (7 лун = наклейка «Семь ночей»). */
function moons(nights: number) {
  const row = el('div', 'sb-moons');
  const filled = nights % MOONS === 0 && nights > 0 ? MOONS : nights % MOONS;
  for (let i = 0; i < MOONS; i++) row.appendChild(el('span', i < filled ? 'is-on' : '', '🌙'));
  row.setAttribute('aria-label', String(nights));
  return row;
}

export function startScreen(nights: number, onPlay: () => void) {
  const t = tr();
  const screen = el('div', 'sb-screen sb-start');
  const bear = el('div', 'sb-bear sb-bear-start', bearSvg({ id: 'start', mood: 'sleepy', pajama: nights ? pajamaOf(nights - 1) : null }));
  const play = el('button', 'sb-big-btn sb-play', '▶');
  play.type = 'button';
  play.setAttribute('aria-label', t.play);
  play.addEventListener('click', onPlay, { once: true });
  screen.append(moons(nights), bear, play);
  return screen;
}

/** Точки сцен сверху: сколько вечерних дел уже сделано. */
export function sceneDots() {
  const row = el('div', 'sb-dots');
  for (let i = 0; i < SCENES.length; i++) row.appendChild(el('span'));
  return {
    node: row,
    set(done: number) {
      [...row.children].forEach((dot, i) => dot.classList.toggle('is-on', i < done));
    },
  };
}

export function finaleScreen(opts: {
  nights: number;
  stickers: string[];
  manifest: GameManifest;
  onAgain: () => void;
  onExit: () => void;
}) {
  const t = tr();
  const screen = el('div', 'sb-screen sb-finale');
  const bear = el('div', 'sb-bear sb-bear-start', bearSvg({ id: 'fin', mood: 'asleep', pajama: pajamaOf(opts.nights - 1) }));
  const prizes = el('div', 'sb-prizes');
  for (const id of opts.stickers) {
    const def = opts.manifest.stickers?.find((s) => s.id === id);
    if (def) prizes.appendChild(el('span', 'sb-prize', def.emoji));
  }
  const buttons = el('div', 'sb-buttons');
  const again = el('button', 'sb-big-btn', '↻');
  again.type = 'button';
  again.setAttribute('aria-label', t.again);
  again.addEventListener('click', opts.onAgain, { once: true });
  const exit = el('button', 'sb-big-btn sb-soft-btn', '🏠');
  exit.type = 'button';
  exit.setAttribute('aria-label', t.exit);
  exit.addEventListener('click', opts.onExit, { once: true });
  buttons.append(again, exit);
  screen.append(moons(opts.nights), prizes, bear, buttons);
  return screen;
}
