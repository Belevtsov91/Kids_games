import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { GameSdk } from '@ig/sdk';
import { starterPuzzles } from '../game/catalog';
import type { LevelId } from '../game/puzzleMath';
import { levelFits } from '../game/boardFit';
import { openLibrary, prepareImage, type SavedPuzzleImage } from '../storage/imageLibrary';
import { SAVE_FROM } from '../storage/progress';
import { usePieceDrag } from '../input/usePieceDrag';
import { useViewport } from '../input/useViewport';
import { usePuzzle } from '../app/usePuzzle';
import { createSound } from '../audio/sound';
import { tr } from '../i18n';
import { Catalog } from './Catalog';
import { Board, DragGhost } from './Board';
import { Tray } from './Tray';
import '../styles/puzzles.css';

export function PuzzlesGame({ sdk }: { sdk: GameSdk }) {
  const library = useMemo(() => openLibrary(sdk.profile?.id ?? null), [sdk]);
  const sound = useMemo(() => createSound(() => sdk.audio.muted), [sdk]);
  const view = useViewport();
  const game = usePuzzle(sdk, sound, view);
  const { puzzle, grid, pieces, board, complete } = game;
  const [saved, setSaved] = useState<SavedPuzzleImage[]>([]);
  const [level, setLevel] = useState<LevelId>(() => sdk.storage.load<LevelId>(`level:${sdk.profile?.id ?? 'guest'}`) ?? 'auto');
  const [hint, setHint] = useState(true);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    library
      .list()
      .then(setSaved)
      .catch(() => game.setMessage(tr().libraryFailed));
  }, [library]);
  useEffect(() => () => sound.dispose(), [sound]);
  useEffect(() => {
    if (!confirmRestart) return;
    const timer = window.setTimeout(() => setConfirmRestart(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmRestart]);

  const allPuzzles = useMemo(() => [...saved, ...starterPuzzles], [saved]);
  const savedIds = useMemo(() => new Set(saved.map((item) => item.id)), [saved]);

  const chooseLevel = (next: LevelId) => {
    setLevel(next);
    sdk.storage.save(`level:${sdk.profile?.id ?? 'guest'}`, next);
  };

  // Большой начатый пазл не сбрасываем одним случайным нажатием: «Заново» надо нажать дважды.
  const restart = () => {
    if (!puzzle) return;
    const started = board.some((piece) => piece !== null);
    if (grid.cols * grid.rows >= SAVE_FROM && started && !complete && !confirmRestart) return setConfirmRestart(true);
    setConfirmRestart(false);
    game.start(puzzle, level, true);
  };

  const { dragPiece, bind, ghostRef } = usePieceDrag({
    boardRef,
    grid,
    hint,
    onDrop: (piece, cell) => (cell === null ? game.setSelected(null) : game.place(piece, cell)),
    onStart: (piece) => {
      game.setSelected(piece);
      sound.pick();
    },
  });

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return game.setMessage(tr().needImage);
    try {
      const { imageUrl, width, height } = await prepareImage(file);
      const image: SavedPuzzleImage = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || tr().myPuzzle,
        imageUrl,
        width,
        height,
        createdAt: new Date().toISOString(),
      };
      await library.save(image);
      setSaved((current) => [image, ...current]);
      game.start(image, level);
    } catch {
      game.setMessage(tr().badImage);
    }
  };

  const remove = async (id: string) => {
    await library.remove(id).catch(() => undefined);
    setSaved((current) => current.filter((item) => item.id !== id));
  };

  const t = tr();
  const aspect = puzzle ? puzzle.width / puzzle.height : 1;
  // Детали в лотке — той же формы, что клетки на поле.
  const pieceAspect = aspect * (grid.rows / grid.cols);

  return (
    <main className={`puzzles ${dragPiece !== null ? 'is-dragging' : ''}`}>
      <header className="puzzles-header">
        <div>
          <h1>{t.title}</h1>
          <p aria-live="polite">{game.message}</p>
        </div>
      </header>

      {!puzzle ? (
        <Catalog
          puzzles={allPuzzles}
          savedIds={savedIds}
          level={level}
          fits={(item) => levelFits(view, item)}
          onLevel={chooseLevel}
          onPick={(item) => game.start(item, level)}
          onUpload={chooseFile}
          onRemove={remove}
        />
      ) : (
        <section className="game-area" style={{ ['--piece-aspect' as string]: String(pieceAspect) }}>
          <div className="game-topbar">
            <button onClick={() => game.setPuzzle(null)}>{t.pictures}</button>
            <button className={confirmRestart ? 'is-warning' : ''} onClick={restart}>
              {confirmRestart ? t.sureRestart : t.restart}
            </button>
            <button className={hint ? 'is-active' : ''} aria-pressed={hint} onClick={() => setHint((value) => !value)}>
              {t.hint}
            </button>
            <span>{complete ? t.done : t.left(pieces.length)}</span>
          </div>
          <div className="puzzle-play">
            <Board
              boardRef={boardRef}
              board={board}
              imageUrl={puzzle.imageUrl}
              aspect={aspect}
              grid={grid}
              hint={hint}
              missCell={game.missCell}
              onCell={(cell) => game.selected !== null && game.place(game.selected, cell)}
            />
            {complete ? (
              <div className="win-card">
                <strong>🎉 {t.done}</strong>
                <button onClick={() => game.start(puzzle, level, true)}>{t.again}</button>
                <button onClick={() => game.setPuzzle(null)}>{t.another}</button>
              </div>
            ) : (
              <Tray
                key={puzzle.id}
                pieces={pieces}
                grid={grid}
                imageUrl={puzzle.imageUrl}
                selected={game.selected}
                dragPiece={dragPiece}
                onSelect={game.select}
                bind={bind}
              />
            )}
          </div>
          {dragPiece !== null && <DragGhost piece={dragPiece} imageUrl={puzzle.imageUrl} grid={grid} ghostRef={ghostRef} />}
        </section>
      )}
    </main>
  );
}
