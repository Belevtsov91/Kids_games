// Звёзды в верхней половине неба и светлячки над облаками. Один canvas на весь экран, без three.js.
interface Star { x: number; y: number; r: number; p: number }
interface Fly { x: number; y: number; vx: number; vy: number; p: number }

export function startStarfield(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, raf = 0;
  let stars: Star[] = [], flies: Fly[] = [];

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 5000) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.5, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6 }));
    flies = Array.from({ length: w < 600 ? 12 : 26 }, () => ({ x: Math.random() * w, y: h * (0.45 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 0.25, vy: -Math.random() * 0.2 - 0.05, p: Math.random() * 6 }));
  };

  const draw = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = (1 - s.y / (h * 0.5)) * (0.55 + 0.45 * Math.sin(t / 900 + s.p));
      ctx.fillStyle = `rgba(255,246,216,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 7);
      ctx.fill();
    }
    for (const f of flies) {
      if (!reduce) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.y < h * 0.35) Object.assign(f, { y: h, x: Math.random() * w });
      }
      const a = 0.35 + 0.35 * Math.sin(t / 500 + f.p);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 9);
      g.addColorStop(0, `rgba(255,236,170,${a.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 9, 0, 7);
      ctx.fill();
    }
    if (!reduce && !document.hidden) raf = requestAnimationFrame(draw);
  };

  const wake = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  };
  size();
  wake();
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', wake);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', size);
    document.removeEventListener('visibilitychange', wake);
  };
}
