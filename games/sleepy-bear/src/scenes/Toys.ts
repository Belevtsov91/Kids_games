import { toysRound } from '../game/logic';
import { tr } from '../i18n';
import { draggable, el } from '../ui/dom';
import { boxSvg, toySvg } from '../ui/props';
import type { Scene, SceneCtx } from './types';

/** Игрушки перед сном: по одной, большая — в большую коробку, маленькая — в маленькую. */
export function toysPhase(ctx: SceneCtx): Scene {
  const t = tr();
  const toys = toysRound(ctx.rng);
  let index = 0;
  let off: (() => void) | null = null;

  const room = el('div', 'sb-room sb-bedroom sb-toys');
  const bigBox = el('div', 'sb-box is-big', boxSvg());
  const smallBox = el('div', 'sb-box is-small', boxSvg());
  const spot = el('div', 'sb-toy-spot');
  room.append(spot, bigBox, smallBox);
  ctx.stage.appendChild(room);

  const show = () => {
    off?.();
    const { toy, big } = toys[index];
    const item = el('button', `sb-item sb-toy ${big ? 'is-big' : 'is-small'}`, toySvg(toy));
    item.type = 'button';
    item.setAttribute('aria-label', toy);
    spot.replaceChildren(item);
    ctx.say(`${index === 0 ? `${t.scenes.toys} ` : ''}${t.sizeAsk(big)}`);
    off = draggable<boolean>({
      item,
      targets: () => [
        { node: bigBox, value: true },
        { node: smallBox, value: false },
      ],
      onPick: () => (ctx.touched(), ctx.sound.unlock()),
      onDrop: (intoBig) => {
        ctx.touched();
        if (intoBig !== big) {
          ctx.progress.skill('sizes', false);
          ctx.sound.soft();
          ctx.say(t.sizeNo);
          return false;
        }
        ctx.progress.skill('sizes', true);
        const box = big ? bigBox : smallBox;
        item.style.transform = '';
        item.classList.add('is-in');
        box.appendChild(item);
        ctx.sound.pop(index);
        ctx.say(t.sizeOk(big));
        index += 1;
        ctx.later(() => {
          item.remove();
          if (index < toys.length) show();
          else {
            ctx.progress.skill('routine', true);
            ctx.done();
          }
        }, 1300);
        return true;
      },
    });
    ctx.setHintTarget(() => item);
  };

  show();
  return { dispose: () => off?.() };
}
