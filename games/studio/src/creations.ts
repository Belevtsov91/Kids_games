import { defineCreations, type Creation } from '@ig/sdk';
import type { Beat } from './api/beats';
import { Sequencer } from './app/Sequencer';
import { StudioAudio } from './audio/StudioAudio';
import { PAD_LIST, ROW_COLORS, ROWS } from './game/kit';
import { hasStep, padsAt, sanitizeGroove, STEPS, type Groove } from './game/pattern';
import { setLocale, tr } from './i18n';

// Биты на странице «Творчество» в кабинете родителя. Сервер отдаёт только те биты,
// которые ребёнок сам отметил «Показать родителям». Тут — мини-сетка 4×16 и кнопка «Послушать».

const grooves = new Map<string, Groove>();

/** Мини-сетка: ряд — группа инструментов, клетка горит, если в ней звучит хоть один пэд ряда. */
function grid(groove: Groove) {
  const el = document.createElement('div');
  el.className = 'is-grid';
  el.style.setProperty('--steps', String(STEPS));
  const cells: HTMLElement[][] = [];
  ROWS.forEach((row, r) => {
    const pads = PAD_LIST.filter((p) => p.row === row).map((p) => p.index);
    cells[r] = [];
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement('i');
      if (pads.some((pad) => hasStep(groove.pattern, pad, step))) cell.style.background = ROW_COLORS[row];
      cells[r]!.push(cell);
      el.append(cell);
    }
  });
  const light = (step: number) => cells.forEach((row) => row.forEach((cell, i) => cell.classList.toggle('is-now', i === step)));
  return { el, light };
}

export default defineCreations({
  async list({ api, childId }) {
    const beats = await api.get<Beat[]>(`/parent/${encodeURIComponent(childId)}`);
    beats.forEach((b) => grooves.set(b.id, sanitizeGroove(b)));
    return beats.map((b): Creation => ({ id: b.id, title: b.title, createdAt: b.createdAt, kind: 'music' }));
  },

  mount(container, creation, sdk, onPlay) {
    setLocale(sdk.locale);
    const t = tr().parent;
    const groove = grooves.get(creation.id) ?? sanitizeGroove(null);
    const audio = new StudioAudio(1);
    audio.setMuted(sdk.muted);
    const view = grid(groove);
    const tempo = document.createElement('p');
    tempo.className = 'is-meta';
    tempo.textContent = `${groove.bpm} BPM${groove.swing > 0 ? ` · ${t.swing}` : ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'is-play';
    container.append(view.el, tempo, button);

    const seq = new Sequencer({
      tempo: () => groove,
      schedule: (step, at) => padsAt(groove.pattern, step).forEach((pad) => audio.play(PAD_LIST[pad]!.voice, at)),
      onStep: view.light,
    });
    const show = () => {
      button.textContent = seq.playing ? `■ ${t.stop}` : `▶ ${t.play}`;
      button.setAttribute('aria-pressed', String(seq.playing));
    };
    const stop = () => {
      seq.stop();
      view.light(-1);
      show();
    };
    button.addEventListener('click', () => {
      if (seq.playing) return stop();
      const ctx = audio.unlock();
      if (!ctx) return;
      onPlay();
      seq.start(ctx);
      show();
    });
    show();

    return {
      stop,
      unmount() {
        seq.stop();
        audio.dispose();
        container.replaceChildren();
      },
    };
  },
});
