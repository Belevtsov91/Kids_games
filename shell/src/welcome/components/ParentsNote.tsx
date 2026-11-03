import { Link } from 'react-router';
import { useI18n } from '@/i18n/I18nProvider';

/** Короткий блок для взрослых внизу страницы. */
export function ParentsNote() {
  const { t } = useI18n();
  const p = t.parentsNote;
  return (
    <section className="wl-block">
      <div className="wl-wrap">
        <div className="wl-parents">
          <div>
            <h2>{p.title}</h2>
            <p>{p.text}</p>
            <Link to="/parents" className="wl-btn wl-btn-ghost wl-btn-sm wl-parents-more">{p.more}</Link>
          </div>
          <div className="wl-facts">
            {p.facts.map((f) => (
              <div key={f.title} className="wl-fact">
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
