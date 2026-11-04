import { ANIMALS, type Animal } from '../../game/animals';
import { beatButton, soundToggle, syncBeat } from '../../ui/controls';
import type { Mode, OrchestraContext } from '../context';

// «Играть»: свободная игра, можно включить ритм-секцию.

export class FreeMode implements Mode {
  readonly poolSize = ANIMALS.length;
  private hits = 0;

  constructor(private readonly ctx: OrchestraContext) {}

  enter() {
    const { ctx } = this;
    ctx.stage.setBubble(null);
    ctx.panel.append(
      soundToggle(ctx.soundMode, (mode) => {
        ctx.setSoundMode(mode);
        ctx.audio.click();
      }),
      beatButton(ctx.audio.beating, () => this.toggleBeat()),
    );
  }

  leave() {}

  onAnimal(animal: Animal) {
    if (this.ctx.playback.playing) this.ctx.playback.stop();
    this.ctx.hit(animal, this.ctx.soundMode);
    // Сыграл целый концерт — наклейка и навык «музыка».
    if (++this.hits === 30) {
      this.ctx.progress.skill('music', true);
      this.ctx.progress.sticker('first-concert');
    }
  }

  pause() {}

  private toggleBeat() {
    const { audio, root } = this.ctx;
    audio.unlock();
    if (audio.beating) audio.stopBeat();
    else audio.startBeat((beat) => (root.dataset.beat = String(beat % 2)));
    syncBeat(this.ctx.panel, root, audio.beating);
  }
}
