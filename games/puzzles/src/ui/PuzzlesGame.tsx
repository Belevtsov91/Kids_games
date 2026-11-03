import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { GameSdk } from '@ig/sdk';
import { starterPuzzles, type PuzzleImage } from '../game/catalog';
import { fits, gridForLevel, shuffled, type Grid, type LevelId } from '../game/puzzleMath';
import { openLibrary, prepareImage, type SavedPuzzleImage } from '../storage/imageLibrary';
import { usePieceDrag } from '../input/usePieceDrag';
import { createSound } from '../audio/sound';
import { Catalog } from './Catalog';
import { Board, DragGhost, Piece } from './Board';
import '../styles/puzzles.css';

type Puzzle = PuzzleImage | SavedPuzzleImage;
type Board = Array<number | null>;

export function PuzzlesGame({ sdk }: { sdk: GameSdk }) {
  const library = useMemo(() => openLibrary(sdk.profile?.id ?? null), [sdk]);
  const sound = useMemo(() => createSound(() => sdk.audio.muted), [sdk]);
  const [saved, setSaved] = useState<SavedPuzzleImage[]>([]);
  const [level, setLevel] = useState<LevelId>(() => sdk.storage.load<LevelId>(`level:${sdk.profile?.id ?? 'guest'}`) ?? 'auto');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Grid>({ cols: 2, rows: 2 });
  const [pieces, setPieces] = useState<number[]>([]);
  const [board, setBoard] = useState<Board>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState(true);
  const [missCell, setMissCell] = useState<number | null>(null);
  const [message, setMessage] = useState('Выбери картинку — и начнём!');
  const missTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    library
      .list()
      .then(setSaved)
      .catch(() => setMessage('Не удалось открыть сохранённые картинки'));
  }, [library]);
  useEffect(() => () => (window.clearTimeout(missTimer.current), sound.dispose()), [sound]);

  const total = grid.cols * grid.rows;
  const complete = puzzle !== null && board.length === total && board.every((piece, index) => piece === index);
  const allPuzzles = useMemo(() => [...saved, ...starterPuzzles], [saved]);
  const savedIds = useMemo(() => new Set(saved.map((item) => item.id)), [saved]);

  const start = (next: Puzzle, nextLevel = level) => {
    const nextGrid = gridForLevel(next.width, next.height, nextLevel);
    const count = nextGrid.cols * nextGrid.rows;
    setPuzzle(next);
    setGrid(nextGrid);
    setPieces(shuffled(Array.from({ length: count }, (_, index) => index)));
    setBoard(Array.from({ length: count }, () => null));
    setSelected(null);
    setMessage(`${count} деталей. Перетащи деталь на её место или нажми на деталь, а потом на место.`);
  };

  const chooseLevel = (next: LevelId) => {
    setLevel(next);
    sdk.storage.save(`level:${sdk.profile?.id ?? 'guest'}`, next);
  };

  const place = (piece: number, cell: number) => {
    if (board[cell] !== null) return;
    if (!fits(piece, cell)) {
      sound.miss();
      setMissCell(cell);
      window.clearTimeout(missTimer.current);
      missTimer.current = window.setTimeout(() => setMissCell(null), 450);
      setMessage('Не сюда — попробуй другое место 🙂');
      return;
    }
    const nextBoard = board.map((value, index) => (index === cell ? piece : value));
    setBoard(nextBoard);
    setPieces((current) => current.filter((value) => value !== piece));
    setSelected(null);
    if (nextBoard.every((value, index) => value === index)) {
      sound.win();
      setMessage('Ура! Пазл собран! ⭐');
    } else {
      sound.snap();
      setMessage('Отлично! Ищи следующую деталь.');
    }
  };

  const { drag, bind } = usePieceDrag(
    (piece, cell) => (cell === null ? setSelected(null) : place(piece, cell)),
    (piece) => {
      setSelected(piece);
      sound.pick();
    },
  );

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Нужна картинка: PNG, JPG или WEBP.');
    try {
      const { imageUrl, width, height } = await prepareImage(file);
      const image: SavedPuzzleImage = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Мой пазл',
        imageUrl,
        width,
        height,
        createdAt: new Date().toISOString(),
      };
      await library.save(image);
      setSaved((current) => [image, ...current]);
      start(image);
    } catch {
      setMessage('Эту картинку не получилось открыть. Попробуй другую.');
    }
  };

  const remove = async (id: string) => {
    await library.remove(id).catch(() => undefined);
    setSaved((current) => current.filter((item) => item.id !== id));
  };

  const aspect = puzzle ? puzzle.width / puzzle.height : 1;
  // Детали в лотке — того же размера и формы, что клетки на поле.
  const pieceAspect = aspect * (grid.rows / grid.cols);

  return (
    <main className={`puzzles ${drag ? 'is-dragging' : ''}`}>
      <header className="puzzles-header">
        <div>
          <h1>Пазлы</h1>
          <p aria-live="polite">{message}</p>
        </div>
      </header>

      {!puzzle ? (
        <Catalog
          puzzles={allPuzzles}
          savedIds={savedIds}
          level={level}
          onLevel={chooseLevel}
          onPick={(item) => start(item)}
          onUpload={chooseFile}
          onRemove={remove}
        />
      ) : (
        <section className="game-area" style={{ ['--piece-aspect' as string]: String(pieceAspect) }}>
          <div className="game-topbar">
            <button onClick={() => setPuzzle(null)}>‹ Картинки</button>
            <button onClick={() => start(puzzle)}>↻ Заново</button>
            <button className={hint ? 'is-active' : ''} aria-pressed={hint} onClick={() => setHint((value) => !value)}>
              👁 Подсказка
            </button>
            <span>{complete ? 'Готово!' : `Осталось: ${pieces.length}`}</span>
          </div>
          <div className="puzzle-play">
            <Board
              board={board}
              imageUrl={puzzle.imageUrl}
              aspect={aspect}
              grid={grid}
              hint={hint}
              missCell={missCell}
              onCell={(cell) => selected !== null && place(selected, cell)}
            />
            {complete ? (
              <div className="win-card">
                <strong>🎉 Готово!</strong>
                <button onClick={() => start(puzzle)}>Ещё раз</button>
                <button onClick={() => setPuzzle(null)}>Другой пазл</button>
              </div>
            ) : (
              <div className="piece-tray" aria-label="Детали пазла">
                {pieces.map((piece) => (
                  <Piece
                    key={piece}
                    piece={piece}
                    imageUrl={puzzle.imageUrl}
                    grid={grid}
                    className={`${selected === piece ? 'is-selected' : ''} ${drag?.piece === piece ? 'is-lifted' : ''}`}
                    onClick={() => {
                      setSelected((current) => (current === piece ? null : piece));
                      sound.pick();
                    }}
                    onPointerDown={bind(piece)}
                  />
                ))}
              </div>
            )}
          </div>
          {drag && <DragGhost drag={drag} imageUrl={puzzle.imageUrl} grid={grid} aspect={aspect} />}
        </section>
      )}
    </main>
  );
}
