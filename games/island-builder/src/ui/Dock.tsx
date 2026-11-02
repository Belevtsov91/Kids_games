import type { CSSProperties } from 'react';
import { BLOCKS, TOOLS, TREES, type Tool } from '../game/blocks';
import { BLOCK_TYPES, TREE_KINDS, type BlockType, type TreeKind } from '../game/world';
import { sound } from '../audio/sound';

// Нижняя панель: инструменты и, для некоторых из них, палитра материалов или растений.

interface Props {
  tool: Tool;
  material: BlockType;
  treeKind: TreeKind;
  onTool(tool: Tool): void;
  onMaterial(material: BlockType): void;
  onTreeKind(kind: TreeKind): void;
}

export function Dock({ tool, material, treeKind, onTool, onMaterial, onTreeKind }: Props) {
  return (
    <nav className="ib-dock">
      {(tool === 'build' || tool === 'paint') && (
        <div className="ib-row ib-palette" role="radiogroup" aria-label="Материал">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              role="radio"
              aria-checked={material === type}
              className={`ib-swatch${material === type ? ' ib-on' : ''}`}
              style={{ '--top': BLOCKS[type].top, '--side': BLOCKS[type].side } as CSSProperties}
              onClick={() => {
                onMaterial(type);
                sound.place(BLOCKS[type].pitch);
              }}
              title={BLOCKS[type].label}
            >
              <span className="ib-cube" />
              <span className="ib-label">{BLOCKS[type].label}</span>
            </button>
          ))}
        </div>
      )}
      {tool === 'tree' && (
        <div className="ib-row ib-palette" role="radiogroup" aria-label="Растение">
          {TREE_KINDS.map((kind) => (
            <button
              key={kind}
              role="radio"
              aria-checked={treeKind === kind}
              className={`ib-swatch${treeKind === kind ? ' ib-on' : ''}`}
              onClick={() => {
                onTreeKind(kind);
                sound.click();
              }}
            >
              <span className="ib-emoji">{TREES[kind].emoji}</span>
              <span className="ib-label">{TREES[kind].label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="ib-row ib-tools" role="radiogroup" aria-label="Инструмент">
        {TOOLS.map((t) => (
          <button key={t.id} role="radio" aria-checked={tool === t.id} className={`ib-tool${tool === t.id ? ' ib-on' : ''}`} onClick={() => onTool(t.id)}>
            <span className="ib-emoji">{t.emoji}</span>
            <span className="ib-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
