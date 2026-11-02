import type { BrushTool, ToolId } from './types';
import { pencil } from './pencil';
import { marker } from './marker';
import { crayon } from './crayon';
import { eraser } from './eraser';

export type { BrushTool, ToolId };

export const tools: BrushTool[] = [pencil, marker, crayon, eraser];

export const palette = [0x1c1c1c, 0xe5484d, 0xf76b15, 0xffc53d, 0x30a46c, 0x3e63dd, 0x8e4ec6, 0xd6409f];
