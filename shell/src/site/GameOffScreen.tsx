import { Link } from 'react-router';
import { useSiteText } from './text';

/** Игру выключил владелец сайта (сломалась, чиним): ребёнку — спокойное объяснение и путь назад. */
export function GameOffScreen() {
  const s = useSiteText();
  return (
    <div className="kid-rest">
      <div className="kid-rest-card">
        <span className="kid-rest-bear" aria-hidden="true">🛠️</span>
        <h1>{s.gameOffTitle}</h1>
        <p>{s.gameOffText}</p>
        <Link to="/dashboard" className="dash-btn dash-btn-primary">{s.back}</Link>
      </div>
    </div>
  );
}
