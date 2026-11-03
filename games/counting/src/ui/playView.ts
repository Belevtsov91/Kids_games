import type { Mode, Question } from '../game/logic';
import { ROUNDS, type Theme } from '../game/themes';
import type { Words } from '../i18n';
import { button, objects } from './html';
import { art } from './art';

// Экран задания: прогресс сессии, вопрос, сцена режима, варианты ответа и обратная связь.

/** Что нужно экрану: состояние сессии (см. Session), тема и текст отзыва. */
export interface PlayState {
  mode: Mode;
  question: Question;
  round: number;
  stars: number;
  solved: boolean;
  counted: ReadonlySet<number>;
  food: number;
  theme: Theme;
  feedback: string;
}

/** Сцена задания — своя для каждого режима. */
function scene(t: Words, s: PlayState) {
  const { question: q, theme } = s;
  const sign = q.subtract ? '−' : '+';
  switch (s.mode) {
    case 'count':
      return `${objects(q.a, theme.item, s.counted)}<p class="cg-help">${t.tap}</p>`;
    case 'digit':
      return `${objects(q.a, theme.item)}<p class="cg-help"></p>`;
    case 'feed':
      return [
        `<div class="cg-feeding"><span class="cg-friend" aria-hidden="true">${art(theme.pet)}</span><span class="cg-target">${q.answer}</span></div>`,
        `<p>${t.collected}: <b>${s.food}</b></p>${objects(s.food, theme.item)}`,
        `<div class="cg-feed-controls">${button('food', '−', -1)}${button('food', '+', 1)}</div>`,
        `<p class="cg-help">${t.enough}</p>${button('check', t.check, undefined, 'cg-primary')}`,
      ].join('');
    case 'sequence':
      return `<div class="cg-sequence">${q.sequence.map((n, i) => `<span class="${i === q.gap ? 'cg-gap' : ''}">${i === q.gap ? '?' : n}</span>`).join('')}</div>`;
    case 'compare':
      return `<div class="cg-compare"><div aria-label="${t.left}">${objects(q.a, theme.item)}</div><div aria-label="${t.right}">${objects(q.b, theme.item)}</div></div>`;
    case 'calculate':
      return [
        `<div class="cg-equation">${q.a} ${sign} ${q.b} = <span>?</span></div>`,
        `<div class="cg-compare"><div>${objects(q.a, theme.item)}</div><strong>${sign}</strong><div>${objects(q.b, theme.item)}</div></div>`,
      ].join('');
  }
}

/** Кнопки ответов. В «сравнении» это «поровну / слева / справа», в «кормлении» их нет. */
function answers(t: Words, s: PlayState) {
  if (s.mode === 'feed') return '';
  const values = s.mode === 'compare' ? [1, 0, 2] : s.question.options;
  const label = (n: number) => (s.mode === 'compare' ? [t.equal, t.left, t.right][n] : String(n));
  return `<div class="cg-answers">${values.map((n) => button('answer', label(n), n, 'cg-answer')).join('')}</div>`;
}

export function playView(t: Words, s: PlayState) {
  const progress = ((s.round - 1 + Number(s.solved)) / ROUNDS) * 100;
  const footer = s.solved
    ? button('next', `${t.next} →`, undefined, 'cg-primary')
    : s.mode === 'count'
      ? button('clear', t.clear, undefined, 'cg-text')
      : '';
  return [
    `<div class="cg-roundline"><span>${t.round} ${s.round} / ${ROUNDS}</span><span>${art('⭐')} ${s.stars}</span></div>`,
    `<div class="cg-progress"><i style="width:${progress}%"></i></div>`,
    `<section class="cg-board">`,
    `<div class="cg-prompt"><h2>${t[s.mode]} ${s.mode === 'feed' ? s.question.answer : ''}</h2>${button('repeat', `🔊 <span>${t.repeat}</span>`, undefined, 'cg-listen')}</div>`,
    scene(t, s),
    s.solved ? '' : answers(t, s),
    `<div class="cg-feedback" role="status" aria-live="polite">${s.feedback}</div>`,
    footer,
    `</section>`,
  ].join('');
}
