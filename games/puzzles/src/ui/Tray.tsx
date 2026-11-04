import { useState, type PointerEvent } from 'react';
import { isEdge, type Grid } from '../game/puzzleMath';
import { tr } from '../i18n';
import { Piece } from './Board';

/** С этого числа деталей в лотке появляются кнопки «Края» и «Середина». */
const FILTER_FROM = 25;
type Filter = 'all' | 'edge' | 'middle';

interface Props {
  pieces: number[];
  grid: Grid;
  imageUrl: string;
  selected: number | null;
  dragPiece: number | null;
  onSelect: (piece: number) => void;
  bind: (piece: number) => (event: PointerEvent<HTMLElement>) => void;
}

/** Лоток с деталями. В большом пазле можно оставить только края (рамку) или только середину. */
export function Tray({ pieces, grid, imageUrl, selected, dragPiece, onSelect, bind }: Props) {
  const t = tr();
  const [filter, setFilter] = useState<Filter>('all');
  const edges = pieces.filter((piece) => isEdge(piece, grid));
  const middle = pieces.filter((piece) => !isEdge(piece, grid));
  const withFilter = grid.cols * grid.rows >= FILTER_FROM;
  // Когда в выбранной группе деталей не осталось, показываем все.
  const active: Filter = !withFilter || (filter === 'edge' && !edges.length) || (filter === 'middle' && !middle.length) ? 'all' : filter;
  const shown = active === 'edge' ? edges : active === 'middle' ? middle : pieces;
  const chips: Array<[Filter, string, number]> = [
    ['all', t.all, pieces.length],
    ['edge', t.edges, edges.length],
    ['middle', t.middle, middle.length],
  ];

  return (
    <div className="piece-tray" aria-label={t.tray}>
      {withFilter && (
        <div className="tray-filter" role="radiogroup" aria-label={t.trayFilter}>
          {chips.map(([id, label, count]) => (
            <button
              key={id}
              role="radio"
              aria-checked={active === id}
              className={active === id ? 'is-active' : ''}
              disabled={!count}
              onClick={() => setFilter(id)}
            >
              {label} {count}
            </button>
          ))}
        </div>
      )}
      {shown.map((piece) => (
        <Piece
          key={piece}
          piece={piece}
          imageUrl={imageUrl}
          grid={grid}
          className={`${selected === piece ? 'is-selected' : ''} ${dragPiece === piece ? 'is-lifted' : ''}`}
          onClick={() => onSelect(piece)}
          onPointerDown={bind(piece)}
        />
      ))}
    </div>
  );
}
