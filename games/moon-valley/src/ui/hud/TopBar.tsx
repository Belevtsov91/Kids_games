// Верхняя панель: карточка героя (уровень, опыт, сердечки), ресурсы, кнопки журнала и дня/ночи.

import { xpForNext, type ValleyState } from '../../game/valley';
import { MAX_HEARTS } from '../../app/runtime';
import { tr } from '../../i18n';
import { moon, seed, star, water } from './art';

export function TopBar({
  state,
  hearts,
  night,
  saveText,
  onNight,
  onLog,
}: {
  state: ValleyState;
  hearts: number;
  night: boolean;
  saveText: string;
  onNight(): void;
  onLog(): void;
}) {
  const h = tr().hud;
  return (
    <header className="mv-top">
      <div className="mv-hero-card">
        <span className="mv-avatar">🧝</span>
        <div>
          <strong>{h.hero(state.level)}</strong>
          <div className="mv-xp" title={`${state.xp} / ${xpForNext(state.level)}`}>
            <i style={{ width: `${Math.min(100, (state.xp / xpForNext(state.level)) * 100)}%` }} />
          </div>
          <div className="mv-hearts" aria-label={h.hearts(hearts, MAX_HEARTS)}>
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <span key={i} className={i < hearts ? '' : 'empty'}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mv-res" title={saveText}>
        <span aria-label={`${h.starlight}: ${state.starlight}`}><img className="mv-resource-art" src={star} alt="" /> {state.starlight}</span>
        <span aria-label={`${h.seeds}: ${state.seeds}`}><img className="mv-resource-art" src={seed} alt="" /> {state.seeds}</span>
        <span aria-label={`${h.water}: ${state.water}`}><img className="mv-resource-art" src={water} alt="" /> {state.water}</span>
      </div>
      <button onClick={onLog} aria-label={h.log}>
        📜
      </button>
      <button onClick={onNight} aria-label={night ? h.day : h.night}>
        {night ? '☀️' : <img className="mv-resource-art" src={moon} alt="" />}
      </button>
    </header>
  );
}
