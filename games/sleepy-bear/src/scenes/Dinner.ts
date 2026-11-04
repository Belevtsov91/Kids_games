import { dinnerRounds, type Color } from '../game/logic';
import { tr } from '../i18n';
import { bearSvg } from '../ui/bear';
import { draggable, el } from '../ui/dom';
import { foodSvg, plateSvg } from '../ui/props';
import type { Scene, SceneCtx } from './types';

/** Ужин: тарелка светится цветом, ребёнок кормит Тёпу едой этого цвета. Три раунда. */
export function dinnerScene(ctx: SceneCtx): Scene {
  const t = tr();
  const rounds = dinnerRounds(ctx.rng);
  const offs: (() => void)[] = [];
  let index = 0;

  const room = el('div', 'sb-room sb-kitchen');
  const bear = el('div', 'sb-bear sb-bear-table', bearSvg({ id: 'dinner' }));
  const plate = el('div', 'sb-plate');
  const tray = el('div', 'sb-tray');
  room.append(bear, plate, tray);
  ctx.stage.appendChild(room);

  const setMood = (mood: 'happy' | 'munch') => (bear.innerHTML = bearSvg({ id: 'dinner', mood }));

  const round = () => {
    offs.splice(0).forEach((off) => off());
    const { target, options } = rounds[index];
    plate.innerHTML = plateSvg(target);
    plate.dataset.color = target;
    tray.replaceChildren();
    ctx.say(`${index === 0 ? `${t.scenes.dinner} ` : ''}${t.colorAsk(t.colors[target])}`);
    for (const color of options) {
      const food = el('button', 'sb-item sb-food', foodSvg(color));
      food.type = 'button';
      food.setAttribute('aria-label', t.colorNames[color]);
      tray.appendChild(food);
      offs.push(
        draggable<Color>({
          item: food,
          targets: () => [{ node: plate, value: target }],
          tapTo: target,
          onPick: ctx.touched,
          onDrop: () => feed(food, color, target),
        }),
      );
    }
    ctx.setHintTarget(() => [...tray.children].find((_, i) => options[i] === target) ?? null);
  };

  const feed = (food: HTMLElement, color: Color, target: Color) => {
    ctx.touched();
    if (color !== target) {
      ctx.progress.skill('colors', false);
      ctx.sound.soft();
      ctx.say(t.notThis(t.colors[target]));
      return false;
    }
    ctx.progress.skill('colors', true);
    food.classList.add('is-eaten');
    ctx.sound.munch();
    setMood('munch');
    ctx.say(t.yum[index % t.yum.length]);
    ctx.later(() => {
      setMood('happy');
      index += 1;
      if (index < rounds.length) round();
      else {
        ctx.progress.skill('routine', true);
        ctx.done();
      }
    }, 1300);
    return true;
  };

  round();
  return { dispose: () => offs.forEach((off) => off()) };
}
