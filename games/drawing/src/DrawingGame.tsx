import { useEffect, useRef, useState } from 'react';
import { DrawingEngine } from './engine/DrawingEngine';
import { palette, tools, type BrushTool } from './tools';
import { sound } from './sound';
import './drawing.css';

export default function DrawingGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);
  const [tool, setTool] = useState<BrushTool>(tools[0]);
  const [color, setColor] = useState(palette[0]);

  // Движок создаётся один раз; init у PixiJS асинхронный, а StrictMode монтирует эффект дважды — отсюда флаг.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    DrawingEngine.create(host, tools[0], palette[0]).then((engine) => {
      if (disposed) engine.destroy();
      else engineRef.current = engine;
    });
    return () => {
      disposed = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.tool = tool;
  }, [tool]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.color = color;
  }, [color]);

  return (
    <div className="drawing">
      <div ref={hostRef} className="drawing-canvas" />
      <div className="drawing-toolbar">
        {tools.map((t) => (
          <button
            key={t.id}
            className={t.id === tool.id ? 'active' : ''}
            onClick={() => {
              setTool(t);
              sound.play('click');
            }}
            aria-label={t.label}
          >
            {t.emoji}
          </button>
        ))}
        <span className="drawing-divider" />
        {palette.map((c) => (
          <button
            key={c}
            className={`swatch ${c === color ? 'active' : ''}`}
            style={{ background: `#${c.toString(16).padStart(6, '0')}` }}
            onClick={() => setColor(c)}
            aria-label="Цвет"
          />
        ))}
        <span className="drawing-divider" />
        <button onClick={() => engineRef.current?.clear()} aria-label="Очистить">
          🗑️
        </button>
      </div>
    </div>
  );
}
