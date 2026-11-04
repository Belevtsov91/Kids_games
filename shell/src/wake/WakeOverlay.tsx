import { useEffect, useRef, useState } from 'react';
import { hintIndex } from './progress';
import { WakeScene } from './scene/WakeScene';
import { wakeStore, type WakeState } from './serverStatus';
import { useWakeText, WAKE_HINT_STEPS, WAKE_STUCK_S } from './text';

/** Сколько длится растворение экрана после того, как мишка помахал (как в wake.css). */
const LEAVE_MS = 650;

/** Экран поверх сайта: мишка просыпается, пока сервер не ответил. fading — сервер уже ответил, экран растворяется. */
export default function WakeOverlay({ state, fading = false }: { state: WakeState; fading?: boolean }) {
  const text = useWakeText();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [noScene, setNoScene] = useState(false);

  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    if (!host || !canvas) return;
    let timer = 0;
    let scene: WakeScene | null = null;
    try {
      scene = new WakeScene(canvas, host, {
        getState: wakeStore.get,
        onDone: () => {
          setLeaving(true);
          timer = window.setTimeout(() => wakeStore.finish(), LEAVE_MS);
        },
      });
    } catch {
      // Нет WebGL: без мишки, просто ждём сервер и сразу убираем экран.
      setNoScene(true);
    }
    return () => {
      clearTimeout(timer);
      scene?.dispose();
    };
  }, []);

  // Без WebGL сцены нет — её onDone не позовут, поэтому убираем экран сами: сразу, а со сценой — запасной таймер.
  const awake = state.phase === 'awake';
  useEffect(() => {
    if (!awake) return;
    const t = window.setTimeout(() => wakeStore.finish(), noScene ? 0 : 9000);
    return () => clearTimeout(t);
  }, [awake, noScene]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((performance.now() - state.since) / 1000), 1000);
    return () => clearInterval(id);
  }, [state.since]);

  const hint = awake ? text.awake : elapsed >= WAKE_STUCK_S ? text.stuck : text.hints[hintIndex(elapsed, WAKE_HINT_STEPS)];
  return (
    <div ref={hostRef} className={`wake${leaving || fading ? ' is-leaving' : ''}${awake ? ' is-awake' : ''}`} role="status" aria-live="polite">
      <canvas ref={canvasRef} className="wake-canvas" aria-label={text.scene} />
      <div className="wake-text">
        <h1 className="wake-title">{text.title[state.reason]}</h1>
        <p className="wake-lead">{text.lead[state.reason]}</p>
        <p className="wake-hint" key={hint}>
          <span className="wake-dots" aria-hidden="true"><i /><i /><i /></span>
          {hint}
        </p>
      </div>
    </div>
  );
}
