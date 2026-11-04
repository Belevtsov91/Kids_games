import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import { DrawingEngine } from '../engine/DrawingEngine';
import { palette, tools, type BrushTool } from '../tools';
import { sound } from '../audio/sound';
import { drawingsApi } from '../api/drawings';
import { rewardSaved } from '../api/rewards';
import { drawingTitle, tr } from '../i18n';
import { Gallery } from './Gallery';
import { ColoringStudio } from './ColoringStudio';
import paletteArt from '../../assets/icons/palette.svg';
import '../styles/drawing.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

export default function DrawingGame({ sdk }: { sdk: GameSdk }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DrawingEngine | null>(null);
  const api = useMemo(() => drawingsApi(sdk.api), [sdk]);
  const [tool, setTool] = useState<BrushTool>(tools[0]);
  const [color, setColor] = useState(palette[0]);
  const [canUndo, setCanUndo] = useState(false);
  const [save, setSave] = useState<SaveState>('idle');
  const [gallery, setGallery] = useState(false);
  const [coloring, setColoring] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  // Движок создаётся один раз; init у PixiJS асинхронный, а StrictMode монтирует эффект дважды — отсюда флаг.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    DrawingEngine.create(host, tools[0], palette[0]).then((engine) => {
      if (disposed) return engine.destroy();
      engineRef.current = engine;
      engine.onChange = () => {
        setCanUndo(engine.canUndo);
        setSave((current) => (current === 'saved' ? 'idle' : current));
      };
    });
    return () => {
      disposed = true;
      window.clearTimeout(saveTimer.current);
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

  const flash = (state: SaveState) => {
    setSave(state);
    window.clearTimeout(saveTimer.current);
    if (state === 'failed') saveTimer.current = window.setTimeout(() => setSave('idle'), 3000);
  };

  const saveDrawing = async () => {
    const engine = engineRef.current;
    if (!engine || engine.isEmpty || save === 'saving') return;
    flash('saving');
    try {
      await api.save(drawingTitle(), await engine.exportPng());
      sound.play('save');
      flash('saved');
      void rewardSaved(sdk, api, 'drawing');
    } catch {
      flash('failed');
    }
  };

  const openDrawing = useCallback(async (image: string) => {
    setGallery(false);
    await engineRef.current?.load(image).catch(() => undefined);
    setSave('idle');
  }, []);
  const closeGallery = useCallback(() => setGallery(false), []);

  const tx = tr();
  const saveLabel = tx.save[save];

  return (
    <div className="drawing">
      <div ref={hostRef} className="drawing-canvas" inert={coloring || undefined} aria-hidden={coloring || undefined} />
      {save === 'saved' && <div className="drawing-toast">{tx.savedToast}</div>}
      {save === 'failed' && <div className="drawing-toast is-error">{tx.failedToast}</div>}
      <div className="drawing-toolbar" inert={coloring || undefined} aria-hidden={coloring || undefined}>
        <div className="drawing-row">
          <button onClick={() => setColoring(true)} aria-label={tx.coloring} title={tx.coloring}><img src={paletteArt} alt="" style={{ width: '90%', height: '90%' }} /></button>
          {tools.map((t) => (
            <button
              key={t.id}
              className={t.id === tool.id ? 'active' : ''}
              aria-pressed={t.id === tool.id}
              onClick={() => {
                setTool(t);
                sound.play('click');
              }}
              aria-label={tx.tools[t.id]}
              title={tx.tools[t.id]}
            >
              {t.emoji}
            </button>
          ))}
          <span className="drawing-divider" />
          <button
            onClick={() => {
              engineRef.current?.undo();
              sound.play('undo');
            }}
            disabled={!canUndo}
            aria-label={tx.undo}
            title={tx.undo}
          >
            ↶
          </button>
          <button
            onClick={() => {
              engineRef.current?.clear();
              sound.play('clear');
            }}
            aria-label={tx.clear}
            title={tx.clearHint}
          >
            🗑️
          </button>
          <button onClick={() => void saveDrawing()} disabled={save === 'saving'} aria-label={saveLabel} title={saveLabel}>
            {save === 'saving' ? '⏳' : save === 'saved' ? '✅' : '💾'}
          </button>
          <button onClick={() => setGallery(true)} aria-label={tx.myDrawings} title={tx.myDrawings}>
            🖼️
          </button>
        </div>
        <div className="drawing-row" role="radiogroup" aria-label={tx.color}>
          {palette.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={c === color}
              className={`swatch ${c === color ? 'active' : ''}`}
              style={{ background: hex(c) }}
              onClick={() => {
                setColor(c);
                if (tool.id === 'eraser') setTool(tools[0]);
              }}
              aria-label={tx.colorOf(hex(c))}
            />
          ))}
        </div>
      </div>
      {gallery && <Gallery api={api} onOpen={(image) => void openDrawing(image)} onClose={closeGallery} />}
      {coloring && <ColoringStudio onClose={() => setColoring(false)} onSave={async (title, image) => { await api.save(title, image); sound.play('save'); void rewardSaved(sdk, api, 'coloring'); }} />}
    </div>
  );
}
