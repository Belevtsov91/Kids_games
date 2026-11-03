import type { CSSProperties, PointerEvent } from 'react';
import { piecePosition, type Grid } from '../game/puzzleMath';
import type { DragState } from '../input/usePieceDrag';
import { tr } from '../i18n';

interface PieceProps {
  piece: number;
  imageUrl: string;
  grid: Grid;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
}

export function Piece({ piece, imageUrl, grid, className = '', style, onClick, onPointerDown }: PieceProps) {
  return (
    <button
      className={`puzzle-piece ${className}`}
      style={{
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: `${grid.cols * 100}% ${grid.rows * 100}%`,
        backgroundPosition: piecePosition(piece, grid),
        ...style,
      }}
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
}

export function Board({ board, imageUrl, aspect, grid, hint, missCell, onCell }: BoardProps) {
  return (
    <div
      className={`puzzle-board ${hint ? 'with-hint' : ''}`}
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

/** Деталь, которая едет за пальцем. */
export function DragGhost({ drag, imageUrl, grid, aspect }: { drag: DragState; imageUrl: string; grid: Grid; aspect: number }) {
  return (
    <Piece
      piece={drag.piece}
      imageUrl={imageUrl}
      grid={grid}
      className="drag-ghost"
      style={{
        width: drag.size,
        aspectRatio: String(aspect * (grid.rows / grid.cols)),
        transform: `translate(${drag.x - drag.size / 2}px, ${drag.y - drag.size / 2}px) scale(1.12)`,
      }}
    />
  );
}
