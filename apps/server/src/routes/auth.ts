import type { DocStore } from '@doc-viewer/core';
import { verifyPassword } from '@doc-viewer/core';
import type { FastifyInstance } from 'fastify';
import { setTimeout as sleep } from 'node:timers/promises';
import { clearSession, getSessionUser, setSession } from '../auth/session.js';

interface LoginBody
{
  username: string;
  password: string;
}

const loginBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['username', 'password'],
  properties: {
    username: { type: 'string', minLength: 1, maxLength: 100 },
    password: { type: 'string', minLength: 1, maxLength: 200 }
  }
} as const;

export function registerAuthRoutes(app: FastifyInstance, store: DocStore): void
{
  app.post<{ Body: LoginBody }>(
    '/api/auth/login',
    { schema: { body: loginBodySchema } },
    async (request, reply) =>
    {
      const user = store.users.getByUsername(request.body.username);
      if (!user || !verifyPassword(request.body.password, user.passwordHash))
      {
        await sleep(300);
        return reply.status(401).send({ error: 'Invalid username or password' });
      }
      setSession(reply, user.username);
      return { user: { username: user.username } };
    }
  );

  app.post('/api/auth/logout', async (_request, reply) =>
  {
    clearSession(reply);
    return { authenticated: false };
  });

  app.get('/api/auth/me', async (request) =>
  {
    const username = getSessionUser(request);
    return username === null
      ? { authenticated: false }
      : { authenticated: true, username };
  });
}
