import type { Sfx } from '../audio/Sfx';
import type { SimEvent, Simulation } from '../game/simulation';
import type { Renderer } from '../render';

// Звуки и частицы в ответ на события физики. Победа и проигрыш передаются дальше в onWin/onLose.

interface Feedback {
  sfx: Sfx;
  renderer: Renderer;
  onWin(): void;
  onLose(): void;
}

export function simFeedback(sim: Simulation, { sfx, renderer, onWin, onLose }: Feedback) {
  // Цветок растёт над горшком.
  const flower = { x: sim.level.pot.x, y: sim.level.pot.y - 120 };
  return (e: SimEvent) => {
    switch (e.type) {
      case 'splash':
        sfx.splash(e.speed);
        if (e.speed > 4) renderer.burst(e.x, e.y, 'splash');
        break;
      case 'collect':
        sfx.collect(e.count);
        renderer.burst(e.x, e.y, 'collect');
        break;
      case 'swallow':
        sfx.swallow();
        renderer.burst(e.x, e.y, 'swallow');
        break;
      case 'stage':
        if (e.stage < 4) {
          sfx.grow();
          renderer.burst(flower.x, flower.y + 40, 'grow');
        }
        break;
      case 'win':
        sfx.win();
        renderer.burst(flower.x, flower.y - 20, 'win');
        onWin();
        break;
      case 'lose':
        onLose();
        break;
    }
  };
}
