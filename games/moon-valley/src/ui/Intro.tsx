// Заставка перед входом в долину: обложка, название, «Начать» или «Продолжить (уровень N)» и выход в меню.

import cover from '../../assets/moon-valley-cover.png';
import type { ValleyState } from '../game/valley';
import { tr } from '../i18n';

export function Intro({ state, onStart, onExit }: { state: ValleyState; onStart: () => void; onExit: () => void }) {
  return (
    <main
      className="mv-intro"
      style={{ backgroundImage: `linear-gradient(90deg, rgb(14 25 54 / .84), rgb(14 25 54 / .2)), url(${cover})` }}
    >
      <section>
        <span className="mv-moon">☾</span>
        <p>{tr().intro.tag}</p>
        <h1>
          {tr().intro.title[0]}
          <br />
          {tr().intro.title[1]}
        </h1>
        <p>{tr().intro.text}</p>
        <button onClick={onStart}>{state.quest.index > 0 || state.level > 1 ? tr().intro.resume(state.level) : tr().intro.start} ✨</button>
        <button className="mv-link" onClick={onExit}>
          {tr().intro.menu}
        </button>
      </section>
    </main>
  );
}
