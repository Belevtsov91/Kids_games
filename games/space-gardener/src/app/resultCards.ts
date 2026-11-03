import type { ProgressStore } from '../api/progress';
import type { Sfx } from '../audio/Sfx';
import { starsFor } from '../game/scoring';
import type { Simulation } from '../game/simulation';
import type { ResultOverlay } from '../ui/ResultOverlay';
import { lightUpStars, loseCardHtml, winCardHtml } from '../ui/resultCards';

// Карточки конца уровня: победа (звёзды за экономию чернил, сохранение результата) и проигрыш.
// Карточка появляется с задержкой: сначала распускается цветок или докатываются капли.

const BLOOM_MS = 1500;
const LOSE_CARD_DELAY_MS = 700;

interface Deps {
  overlay: ResultOverlay;
  progress: ProgressStore;
  sfx: Sfx;
}

export function showWinCard({ overlay, progress, sfx }: Deps, sim: Simulation, isLastLevel: boolean) {
  const { level, inkUsed } = sim;
  const stars = starsFor(inkUsed, level.ink);
  overlay.showLater(BLOOM_MS, winCardHtml(stars, isLastLevel), (card) => {
    void progress.record(level.id, stars);
    lightUpStars(card, stars, (i) => sfx.star(i));
  });
}

export function showLoseCard({ overlay, sfx }: Deps, sim: Simulation) {
  // Капли ещё докатываются: счёт берём в момент показа карточки.
  overlay.showLater(LOSE_CARD_DELAY_MS, () => loseCardHtml(sim.collected, sim.level.need), () => sfx.lose());
}
