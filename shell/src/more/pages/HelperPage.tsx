import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { useMoreText } from '../text';

interface HelperData {
  helper: string;
  kids: { id: string; name: string; avatar: string }[];
  requests: { id: string; child_id: string; minutes: number; status: string }[];
}

// Токен помощника живёт в адресе после # (серверу и в Referer не уходит). Запоминаем его во вкладке,
// чтобы страница работала и после обновления.
const KEY = 'ig:helper';
const readToken = () => {
  const fromHash = location.hash.slice(1);
  if (fromHash) {
    try {
      localStorage.setItem(KEY, fromHash);
    } catch {
      /* приватный режим: просто не запомним */
    }
    history.replaceState(null, '', location.pathname);
    return fromHash;
  }
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
};

/** /helper#<токен>: бабушка или няня отвечают на просьбы о времени без пароля. */
export function HelperPage() {
  const h = useMoreText().helper;
  const [token] = useState(readToken);
  const [data, setData] = useState<HelperData | null>(null);
  const [revoked, setRevoked] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.post<HelperData>('/helper', { token }));
    } catch {
      setRevoked(true);
    }
  }, [token]);
  useEffect(() => void load(), [load]);

  const answer = async (requestId: string, approve: boolean) => {
    await api.post('/helper/answer', { token, requestId, approve }).catch(() => undefined);
    await load();
  };
  const kid = (id: string) => data?.kids.find((k) => k.id === id);

  return (
    <main className="wl more-page">
      <SiteTopbar />
      <section className="wl-wrap more-card">
        {revoked || !token ? (
          <p role="alert">{h.revoked}</p>
        ) : (
          data && (
            <>
              <h1>{h.title(data.helper)}</h1>
              <p>{h.lead}</p>
              {data.requests.length === 0 && <p className="more-muted">{h.none}</p>}
              <ul className="more-list">
                {data.requests.map((r) => (
                  <li key={r.id}>
                    <b>{kid(r.child_id)?.avatar} {h.asks(kid(r.child_id)?.name ?? '', r.minutes)}</b>
                    {r.status === 'pending' ? (
                      <span className="more-actions">
                        <button type="button" className="wl-btn wl-btn-primary" onClick={() => void answer(r.id, true)}>{h.allow(r.minutes)}</button>
                        <button type="button" className="wl-btn wl-btn-ghost" onClick={() => void answer(r.id, false)}>{h.deny}</button>
                      </span>
                    ) : (
                      <span className="more-muted">{h.status[r.status]}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" className="wl-btn wl-btn-ghost" onClick={() => void load()}>🔄 {h.refresh}</button>
            </>
          )
        )}
      </section>
    </main>
  );
}
