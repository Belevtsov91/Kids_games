import { defineGame } from '@ig/sdk';

// Заготовка: холст, на котором касание рисует шарик. Замените на свою игру —
// на чём угодно (Pixi, Three, React…), добавив зависимости в package.json этой игры.
export default defineGame({
  mount(container, sdk) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;background:#fff';
    // sdk.comfort: крупные цели для «крупных кнопок», без анимаций для «меньше движения».
    const radius = sdk.comfort.bigButtons ? 44 : 30;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const taps = sdk.storage.load<number>('taps') ?? 0;
    let count = taps;
    const onDown = (e: PointerEvent) => {
      ctx.fillStyle = `hsl(${(count * 47) % 360} 80% 60%)`;
      ctx.beginPath();
      ctx.arc(e.offsetX, e.offsetY, radius, 0, Math.PI * 2);
      ctx.fill();
      sdk.storage.save('taps', ++count);
      // Успехи для родителя и альбома: навык и наклейка из манифеста.
      sdk.progress.skill('motor', true);
      sdk.progress.sticker('first-tap');
    };
    // За 2 минуты до конца времени: оболочка покажет плашку сама, игра может мягко завершиться.
    const offEnding = sdk.time.onEnding(() => (canvas.style.background = '#fff6e0'));
    canvas.addEventListener('pointerdown', onDown);

    return {
      unmount() {
        offEnding();
        canvas.removeEventListener('pointerdown', onDown);
        observer.disconnect();
        canvas.remove();
      },
    };
  },
});
