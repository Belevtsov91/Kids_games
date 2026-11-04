import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Заголовок страницы кабинета: надзаголовок, заголовок, пояснение и место для кнопки. */
export function PageHead({ eyebrow, title, lead, back, children }: { eyebrow?: string; title: ReactNode; lead?: string; back?: { to: string; label: string }; children?: ReactNode }) {
  return (
    <div className="pa-head">
      <div>
        {back && (
          <Link to={back.to} className="pa-back">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <span className="pa-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {children}
    </div>
  );
}

/** Плитка-ссылка на отдельную страницу раздела. */
export function Tile({ to, icon, title, text, extra }: { to: string; icon: string; title: string; text: string; extra?: ReactNode }) {
  return (
    <Link to={to} className="pa-tile">
      <span className="pa-tile-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      <span>{text}</span>
      {extra}
      <span className="pa-tile-go" aria-hidden="true">→</span>
    </Link>
  );
}

/** Переключатель-строка: подпись, пояснение и тумблер. */
export function ToggleRow({ id, label, hint, checked, onChange, disabled }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="pa-row">
      <label htmlFor={id} className="pa-row-label">
        <b>{label}</b>
        {hint && <span>{hint}</span>}
      </label>
      <input id={id} type="checkbox" role="switch" className="pa-switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

/** Панель-карточка с заголовком. */
export function Panel({ title, lead, children, className = '' }: { title?: string; lead?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`pa-panel ${className}`}>
      {title && (
        <div className="pa-panel-head">
          <h2>{title}</h2>
          {lead && <p>{lead}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
