import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc' as const;
const IV_BYTES = 16 as const;
const KEY_BYTES = 32 as const;

export interface EncryptedPayload {
  ciphertext: Buffer;
  iv: Buffer;
}

function deriveKey(): Buffer {
  return Buffer.from(env.AES_ENCRYPTION_KEY, 'hex').subarray(0, KEY_BYTES);
}

export function encrypt(plaintext: string): EncryptedPayload {
  const iv = crypto.randomBytes(IV_BYTES);
  const key = deriveKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return { ciphertext: encrypted, iv };
}

export function decrypt(ciphertext: Buffer, iv: Buffer): string {
  const key = deriveKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function encryptField(value: string): EncryptedPayload {
  if (!value) {
    throw new Error('Cannot encrypt empty value');
  }
  return encrypt(value);
}

export function decryptField(
  ciphertext: Buffer | null | undefined,
  iv: Buffer | null | undefined,
): string | null {
  if (!ciphertext || !iv) return null;
  return decrypt(ciphertext, iv);
}

export function hashForLookup(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

// Backward-compatible aliases consumed by old config/encryption.ts callers
export const encryptEmployeeId = encryptField;
export function decryptEmployeeId(
  ciphertext: Buffer | null | undefined,
  iv: Buffer | null | undefined,
): string | null {
  return decryptField(ciphertext, iv);
}
