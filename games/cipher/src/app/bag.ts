// Мешок почты: пять писем одного режима подряд. Считает ошибки и показывает разгаданное письмо.
import type { Sound } from '../audio/Sound';
import { BAG_SIZE, makeLighthouseRounds, makeRiddleRounds, makeWheelRounds, type Mode, type Rng } from '../game/rounds';
import { tr } from '../i18n';
import type { Pack } from '../packs';
import { button, h } from '../ui/dom';
import { lighthouseRound } from '../ui/lighthouseRound';
import { riddleRound } from '../ui/riddleRound';
import type { RoundContext, RoundView } from '../ui/round';
import { wheelRound } from '../ui/wheelRound';

export interface BagOptions {
  mode: Mode;
  tier: number;
  pack: Pack;
  sound: Sound;
  rng: Rng;
  reduceMotion: boolean;
  onLetter(): void;
  onFinish(mistakes: number, letters: number): void;
  onExit(): void;
}

interface Letter {
  start(ctx: RoundContext): RoundView;
  answer: { text: string; emoji: string };
}

function lettersFor({ mode, pack, tier, rng }: BagOptions): Letter[] {
  if (mode === 'wheel') return makeWheelRounds(pack, tier, rng).map((r) => ({ start: (ctx) => wheelRound(r, ctx), answer: { text: r.word, emoji: r.emoji } }));
  if (mode === 'lighthouse') return makeLighthouseRounds(pack, tier, rng).map((r) => ({ start: (ctx) => lighthouseRound(r, ctx), answer: { text: r.word, emoji: r.emoji } }));
  return makeRiddleRounds(pack, rng).map((r) => ({ start: (ctx) => riddleRound(r, ctx), answer: r.choices[r.answer] }));
}

export function createBag(opts: BagOptions) {
  const t = tr();
  const letters = lettersFor(opts);
  let index = 0;
  let mistakes = 0;
  let view: RoundView | null = null;
  let disposed = false;

  const bubble = h('div', { class: 'cp-bubble', 'aria-live': 'polite' });
  const dots = h('div', { class: 'cp-dots' }, letters.map(() => h('span')));
  const counter = h('div', { class: 'cp-counter' });
  const stage = h('div', { class: 'cp-stage' });

  const say = (text: string, mood: 'hint' | 'oops' | 'yay' = 'hint') => {
    bubble.textContent = text;
    bubble.dataset.mood = mood;
  };

  const reveal = () => {
    const { text, emoji } = letters[index].answer;
    const praise = t.praise[Math.floor(opts.rng() * t.praise.length)];
    const next = button(t.next, advance, 'cp-btn cp-primary');
    stage.appendChild(
      h('div', { class: 'cp-reveal', role: 'dialog', 'aria-label': t.solved }, [
        h('div', { class: 'cp-reveal-card' }, [h('div', { class: 'cp-reveal-emoji' }, [emoji]), h('div', { class: 'cp-reveal-word' }, [text]), h('p', {}, [praise]), next]),
      ]),
    );
    next.focus();
  };

  const show = () => {
    view?.dispose();
    counter.textContent = t.letterOf(index + 1, letters.length);
    Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('is-done', i < index));
    const ctx: RoundContext = {
      pack: opts.pack,
      sound: opts.sound,
      rng: opts.rng,
      tier: opts.tier,
      reduceMotion: opts.reduceMotion,
      say,
      mistake: () => (mistakes += 1),
      solved: () => {
        if (disposed) return;
        opts.sound.ok();
        opts.onLetter();
        say(t.solved, 'yay');
        reveal();
      },
    };
    view = letters[index].start(ctx);
    stage.replaceChildren(view.el);
  };

  function advance() {
    index += 1;
    if (index < letters.length) show();
    else opts.onFinish(mistakes, BAG_SIZE);
  }

  const el = h('div', { class: 'cp-screen cp-bag' }, [
    h('header', { class: 'cp-bar' }, [
      button('←', opts.onExit, 'cp-btn cp-icon', t.toMenu),
      h('div', { class: 'cp-bar-title' }, [t.modes[opts.mode].name, ' · ', t.bag(opts.tier + 1)]),
      h('div', { class: 'cp-progress' }, [counter, dots]),
    ]),
    h('div', { class: 'cp-teller' }, [h('div', { class: 'cp-bear', 'aria-label': t.bear }, ['🐻']), bubble]),
    stage,
  ]);

  show();
  return {
    el,
    dispose() {
      disposed = true;
      view?.dispose();
    },
  };
}
