import type { BlockType, TreeKind } from './world';

export interface BlockLook {
  label: string;
  emoji: string;
  top: string;
  side: string;
  bottom: string;
  /** Нота звука при установке, Гц. */
  pitch: number;
  transparent?: boolean;
  glow?: boolean;
}

export const BLOCKS: Record<BlockType, BlockLook> = {
  grass: { label: 'Трава', emoji: '🌿', top: '#5cc95a', side: '#8b6a3e', bottom: '#7a5a33', pitch: 392 },
  sand: { label: 'Песок', emoji: '🏖️', top: '#f2dc9b', side: '#e6cc85', bottom: '#d9bd74', pitch: 330 },
  stone: { label: 'Камень', emoji: '🪨', top: '#a3a9b3', side: '#8c929c', bottom: '#7a808a', pitch: 196 },
  wood: { label: 'Доски', emoji: '🪵', top: '#c8935a', side: '#b07a43', bottom: '#9c6a38', pitch: 262 },
  brick: { label: 'Кирпич', emoji: '🧱', top: '#d4634f', side: '#c0503e', bottom: '#a8432f', pitch: 220 },
  glass: { label: 'Стекло', emoji: '🔷', top: '#bfe9ff', side: '#a8dcf7', bottom: '#93cdef', pitch: 784, transparent: true },
  snow: { label: 'Снег', emoji: '❄️', top: '#ffffff', side: '#e8f0f7', bottom: '#d5e0ea', pitch: 523 },
  lantern: { label: 'Фонарь', emoji: '🏮', top: '#ffd166', side: '#ffbf3f', bottom: '#e8a92a', pitch: 659, glow: true },
};

export const TREES: Record<TreeKind, { label: string; emoji: string }> = {
  palm: { label: 'Пальма', emoji: '🌴' },
  pine: { label: 'Ель', emoji: '🌲' },
  round: { label: 'Дуб', emoji: '🌳' },
  flowers: { label: 'Цветы', emoji: '🌷' },
};

export type Tool = 'build' | 'paint' | 'dig' | 'tree' | 'boat' | 'crate';

export const TOOLS: { id: Tool; label: string; emoji: string; hint: string }[] = [
  { id: 'build', label: 'Строить', emoji: '🧱', hint: 'Нажми на блок или дно — появится новый блок' },
  { id: 'paint', label: 'Красить', emoji: '🖌️', hint: 'Нажми на блок, чтобы сменить материал' },
  { id: 'dig', label: 'Копать', emoji: '⛏️', hint: 'Нажми на блок или дерево, чтобы убрать' },
  { id: 'tree', label: 'Сажать', emoji: '🌱', hint: 'Нажми на траву, песок или снег' },
  { id: 'boat', label: 'Лодка', emoji: '⛵', hint: 'Нажми на воду — спустишь лодку. Нажми на лодку — толкнёшь' },
  { id: 'crate', label: 'Ящик', emoji: '📦', hint: 'Нажми куда угодно — сверху упадёт ящик' },
];
