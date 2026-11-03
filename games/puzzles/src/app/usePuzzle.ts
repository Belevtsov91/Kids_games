// Состояние одного пазла: сетка, поле, лоток, выбор детали, сохранение недособранного большого пазла.
import { useEffect, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import type { PuzzleImage } from '../game/catalog';
import { fits, gridForLevel, shuffled, type Grid, type LevelId } from '../game/puzzleMath';
import { betterTurned, fitGrid, type Viewport } from '../game/boardFit';
import { loadProgress, saveProgress, SAVE_FROM } from '../storage/progress';
import type { SavedPuzzleImage } from '../storage/imageLibrary';
import type { createSound } from '../audio/sound';
import { tr } from '../i18n';

export type Puzzle = PuzzleImage | SavedPuzzleImage;
type Sound = ReturnType<typeof createSound>;

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

export function usePuzzle(sdk: GameSdk, sound: Sound, view: Viewport) {
  const profileId = sdk.profile?.id ?? null;
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Grid>({ cols: 2, rows: 2 });
  const [pieces, setPieces] = useState<number[]>([]);
  const [board, setBoard] = useState<Array<number | null>>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [missCell, setMissCell] = useState<number | null>(null);
  const [message, setMessage] = useState(() => tr().pick);
  const missTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(missTimer.current), []);

  const total = grid.cols * grid.rows;
  const complete = puzzle !== null && board.length === total && board.every((piece, index) => piece === index);

  /** Открыть пазл. Если этот большой пазл не дособран — продолжаем с того места; fresh — начать заново. */
  const start = (next: Puzzle, level: LevelId, fresh = false) => {
    const saved = fresh ? null : loadProgress(sdk.storage, profileId, next.id);
    if (fresh) saveProgress(sdk.storage, profileId, next.id, null);
    const nextGrid = saved?.grid ?? fitGrid(view, next.width, next.height, gridForLevel(next.width, next.height, level));
    const count = nextGrid.cols * nextGrid.rows;
    const placed = new Set(saved?.placed ?? []);
    setPuzzle(next);
    setGrid(nextGrid);
    setPieces(shuffled(range(count).filter((piece) => !placed.has(piece))));
    setBoard(range(count).map((cell) => (placed.has(cell) ? cell : null)));
    setSelected(null);
    const t = tr();
    const turn = betterTurned(view, next.width / next.height, nextGrid) ? ` ${t.turn}` : '';
    setMessage((saved ? t.resumed(count - placed.size) : t.started(count)) + turn);
  };

  const place = (piece: number, cell: number) => {
    if (!puzzle || board[cell] !== null) return;
    if (!fits(piece, cell)) {
      sound.miss();
      setMissCell(cell);
      window.clearTimeout(missTimer.current);
      missTimer.current = window.setTimeout(() => setMissCell(null), 450);
      setMessage(tr().miss);
      return;
    }
    const nextBoard = board.map((value, index) => (index === cell ? piece : value));
    const done = nextBoard.every((value, index) => value === index);
    setBoard(nextBoard);
    setPieces((current) => current.filter((value) => value !== piece));
    setSelected(null);
    if (total >= SAVE_FROM) {
      const placed = nextBoard.filter((value): value is number => value !== null);
      saveProgress(sdk.storage, profileId, puzzle.id, done ? null : { grid, placed });
    }
    if (done) {
      sound.win();
      setMessage(tr().solved);
    } else {
      sound.snap();
      setMessage(tr().good);
    }
  };

  const select = (piece: number) => {
    setSelected((current) => (current === piece ? null : piece));
    sound.pick();
  };

  return { puzzle, setPuzzle, grid, pieces, board, selected, setSelected, missCell, message, setMessage, complete, start, place, select };
}
