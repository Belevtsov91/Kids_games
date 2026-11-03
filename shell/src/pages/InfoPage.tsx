import { useEffect, type CSSProperties } from 'react';
import { INFO_PAGES } from '@/info/content';
import { SiteFooter } from '@/info/components/SiteFooter';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { Fill } from '@/info/components/Fill';
import { SITE } from '@/info/site';
import type { InfoSlug } from '@/info/types';

/** Информационная страница (документы, родителям, о проекте). Открыта и гостям, и тем, кто вошёл. */
export function InfoPage({ slug }: { slug: InfoSlug }) {
  const page = INFO_PAGES[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = `${page.title} · ${SITE.name}`;
    return () => {
      document.title = prev;
    };
  }, [page]);

  return (
    <main className="wl info" style={{ '--c': page.color } as CSSProperties}>
      <SiteTopbar />
      <section className="info-hero">
        <div className="wl-wrap">
          <span className="info-eyebrow">
            <span aria-hidden="true">{page.icon}</span>
            {page.eyebrow}
          </span>
          <h1>{page.title}</h1>
          {page.dated && (
            <p className="info-date">
              Редакция от <Fill value={SITE.docsDate} />
            </p>
          )}
        </div>
      </section>
      <div className="wl-wrap">
        <article className="info-doc">
          {page.summary && (
            <div className="info-summary">
              <b>Коротко</b>
              {page.summary}
            </div>
          )}
          {page.body}
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
