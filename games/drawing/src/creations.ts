import { defineCreations, type Creation } from '@ig/sdk';
import type { DrawingSummary } from './api/drawings';
import { setLocale, tr } from './i18n';

// Рисунки на странице «Творчество» в кабинете родителя: посмотреть, скачать, распечатать, удалить.
// Сервер игры отдаёт /parent/:childId только взрослому с открытым кабинетом (parentCanView).

const path = (childId: string, id?: string) => `/parent/${encodeURIComponent(childId)}${id ? `/${encodeURIComponent(id)}` : ''}`;

function printImage(image: string, title: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.title = title;
  const img = w.document.createElement('img');
  img.style.maxWidth = '100%';
  img.onload = () => w.print();
  img.src = image;
  w.document.body.append(img);
}

function action(label: string, onClick: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

export default defineCreations({
  async list({ api, childId }) {
    const drawings = await api.get<DrawingSummary[]>(path(childId));
    return drawings.map((d): Creation => ({ id: d.id, title: d.title, createdAt: d.createdAt, kind: 'picture' }));
  },

  mount(container, creation, sdk) {
    setLocale(sdk.locale);
    const t = tr().parent;
    let alive = true;
    const img = document.createElement('img');
    img.alt = creation.title;
    img.className = 'is-picture';
    const actions = document.createElement('div');
    actions.className = 'is-actions';
    container.append(img, actions);

    sdk.api.get<{ image: string }>(path(sdk.childId, creation.id)).then(
      ({ image }) => {
        if (!alive) return;
        img.src = image;
        const download = document.createElement('a');
        download.href = image;
        download.download = `${creation.title || 'drawing'}.png`;
        download.textContent = `⬇ ${t.download}`;
        actions.append(download, action(`🖨 ${t.print}`, () => printImage(image, creation.title)));
      },
      () => {
        if (alive) actions.textContent = t.failed;
      },
    );
    return {
      unmount() {
        alive = false;
        container.replaceChildren();
      },
    };
  },

  remove: (creation, { api, childId }) => api.delete(path(childId, creation.id)),
});
