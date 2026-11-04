import { useEffect, useState } from 'react';
import { createApiClient } from '@/api/client';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';
import { useChild } from './useChild';

// Рисунки ребёнка из «Рисовалки». Данные игры: спрашиваем её сервер, он сверяется с кабинетом.
const drawingsApi = createApiClient('/games/drawing/parent');

interface Summary {
  id: string;
  title: string;
  createdAt: string;
}

function Drawing({ childId, d, onRemoved }: { childId: string; d: Summary; onRemoved: () => void }) {
  const p = useParentText();
  const g = p.gallery;
  const { toast } = useParent();
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    drawingsApi.get<{ image: string }>(`/${childId}/${d.id}`).then((r) => setImage(r.image), () => setImage(null));
  }, [childId, d.id]);

  const print = () => {
    const w = window.open('', '_blank');
    if (!w || !image) return;
    w.document.write(`<title>${d.title.replace(/</g, '')}</title><img src="${image}" style="max-width:100%" onload="print()">`);
    w.document.close();
  };
  const remove = async () => {
    if (!confirm(g.confirm)) return;
    try {
      await drawingsApi.delete(`/${childId}/${d.id}`);
      toast(g.removed);
      onRemoved();
    } catch {
      toast(p.failed);
    }
  };

  return (
    <figure className="pa-drawing">
      {image ? <img src={image} alt={d.title} loading="lazy" /> : <div style={{ aspectRatio: '4 / 3' }} />}
      <figcaption>
        {image && <a href={image} download={`${d.title || 'drawing'}.png`}>⬇ {g.download}</a>}
        {image && <button type="button" onClick={print}>🖨 {g.print}</button>}
        <button type="button" onClick={() => void remove()}>🗑 {g.remove}</button>
      </figcaption>
    </figure>
  );
}

/** Галерея рисунков в кабинете: скачать, распечатать, удалить. */
export function ChildGalleryPage() {
  const p = useParentText();
  const { id, child } = useChild();
  const { data, reload } = useLoad(() => drawingsApi.get<Summary[]>(`/${id}`), [id]);
  if (!child) return null;
  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.tiles3.gallery[0]} lead={p.gallery.lead} />
      <Panel>
        {data && data.length === 0 && <p className="pa-empty">{p.gallery.empty}</p>}
        <div className="pa-gallery">
          {data?.map((d) => <Drawing key={d.id} childId={id} d={d} onRemoved={() => void reload()} />)}
        </div>
      </Panel>
    </>
  );
}
