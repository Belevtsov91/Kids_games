import { Link } from 'react-router';
import { AskTime } from './AskTime';
import type { KidTime } from './KidStatus';
import { useKidText } from './text';

/** Экран вместо игры, когда время кончилось или идут тихие часы. Игра уже закрыта и сохранилась. */
export function TimeUpScreen({ time }: { time: KidTime }) {
  const k = useKidText();
  const quiet = time.blocked === 'quiet';
  return (
    <div className="kid-rest" role="alertdialog" aria-labelledby="rest-title" data-testid="time-up">
      <div className="kid-rest-card">
        <span className="kid-rest-bear" aria-hidden="true">{quiet ? '🌙' : '🐻'}</span>
        <h1 id="rest-title">{quiet ? k.timeUp.quietTitle : k.timeUp.limitTitle}</h1>
        <p>{quiet ? k.timeUp.quietText(time.quietTo ?? '') : k.timeUp.limitText}</p>
        {!quiet && <AskTime />}
        <div className="kid-rest-actions">
          <Link to="/dashboard" className="dash-btn dash-btn-ghost">{k.timeUp.back}</Link>
          <Link to="/me" className="dash-btn dash-btn-ghost">{k.me.toMe}</Link>
        </div>
      </div>
    </div>
  );
}

/** Напоминание о перерыве поверх игры. */
export function PauseScreen({ onGo }: { onGo: () => void }) {
  const k = useKidText();
  return (
    <div className="kid-rest kid-rest-soft" role="alertdialog" aria-labelledby="pause-title">
      <div className="kid-rest-card">
        <span className="kid-rest-bear" aria-hidden="true">🙆</span>
        <h1 id="pause-title">{k.pause.title}</h1>
        <p>{k.pause.text}</p>
        <button type="button" className="dash-btn dash-btn-primary" onClick={onGo} autoFocus>
          {k.pause.go}
        </button>
      </div>
    </div>
  );
}

/** Игру закрыл взрослый. */
export function ClosedGameScreen() {
  const k = useKidText();
  return (
    <div className="kid-rest">
      <div className="kid-rest-card">
        <span className="kid-rest-bear" aria-hidden="true">🔒</span>
        <h1>{k.closed.title}</h1>
        <p>{k.closed.text}</p>
        <Link to="/dashboard" className="dash-btn dash-btn-primary">{k.timeUp.back}</Link>
      </div>
    </div>
  );
}
