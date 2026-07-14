import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyReply, FastifyRequest } from 'fastify';

const COOKIE_NAME = 'dv_session';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Cookie-signing secret persisted in the data directory so sessions survive
 * server restarts. Created with owner-only permissions on first run.
 */
export function loadOrCreateCookieSecret(dataDir: string): string
{
  mkdirSync(dataDir, { recursive: true });
  const secretPath = join(dataDir, 'cookie-secret');
  if (existsSync(secretPath))
  {
    return readFileSync(secretPath, 'utf8').trim();
  }
  const secret = randomBytes(32).toString('hex');
  writeFileSync(secretPath, secret, { encoding: 'utf8', mode: 0o600 });
  return secret;
}

interface SessionPayload
{
  u: string;
  exp: number;
}

export function setSession(reply: FastifyReply, username: string): void
{
  const payload: SessionPayload = {
    u: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  reply.setCookie(COOKIE_NAME, JSON.stringify(payload), {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSession(reply: FastifyReply): void
{
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

export function getSessionUser(request: FastifyRequest): string | null
{
  const raw = request.cookies[COOKIE_NAME];
  if (!raw)
  {
    return null;
  }
  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value === null)
  {
    return null;
  }
  try
  {
    const payload = JSON.parse(unsigned.value) as Partial<SessionPayload>;
    if (typeof payload.u !== 'string' || typeof payload.exp !== 'number' || payload.exp < Date.now())
    {
      return null;
    }
    return payload.u;
  }
  catch
  {
    return null;
  }
}
