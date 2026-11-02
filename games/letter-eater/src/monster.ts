// Монстрик-буквоед: SVG с глазами, которые следят за пальцем, и ртом, который открывается и жуёт.

const SVG = `
<svg class="le-monster-svg" viewBox="0 0 220 200" aria-hidden="true">
  <defs>
    <radialGradient id="le-body" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#a98bff"/>
      <stop offset="1" stop-color="#6a45e8"/>
    </radialGradient>
  </defs>
  <g class="le-m-body">
    <path class="le-m-horn" d="M62 48 Q50 14 72 20 Q78 36 80 46Z" fill="#ffb84d"/>
    <path class="le-m-horn" d="M158 48 Q170 14 148 20 Q142 36 140 46Z" fill="#ffb84d"/>
    <ellipse cx="74" cy="186" rx="26" ry="11" fill="#5333c7"/>
    <ellipse cx="146" cy="186" rx="26" ry="11" fill="#5333c7"/>
    <path d="M110 30 C176 30 204 82 200 128 C196 172 160 190 110 190 C60 190 24 172 20 128 C16 82 44 30 110 30Z" fill="url(#le-body)"/>
    <ellipse cx="110" cy="150" rx="58" ry="34" fill="#c9b8ff" opacity=".55"/>
    <circle cx="44" cy="120" r="7" fill="#ff8fb8" opacity=".7"/>
    <circle cx="176" cy="120" r="7" fill="#ff8fb8" opacity=".7"/>
    <g class="le-m-eye">
      <circle cx="80" cy="80" r="22" fill="#fff"/>
      <g class="le-m-pupil"><circle cx="80" cy="82" r="10" fill="#1f1640"/><circle cx="84" cy="77" r="3.5" fill="#fff"/></g>
      <rect class="le-m-lid" x="56" y="56" width="48" height="0" rx="24" fill="#6a45e8"/>
    </g>
    <g class="le-m-eye">
      <circle cx="140" cy="80" r="22" fill="#fff"/>
      <g class="le-m-pupil"><circle cx="140" cy="82" r="10" fill="#1f1640"/><circle cx="144" cy="77" r="3.5" fill="#fff"/></g>
      <rect class="le-m-lid" x="116" y="56" width="48" height="0" rx="24" fill="#6a45e8"/>
    </g>
    <g class="le-m-mouth">
      <ellipse cx="110" cy="130" rx="42" ry="26" fill="#3b0d2e"/>
      <ellipse cx="110" cy="146" rx="22" ry="9" fill="#ff5d8f"/>
      <path d="M78 110 L86 122 L94 110Z M126 110 L134 122 L142 110Z" fill="#fff"/>
    </g>
  </g>
</svg>`;

export type MonsterMood = 'idle' | 'open' | 'chomp' | 'sad' | 'happy';

export class Monster {
  readonly el: HTMLElement;
  private moodTimer = 0;
  private blinkTimer = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'le-monster';
    this.el.innerHTML = SVG;
    this.scheduleBlink();
  }

  /** Точка рта на экране: туда летят съеденные буквы. */
  mouthPoint() {
    const mouth = this.el.querySelector('.le-m-mouth ellipse')!.getBoundingClientRect();
    return { x: mouth.left + mouth.width / 2, y: mouth.top + mouth.height / 2 };
  }

  /** Настроение; с `ms` через это время монстрик вернётся в покой. */
  mood(mood: MonsterMood, ms = 0) {
    clearTimeout(this.moodTimer);
    this.el.dataset.mood = mood;
    // Перезапуск CSS-анимации, если настроение повторилось.
    this.el.classList.remove('le-monster--pulse');
    void this.el.offsetWidth;
    this.el.classList.add('le-monster--pulse');
    if (ms) this.moodTimer = window.setTimeout(() => (this.el.dataset.mood = 'idle'), ms);
  }

  /** Зрачки смотрят на точку экрана (палец, курсор, летящую букву). */
  lookAt(x: number, y: number) {
    for (const eye of this.el.querySelectorAll<SVGGElement>('.le-m-eye')) {
      const rect = eye.querySelector('circle')!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.min(1, Math.hypot(x - cx, y - cy) / 200);
      const pupil = eye.querySelector<SVGGElement>('.le-m-pupil')!;
      pupil.style.transform = `translate(${Math.cos(angle) * 9 * dist}px, ${Math.sin(angle) * 8 * dist}px)`;
    }
  }

  private scheduleBlink() {
    this.blinkTimer = window.setTimeout(() => {
      this.el.classList.add('le-monster--blink');
      window.setTimeout(() => this.el.classList.remove('le-monster--blink'), 160);
      this.scheduleBlink();
    }, 2200 + Math.random() * 3000);
  }

  dispose() {
    clearTimeout(this.moodTimer);
    clearTimeout(this.blinkTimer);
    this.el.remove();
  }
}
