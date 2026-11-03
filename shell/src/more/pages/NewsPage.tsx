import { SiteFooter } from '@/info/components/SiteFooter';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { useI18n } from '@/i18n/I18nProvider';
import { useMoreText } from '../text';

/** «Что нового» (/news): новые игры и возможности, коротко и с датой. */
export function NewsPage() {
  const n = useMoreText().news;
  const { locale } = useI18n();
  return (
    <main className="wl info more-page">
      <SiteTopbar />
      <section className="wl-wrap">
        <h1>{n.title}</h1>
        <p>{n.lead}</p>
        <ol className="news-list">
          {n.items.map((item) => (
            <li key={item.title}>
              <span className="news-icon" aria-hidden="true">{item.icon}</span>
              <div>
                <time dateTime={item.date}>{new Date(`${item.date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <SiteFooter />
    </main>
  );
}
