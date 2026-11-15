import type { ReactNode } from 'react';
import type { Delta } from '../api/types';
import { useI18n } from '../i18n';
import type { Loaded } from '../app/useLoad';

// Кирпичики страниц: карточка, цифра со сравнением, столбики по дням, полоски, метка состояния.

export function Card({ title, children, aside }: { title?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card">
      {(title || aside) && (
        <div className="row card-head">
          {title && <h3>{title}</h3>}
          <span className="sp" />
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ title, value, delta, note, tone }: { title: string; value: number | string; delta?: Delta; note?: string; tone?: 'bad' }) {
  const { t, num } = useI18n();
  const change = delta?.change;
  return (
    <div className="card kpi">
      <h3>{title}</h3>
      <b className={tone === 'bad' ? 'd-dn' : undefined}>{typeof value === 'number' ? num(value) : value}</b>
      {change !== undefined && change !== null && <span className={change >= 0 ? 'd-up' : 'd-dn'}>{t('vsPrev', { pct: `${change >= 0 ? '+' : '−'}${Math.abs(change)}%` })}</span>}
      {note && <span>{note}</span>}
    </div>
  );
}

export function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <>
      <div className="bars" role="img" aria-label={values.join(', ')}>
        {values.map((v, i) => <i key={i} style={{ height: `${Math.max(2, (v / max) * 100)}%` }} title={`${labels[i]}: ${v}`} />)}
      </div>
      <div className="axis">
        <span>{labels[0]}</span>
        {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
        <span>{labels[labels.length - 1]}</span>
      </div>
    </>
  );
}

export function HBars({ rows, empty }: { rows: { label: string; value: number; text?: string }[]; empty?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="note">{empty ?? '—'}</p>;
  return (
    <div>
      {rows.map((r) => (
        <div className="hbar" key={r.label}>
          <span>{r.label}</span>
          <span className="t"><i style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="v">{r.text ?? r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const Pill = ({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'n'; children: ReactNode }) => <span className={`pill p-${tone}`}>{children}</span>;

/** Состояние загрузки страницы: ошибка или «загружаю», пока данных ещё нет. */
export function LoadState({ state }: { state: Loaded<unknown> }) {
  const { t } = useI18n();
  if (state.error) return <div className="card fail-card">{t('loadFailed')}: {state.error} <button className="btn sm" onClick={() => void state.reload()}>{t('retry')}</button></div>;
  if (!state.data) return <p className="note">{t('loading')}</p>;
  return null;
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="row pager">
      <span className="note">{t('shown', { from: total ? (page - 1) * pageSize + 1 : 0, to: Math.min(page * pageSize, total), total })}</span>
      <span className="sp" />
      <button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>←</button>
      <span className="note">{page} / {pages}</span>
      <button className="btn sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>→</button>
    </div>
  );
}

export const bytes = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** «14.11» из «2026-11-14». */
export const shortDay = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
