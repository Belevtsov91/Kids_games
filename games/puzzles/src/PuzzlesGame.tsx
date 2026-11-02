import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { GameSdk } from '@ig/sdk';
import { starterPuzzles, type PuzzleImage } from './catalog';
import { getImageSize, listSavedImages, readFileAsDataUrl, saveImage, type SavedPuzzleImage } from './imageLibrary';
import { recommendedGrid, shuffled, type Grid } from './puzzleMath';
import './puzzles.css';

type Puzzle = PuzzleImage | SavedPuzzleImage;
type Board = Array<number | null>;

function Piece({ piece, puzzle, grid, selected, onClick }: { piece: number; puzzle: Puzzle; grid: Grid; selected: boolean; onClick: () => void }) {
  const col = piece % grid.cols;
  const row = Math.floor(piece / grid.cols);
  return (
    <button
      className={`puzzle-piece ${selected ? 'is-selected' : ''}`}
      style={{
        backgroundImage: `url("${puzzle.imageUrl}")`,
        backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`,
        backgroundPosition: `${grid.cols === 1 ? 0 : (col / (grid.cols - 1)) * 100}% ${grid.rows === 1 ? 0 : (row / (grid.rows - 1)) * 100}%`,
      }}
      aria-label={`Деталь ${piece + 1}`}
      onClick={onClick}
    />
  );
}

export function PuzzlesGame({ sdk }: { sdk: GameSdk }) {
  const [saved, setSaved] = useState<SavedPuzzleImage[]>([]);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Grid>({ cols: 2, rows: 2 });
  const [pieces, setPieces] = useState<number[]>([]);
  const [board, setBoard] = useState<Board>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('Выбери картинку — и начнём!');

  useEffect(() => { listSavedImages().then(setSaved).catch(() => setMessage('Не удалось открыть сохранённые картинки')); }, []);

  const total = grid.cols * grid.rows;
  const complete = board.length === total && board.every((piece, index) => piece === index);
  const allPuzzles = useMemo(() => [...starterPuzzles, ...saved], [saved]);

  const start = (next: Puzzle, nextGrid = recommendedGrid(next.width, next.height)) => {
    const count = nextGrid.cols * nextGrid.rows;
    setPuzzle(next);
    setGrid(nextGrid);
    setPieces(shuffled(Array.from({ length: count }, (_, index) => index)));
    setBoard(Array.from({ length: count }, () => null));
    setSelected(null);
    setMessage('Выбери деталь снизу, потом нажми на её место.');
  };

  const place = (cell: number) => {
    if (selected === null || board[cell] !== null) return;
    setBoard((current) => current.map((piece, index) => (index === cell ? selected : piece)));
    setPieces((current) => current.filter((piece) => piece !== selected));
    setSelected(null);
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Нужна картинка: PNG, JPG или WEBP.');
    try {
      const imageUrl = await readFileAsDataUrl(file);
      const { width, height } = await getImageSize(imageUrl);
      const image: SavedPuzzleImage = {
        id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, '') || 'Мой пазл', imageUrl, width, height, createdAt: new Date().toISOString(),
      };
      await saveImage(image);
      setSaved((current) => [image, ...current]);
      const nextGrid = recommendedGrid(width, height);
      start(image, nextGrid);
      setMessage(`Картинка ${width} × ${height}. Рекомендуем ${nextGrid.cols} × ${nextGrid.rows} = ${nextGrid.cols * nextGrid.rows} деталей.`);
    } catch {
      setMessage('Эту картинку не получилось сохранить. Попробуй другую.');
    }
  };

  useEffect(() => {
    if (complete) setMessage('Ура! Пазл собран! ⭐');
  }, [complete]);

  return (
    <main className="puzzles">
      <header className="puzzles-header">
        <button className="exit-button" onClick={sdk.exit}>← В меню</button>
        <div><h1>Пазлы</h1><p>{message}</p></div>
        <label className="upload-button">＋ Своя картинка<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} /></label>
      </header>

      {!puzzle ? (
        <section className="puzzle-catalog" aria-label="Выбор пазла">
          {allPuzzles.map((item) => <button key={item.id} className="puzzle-card" onClick={() => start(item)}><img src={item.imageUrl} alt="" /><span>{item.title}</span><small>{item.width} × {item.height}</small></button>)}
        </section>
      ) : (
        <section className="game-area">
          <div className="game-topbar"><button onClick={() => setPuzzle(null)}>‹ К выбору</button><button onClick={() => start(puzzle, grid)}>↻ Заново</button><span>{pieces.length} деталей осталось</span></div>
          <div className="puzzle-board" style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }}>
            {board.map((piece, cell) => piece === null ? <button key={cell} className="puzzle-slot" onClick={() => place(cell)} aria-label={`Место ${cell + 1}`} /> : <Piece key={cell} piece={piece} puzzle={puzzle} grid={grid} selected={false} onClick={() => undefined} />)}
          </div>
          {complete ? <div className="win-card"><strong>Готово!</strong><button onClick={() => start(puzzle, grid)}>Ещё раз</button></div> : <div className="piece-tray" aria-label="Детали пазла">{pieces.map((piece) => <Piece key={piece} piece={piece} puzzle={puzzle} grid={grid} selected={selected === piece} onClick={() => setSelected(piece)} />)}</div>}
        </section>
      )}
    </main>
  );
}
