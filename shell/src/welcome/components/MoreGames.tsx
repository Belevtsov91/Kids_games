import type { CSSProperties } from 'react';
import { SHOWCASE, SMALL_IDS } from '../showcase';

/** Остальные игры плитками: на главной они летают маленькими игрушками вокруг островов. */
export function MoreGames() {
  return (
    <section className="wl-block">
      <div className="wl-wrap">
        <div className="wl-section-head">
          <h2>И ещё шесть игр</h2>
          <p>Для самых маленьких и для тех, кто учит буквы и цифры.</p>
        </div>
        <div className="wl-minis">
          {SMALL_IDS.map((id) => {
            const g = SHOWCASE[id];
            return (
              <div key={id} className="wl-mini" style={{ '--c': g.color } as CSSProperties}>
                <div className="wl-mini-icon" aria-hidden="true">{g.icon}</div>
                <b>{g.title}</b>
                <span>{g.ages}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
