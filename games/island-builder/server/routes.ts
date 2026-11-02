import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { BLOCK_TYPES, GRID, MAX_HEIGHT, MAX_TREES, STAT_KEYS, TREE_KINDS, type SaveData } from '../src/world.js';
import { islandsRepository } from './repository.js';

const cell = (types: number) =>
  ({
    type: 'array',
    minItems: 4,
    maxItems: 4,
    items: [
      { type: 'integer', minimum: 0, maximum: GRID - 1 },
      { type: 'integer', minimum: 0, maximum: MAX_HEIGHT - 1 },
      { type: 'integer', minimum: 0, maximum: GRID - 1 },
      { type: 'integer', minimum: 0, maximum: types - 1 },
    ],
  }) as const;

const saveBody = {
  type: 'object',
  required: ['v', 'blocks', 'trees', 'stats', 'night', 'achieved'],
  properties: {
    v: { const: 1 },
    blocks: { type: 'array', maxItems: GRID * GRID * MAX_HEIGHT, items: cell(BLOCK_TYPES.length) },
    trees: { type: 'array', maxItems: MAX_TREES, items: cell(TREE_KINDS.length) },
    stats: {
      type: 'object',
      required: [...STAT_KEYS],
      properties: Object.fromEntries(STAT_KEYS.map((key) => [key, { type: 'integer', minimum: 0, maximum: 1e9 }])),
      additionalProperties: false,
    },
    night: { type: 'boolean' },
    achieved: { type: 'array', maxItems: 50, items: { type: 'string', pattern: '^[a-z-]{1,32}$' } },
  },
  additionalProperties: false,
} as const;

// Остров привязан к ребёнку из серверной сессии: клиенту не доверяем, чей он.
const childOf = (req: FastifyRequest) => (req as { session?: { activeChildId?: string | null } | null }).session?.activeChildId ?? null;
const NO_CHILD = { error: 'Нужно выбрать ребёнка' };

export const islandsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send(NO_CHILD);
    const saved = await islandsRepository.get(childId);
    return { island: saved?.island ?? null, updatedAt: saved?.updatedAt ?? null };
  });

  app.post<{ Body: SaveData }>(
    '/',
    // Полный остров 20×20×12 в JSON — до ~70 КБ, с запасом.
    { schema: { body: saveBody }, bodyLimit: 512 * 1024 },
    async (req, reply) => {
      const childId = childOf(req);
      if (!childId) return reply.code(401).send(NO_CHILD);
      const saved = await islandsRepository.save(childId, req.body);
      return { updatedAt: saved.updatedAt };
    },
  );

  app.delete('/', async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send(NO_CHILD);
    await islandsRepository.remove(childId);
    return reply.code(204).send();
  });
};
