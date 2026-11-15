import { useState } from 'react';
import { del, get, post, put } from '../api/client';
import type { Lang, News, SiteFlags, Texts } from '../api/types';
import { useLoad } from '../app/useLoad';
import { LANGS, useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card, LoadState, Pill } from '../ui/parts';

// Управление сайтом: режим обслуживания, объявление для родителей, «Что нового».

function LangFields({ prefix, value, onChange, rows = 1 }: { prefix: string; value: Texts; onChange: (v: Texts) => void; rows?: number }) {
  return (
    <div className="langs">
      {LANGS.map((l) => (
        <label key={l.id} htmlFor={`${prefix}-${l.id}`}>
          {l.label}
          <textarea className="inp" id={`${prefix}-${l.id}`} rows={rows} value={value[l.id] ?? ''} onChange={(e) => onChange({ ...value, [l.id]: e.target.value })} />
        </label>
      ))}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export function SitePage({ refreshMe }: { refreshMe: () => Promise<void> }) {
  const { t, when, lang } = useI18n();
  const { run, danger } = useFeedback();
  const flags = useLoad(() => get<SiteFlags>('/site'), []);
  const news = useLoad(() => get<News[]>('/news'), [], false);
  const [banner, setBanner] = useState<Texts | null>(null);
  const [draft, setDraft] = useState<(Omit<News, 'id'> & { id?: string }) | null>(null);
  const f = flags.data;
  const shownBanner = banner ?? f?.banner ?? {};

  const maintenance = async (on: boolean) => {
    const answer = on ? await danger({ title: t('site.close'), text: t('site.closeText'), word: t('word.close') }) : {};
    if (answer && (await run(() => post('/site/maintenance', { on, ...answer })))) await flags.reload();
  };
  const saveBanner = async (value: Texts) => {
    if (await run(() => put('/site/banner', { banner: value }))) {
      setBanner(null);
      await flags.reload();
    }
  };
  const saveNews = async () => {
    if (!draft) return;
    const body = { day: draft.day, titles: draft.titles, bodies: draft.bodies, published: draft.published };
    if (await run(() => (draft.id ? put(`/news/${draft.id}`, body) : post('/news', body)))) {
      setDraft(null);
      await news.reload();
    }
  };
  const removeNews = async (id: string) => {
    if (await run(() => del(`/news/${id}`))) await news.reload();
  };

  return (
    <>
      <LoadState state={flags} />
      {f && (
        <div className="g2">
          <Card title={t('site.maintenance')}>
            <p style={{ marginBottom: 8 }}>{f.maintenance ? <Pill tone="bad">{t('site.closed')}</Pill> : <Pill tone="ok">{t('site.open')}</Pill>}</p>
            <button className={`btn${f.maintenance ? '' : ' dng'}`} onClick={() => void maintenance(!f.maintenance)}>{f.maintenance ? t('site.reopen') : t('site.close')}</button>
            <p className="note" style={{ marginTop: 8 }}>{t('site.maintenanceNote')}</p>
          </Card>
          <Card title={t('site.readonlyTitle')}>
            <p style={{ marginBottom: 8 }}>{f.admin_readonly ? <Pill tone="warn">{t('readonly.onShort')}</Pill> : <Pill tone="ok">{t('readonly.offShort')}</Pill>}</p>
            <button className="btn" onClick={() => void run(() => post('/site/readonly', { on: !f.admin_readonly })).then(() => Promise.all([flags.reload(), refreshMe()]))}>
              {f.admin_readonly ? t('readonly.disable') : t('readonly.enable')}
            </button>
          </Card>
        </div>
      )}
      {f && (
        <Card title={t('site.banner')}>
          <LangFields prefix="banner" value={shownBanner} onChange={setBanner} rows={2} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn pri" onClick={() => void saveBanner(shownBanner)}>{t('site.bannerShow')}</button>
            <button className="btn" onClick={() => void saveBanner({})}>{t('site.bannerHide')}</button>
            <span className="note">{Object.keys(f.banner).length ? t('site.bannerOn') : t('site.bannerOff')}</span>
          </div>
        </Card>
      )}
      <Card title={t('site.news')} aside={<button className="btn sm" onClick={() => setDraft({ day: today(), titles: {}, bodies: {}, published: false })}>{t('site.newsAdd')}</button>}>
        {draft && (
          <div className="col" style={{ marginBottom: 12 }}>
            <div className="row">
              <input className="inp" id="news-day" type="date" value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} />
              <label className="sw"><input type="checkbox" id="news-published" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> {t('site.newsPublished')}</label>
            </div>
            <span className="note">{t('site.newsTitle')}</span>
            <LangFields prefix="news-title" value={draft.titles} onChange={(titles) => setDraft({ ...draft, titles })} />
            <span className="note">{t('site.newsBody')}</span>
            <LangFields prefix="news-body" value={draft.bodies} onChange={(bodies) => setDraft({ ...draft, bodies })} rows={3} />
            <div className="row">
              <button className="btn pri" onClick={() => void saveNews()}>{t('save')}</button>
              <button className="btn" onClick={() => setDraft(null)}>{t('cancel')}</button>
            </div>
          </div>
        )}
        <LoadState state={news} />
        {news.data && (
          <div className="tw"><table>
            <tbody>{news.data.map((n) => (
              <tr key={n.id}>
                <td>{when(n.day, false)}</td>
                <td className="wrap">{n.titles[lang as Lang] ?? n.titles.ru ?? Object.values(n.titles)[0] ?? '—'}</td>
                <td className="note">{Object.keys(n.titles).join(' ')}</td>
                <td>{n.published ? <Pill tone="ok">{t('site.newsPublished')}</Pill> : <Pill tone="n">{t('site.newsDraft')}</Pill>}</td>
                <td className="row">
                  <button className="btn sm" onClick={() => setDraft({ ...n })}>{t('edit')}</button>
                  <button className="btn sm dng" onClick={() => void removeNews(n.id)}>{t('delete')}</button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {news.data && !news.data.length && <p className="note">{t('site.newsEmpty')}</p>}
      </Card>
    </>
  );
}
