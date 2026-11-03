import { useEffect, useState } from 'react';
import type { DrawingsApi, DrawingSummary } from '../api/drawings';

interface Props {
  api: DrawingsApi;
  onOpen(image: string): void;
  onClose(): void;
}

type Thumbs = Record<string, string | undefined>;

/** Альбом рисунков ребёнка: открыть, чтобы дорисовать, или удалить. */
export function Gallery({ api, onOpen, onClose }: Props) {
  const [items, setItems] = useState<DrawingSummary[] | null>(null);
  const [thumbs, setThumbs] = useState<Thumbs>({});
  const [error, setError] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .list()
      .then(async (list) => {
        if (!alive) return;
        setItems(list);
        // Картинки подгружаем по одной, чтобы не забить сеть на слабом телефоне.
        for (const item of list.slice(0, 30)) {
          const image = await api.image(item.id).catch(() => undefined);
          if (!alive) return;
          setThumbs((current) => ({ ...current, [item.id]: image }));
        }
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [api]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const remove = async (id: string) => {
    if (confirmId !== id) return setConfirmId(id);
    setConfirmId(null);
    await api.remove(id).catch(() => undefined);
    setItems((current) => current?.filter((item) => item.id !== id) ?? null);
  };

  return (
    <div className="drawing-gallery" role="dialog" aria-modal="true" aria-label="Мои рисунки">
      <header>
        <h2>🖼️ Мои рисунки</h2>
        <button className="gallery-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </header>
      {error && <p className="gallery-note">Не получилось открыть альбом. Проверь интернет и попробуй ещё раз.</p>}
      {!error && items === null && <p className="gallery-note">Загружаю…</p>}
      {items?.length === 0 && <p className="gallery-note">Пока пусто. Нарисуй что-нибудь и нажми 💾!</p>}
      <div className="gallery-grid">
        {items?.map((item) => (
          <figure key={item.id}>
            <button className="gallery-thumb" disabled={!thumbs[item.id]} onClick={() => thumbs[item.id] && onOpen(thumbs[item.id]!)}>
              {thumbs[item.id] ? <img src={thumbs[item.id]} alt={item.title} /> : <span>⏳</span>}
            </button>
            <figcaption>{item.title}</figcaption>
            <button className={`gallery-delete ${confirmId === item.id ? 'is-confirm' : ''}`} onClick={() => void remove(item.id)}>
              {confirmId === item.id ? 'Точно удалить?' : '🗑️'}
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
