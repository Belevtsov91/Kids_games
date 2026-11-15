// Одно задание дня: «Который час?» (выбрать из трёх) или «Поставь стрелки» (двигать пальцем).
import type { Sound } from '../audio/Sound';
import { formatTime, readOptions, sameTime, stepOf, type ClockTime, type Level } from '../game/clock';
import type { Task } from '../game/day';
import { tr } from '../i18n';
import { button, el } from '../ui/dom';
import { EVENT_ICON, type Scene } from '../ui/scene';

/** После стольких ошибок в «поставь стрелки» Тёпа сам показывает ответ. */
export const SHOW_AFTER = 3;

export interface TaskCtx {
  scene: Scene;
  level: Level;
  sound: Sound;
  rng: () => number;
  /** Где стояли стрелки до задания: с этого места ребёнок их и двигает. */
  from: ClockTime;
  say(text: string): void;
  answer(ok: boolean): void;
  done(mistakes: number): void;
  later(fn: () => void, ms: number): void;
}

/** Фраза Тёпы: в облачке и голосом — ребёнок 5–8 лет уже пробует читать. */
const tell = (task: Task, ctx: TaskCtx, text: string) => {
  ctx.scene.bubble(EVENT_ICON[task.event], text);
  ctx.say(text);
};

const praise = (rng: () => number) => {
  const list = tr().right;
  return list[Math.floor(rng() * list.length) % list.length];
};

export function runTask(task: Task, ctx: TaskCtx): () => void {
  return task.kind === 'read' ? readTask(task, ctx) : setTask(task, ctx);
}

function success(task: Task, ctx: TaskCtx, mistakes: number) {
  ctx.sound.correct();
  ctx.later(() => ctx.sound.chime(task.time.h), 500);
  ctx.scene.bear('happy');
  tell(task, ctx, praise(ctx.rng));
  ctx.later(() => ctx.done(mistakes), 2200);
}

function readTask(task: Task, ctx: TaskCtx) {
  const t = tr();
  const { scene } = ctx;
  let mistakes = 0;
  let finished = false;
  scene.tower.set(task.time);
  const event = t.events[task.event];
  scene.bubble(EVENT_ICON[task.event], t.readAsk(event));
  ctx.say(t.readAsk(event));
  const options = readOptions(task.time, ctx.level, ctx.rng);
  scene.answers.replaceChildren(
    ...options.map((opt) => {
      const b = button('wc-answer', formatTime(opt), formatTime(opt), () => {
        if (finished || b.disabled) return;
        const ok = sameTime(opt, task.time);
        ctx.answer(ok);
        if (ok) {
          finished = true;
          b.classList.add('is-right');
          return success(task, ctx, mistakes);
        }
        mistakes++;
        b.disabled = true;
        b.classList.add('is-wrong');
        ctx.sound.soft();
        scene.bear('oops');
        tell(task, ctx, t.wrong);
      });
      return b;
    }),
  );
  return () => undefined;
}

function setTask(task: Task, ctx: TaskCtx) {
  const t = tr();
  const { scene } = ctx;
  let mistakes = 0;
  let finished = false;
  let ticks = 0;
  const start = sameTime(ctx.from, task.time) ? { h: (task.time.h % 12) + 1, m: task.time.m } : ctx.from;
  scene.tower.set(start);
  const event = t.events[task.event];
  const ask = t.setAsk(event, t.timeWords(task.time.h, task.time.m));
  scene.bubble(EVENT_ICON[task.event], t.setAsk(event, formatTime(task.time)));
  ctx.say(ask);
  const off = scene.tower.enableDrag(stepOf(ctx.level), () => {
    ctx.sound.tick(ticks++);
    scene.tower.flash(null);
  });
  const goal = el('span', 'wc-goal', formatTime(task.time));
  const check = button('wc-big-btn wc-check', '✓', t.check, () => {
    if (finished) return;
    ctx.sound.click();
    const now = scene.tower.get();
    const ok = sameTime(now, task.time);
    ctx.answer(ok);
    if (ok) {
      finished = true;
      off();
      return success(task, ctx, mistakes);
    }
    mistakes++;
    ctx.sound.soft();
    scene.bear('oops');
    if (mistakes >= SHOW_AFTER) {
      finished = true;
      off();
      scene.tower.set(task.time);
      tell(task, ctx, t.showAnswer);
      ctx.later(() => ctx.done(mistakes), 2600);
      return;
    }
    const hourOk = now.h === task.time.h, minuteOk = now.m === task.time.m;
    scene.tower.flash(hourOk ? 'minute' : minuteOk ? 'hour' : null);
    tell(task, ctx, hourOk ? t.wrongMinute : minuteOk ? t.wrongHour : t.wrong);
  });
  scene.answers.replaceChildren(goal, check);
  return off;
}
