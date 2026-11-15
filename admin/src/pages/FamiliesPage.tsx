import { useState, type FormEvent } from 'react';
import { get, qs } from '../api/client';
import type { FamilyRow, Paged } from '../api/types';
import { navigate } from '../app/router';
import { useLoad } from '../app/useLoad';
import { useI18n, type Key } from '../i18n';
import { Card, LoadState, Pager, Pill } from '../ui/parts';

// Семьи: поиск одной строкой и список. Почта скрыта, целиком — в карточке по клику.

const FILTERS: { id: string; key: Key }[] = [
  { id: 'all', key: 'families.all' },
  { id: 'frozen', key: 'families.frozen' },
  { id: 'deleting', key: 'families.deleting' },
  { id: 'pinLocked', key: 'families.pinLocked' },
];

export function FamiliesPage() {
  const { t, when } = useI18n();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const state = useLoad(() => get<Paged<FamilyRow>>(`/families${qs({ q, filter, page })}`), [q, filter, page]);
  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setQ(String(new FormData(e.currentTarget).get('q') ?? '').trim());
  };

  return (
    <>
      <form className="row" onSubmit={search}>
        <input className="inp sp" id="family-search" name="q" placeholder={t('families.search')} defaultValue={q} />
        <button className="btn pri">{t('find')}</button>
      </form>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {FILTERS.map((f) => <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => { setFilter(f.id); setPage(1); }}>{t(f.key)}</button>)}
      </div>
      <LoadState state={state} />
      {state.data && (
        <Card>
          <div className="tw">
            <table>
              <thead>
                <tr><th>{t('families.adult')}</th><th>{t('email')}</th><th className="num">{t('families.kids')}</th><th>{t('families.lang')}</th><th>{t('families.created')}</th><th>{t('families.seen')}</th><th>{t('state')}</th></tr>
              </thead>
              <tbody>
                {state.data.items.map((f) => (
                  <tr key={f.id} className="click" onClick={() => navigate(`/families/${f.id}`)}>
                    <td>{f.name}</td>
                    <td className="mono">{f.email}</td>
                    <td className="num">{f.children}</td>
                    <td>{f.locale ?? '—'}</td>
                    <td>{when(f.createdAt, false)}</td>
                    <td>{when(f.lastSeenAt, false)}</td>
                    <td>
                      {f.deleteAfter ? <Pill tone="bad">{t('families.deleting')}</Pill> : f.frozen ? <Pill tone="n">{t('families.frozen')}</Pill> : f.pinLocked ? <Pill tone="warn">{t('families.pinLocked')}</Pill> : <Pill tone="ok">{t('families.active')}</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!state.data.items.length && <p className="note">{t('families.none')}</p>}
          <Pager page={page} total={state.data.total} pageSize={state.data.pageSize} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
