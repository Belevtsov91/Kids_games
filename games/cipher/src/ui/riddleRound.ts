// Письмо-загадка: вопрос и четыре ответа. Ошибочный ответ гаснет, верный открывает письмо.
import type { RiddleRound } from '../game/rounds';
import { tr } from '../i18n';
import { h } from './dom';
import type { RoundContext, RoundView } from './round';

export function riddleRound(round: RiddleRound, ctx: RoundContext): RoundView {
  const t = tr().riddle;
  let done = false;

  const choose = (i: number, btn: HTMLButtonElement) => {
    if (done || btn.disabled) return;
    if (i !== round.answer) {
      btn.disabled = true;
      btn.classList.add('is-wrong');
      ctx.sound.wrong();
      ctx.mistake();
      ctx.say(t.wrong, 'oops');
      return;
    }
    done = true;
    btn.classList.add('is-right');
    ctx.solved();
  };

  const choices = round.choices.map((choice, i) => {
    const btn = h('button', { type: 'button', class: 'cp-btn cp-choice' }, [h('span', { class: 'cp-choice-emoji' }, [choice.emoji]), h('span', {}, [choice.text])]);
    btn.addEventListener('click', () => choose(i, btn));
    return btn;
  });

  const el = h('div', { class: 'cp-round cp-riddle-round' }, [
    h('div', { class: 'cp-envelope cp-letter-paper' }, [h('div', { class: 'cp-seal' }, ['✉️']), h('p', { class: 'cp-question' }, [round.question])]),
    h('div', { class: 'cp-choices' }, choices),
  ]);

  ctx.say(t.prompt, 'hint');
  return { el, dispose: () => undefined };
}
