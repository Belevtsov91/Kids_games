import { pajamaOf } from '../game/logic';
import { tr } from '../i18n';
import { bearSvg } from '../ui/bear';
import { el } from '../ui/dom';
import { lampSvg, starSvg } from '../ui/props';
import type { Scene, SceneCtx } from './types';

const STARS = 5;

/** Ночь: Тёпа в кроватке. Гасим лампу, зажигаем пять звёзд в окне — каждая нота колыбельной. */
export function nightScene(ctx: SceneCtx): Scene {
  const t = tr();
  const pajama = pajamaOf(ctx.nights);
  const room = el('div', 'sb-room sb-night');
  const window$ = el('div', 'sb-window');
  const bed = el('div', 'sb-bed');
  const bear = el('div', 'sb-bear sb-bear-bed', bearSvg({ id: 'night', mood: 'sleepy', pajama }));
  const lamp = el('button', 'sb-item sb-lamp', lampSvg(true));
  lamp.type = 'button';
  lamp.setAttribute('aria-label', '💡');
  bed.append(bear, el('div', 'sb-blanket'));
  room.append(window$, bed, lamp);
  ctx.stage.appendChild(room);

  let lit = 0;
  const stars: HTMLButtonElement[] = [];

  const sleep = () => {
    bear.innerHTML = bearSvg({ id: 'night', mood: 'asleep', pajama });
    room.classList.add('is-asleep');
    ctx.sound.lullaby();
    ctx.say(t.goodnight);
    ctx.progress.skill('routine', true);
    ctx.later(() => ctx.done(), 4200);
  };

  for (let i = 0; i < STARS; i++) {
    const star = el('button', 'sb-item sb-star', starSvg(false));
    star.type = 'button';
    star.disabled = true;
    star.setAttribute('aria-label', t.numbers[i]);
    star.style.setProperty('--i', String(i));
    star.addEventListener('pointerdown', () => {
      if (star.disabled || star.classList.contains('is-lit')) return;
      ctx.touched();
      star.classList.add('is-lit');
      star.innerHTML = starSvg(true);
      ctx.sound.note(lit);
      lit += 1;
      if (lit === STARS) {
        ctx.progress.skill('count', true);
        ctx.later(sleep, 700);
      }
    });
    window$.appendChild(star);
    stars.push(star);
  }

  lamp.addEventListener(
    'pointerdown',
    () => {
      ctx.touched();
      ctx.sound.unlock();
      ctx.sound.click();
      lamp.innerHTML = lampSvg(false);
      lamp.disabled = true;
      room.classList.add('is-dark');
      stars.forEach((s) => (s.disabled = false));
      ctx.say(t.stars);
    },
    { once: true },
  );

  ctx.say(`${t.scenes.night}`);
  ctx.setHintTarget(() => (lamp.disabled ? (stars.find((s) => !s.classList.contains('is-lit')) ?? null) : lamp));
  return { dispose: () => undefined };
}
