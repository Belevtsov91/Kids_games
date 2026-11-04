import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { browserZone, papi, type Account } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PhotoPicker } from '../ui/PhotoPicker';
import { PageHead, Panel, Tile } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

/** Аккаунт взрослого: имя, фото, часовой пояс и ссылки на пароль, PIN и данные. */
export function AccountPage() {
  const p = useParentText();
  const a = p.account;
  const { toast } = useParent();
  const { refresh } = useAuth();
  const { data, reload } = useLoad(() => papi.get<Account>('/account'), []);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setName(data?.name ?? ''), [data]);
  if (!data) return null;

  const update = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      await papi.put('/account', patch);
      toast(p.saved);
      await Promise.all([reload(), refresh()]);
    } catch {
      toast(p.failed);
    }
    setBusy(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) void update({ name: name.trim() });
  };
  const zone = browserZone();

  return (
    <>
      <PageHead eyebrow={a.eyebrow} title={a.title} lead={a.lead} />
      <div className="pa-cols">
        <Panel>
          <div className="pa-field">
            <span>{p.profile.photo}</span>
            <PhotoPicker
              photo={data.photo}
              avatar={data.name.slice(0, 1).toUpperCase()}
              onChange={(photo) => void update({ photo })}
              text={{ pick: p.profile.photoPick, remove: p.profile.photoRemove, bad: p.profile.photoBad, hint: p.profile.photoHint }}
            />
          </div>
          <form className="pa-form" onSubmit={submit}>
            <label className="pa-field">
              <span>{a.name}</span>
              <input id="parent-name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div>
              <button className="pa-btn pa-btn-gold" disabled={busy || name.trim() === data.name}>{p.save}</button>
            </div>
          </form>
          <dl className="pa-facts">
            <dt>{a.email}</dt>
            <dd>{data.email}</dd>
            <dt>{a.tz}</dt>
            <dd>
              {data.timezone ?? '—'}
              {data.timezone !== zone && (
                <button type="button" className="pa-link" onClick={() => void update({ timezone: zone })}>{a.tzUse(zone)}</button>
              )}
              <small>{a.tzHint}</small>
            </dd>
          </dl>
        </Panel>
        <div className="pa-tiles pa-tiles-col">
          <Tile to="/parent/account/password" icon="🔑" title={a.tiles.password[0]} text={a.tiles.password[1]} />
          <Tile to="/parent/account/pin" icon="🔢" title={a.tiles.pin[0]} text={a.tiles.pin[1]} extra={<em>{data.hasPin ? a.pinOn : a.pinOff}</em>} />
          <Tile to="/parent/account/data" icon="🗂️" title={a.tiles.data[0]} text={a.tiles.data[1]} />
        </div>
      </div>
    </>
  );
}
