import { pajamaOf, pajamaRound, type Shape } from '../game/logic';
import { tr } from '../i18n';
import { bearSvg } from '../ui/bear';
import { draggable, el } from '../ui/dom';
import { shapeSvg } from '../ui/props';
import { toysPhase } from './Toys';
import type { Scene, SceneCtx } from './types';

/** Пижама: на ней три места-силуэта, фигурки ставим по местам. Потом убираем игрушки (Toys). */
export function pajamaScene(ctx: SceneCtx): Scene {
  const t = tr();
  const { slots, tray } = pajamaRound(ctx.rng);
  const pajama = pajamaOf(ctx.nights);
  const offs: (() => void)[] = [];
  let placed = 0;
  let next: Scene | null = null;

  const room = el('div', 'sb-room sb-bedroom');
  const bear = el('div', 'sb-bear sb-bear-side', bearSvg({ id: 'pj' }));
  const shirt = el('div', `sb-shirt sb-shirt-${pajama}`);
  const tray$ = el('div', 'sb-tray');
  room.append(bear, shirt, tray$);
  ctx.stage.appendChild(room);

  const slotNodes = slots.map((shape) => {
    const slot = el('div', 'sb-slot', shapeSvg(shape, true));
    slot.dataset.shape = shape;
    shirt.appendChild(slot);
    return { node: slot, value: shape };
  });

  const finish = () => {
    ctx.progress.skill('shapes', true);
    bear.innerHTML = bearSvg({ id: 'pj', pajama });
    bear.classList.add('is-dressed');
    shirt.classList.add('is-gone');
    tray$.classList.add('is-gone');
    ctx.sound.correct();
    ctx.later(() => {
      offs.splice(0).forEach((off) => off());
      room.remove();
      next = toysPhase(ctx);
    }, 1800);
  };

  for (const shape of tray) {
    const item = el('button', 'sb-item sb-shape', shapeSvg(shape));
    item.type = 'button';
    item.setAttribute('aria-label', t.shapes[shape]);
    tray$.appendChild(item);
    offs.push(
      draggable<Shape>({
        item,
        targets: () => slotNodes.filter((s) => !s.node.classList.contains('is-filled')),
        onPick: () => (ctx.touched(), ctx.sound.unlock()),
        onDrop: (target) => {
          ctx.touched();
          if (target !== shape) {
            ctx.progress.skill('shapes', false);
            ctx.sound.soft();
            ctx.say(t.shapeNo);
            return false;
          }
          const slot = slotNodes.find((s) => s.value === shape)!.node;
          item.style.transform = '';
          slot.classList.add('is-filled');
          slot.replaceChildren(item);
          ctx.sound.pop(placed);
          ctx.say(t.shapeOk(t.shapes[shape]));
          placed += 1;
          if (placed === slots.length) finish();
          return true;
        },
      }),
    );
  }

  ctx.say(`${t.scenes.pajama} ${t.shapeAsk}`);
  ctx.setHintTarget(() => {
    const free = slotNodes.find((s) => !s.node.classList.contains('is-filled'));
    return [...tray$.children].find((n) => n.getAttribute('aria-label') === (free && t.shapes[free.value])) ?? null;
  });
  return {
    dispose: () => {
      offs.forEach((off) => off());
      next?.dispose();
    },
  };
}
