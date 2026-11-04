import { tr } from '../i18n';
import { mouthSvg } from '../ui/bear';
import { el } from '../ui/dom';
import { brushSvg } from '../ui/props';
import type { Scene, SceneCtx } from './types';

const TEETH = 5;
const SCRUB_NEEDED = 10;

/** Зубки: пять зубов с налётом. Водим щёткой (или нажимаем) — зуб блестит, Тёпа считает вслух. */
export function teethScene(ctx: SceneCtx): Scene {
  const t = tr();
  const room = el('div', 'sb-room sb-bathroom sb-teeth');
  const mouth = el('div', 'sb-mouth', mouthSvg());
  const row = el('div', 'sb-teeth-row');
  const brush = el('div', 'sb-brush', brushSvg());
  mouth.appendChild(row);
  room.append(mouth, brush);
  ctx.stage.appendChild(room);

  let clean = 0;
  const teeth: HTMLElement[] = [];

  const scrub = (tooth: HTMLElement, amount: number) => {
    if (tooth.classList.contains('is-clean')) return;
    ctx.touched();
    const left = Number(tooth.dataset.left ?? SCRUB_NEEDED) - amount;
    tooth.dataset.left = String(left);
    tooth.style.setProperty('--dirt', String(Math.max(0, left / SCRUB_NEEDED)));
    if (left > 0) return;
    tooth.classList.add('is-clean');
    ctx.sound.sparkle();
    ctx.say(t.numbers[clean]);
    clean += 1;
    ctx.progress.skill('count', true);
    if (clean < TEETH) return;
    ctx.later(() => {
      ctx.say(t.shiny);
      ctx.sound.correct();
      ctx.progress.skill('routine', true);
    }, 900);
    ctx.later(() => ctx.done(), 2600);
  };

  for (let i = 0; i < TEETH; i++) {
    const tooth = el('button', 'sb-item sb-tooth');
    tooth.type = 'button';
    tooth.setAttribute('aria-label', t.numbers[i]);
    tooth.style.setProperty('--dirt', '1');
    tooth.addEventListener('pointerdown', () => {
      ctx.sound.unlock();
      scrub(tooth, 4);
    });
    row.appendChild(tooth);
    teeth.push(tooth);
  }

  // Щётка ездит за пальцем; зуб под пальцем чистится. Палец «захвачен» элементом, где начал,
  // поэтому зуб ищем по координатам, а не по событию на самом зубе.
  const onMove = (e: PointerEvent) => {
    const box = room.getBoundingClientRect();
    brush.style.transform = `translate(${e.clientX - box.left}px, ${e.clientY - box.top}px)`;
    if (e.pointerType === 'mouse' && e.buttons === 0) return;
    const hit = teeth.find((tooth) => {
      const r = tooth.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20;
    });
    if (hit) scrub(hit, 1);
  };
  room.addEventListener('pointermove', onMove);

  ctx.say(`${t.scenes.teeth} ${t.brush}`);
  ctx.setHintTarget(() => teeth.find((n) => !n.classList.contains('is-clean')) ?? null);
  return { dispose: () => room.removeEventListener('pointermove', onMove) };
}
