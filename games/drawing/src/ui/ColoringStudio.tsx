import { useEffect, useRef, useState } from 'react';
import { ColoringEngine, type ColoringTool } from '../engine/ColoringEngine';
import { palette } from '../tools';
import { coloringPages, type ColoringPage } from './coloringPages';
import '../styles/coloring.css';

interface Props { onClose(): void; onSave(title: string, image: string): Promise<void> }
const colors = palette.map(color => `#${color.toString(16).padStart(6, '0')}`);

export function ColoringStudio({ onClose, onSave }: Props) {
  const [page, setPage] = useState<ColoringPage | null>(null);
  const [tool, setTool] = useState<ColoringTool>('fill');
  const [color, setColor] = useState(colors[0]);
  const [zoom, setZoom] = useState(1);
  const [sheetWidth, setSheetWidth] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'load-error'>('ready');
  const [leave, setLeave] = useState<'catalog' | 'close' | 'menu' | null>(null);
  const menuLink = useRef<HTMLAnchorElement | null>(null);
  const bypassExit = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ColoringEngine | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (leave) confirmRef.current?.focus(); }, [leave]);
  useEffect(() => {
    const viewport = scrollRef.current;
    if (!page || !viewport) return;
    const fit = () => setSheetWidth(Math.max(100, Math.min(viewport.clientWidth - 24, (viewport.clientHeight - 24) * 1.5)));
    const observer = new ResizeObserver(fit);
    observer.observe(viewport); fit();
    return () => observer.disconnect();
  }, [page]);
  useEffect(() => {
    if (!page || !canvasRef.current) return;
    const engine = new ColoringEngine(canvasRef.current);
    let disposed = false;
    engineRef.current = engine;
    engine.onChange = () => { setCanUndo(engine.canUndo); setDirty(true); setStatus('ready'); };
    setStatus('loading'); setDirty(false); setCanUndo(false); setZoom(1);
    engine.load(page.src).then(() => { if (!disposed) setStatus('ready'); }).catch(() => { if (!disposed) setStatus('load-error'); });
    return () => { disposed = true; engine.destroy(); engineRef.current = null; };
  }, [page]);
  useEffect(() => { if (engineRef.current) { engineRef.current.tool = tool; engineRef.current.color = color; } }, [tool, color, page]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => { if (!bypassExit.current) { event.preventDefault(); event.returnValue = ''; } };
    const guardLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || bypassExit.current || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      menuLink.current = link; setLeave('menu');
    };
    window.addEventListener('beforeunload', guard);
    document.addEventListener('click', guardLink, true);
    return () => { window.removeEventListener('beforeunload', guard); document.removeEventListener('click', guardLink, true); };
  }, [dirty]);

  const exit = (target: 'catalog' | 'close') => {
    if (status === 'saving') return;
    if (dirty) { setLeave(target); return; }
    if (target === 'close') onClose(); else setPage(null);
  };
  const save = async () => {
    if (!page || !engineRef.current || status === 'saving') return;
    setStatus('saving');
    try { await onSave(page.title, engineRef.current.exportPng()); setDirty(false); setStatus('saved'); }
    catch { setStatus('error'); }
  };
  const locked = status === 'loading' || status === 'saving' || status === 'load-error';
  return (
    <section className="coloring-studio" aria-label="Раскраски">
      <header className="coloring-header">
        <div><small>МАСТЕРСКАЯ ЦВЕТА</small><h2>{page?.title ?? 'Выбери свою историю'}</h2></div>
        <button ref={closeRef} onClick={() => exit('close')} disabled={status === 'saving'}>К рисованию</button>
      </header>
      {!page ? <div className="coloring-catalog">{coloringPages.map(item => (
        <button key={item.id} onClick={() => setPage(item)}><img src={item.thumbnail} alt="" loading="lazy" /><strong>{item.title}</strong><span>Открыть раскраску ↗</span></button>
      ))}</div> : <>
        <div className="coloring-actions">
          <button onClick={() => exit('catalog')} disabled={status === 'saving'}>‹ Все раскраски</button>
          <label>Масштаб <input aria-label="Масштаб раскраски" type="range" min="1" max="3" step="0.25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
          <output>{Math.round(zoom * 100)}%</output>
          <button onClick={() => void save()} disabled={locked}>{status === 'saving' ? 'Сохраняю…' : 'Сохранить в альбом'}</button>
        </div>
        <p className="coloring-status" role="status">{status === 'loading' ? 'Открываю рисунок…' : status === 'load-error' ? 'Не получилось открыть рисунок. Вернись к выбору и попробуй ещё раз.' : status === 'error' ? 'Не удалось сохранить. Рисунок остался здесь — попробуй ещё раз.' : status === 'saved' ? 'Готово! Раскраска сохранена в альбом.' : 'Заливка — касание области. Кисть — свободный штрих. Увеличь рисунок для мелких деталей.'}</p>
        <div ref={scrollRef} className="coloring-scroll" tabIndex={0} aria-label="Лист раскраски. Прокручивай увеличенный рисунок">
          <div className="coloring-sheet" style={{ width: sheetWidth ? `${sheetWidth * zoom}px` : '100%' }}>
            <canvas ref={canvasRef} aria-label={`Раскраска: ${page.title}`} style={{ pointerEvents: locked || leave ? 'none' : 'auto' }} />
          </div>
        </div>
        <fieldset className="coloring-controls" disabled={locked || !!leave}>
          <legend className="coloring-sr">Инструменты и цвета</legend>
          <div className="coloring-tools" role="group" aria-label="Инструменты раскраски">
            {([['fill', 'Заливка'], ['brush', 'Кисть'], ['eraser', 'Ластик']] as const).map(([id, label]) => <button key={id} aria-pressed={tool === id} onClick={() => setTool(id)}>{label}</button>)}
            <button onClick={() => engineRef.current?.undo()} disabled={!canUndo}>Отменить</button>
            <button onClick={() => engineRef.current?.clear()}>Очистить цвет</button>
          </div>
          <div className="coloring-colors" role="group" aria-label="Цвета раскраски">{colors.map(value => <button key={value} aria-label={`Цвет ${value}`} aria-pressed={value === color} style={{ background: value }} onClick={() => { setColor(value); if (tool === 'eraser') setTool('fill'); }} />)}</div>
        </fieldset>
      </>}
      {leave && <div className="coloring-confirm" role="alertdialog" aria-modal="true" aria-labelledby="leave-coloring-title" onKeyDown={e => {
        if (e.key === 'Escape') { setLeave(null); closeRef.current?.focus(); }
        if (e.key === 'Tab') {
          const buttons = [...e.currentTarget.querySelectorAll('button')];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          buttons[(index + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus(); e.preventDefault();
        }
      }}><div><h3 id="leave-coloring-title">Выйти без сохранения?</h3><p>Несохранённый цвет на этом листе будет потерян. Можно вернуться и сохранить его в альбом.</p><button ref={confirmRef} onClick={() => { setLeave(null); closeRef.current?.focus(); }}>Продолжить раскрашивать</button><button onClick={() => { const target = leave; setLeave(null); setDirty(false); if (target === 'menu') { bypassExit.current = true; menuLink.current?.click(); } else if (target === 'close') onClose(); else setPage(null); }}>Выйти без сохранения</button></div></div>}
    </section>
  );
}
