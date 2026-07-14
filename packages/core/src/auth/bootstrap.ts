import type { DocStore } from '../store.js';
import { generatePassword, hashPassword, verifyPassword } from './password.js';

export const ADMIN_USERNAME = 'admin';

export interface BootstrapResult
{
  created: boolean;
  rotated: boolean;
  /** Present only when no password was provided and one had to be generated. */
  generatedPassword?: string;
}

/**
 * Ensures the admin user exists. A provided password (typically from the
 * DOC_VIEWER_ADMIN_PASSWORD env var) is the source of truth: if it no longer
 * matches the stored hash, the hash is rotated. Without a provided password a
 * random one is generated on first run and returned so the caller can surface
 * it to the operator exactly once.
 */
export function bootstrapAdmin(store: DocStore, providedPassword?: string): BootstrapResult
{
  const existing = store.users.getByUsername(ADMIN_USERNAME);

  if (!existing)
  {
    if (providedPassword)
    {
      store.users.create(ADMIN_USERNAME, hashPassword(providedPassword));
      return { created: true, rotated: false };
    }
    const generated = generatePassword();
    store.users.create(ADMIN_USERNAME, hashPassword(generated));
    return { created: true, rotated: false, generatedPassword: generated };
  }

  if (providedPassword && !verifyPassword(providedPassword, existing.passwordHash))
  {
    store.users.updatePassword(existing.id, hashPassword(providedPassword));
    return { created: false, rotated: true };
  }

  return { created: false, rotated: false };
}
