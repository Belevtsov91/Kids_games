import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { Face } from '@/parent/ui/Face';
import { useKidText } from '@/kid/text';

/** Кто играет: аватарка в верхней панели, по нажатию — быстрый выбор другого профиля без ухода со страницы. */
export function ProfileMenu() {
  const { me, activeChild, selectChild } = useAuth();
  const { t, locale } = useI18n();
  const k = useKidText();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', onDown);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = async (id: string) => {
    setOpen(false);
    if (id !== activeChild?.id) await selectChild(id);
  };

  return (
    <div className="dash-profile" ref={box}>
      <button type="button" className="dash-chip" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
        {activeChild && <Face photo={activeChild.photo} avatar={activeChild.avatar} size={34} className="dash-ava" />}
        <span className="dash-chip-name">{activeChild?.name}</span>
        <small className="dash-chip-age">{activeChild && ageText(locale, activeChild.age)}</small>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="dash-menu">
          <div className="dash-menu-title">{t.menu.profiles}</div>
          {me?.children.map((child) => (
            <button key={child.id} type="button" aria-current={child.id === activeChild?.id} onClick={() => void pick(child.id)}>
              <Face photo={child.photo} avatar={child.avatar} size={34} className="dash-ava" />
              {child.name}
              <small>{ageText(locale, child.age)}</small>
            </button>
          ))}
          <Link to="/me" className="dash-menu-link">🙂 {k.me.open}</Link>
          <Link to="/children" className="dash-menu-link">{t.menu.changeProfile}</Link>
          <Link to="/parent" className="dash-menu-link" data-testid="to-parent">🔒 {k.me.parents}</Link>
        </div>
      )}
    </div>
  );
}
