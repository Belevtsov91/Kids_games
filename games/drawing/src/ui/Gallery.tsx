import { useEffect, useState } from 'react';
import type { DrawingsApi, DrawingSummary } from '../api/drawings';
import { tr } from '../i18n';

interface Props {
  api: DrawingsApi;
  onOpen(image: string): void;
  onClose(): void;
}

type Thumbs = Record<string, string | undefined>;

/** Альбом рисунков ребёнка: открыть, чтобы дорисовать, или удалить. */
export function Gallery({ api, onOpen, onClose }: Props) {
  const g = tr().gallery;
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
    <div className="drawing-gallery" role="dialog" aria-modal="true" aria-label={tr().myDrawings}>
      <header>
        <h2>🖼️ {tr().myDrawings}</h2>
        <button className="gallery-close" onClick={onClose} aria-label={g.close}>
          ✕
        </button>
      </header>
      {error && <p className="gallery-note">{g.error}</p>}
      {!error && items === null && <p className="gallery-note">{g.loading}</p>}
      {items?.length === 0 && <p className="gallery-note">{g.empty}</p>}
      <div className="gallery-grid">
        {items?.map((item) => (
          <figure key={item.id}>
            <button className="gallery-thumb" disabled={!thumbs[item.id]} onClick={() => thumbs[item.id] && onOpen(thumbs[item.id]!)}>
              {thumbs[item.id] ? <img src={thumbs[item.id]} alt={item.title} /> : <span>⏳</span>}
            </button>
            <figcaption>{item.title}</figcaption>
            <button className={`gallery-delete ${confirmId === item.id ? 'is-confirm' : ''}`} onClick={() => void remove(item.id)}>
              {confirmId === item.id ? g.sure : '🗑️'}
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
