import type { Texts } from '../i18n';

interface Props {
  t: Texts;
  stars: number;
  star: boolean;
  par: boolean;
  hasNext: boolean;
  onNext(): void;
  onAgain(): void;
}

/** Карточка победы: три звезды и за что каждая. */
export function ResultCard({ t, stars, star, par, hasNext, onNext, onAgain }: Props) {
  const rows: [boolean, string][] = [
    [true, t.starLit],
    [star, t.starStar],
    [par, t.starPar],
  ];
  return (
    <div className="lab-card" role="dialog" aria-label={t.litTitle}>
      <h2>💡 {t.litTitle}</h2>
      <p className="lab-stars" aria-label={`${stars} / 3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < stars ? 'on' : ''}>
            ★
          </span>
        ))}
      </p>
      <ul>
        {rows.map(([ok, label]) => (
          <li key={label} className={ok ? 'ok' : ''}>
            {ok ? '✔' : '○'} {label}
          </li>
        ))}
      </ul>
      <div className="lab-card-actions">
        {stars < 3 && <button onClick={onAgain}>🔧 {t.again}</button>}
        <button className="lab-primary" onClick={onNext}>
          {hasNext ? `${t.next} →` : `🗺 ${t.map}`}
        </button>
      </div>
    </div>
  );
}
