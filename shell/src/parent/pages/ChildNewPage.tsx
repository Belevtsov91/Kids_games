import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { api, ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { games } from '@/catalog/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PhotoPicker } from '../ui/PhotoPicker';
import { PageHead, Panel, ToggleRow } from '../ui/bits';
import { AVATARS, Stepper } from '../ui/fields';
import { fitsAge } from './access';
import { Plush } from '@/ui/Plush';

/** Новый профиль ребёнка из кабинета: имя, возраст или месяц рождения, аватар, правила по возрасту и (по желанию) фото. */
export function ChildNewPage() {
  const p = useParentText();
  const n = p.newChild;
  const { locale } = useI18n();
  const { refresh } = useAuth();
  const { toast } = useParent();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [birth, setBirth] = useState('');
  const [rules, setRules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const thisYear = new Date().getFullYear();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const child = await api.post<{ id: string }>('/children', { name: name.trim(), avatar, rules, ...(birth ? { birthMonth: birth } : { age }) });
      if (photo) await papi.patch(`/children/${child.id}`, { photo });
      await refresh();
      toast(p.saved);
      navigate(`/parent/kids/${child.id}`);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? n.tooMany : p.failed);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead back={{ to: '/parent/kids', label: p.nav.kids }} title={n.title} lead={n.lead} />
      <Panel>
        <form className="pa-form" onSubmit={submit}>
          <label className="pa-field">
            <span>{p.profile.name}</span>
            <input id="new-kid-name" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <div className="pa-field">
            <span>{p.profile.age}</span>
            {!birth && <Stepper value={age} min={3} max={15} label={ageText(locale, age)} onChange={setAge} />}
            {!birth && <small>{n.games(games.filter((g) => fitsAge(g, age)).length, games.length)}</small>}
          </div>
          <label className="pa-field">
            <span>{p.newKid.birth}</span>
            <input id="new-kid-birth" type="month" min={`${thisYear - 16}-01`} max={`${thisYear - 2}-12`} value={birth} onChange={(e) => setBirth(e.target.value)} />
            <small>{p.newKid.birthLead}</small>
          </label>
          <ToggleRow id="new-kid-rules" label={p.newKid.rules} hint={p.newKid.rulesLead} checked={rules} onChange={setRules} />
          <fieldset className="pa-field">
            <legend>{p.profile.avatar}</legend>
            <div className="pa-avatars">
              {AVATARS.map((a) => (
                <button key={a} type="button" aria-pressed={a === avatar} aria-label={a} onClick={() => setAvatar(a)}>
                  <Plush value={a} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="pa-field">
            <span>{p.profile.photo}</span>
            <PhotoPicker
              photo={photo}
              avatar={avatar}
              onChange={setPhoto}
              text={{ pick: p.profile.photoPick, remove: p.profile.photoRemove, bad: p.profile.photoBad, hint: p.profile.photoHint }}
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div>
            <button className="pa-btn pa-btn-gold" disabled={busy}>{busy ? p.saving : n.create}</button>
          </div>
        </form>
      </Panel>
    </>
  );
}
