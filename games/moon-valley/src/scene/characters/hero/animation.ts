// Какую анимацию играет герой в этом кадре: взмах жезлом, удар, действие, прыжок, бег, шаг или покой.

import type { Runtime } from '../../../app/runtime';
import type { useAnimator } from '../../models';

type Animator = ReturnType<typeof useAnimator>;

export function playHeroAnimation(
  anim: Animator,
  runtime: Runtime,
  lastCast: { current: number },
  airborneUp: boolean,
  moving: number,
) {
  const now = runtime.time;
  const action = runtime.action && runtime.action.until > now ? runtime.action.name : null;
  if (runtime.cast !== lastCast.current) {
    lastCast.current = runtime.cast;
    anim.play(['Sword_Slash'], { once: true, fade: 0.08, speed: 1.6 });
  } else if (action === 'hit') anim.play(['HitRecieve'], { fade: 0.08 });
  else if (action === 'interact') anim.play(['Interact']);
  else if (action === 'wave') anim.play(['Wave']);
  else if (action === 'cast') {
    /* доигрывается взмах */
  } else if (airborneUp) anim.play(['Roll'], { fade: 0.1, speed: 1.3 });
  else if (moving > 4) anim.play(['Run']);
  else if (moving > 0.3) anim.play(['Walk']);
  else anim.play(['Idle']);
}
