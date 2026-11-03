import { useState } from 'react';
import { DeleteAccountDialog } from '@/account/DeleteAccountDialog';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';

/** Что хранится и удаление аккаунта (тот же диалог с тремя примерами, что на странице «Удалить аккаунт»). */
export function DataPage() {
  const p = useParentText();
  const d = p.data;
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <PageHead back={{ to: '/parent/account', label: p.account.title }} title={d.title} />
      <Panel title={d.store} lead={d.noAds}>
        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                {d.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={d.deleteTitle} lead={d.deleteLead} className="pa-danger">
        <button type="button" className="pa-btn pa-btn-danger" onClick={() => setDeleting(true)}>
          {d.deleteTitle}
        </button>
      </Panel>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </>
  );
}
