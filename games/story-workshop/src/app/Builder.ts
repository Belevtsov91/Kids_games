// Сочинение сказки: четыре выбора (кто, куда, что случилось, что помогло), потом рассказ по картинкам.
import { OPTIONS, randomTale, STEPS, type Step, type Tale } from '../game/story';
import { tell } from '../game/tell';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import { Comic } from '../ui/comic';
import { button, el } from '../ui/dom';
import { picker } from '../ui/picker';
import type { Timers } from './Timers';

export interface BuilderDeps {
  stage: HTMLElement;
  sound: Sound;
  timers: Timers;
  setBadge: (text: string) => void;
  /** Сказка рассказана до конца: сохранить и показать финал. */
  onDone: (tale: Tale, comic: Comic, wrap: HTMLElement) => void;
}

type Draft = Partial<Record<Step, string>>;

export class Builder {
  private draft: Draft = {};

  constructor(private readonly d: BuilderDeps) {
    this.ask(0);
  }

  private nameOf(step: Step, id: string) {
    const w = tr().words;
    const table = { hero: w.heroes, place: w.places, twist: w.twists, item: w.items }[step] as Record<string, { name: string }>;
    return table[id]?.name ?? id;
  }

  private ask(i: number) {
    const step = STEPS[i]!;
    this.d.setBadge(tr().step(i + 1));
    const wrap = el('section', 'st-pick');
    const question = tr().ask[step];
    wrap.append(el('h2', 'st-question', question));
    wrap.append(
      picker(OPTIONS[step], (id) => this.nameOf(step, id), (id, card) => {
        card.classList.add('is-picked');
        this.d.sound.pick();
        this.d.sound.say(this.nameOf(step, id));
        this.draft[step] = id;
        this.d.timers.later(() => (i + 1 < STEPS.length ? this.ask(i + 1) : this.startTelling(this.finish())), 450);
      }),
    );
    const actions = el('div', 'st-actions');
    if (i > 0) actions.append(button('st-btn st-btn-soft st-btn-small', tr().back, () => this.ask(i - 1)));
    else actions.append(button('st-btn st-btn-soft st-btn-small', tr().surprise, () => this.startTelling(randomTale(Math.random))));
    wrap.append(actions);
    this.d.stage.replaceChildren(wrap);
    this.d.timers.later(() => this.d.sound.say(question), 200);
  }

  private finish(): Tale {
    // Все четыре шага пройдены; случайная сказка лишь подстраховка для типов.
    return { ...randomTale(Math.random), ...this.draft, at: Date.now() } as Tale;
  }

  private startTelling(tale: Tale) {
    this.d.setBadge('');
    const lines = tell(tale, tr().words);
    const comic = new Comic(tale, lines, false);
    const wrap = el('section', 'st-tell');
    const prompt = el('h2', 'st-question');
    const actions = el('div', 'st-actions');
    wrap.append(comic.node, prompt, actions, el('p', 'st-coach', tr().coach));
    this.d.stage.replaceChildren(wrap);
    const panel = (i: number) => {
      comic.focus(i);
      prompt.textContent = tr().tellAsk[i] ?? '';
      this.d.sound.say(prompt.textContent);
      const hint = button('st-btn st-btn-soft st-btn-small', tr().hint, () => {
        comic.reveal(i);
        this.d.sound.say(lines[i]!);
      });
      const told = button('st-btn st-btn-play', tr().told, () => {
        comic.reveal(i);
        this.d.sound.correct();
        if (i < 2) panel(i + 1);
        else {
          actions.replaceChildren();
          prompt.textContent = tr().done;
          this.d.onDone(tale, comic, wrap);
        }
      });
      actions.replaceChildren(hint, told);
      told.focus({ preventScroll: true });
    };
    panel(0);
  }
}
