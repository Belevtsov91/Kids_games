import { useState } from 'react';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { Face } from '../ui/Face';
import { Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

interface Trashed {
  id: string;
  name: string;
  avatar: string;
  deletedAt: string;
  purgeAt: string;
}

const TRASH_DAYS = 30;

/** Корзина профилей: вернуть со всеми сохранениями или стереть сразу. Пустая корзина не показывается. */
export function TrashPanel({ onChange }: { onChange: () => void }) {
  const p = useParentText();
  const tr = p.trash;
  const { locale } = useI18n();
  const { toast } = useParent();
  const { refresh } = useAuth();
  const { data, reload } = useLoad(() => papi.get<Trashed[]>('/trash'), []);
  const [sure, setSure] = useState<string | null>(null);

  const done = async (message: string) => {
    toast(message);
    setSure(null);
    await Promise.all([reload(), refresh()]);
    onChange();
  };
  const restore = async (c: Trashed) => {
    try {
      await papi.post(`/trash/${c.id}/restore`, {});
      await done(tr.restored(c.name));
    } catch (err) {
      toast(err instanceof ApiError && err.status === 409 ? tr.tooMany : p.failed);
    }
  };
  const purge = async (c: Trashed) => {
    if (sure !== c.id) return setSure(c.id);
    try {
      await papi.delete(`/trash/${c.id}`);
      await done(tr.purged(c.name));
    } catch {
      toast(p.failed);
    }
  };

  if (!data?.length) return null;
  return (
    <Panel title={tr.title} lead={tr.lead(TRASH_DAYS)}>
      <ul className="pa-trash">
        {data.map((c) => (
          <li key={c.id} data-testid="trash-kid">
            <Face photo={null} avatar={c.avatar} size={40} />
            <div>
              <b>{c.name}</b>
              <small>{tr.until(new Date(c.purgeAt).toLocaleDateString(locale))}</small>
            </div>
            <a className="pa-btn pa-btn-quiet" href={`/api/parent/export?child=${c.id}`} download>⬇ {p.delExport}</a>
            <button type="button" className="pa-btn pa-btn-mint" onClick={() => void restore(c)}>{tr.restore}</button>
            <button type="button" className="pa-btn pa-btn-danger" onClick={() => void purge(c)}>{sure === c.id ? tr.purgeSure : tr.purge}</button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
