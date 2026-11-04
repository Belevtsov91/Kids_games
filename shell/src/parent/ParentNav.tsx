import { NavLink } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { Face } from './ui/Face';
import { useParentText } from './text';

/** Разделы кабинета: слева на компьютере, лентой сверху на телефоне. */
export function ParentNav() {
  const p = useParentText();
  const { me } = useAuth();
  return (
    <nav className="pa-nav" aria-label={p.overview.eyebrow}>
      {me && (
        <div className="pa-who">
          <Face photo={me.parent.photo} avatar={me.parent.name.slice(0, 1).toUpperCase()} size={44} className="face-adult" />
          <b>{me.parent.name}</b>
        </div>
      )}
      <NavLink to="/parent" end className="pa-nav-link">
        <span aria-hidden="true">🏠</span> {p.nav.overview}
      </NavLink>
      <NavLink to="/parent/kids" end className="pa-nav-link">
        <span aria-hidden="true">👨‍👩‍👧</span> {p.nav.kids}
      </NavLink>
      <div className="pa-nav-kids">
        {me?.children.map((c) => (
          <NavLink key={c.id} to={`/parent/kids/${c.id}`} className="pa-nav-link pa-nav-kid">
            <Face photo={c.photo} avatar={c.avatar} size={26} /> {c.name}
          </NavLink>
        ))}
      </div>
      <NavLink to="/parent/inbox" className="pa-nav-link">
        <span aria-hidden="true">📬</span> {p.nav3.inbox}
      </NavLink>
      <NavLink to="/parent/family" className="pa-nav-link">
        <span aria-hidden="true">👵</span> {p.nav3.family}
      </NavLink>
      <NavLink to="/parent/account" className="pa-nav-link">
        <span aria-hidden="true">🔐</span> {p.nav.account}
      </NavLink>
    </nav>
  );
}
