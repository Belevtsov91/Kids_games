import { useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

interface Helper {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  last_used_at: string | null;
  /** Для каких детей помощник; null — для всех. */
  child_ids: string[] | null;
}

/** Семья: ссылки помощников, которые отвечают на просьбы о времени без пароля. */
export function FamilyPage() {
  const p = useParentText();
  const f = p.family;
  const { locale } = useI18n();
  const { toast } = useParent();
  const kids = useAuth().me?.children ?? [];
  const nameOf = (id: string) => kids.find((k) => k.id === id)?.name ?? '—';
  const { data, reload } = useLoad(() => papi.get<Helper[]>('/helpers'), []);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const picked = form.getAll('kid').map(String);
    // Отмечены все или никто — помощник для всех детей, включая будущих.
    const childIds = picked.length && picked.length < kids.length ? picked : undefined;
    setBusy(true);
    try {
      const res = await papi.post<{ url: string }>('/helpers', { name: String(form.get('name')), ...(email ? { email } : {}), ...(childIds ? { childIds } : {}), locale });
      setLink(res.url);
      (e.target as HTMLFormElement).reset();
      await reload();
    } catch {
      toast(p.failed);
    }
    setBusy(false);
  };
  const remove = async (id: string) => {
    try {
      await papi.delete(`/helpers/${id}`);
      toast(f.removed);
      await reload();
    } catch {
      toast(p.failed);
    }
  };
  const copy = async () => {
    if (!link) return;
    await navigator.clipboard?.writeText(link).catch(() => undefined);
    toast(f.copied);
  };

  return (
    <>
      <PageHead eyebrow={p.overview.eyebrow} title={f.title} lead={f.lead} />
      <div className="pa-cols">
        <Panel title={f.add}>
          <form className="pa-form" onSubmit={(e) => void create(e)}>
            <label className="pa-field"><span>{f.name}</span><input name="name" required maxLength={40} /></label>
            <label className="pa-field"><span>{f.email}</span><input name="email" type="email" maxLength={254} /></label>
            {kids.length > 1 && (
              <fieldset className="pa-field">
                <legend>{p.helperKids.label}</legend>
                <div className="pa-checks">
                  {kids.map((k) => (
                    <label key={k.id}><input type="checkbox" name="kid" value={k.id} defaultChecked /><span>{k.avatar} {k.name}</span></label>
                  ))}
                </div>
              </fieldset>
            )}
            <button className="dash-btn dash-btn-primary" disabled={busy}>{f.create}</button>
          </form>
          {link && (
            <>
              <p>{f.link}</p>
              <div className="pa-helper-link">
                <span>{link}</span>
                <button type="button" className="dash-btn" onClick={() => void copy()}>{f.copy}</button>
              </div>
            </>
          )}
        </Panel>
        <Panel>
          {data && data.length === 0 && <p className="pa-empty">{f.empty}</p>}
          <ul className="pa-inbox">
            {data?.map((h) => (
              <li key={h.id}>
                <b>{h.name}</b>
                <small>{h.child_ids?.length ? p.helperKids.only(h.child_ids.map(nameOf).join(', ')) : p.helperKids.all} · {h.last_used_at ? f.used(new Date(h.last_used_at).toLocaleDateString(locale)) : f.never}</small>
                <button type="button" className="dash-btn" onClick={() => void remove(h.id)}>{f.remove}</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
