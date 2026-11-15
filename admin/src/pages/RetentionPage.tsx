import { get, post } from '../api/client';
import type { Retention } from '../api/types';
import { navigate } from '../app/router';
import { useLoad } from '../app/useLoad';
import { useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card, LoadState } from '../ui/parts';

// Хранение и удаление: скоро удалятся за неактивность, аккаунты на удалении, корзина профилей.

export function RetentionPage() {
  const { t, when } = useI18n();
  const { run } = useFeedback();
  const state = useLoad(() => get<Retention>('/retention'), []);
  const act = async (path: string) => {
    if (await run(() => post(path))) await state.reload();
  };
  const r = state.data;
  const open = (id: string) => navigate(`/families/${id}`);

  return (
    <>
      <LoadState state={state} />
      {r && (
        <>
          <p className="note">{t('retention.rules', { inactive: r.rules.inactiveDays, warn: r.rules.warnDays, trash: r.rules.trashDays })}</p>
          <Card title={t('retention.inactive')}>
            <div className="tw"><table>
              <thead><tr><th>{t('families.adult')}</th><th>{t('email')}</th><th className="num">{t('retention.idle')}</th><th>{t('retention.warned')}</th><th>{t('retention.deleteAt')}</th><th /></tr></thead>
              <tbody>{r.inactive.map((p) => (
                <tr key={p.id}>
                  <td><button className="btn sm" onClick={() => open(p.id)}>{p.name}</button></td>
                  <td className="mono">{p.email}</td><td className="num">{p.idleDays}</td>
                  <td>{when(p.warnedAt, false)}</td><td>{when(p.deleteAt, false)}</td>
                  <td><button className="btn sm" onClick={() => void act(`/families/${p.id}/retention/postpone`)}>{t('retention.postpone')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
            {!r.inactive.length && <p className="note">{t('empty')}</p>}
          </Card>
          <Card title={t('retention.deleting')}>
            <div className="tw"><table>
              <thead><tr><th>{t('families.adult')}</th><th>{t('email')}</th><th>{t('retention.erased')}</th><th /></tr></thead>
              <tbody>{r.deleting.map((p) => (
                <tr key={p.id}>
                  <td><button className="btn sm" onClick={() => open(p.id)}>{p.name}</button></td>
                  <td className="mono">{p.email}</td><td>{when(p.deleteAfter)}</td>
                  <td><button className="btn sm" onClick={() => void act(`/families/${p.id}/delete/cancel`)}>{t('family.deleteCancel')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
            {!r.deleting.length && <p className="note">{t('empty')}</p>}
          </Card>
          <Card title={t('retention.trash')}>
            <div className="tw"><table>
              <thead><tr><th>{t('retention.child')}</th><th>{t('retention.removed')}</th><th>{t('retention.erased')}</th><th /></tr></thead>
              <tbody>{r.trash.map((c) => (
                <tr key={c.id}>
                  <td><button className="btn sm" onClick={() => open(c.parentId)}>{c.avatar} {c.name}, {c.age}</button></td>
                  <td>{when(c.deletedAt, false)}</td><td>{when(c.purgeAt, false)}</td>
                  <td><button className="btn sm" onClick={() => void act(`/children/${c.id}/restore`)}>{t('child.restore')}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
            {!r.trash.length && <p className="note">{t('empty')}</p>}
          </Card>
        </>
      )}
    </>
  );
}
