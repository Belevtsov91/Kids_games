import type { FastifyPluginAsync } from 'fastify';
import { profilesRepository, type Profile } from './profiles.repository.js';

const createBody = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 40 },
    avatar: { type: 'string', maxLength: 40, default: '🐻' },
  },
  additionalProperties: false,
} as const;

export const profilesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => profilesRepository.list());

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const profile = await profilesRepository.get(req.params.id);
    if (!profile) return reply.code(404).send({ error: 'Profile not found' });
    return profile;
  });

  app.post<{ Body: Pick<Profile, 'name' | 'avatar'> }>('/', { schema: { body: createBody } }, async (req, reply) => {
    const profile = await profilesRepository.create(req.body);
    return reply.code(201).send(profile);
  });
};
