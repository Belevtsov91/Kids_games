import { BPM_MAX, BPM_MIN, MAX_MASK, PADS, SWING_MAX, TITLE_MAX } from '../src/game/pattern.js';

// JSON-схемы запросов: Fastify отклоняет всё, что не по форме, ещё до обработчика.

export const createBody = {
  type: 'object',
  required: ['bpm', 'pattern'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: TITLE_MAX, default: 'Мой бит' },
    bpm: { type: 'integer', minimum: BPM_MIN, maximum: BPM_MAX },
    swing: { type: 'number', minimum: 0, maximum: SWING_MAX, default: 0 },
    pattern: {
      type: 'array',
      minItems: PADS,
      maxItems: PADS,
      items: { type: 'integer', minimum: 0, maximum: MAX_MASK },
    },
  },
  additionalProperties: false,
} as const;

export const shareBody = {
  type: 'object',
  required: ['shared'],
  properties: { shared: { type: 'boolean' } },
  additionalProperties: false,
} as const;

export const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', maxLength: 64 } },
} as const;

export const parentParams = {
  type: 'object',
  required: ['childId'],
  properties: { childId: { type: 'string', maxLength: 64 } },
} as const;
