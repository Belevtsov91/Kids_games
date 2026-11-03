import { useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { LOCALE_NAMES, LOCALES } from '@/i18n/locale';
import { useParentText } from '../text';
import { PhotoPicker } from '../ui/PhotoPicker';
import { PageHead, Panel } from '../ui/bits';
import { AVATARS, Stepper } from '../ui/fields';
import { DeleteChild } from './DeleteChild';
import { useChild } from './useChild';

/** Профиль ребёнка: имя, возраст, аватар, фото, язык игр, удаление. */
export function ChildProfilePage() {
  const p = useParentText();
  const { locale } = useI18n();
  const { id, child, save } = useChild();
  const [form, setForm] = useState({ name: '', age: 5, avatar: AVATARS[0], lang: null as string | null, photo: null as string | null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (child) setForm({ name: child.name, age: child.age, avatar: child.avatar, lang: child.lang, photo: child.photo });
  }, [child]);
  if (!child) return null;
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    await save({ ...form, name: form.name.trim() });
    setBusy(false);
  };

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.child.tiles.profile[0]} lead={p.child.tiles.profile[1]} />
      <div className="pa-cols">
        <Panel>
          <form className="pa-form" onSubmit={submit}>
            <label className="pa-field">
              <span>{p.profile.name}</span>
              <input id="kid-name" maxLength={40} required value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <div className="pa-field">
              <span>{p.profile.age}</span>
              <Stepper value={form.age} min={3} max={15} label={ageText(locale, form.age)} onChange={(age) => set({ age })} />
              <small>{p.profile.ageHint}</small>
            </div>
            <div className="pa-field">
              <span>{p.profile.photo}</span>
              <PhotoPicker
                photo={form.photo}
                avatar={form.avatar}
                onChange={(photo) => set({ photo })}
                text={{ pick: p.profile.photoPick, remove: p.profile.photoRemove, bad: p.profile.photoBad, hint: p.profile.photoHint }}
              />
            </div>
            <fieldset className="pa-field">
              <legend>{p.profile.avatar}</legend>
              <div className="pa-avatars">
                {AVATARS.map((a) => (
                  <button key={a} type="button" aria-pressed={a === form.avatar} aria-label={a} onClick={() => set({ avatar: a })}>
                    {a}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="pa-field">
              <legend>{p.profile.lang}</legend>
              <div className="pa-seg">
                <button type="button" aria-pressed={form.lang === null} onClick={() => set({ lang: null })}>{p.profile.langSite}</button>
                {LOCALES.map((l) => (
                  <button key={l} type="button" aria-pressed={form.lang === l} onClick={() => set({ lang: l })}>
                    {LOCALE_NAMES[l]}
                  </button>
                ))}
              </div>
              <small>{p.profile.langHint}</small>
            </fieldset>
            <div>
              <button className="pa-btn pa-btn-gold" disabled={busy}>{busy ? p.saving : p.save}</button>
            </div>
          </form>
        </Panel>
        <DeleteChild id={id} name={child.name} />
      </div>
    </>
  );
}
