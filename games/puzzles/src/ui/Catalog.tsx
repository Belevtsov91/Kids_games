import { useState, type ChangeEvent } from 'react';
import { LEVELS, type LevelId } from '../game/puzzleMath';
import type { PuzzleImage } from '../game/catalog';
import type { SavedPuzzleImage } from '../storage/imageLibrary';

type Puzzle = PuzzleImage | SavedPuzzleImage;

interface Props {
  puzzles: Puzzle[];
  savedIds: Set<string>;
  level: LevelId;
  onLevel: (level: LevelId) => void;
  onPick: (puzzle: Puzzle) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}

export function Catalog({ puzzles, savedIds, level, onLevel, onPick, onUpload, onRemove }: Props) {
  // Картинки из интернета могут не загрузиться (нет сети) — такие карточки прячем.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  return (
    <>
      <div className="puzzle-levels" role="radiogroup" aria-label="Сколько деталей">
        <span>Деталей:</span>
        {LEVELS.map((item) => (
          <button
            key={item.id}
            role="radio"
            aria-checked={level === item.id}
            className={level === item.id ? 'is-active' : ''}
            onClick={() => onLevel(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="puzzle-catalog" aria-label="Выбор пазла">
        <label className="puzzle-card upload-card">
          <span className="upload-plus" aria-hidden>
            ＋
          </span>
          <span>Своя картинка</span>
          <small>PNG, JPG, WEBP</small>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} />
        </label>
        {puzzles
          .filter((item) => !broken.has(item.id))
          .map((item) => (
            <div key={item.id} className="puzzle-card-wrap">
              <button className="puzzle-card" onClick={() => onPick(item)}>
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setBroken((current) => new Set(current).add(item.id))}
                />
                <span>{item.title}</span>
              </button>
              {savedIds.has(item.id) && (
                <button className="puzzle-remove" aria-label={`Удалить «${item.title}»`} onClick={() => onRemove(item.id)}>
                  ✕
                </button>
              )}
            </div>
          ))}
      </section>
    </>
  );
}
