import { useEffect, useRef } from 'react';
import { startStarfield } from './starfield';

/** Закатное небо как на стартовой странице: звёзды, солнце, три слоя мягких облаков с параллаксом. */
export function DashSky() {
  const sky = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLCanvasElement>(null);

  useEffect(() => (stars.current ? startStarfield(stars.current) : undefined), []);

  useEffect(() => {
    const el = sky.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let px = 0, py = 0;
    // облака двигаются за курсором и при прокрутке; CSS читает --px/--py/--sy (см. dashboard-sky.css)
    const apply = () => {
      raf = 0;
      el.style.setProperty('--px', px.toFixed(3));
      el.style.setProperty('--py', py.toFixed(3));
      el.style.setProperty('--sy', String(Math.round(scrollY)));
    };
    const queue = () => (raf ||= requestAnimationFrame(apply));
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      queue();
    };
    addEventListener('pointermove', onMove);
    addEventListener('scroll', queue, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      removeEventListener('scroll', queue);
    };
  }, []);

  return (
    <div className="dash-sky" ref={sky} aria-hidden="true">
      <canvas ref={stars} className="dash-stars" />
      <div className="dash-sun" />
      {(['far', 'mid', 'near'] as const).map((layer) => (
        <div key={layer} className={`dash-clouds dash-clouds-${layer}`}>
          <svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice">
            <use href={`#dash-clouds-${layer}`} />
          </svg>
        </div>
      ))}
      <CloudDefs />
    </div>
  );
}

/** Облака: эллипсы, размытые шумом (feTurbulence) и освещённые с одной стороны, — мягкие, а не полигональные. */
function CloudDefs() {
  return (
    <svg width="0" height="0" className="dash-defs">
      <defs>
        <filter id="dash-fluff" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="5" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="120" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="6" result="b" />
          <feDiffuseLighting in="b" surfaceScale="6" lightingColor="#fff2e6" result="l">
            <feDistantLight azimuth="250" elevation="38" />
          </feDiffuseLighting>
          <feComposite in="l" in2="b" operator="in" result="lit" />
          <feBlend in="lit" in2="b" mode="multiply" />
        </filter>
        <radialGradient id="dash-cg" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fff6f0" />
          <stop offset=".7" stopColor="#f3d6ea" />
          <stop offset="1" stopColor="#c9a6d8" />
        </radialGradient>
        <radialGradient id="dash-cgw" cx="50%" cy="30%" r="65%">
          <stop offset="0" stopColor="#ffe9dc" />
          <stop offset=".6" stopColor="#e7b8d2" />
          <stop offset="1" stopColor="#9c78bf" />
        </radialGradient>
        <g id="dash-clouds-far" filter="url(#dash-fluff)" fill="url(#dash-cgw)">
          {[[120, 300, 200, 70], [420, 280, 230, 80], [760, 310, 210, 60], [1080, 270, 260, 85], [1420, 300, 230, 70]].map(([cx, cy, rx, ry]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} />
          ))}
        </g>
        <g id="dash-clouds-mid" filter="url(#dash-fluff)" fill="url(#dash-cg)">
          {[[60, 300, 240, 110], [380, 320, 260, 120], [700, 290, 220, 100], [1000, 320, 270, 120], [1330, 295, 240, 110], [1600, 320, 220, 110]].map(([cx, cy, rx, ry]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} />
          ))}
          <rect x="-100" y="320" width="1800" height="120" />
        </g>
        <g id="dash-clouds-near" filter="url(#dash-fluff)" fill="url(#dash-cg)">
          {[[200, 240, 300, 130], [620, 270, 280, 120], [1010, 230, 320, 140], [1420, 260, 300, 130]].map(([cx, cy, rx, ry]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} />
          ))}
          <rect x="-100" y="270" width="1800" height="200" />
        </g>
      </defs>
    </svg>
  );
}
