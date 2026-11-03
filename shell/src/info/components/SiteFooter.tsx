import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { BIG_IDS, SHOWCASE } from '@/welcome/showcase';
import { SITE } from '../site';
import { CopyEmail } from './CopyEmail';
import { GameLink } from './GameLink';

const BADGES = [
  { icon: '✓', text: 'Без рекламы', c: '#7ef09a' },
  { icon: '🛡', text: 'Безопасно для детей', c: '#7ee7ff' },
  { icon: '💬', text: 'Без чатов с незнакомцами', c: '#a99bff' },
  { icon: '📱', text: 'Работает на телефоне', c: '#ffd25a' },
];

const COLUMNS: { title: string; c: string; links: { to: string; text: string; danger?: boolean }[] }[] = [
  {
    title: 'Родителям',
    c: '#ff7eb6',
    links: [
      { to: '/parents', text: 'Как устроен аккаунт' },
      { to: '/parents', text: 'Возраст и польза игр' },
      { to: '/kids', text: 'Детская приватность' },
      { to: '/help', text: 'Помощь и вопросы' },
      { to: '/delete-account', text: 'Удалить аккаунт и данные', danger: true },
    ],
  },
  {
    title: 'О проекте',
    c: '#7ee7ff',
    links: [
      { to: '/about', text: 'О нас' },
      { to: '/contact', text: 'Контакты' },
      { to: '/credits', text: 'Авторы 3D-моделей' },
    ],
  },
  {
    title: 'Документы',
    c: '#7ef09a',
    links: [
      { to: '/privacy', text: 'Политика конфиденциальности' },
      { to: '/terms', text: 'Условия использования' },
      { to: '/cookies', text: 'Файлы cookie' },
    ],
  },
];

/** Подвал сайта: значки, ссылки на игры и документы, контакты, копирайт. */
export function SiteFooter() {
  return (
    <footer className="ft">
      <div className="wl-wrap ft-in">
        <div className="ft-top">
          <ul className="ft-badges">
            {BADGES.map((b) => (
              <li key={b.text} className="ft-badge" style={{ '--c': b.c } as CSSProperties}>
                <i aria-hidden="true">{b.icon}</i>
                {b.text}
              </li>
            ))}
          </ul>
          <div className="ft-lang" role="group" aria-label="Язык сайта">
            <span>Язык</span>
            <button type="button" aria-pressed="true">RU</button>
            {['UA', 'RO', 'EN'].map((l) => (
              <button key={l} type="button" aria-pressed="false" disabled title="Скоро">
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="ft-main">
          <div className="ft-brand">
            <Link to="/" className="wl-logo">
              <span className="wl-logo-mark" aria-hidden="true">🐻</span>
              {SITE.name}
            </Link>
            <p>Десять игр для детей от 3 до 15 лет: рисуем, строим, считаем и спасаем Лунную Долину. Без рекламы и без чатов.</p>
          </div>
          <nav className="ft-col" style={{ '--c': '#ffd25a' } as CSSProperties} aria-label="Игры">
            <h2>Игры</h2>
            <ul>
              <li><GameLink>Все игры</GameLink></li>
              {BIG_IDS.map((id) => (
                <li key={id}><GameLink gameId={id}>{SHOWCASE[id].title}</GameLink></li>
              ))}
            </ul>
          </nav>
          {COLUMNS.map((col) => (
            <nav key={col.title} className="ft-col" style={{ '--c': col.c } as CSSProperties} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.text}>
                    <Link to={l.to} className={l.danger ? 'is-danger' : undefined}>{l.text}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="ft-contact">
          <div>
            <h2>Напишите нам</h2>
            <p>Вопрос, идея новой игры или что-то сломалось. Отвечаем взрослым за 1–2 рабочих дня.</p>
          </div>
          <CopyEmail />
        </div>

        <div className="ft-bottom">
          <span>© {SITE.year} {SITE.name}. Все права защищены.</span>
          <span>
            3D-модели: <a href="https://quaternius.com" target="_blank" rel="noreferrer">Quaternius</a> и{' '}
            <a href="https://kenney.nl" target="_blank" rel="noreferrer">Kenney</a>, лицензия CC0 1.0
          </span>
        </div>
      </div>
    </footer>
  );
}
