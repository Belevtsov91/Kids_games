import { tr } from '../i18n';
import { bearSvg, mudSvg } from '../ui/bear';
import { el } from '../ui/dom';
import { bubbleSvg } from '../ui/props';
import type { Scene, SceneCtx } from './types';

const BUBBLES = 6;
const SPOTS = [
  { x: 30, y: 62 },
  { x: 70, y: 62 },
  { x: 50, y: 48 },
];
const RUB_NEEDED = 14;

/** Купание: лопаем пузыри (каждый — своя нота) и оттираем три грязных пятна. */
export function bathScene(ctx: SceneCtx): Scene {
  const t = tr();
  const room = el('div', 'sb-room sb-bathroom');
  const tub = el('div', 'sb-tub');
  const bear = el('div', 'sb-bear sb-bear-tub', bearSvg({ id: 'bath' }));
  tub.append(bear, el('div', 'sb-foam'));
  room.appendChild(tub);
  ctx.stage.appendChild(room);

  let popped = 0;
  let cleaned = 0;
  const spots: HTMLElement[] = [];
  const offs: (() => void)[] = [];

  const finishIfDone = () => {
    if (popped < BUBBLES || cleaned < SPOTS.length) return;
    ctx.progress.skill('motor', true);
    ctx.progress.skill('routine', true);
    ctx.say(t.clean);
    ctx.sound.correct();
    ctx.later(() => ctx.done({ cleanPaws: true }), 1600);
  };

  for (let i = 0; i < BUBBLES; i++) {
    const b = el('button', 'sb-item sb-bubble', bubbleSvg());
    b.type = 'button';
    b.setAttribute('aria-label', '○');
    b.style.left = `${6 + ((i * 37) % 6) * 15}%`;
    b.style.animationDelay = `${-i * 1.1}s`;
    b.style.setProperty('--size', `${10 + (i % 3) * 3}vmin`);
    b.addEventListener('pointerdown', () => {
      ctx.touched();
      ctx.sound.unlock();
      ctx.sound.pop(popped);
      b.classList.add('is-popped');
      b.disabled = true;
      popped += 1;
      if (popped === BUBBLES) ctx.say(t.rub);
      finishIfDone();
    });
    room.appendChild(b);
  }

  SPOTS.forEach((pos, i) => {
    const spot = el('div', 'sb-mud', mudSvg());
    spot.style.left = `${pos.x}%`;
    spot.style.top = `${pos.y}%`;
    let rub = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.buttons === 0) return;
      ctx.touched();
      rub += 1;
      spot.style.opacity = String(Math.max(0, 1 - rub / RUB_NEEDED));
      if (rub === RUB_NEEDED) {
        ctx.sound.sparkle();
        spot.classList.add('is-clean');
        cleaned += 1;
        finishIfDone();
      }
    };
    // Касание тоже оттирает: малышу трудно водить пальцем.
    const onDown = () => {
      for (let k = 0; k < 4; k++) onMove({ pointerType: 'touch', buttons: 1 } as PointerEvent);
    };
    spot.addEventListener('pointermove', onMove);
    spot.addEventListener('pointerdown', onDown);
    offs.push(() => spot.removeEventListener('pointermove', onMove));
    spot.dataset.i = String(i);
    bear.appendChild(spot);
    spots.push(spot);
  });

  ctx.say(`${t.scenes.bath} ${t.bubbles}`);
  ctx.setHintTarget(() => room.querySelector('.sb-bubble:not(.is-popped)') ?? spots.find((s) => !s.classList.contains('is-clean')) ?? null);
  return { dispose: () => offs.forEach((off) => off()) };
}
