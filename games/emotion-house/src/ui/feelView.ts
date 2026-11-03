// «Как я себя чувствую»: ребёнок выбирает лицо, зверёк отвечает и, если нужно, дышит вместе с ним.
import { EMOTIONS, COLOR, FACE, type Emotion } from '../game/emotions';
import { tr } from '../i18n';
import { button, el } from './dom';
import { choiceCard } from './screens';

const NEEDS_BREATH: readonly Emotion[] = ['sad', 'anger', 'fear'];

export function feelScreen(onPick: (e: Emotion) => void, onBack: () => void) {
  const screen = el('section', 'eh-feel');
  const faces = el('div', 'eh-choices eh-choices-wide');
  for (const e of EMOTIONS) faces.append(choiceCard(FACE[e], tr().emotions[e], () => onPick(e), COLOR[e]));
  screen.append(button('eh-btn eh-btn-soft eh-btn-small', tr().back, onBack), el('h2', 'eh-question', tr().askFeel), faces);
  return screen;
}

/** Ответ на выбор; при грусти, злости и страхе — круг дыхания на три вдоха. */
export function feelAnswer(e: Emotion, onDone: () => void) {
  const card = el('div', 'eh-feel-answer');
  card.style.setProperty('--eh-room', COLOR[e]);
  card.append(el('div', 'eh-feel-face', FACE[e]), el('p', '', tr().sayFeel[e]));
  if (NEEDS_BREATH.includes(e)) {
    const circle = el('div', 'eh-breath');
    const label = el('span', '', tr().breatheIn);
    circle.append(label);
    circle.addEventListener('animationiteration', () => {
      label.textContent = label.textContent === tr().breatheIn ? tr().breatheOut : tr().breatheIn;
    });
    card.append(circle);
  }
  card.append(button('eh-btn eh-btn-play', tr().home, onDone));
  return card;
}
