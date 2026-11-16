import { defineCreations, type Creation } from '@ig/sdk';
import type { Melody } from './api/melodies';
import { Playback } from './app/Playback';
import { OrchestraAudio } from './audio/OrchestraAudio';
import { animalById } from './game/animals';
import { normalizeSong } from './game/song';
import { setLocale, tr } from './i18n';

// Мелодии на странице «Творчество» в кабинете родителя: зверята мелодии и кнопка «Послушать».
// Звук синтезируется тут же (как в игре), контекст создаётся по нажатию.

const path = (childId: string, id?: string) => `/parent/${encodeURIComponent(childId)}${id ? `/${encodeURIComponent(id)}` : ''}`;
const melodies = new Map<string, Melody>();

export default defineCreations({
  async list({ api, childId }) {
    const list = await api.get<Melody[]>(path(childId));
    list.forEach((m) => melodies.set(m.id, m));
    return list.map((m): Creation => ({ id: m.id, title: m.title, createdAt: m.createdAt, kind: 'music' }));
  },

  mount(container, creation, sdk, onPlay) {
    setLocale(sdk.locale);
    const t = tr().parent;
    const notes = normalizeSong(melodies.get(creation.id)?.notes ?? []);
    const audio = new OrchestraAudio();
    audio.setMuted(sdk.muted);

    const strip = document.createElement('p');
    strip.className = 'is-notes';
    strip.textContent = notes.slice(0, 24).map((n) => animalById(n.a)?.emoji ?? '♪').join(' ') + (notes.length > 24 ? ' …' : '');
    strip.title = t.notes(notes.length);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'is-play';
    container.append(strip, button);

    const playback = new Playback(
      (animal, sound) => audio.play(animal, sound),
      (playing) => {
        button.textContent = playing ? `■ ${t.stop}` : `▶ ${t.play}`;
        button.setAttribute('aria-pressed', String(playing));
      },
    );
    button.textContent = `▶ ${t.play}`;
    button.disabled = notes.length === 0;
    button.addEventListener('click', () => {
      if (playback.playing) return playback.stop();
      audio.unlock();
      onPlay();
      playback.play(notes);
    });

    return {
      stop: () => playback.stop(),
      unmount() {
        playback.stop();
        audio.dispose();
        container.replaceChildren();
      },
    };
  },

  remove: async (creation, { api, childId }) => {
    await api.delete(path(childId, creation.id));
    melodies.delete(creation.id);
  },
});
