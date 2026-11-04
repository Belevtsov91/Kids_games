import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useI18n } from '@/i18n/I18nProvider';
import { BIG_IDS, showcaseGame } from '@/welcome/showcase';
import { SITE } from '../site';
import { CopyEmail } from './CopyEmail';
import { GameLink } from './GameLink';

/** Значки над подвалом: иконка и цвет; подписи берутся из словаря по порядку. */
const BADGES = [
  { icon: '✓', c: '#7ef09a' },
  { icon: '🛡', c: '#7ee7ff' },
  { icon: '💬', c: '#a99bff' },
  { icon: '📱', c: '#ffd25a' },
];

/** Колонки ссылок: адреса и цвета; заголовки и подписи — из словаря, в том же порядке. */
const COLUMNS: { c: string; links: { to: string; danger?: boolean }[] }[] = [
  {
    c: '#ff7eb6',
    links: [{ to: '/parents' }, { to: '/parents' }, { to: '/kids' }, { to: '/help' }, { to: '/delete-account', danger: true }],
  },
  { c: '#7ee7ff', links: [{ to: '/about' }, { to: '/contact' }, { to: '/credits' }, { to: '/games' }, { to: '/news' }] },
  { c: '#7ef09a', links: [{ to: '/privacy' }, { to: '/terms' }, { to: '/cookies' }] },
];

/** Подвал сайта: значки, ссылки на игры и документы, контакты, копирайт. */
export function SiteFooter() {
  const { t, locale } = useI18n();
  const f = t.footer;
  return (
    <footer className="ft">
      <div className="wl-wrap ft-in">
        <div className="ft-top">
          <ul className="ft-badges">
            {BADGES.map((b, i) => (
              <li key={b.icon} className="ft-badge" style={{ '--c': b.c } as CSSProperties}>
                <i aria-hidden="true">{b.icon}</i>
                {f.badges[i]}
              </li>
            ))}
          </ul>
        </div>

        <div className="ft-main">
          <div className="ft-brand">
            <Link to="/" className="wl-logo">
              <span className="wl-logo-mark" aria-hidden="true">🐻</span>
              {SITE.name}
            </Link>
            <p>{f.brand}</p>
          </div>
          <nav className="ft-col" style={{ '--c': '#ffd25a' } as CSSProperties} aria-label={f.games}>
            <h2>{f.games}</h2>
            <ul>
              <li><GameLink>{f.allGames}</GameLink></li>
              {BIG_IDS.map((id) => (
                <li key={id}><GameLink gameId={id}>{showcaseGame(id, locale).title}</GameLink></li>
              ))}
            </ul>
          </nav>
          {COLUMNS.map((col, ci) => {
            const text = f.columns[ci];
            return (
              <nav key={text.title} className="ft-col" style={{ '--c': col.c } as CSSProperties} aria-label={text.title}>
                <h2>{text.title}</h2>
                <ul>
                  {col.links.map((l, li) => (
                    <li key={text.links[li]}>
                      <Link to={l.to} className={l.danger ? 'is-danger' : undefined}>{text.links[li]}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="ft-contact">
          <div>
            <h2>{f.contactTitle}</h2>
            <p>{f.contactText}</p>
          </div>
          <CopyEmail />
        </div>

        <div className="ft-bottom">
          <span>© {SITE.year} {SITE.name}. {f.rights}</span>
          <span>
            {f.models} <a href="https://quaternius.com" target="_blank" rel="noreferrer">Quaternius</a> {f.and}{' '}
            <a href="https://kenney.nl" target="_blank" rel="noreferrer">Kenney</a>, {f.license}
          </span>
        </div>
      </div>
    </footer>
  );
}
