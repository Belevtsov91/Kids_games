import { NavLink, useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { Face } from './ui/Face';
import { NavIcon } from './ui/NavIcon';
import { useParentText } from './text';

/** Разделы кабинета: слева на компьютере, лентой сверху на телефоне. */
export function ParentNav() {
  const p = useParentText();
  const { me } = useAuth();
  // На телефоне ссылок на детей нет, поэтому «Дети» подсвечиваются и на странице конкретного ребёнка.
  const inKid = useLocation().pathname.startsWith('/parent/kids/');
  return (
    <nav className="pa-nav" aria-label={p.overview.eyebrow}>
      {me && (
        <div className="pa-who">
          <Face photo={me.parent.photo} avatar={me.parent.name.slice(0, 1).toUpperCase()} size={44} className="face-adult" />
          <b>{me.parent.name}</b>
        </div>
      )}
      <NavLink to="/parent" end className="pa-nav-link">
        <NavIcon name="home" /> <span className="pa-nav-text">{p.nav.overview}</span>
      </NavLink>
      <NavLink to="/parent/kids" end className={({ isActive }) => `pa-nav-link${isActive ? ' active' : inKid ? ' pa-nav-under' : ''}`}>
        <NavIcon name="kids" /> <span className="pa-nav-text">{p.nav.kids}</span>
      </NavLink>
      <div className="pa-nav-kids">
        {me?.children.map((c) => (
          <NavLink key={c.id} to={`/parent/kids/${c.id}`} className="pa-nav-link pa-nav-kid">
            <Face photo={c.photo} avatar={c.avatar} size={26} /> {c.name}
          </NavLink>
        ))}
      </div>
      <NavLink to="/parent/inbox" className="pa-nav-link">
        <NavIcon name="inbox" /> <span className="pa-nav-text">{p.nav3.inbox}</span>
      </NavLink>
      <NavLink to="/parent/family" className="pa-nav-link">
        <NavIcon name="family" /> <span className="pa-nav-text">{p.nav3.family}</span>
      </NavLink>
      <NavLink to="/parent/account" className="pa-nav-link">
        <NavIcon name="lock" /> <span className="pa-nav-text">{p.nav.account}</span>
      </NavLink>
    </nav>
  );
}
