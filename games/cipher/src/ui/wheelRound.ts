// Письмо, зашифрованное Цезарем: крутим колесо, пока шифровка не прочитается.
import { decode, normalizeKey } from '../game/caesar';
import type { WheelRound } from '../game/rounds';
import { tr } from '../i18n';
import { button, h, tiles } from './dom';
import type { RoundContext, RoundView } from './round';
import { createWheel } from './wheel';

export function wheelRound(round: WheelRound, ctx: RoundContext): RoundView {
  const t = tr().wheel;
  const { alphabet } = ctx.pack;
  let shift = 0;
  let done = false;

  const wheel = createWheel(alphabet, t.hint);
  wheel.mark(round.cipher);
  const shiftLabel = h('span', { class: 'cp-shift', 'aria-live': 'polite' });
  const plain = h('div', { class: 'cp-plain' });
  const envelope = h('div', { class: 'cp-envelope' }, [
    h('div', { class: 'cp-label' }, [t.cipher]),
    tiles(round.cipher, 'cp-tile is-cipher'),
    round.keyKnown ? h('div', { class: 'cp-key' }, ['🔑 ', String(round.key)]) : h('div', { class: 'cp-key is-lost' }, ['🔑 ?']),
    h('div', { class: 'cp-label' }, [t.plain]),
    plain,
  ]);

  const render = () => {
    wheel.turn(shift);
    shiftLabel.textContent = t.shift(normalizeKey(shift, alphabet));
    plain.replaceChildren(tiles(decode(round.cipher, shift, alphabet), 'cp-tile is-plain'));
  };

  const turn = (delta: number) => {
    if (done) return;
    shift += delta;
    ctx.sound.click();
    render();
  };

  const check = () => {
    if (done) return;
    if (decode(round.cipher, shift, alphabet) === round.word) {
      done = true;
      el.classList.add('is-solved');
      ctx.solved();
      return;
    }
    ctx.mistake();
    ctx.say(round.keyKnown ? t.wrongKnown(round.key) : t.wrongUnknown, 'oops');
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') turn(-1);
    else if (e.key === 'ArrowRight') turn(1);
    else if (e.key === 'Enter') check();
    else return;
    e.preventDefault();
  };

  const el = h('div', { class: 'cp-round cp-wheel-round' }, [
    h('div', { class: 'cp-wheel-box' }, [
      wheel.el,
      h('div', { class: 'cp-wheel-controls' }, [
        button('⟲', () => turn(-1), 'cp-btn cp-round-btn', t.left),
        shiftLabel,
        button('⟳', () => turn(1), 'cp-btn cp-round-btn', t.right),
      ]),
    ]),
    h('div', { class: 'cp-side' }, [envelope, button(t.check, check, 'cp-btn cp-primary')]),
  ]);

  window.addEventListener('keydown', onKey);
  ctx.say(round.keyKnown ? t.known(round.key) : t.unknown, 'hint');
  render();

  return { el, dispose: () => window.removeEventListener('keydown', onKey) };
}
