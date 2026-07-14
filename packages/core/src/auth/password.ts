import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_COST = 16384;
const KEY_LENGTH = 64;

/** Hashes a password as `scrypt$<cost>$<salt-hex>$<hash-hex>`. */
export function hashPassword(password: string): string
{
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_COST });
  return `scrypt$${SCRYPT_COST}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean
{
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt')
  {
    return false;
  }
  const cost = Number(parts[1]);
  if (!Number.isInteger(cost) || cost <= 0)
  {
    return false;
  }
  const salt = Buffer.from(parts[2], 'hex');
  const expected = Buffer.from(parts[3], 'hex');
  const actual = scryptSync(password, salt, expected.length, { N: cost });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** URL-safe random password for first-run admin bootstrap. */
export function generatePassword(length = 24): string
{
  return randomBytes(length * 2).toString('base64url').replaceAll(/[-_]/g, '').slice(0, length);
}
