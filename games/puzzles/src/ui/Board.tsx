import type { CSSProperties, PointerEvent, Ref } from 'react';
import { piecePosition, type Grid } from '../game/puzzleMath';
import { isBig } from '../game/boardFit';
import { tr } from '../i18n';

/** Фон детали: нужный кусок картинки. */
export const pieceBackground = (piece: number, imageUrl: string, grid: Grid): CSSProperties => ({
  backgroundImage: `url("${imageUrl}")`,
  backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`,
  backgroundPosition: piecePosition(piece, grid),
});

interface PieceProps {
  piece: number;
  imageUrl: string;
  grid: Grid;
  className?: string;
  onClick?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
}

export function Piece({ piece, imageUrl, grid, className = '', onClick, onPointerDown }: PieceProps) {
  return (
    <button
      className={`puzzle-piece ${className}`}
      style={pieceBackground(piece, imageUrl, grid)}
      aria-label={tr().piece(piece + 1)}
      onClick={onClick}
      onPointerDown={onPointerDown}
    />
  );
}

interface BoardProps {
  board: Array<number | null>;
  imageUrl: string;
  aspect: number;
  grid: Grid;
  hint: boolean;
  missCell: number | null;
  onCell: (cell: number) => void;
  boardRef: Ref<HTMLDivElement>;
}

export function Board({ board, imageUrl, aspect, grid, hint, missCell, onCell, boardRef }: BoardProps) {
  return (
    <div
      ref={boardRef}
      className={`puzzle-board ${hint ? 'with-hint' : ''} ${isBig(grid) ? 'is-big' : ''}`}
      style={{
        aspectRatio: String(aspect),
        ['--board-aspect' as string]: String(aspect),
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        ['--hint-image' as string]: `url("${imageUrl}")`,
      }}
    >
      {board.map((piece, cell) =>
        piece === null ? (
          <button
            key={cell}
            data-cell={cell}
            className={`puzzle-slot ${missCell === cell ? 'is-miss' : ''}`}
            onClick={() => onCell(cell)}
            aria-label={tr().cell(cell + 1)}
          />
        ) : (
          <Piece key={cell} piece={piece} imageUrl={imageUrl} grid={grid} className="is-placed" />
        ),
      )}
    </div>
  );
}

/** Деталь, которая едет за пальцем. Размер и положение ставит usePieceDrag напрямую, без перерисовки. */
export function DragGhost({ piece, imageUrl, grid, ghostRef }: { piece: number; imageUrl: string; grid: Grid; ghostRef: Ref<HTMLDivElement> }) {
  return <div ref={ghostRef} className="puzzle-piece drag-ghost" style={pieceBackground(piece, imageUrl, grid)} aria-hidden />;
}
