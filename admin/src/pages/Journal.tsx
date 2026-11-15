import { useState, type FormEvent, type ReactNode } from 'react';
import { download, get, qs } from '../api/client';
import type { Paged, Row } from '../api/types';
import { useLoad } from '../app/useLoad';
import { useI18n } from '../i18n';
import { Card, LoadState, Pager } from '../ui/parts';

// Журнал с поиском, страницами и выгрузкой в CSV. Колонки и ячейки задаёт страница.

export interface Column {
  head: string;
  cell: (row: Row) => ReactNode;
  num?: boolean;
  wrap?: boolean;
}

export function Journal({ title, path, columns, file, tick = 0 }: { title: string; path: string; columns: Column[]; file: string; tick?: number }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const state = useLoad(() => get<Paged<Row>>(`${path}${qs({ page, q })}`), [path, page, q, tick]);
  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setQ(String(new FormData(e.currentTarget).get('q') ?? '').trim());
  };
  return (
    <Card title={title} aside={<button className="btn sm" onClick={() => void download(`${path}${qs({ format: 'csv', q })}`, `${file}.csv`)}>CSV</button>}>
      <form className="row" onSubmit={search} style={{ marginBottom: 8 }}>
        <input className="inp sp" id={`search-${file}`} name="q" placeholder={t('search')} defaultValue={q} />
        <button className="btn sm">{t('find')}</button>
      </form>
      <LoadState state={state} />
      {state.data && (
        <>
          <div className="tw">
            <table>
              <thead><tr>{columns.map((c) => <th key={c.head} className={c.num ? 'num' : undefined}>{c.head}</th>)}</tr></thead>
              <tbody>
                {state.data.items.map((row, i) => (
                  <tr key={i}>{columns.map((c) => <td key={c.head} className={c.num ? 'num' : c.wrap ? 'wrap' : undefined}>{c.cell(row)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {!state.data.items.length && <p className="note">{t('empty')}</p>}
          <Pager page={page} total={state.data.total} pageSize={state.data.pageSize} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
