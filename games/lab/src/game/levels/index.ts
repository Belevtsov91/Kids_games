import { FIRST } from './first';
import { SECOND } from './second';
import type { Level } from './types';

export const LEVELS: Level[] = [...FIRST, ...SECOND];
export * from './types';
