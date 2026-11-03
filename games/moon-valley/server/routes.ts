import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';
import { MAX_LEVEL, PLOT_COUNT } from '../src/game/valley/index.js';
import { QUESTS } from '../src/game/quests.js';
import { createSavesRepository } from './repository.js';

const int = (max: number) => ({ type: 'integer', minimum: 0, maximum: max }) as const;
const ids = { type: 'array', maxItems: 50, items: { type: 'string', pattern: '^[a-z0-9-]{1,32}$' } } as const;

// Форма сохранения (ValleyState + savedAt). Лишние поля отбрасываются, кривые — 400.
const saveBody = {
  type: 'object',
  required: ['level', 'xp', 'starlight', 'seeds', 'water', 'plots', 'pets', 'stats', 'quest'],
  properties: {
    level: { type: 'integer', minimum: 1, maximum: MAX_LEVEL },
    xp: int(100_000),
    starlight: int(1_000_000),
    seeds: int(100_000),
    water: int(100_000),
    plots: {
      type: 'array',
      maxItems: PLOT_COUNT,
      items: {
        type: 'object',
        required: ['id', 'stage'],
        properties: { id: int(PLOT_COUNT - 1), stage: int(3) },
        additionalProperties: false,
      },
    },
    pets: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        required: ['id', 'affection'],
        properties: {
          id: { enum: ['fox', 'owl', 'bunny'] },
          name: { type: 'string', maxLength: 32 },
          level: { type: 'integer', minimum: 1, maximum: 5 },
          affection: int(100),
          unlocked: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    },
    buildings: ids,
    explored: ids,
    opened: ids,
    stats: {
      type: 'object',
      required: ['harvested', 'crystals', 'cleansed', 'boss', 'chests'],
      properties: { harvested: int(1e9), crystals: int(1e9), cleansed: int(1e9), boss: int(1), chests: int(100) },
      additionalProperties: false,
    },
    quest: {
      type: 'object',
      required: ['index', 'active', 'base'],
      properties: { index: int(QUESTS.length), active: { type: 'boolean' }, base: int(1e9) },
      additionalProperties: false,
    },
    savedAt: { type: 'number', minimum: 0 },
  },
  additionalProperties: false,
} as const;

// Сохранение привязано к ребёнку из серверной сессии: клиенту не доверяем, чьё оно.
export const saveRoutes: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const repository = createSavesRepository(opts.db);
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => {
    const saved = await repository.get(childIdOf(req)!);
    return { save: saved?.save ?? null, updatedAt: saved?.updatedAt ?? null };
  });

  app.post('/', { schema: { body: saveBody }, bodyLimit: 32 * 1024 }, async (req) => {
    const saved = await repository.save(childIdOf(req)!, req.body);
    return { updatedAt: saved.updatedAt };
  });

  app.delete('/', async (req, reply) => {
    await repository.remove(childIdOf(req)!);
    return reply.code(204).send();
  });
};
