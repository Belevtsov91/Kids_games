// Письмо от маяка: буква за буквой маяк мигает код, ребёнок находит букву по книге кодов.
import type { Word } from '../packs';
import { codeOf, prettyCode } from '../game/morse';
import { letterOptions, lighthouseLevel } from '../game/rounds';
import { tr } from '../i18n';
import { button, h } from './dom';
import { createLighthouse } from './lighthouse';
import type { RoundContext, RoundView } from './round';

export function lighthouseRound(round: Word, ctx: RoundContext): RoundView {
  const t = tr().lighthouse;
  const table = ctx.pack.morse;
  const level = lighthouseLevel(ctx.tier);
  const letters = Array.from(round.word);
  let index = 0;

  const tower = createLighthouse(ctx.reduceMotion);
  const slots = letters.map(() => h('span', { class: 'cp-tile is-slot' }, ['?']));
  const signal = h('div', { class: 'cp-signal', 'aria-live': 'polite' });
  const counter = h('div', { class: 'cp-label' });
  const options = h('div', { class: 'cp-options' });
  const book = h('div', { class: 'cp-book' });

  const code = () => codeOf(letters[index], table) ?? '';

  const play = () => {
    signal.classList.add('is-waiting');
    tower.play(code(), (ms) => ctx.sound.beep(ms), () => signal.classList.remove('is-waiting'));
  };

  const bookEntry = (letter: string) =>
    h('div', { class: 'cp-book-row' }, [h('b', {}, [letter]), h('span', {}, [prettyCode(codeOf(letter, table) ?? '')])]);

  const showLetter = () => {
    slots.forEach((slot, i) => slot.classList.toggle('is-current', i === index));
    counter.textContent = t.letter(index + 1, letters.length);
    signal.textContent = prettyCode(code());
    const choices = letterOptions(letters[index], table, level.options, ctx.rng);
    options.replaceChildren(...choices.map((letter) => button(letter, () => pick(letter, buttonFor(letter)), 'cp-btn cp-letter')));
    const shown = level.fullBook ? Object.keys(table) : [...choices].sort((a, b) => a.localeCompare(b));
    book.replaceChildren(h('div', { class: 'cp-label' }, [t.book]), h('div', { class: level.fullBook ? 'cp-book-grid is-full' : 'cp-book-grid' }, shown.map(bookEntry)));
    play();
  };

  const buttonFor = (letter: string) => Array.from(options.children).find((b) => b.textContent === letter) as HTMLButtonElement | undefined;

  const pick = (letter: string, btn: HTMLButtonElement | undefined) => {
    if (index >= letters.length) return;
    if (letter !== letters[index]) {
      btn?.classList.add('is-wrong');
      if (btn) btn.disabled = true;
      ctx.sound.wrong();
      ctx.mistake();
      ctx.say(t.wrong, 'oops');
      return;
    }
    tower.stop();
    slots[index].textContent = letter;
    slots[index].classList.add('is-filled');
    ctx.sound.ok();
    index += 1;
    if (index < letters.length) showLetter();
    else {
      slots.forEach((slot) => slot.classList.remove('is-current'));
      options.replaceChildren();
      ctx.solved();
    }
  };

  const el = h('div', { class: 'cp-round cp-lh-round' }, [
    h('div', { class: 'cp-lh-scene' }, [tower.el, h('div', { class: 'cp-legend' }, [t.legend])]),
    h('div', { class: 'cp-side' }, [
      h('div', { class: 'cp-envelope' }, [
        h('div', { class: 'cp-tiles' }, slots),
        counter,
        signal,
        button(`💡 ${t.replay}`, play, 'cp-btn cp-ghost'),
      ]),
      options,
      book,
    ]),
  ]);

  ctx.say(t.prompt, 'hint');
  showLetter();
  return { el, dispose: () => tower.stop() };
}
