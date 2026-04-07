import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/security/password';

describe('Password helpers', () => {
  describe('hashPassword', () => {
    it('returns a bcrypt hash (starts with $2b$)', async () => {
      const hash = await hashPassword('mySecret123!');
      expect(hash).toMatch(/^\$2b\$/);
    });

    it('produces different hashes for the same plaintext on repeat calls', async () => {
      const h1 = await hashPassword('samePassword');
      const h2 = await hashPassword('samePassword');
      expect(h1).not.toBe(h2);
    });

    it('hash is at least 60 characters (bcrypt output length)', async () => {
      const hash = await hashPassword('short');
      expect(hash.length).toBeGreaterThanOrEqual(60);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct plaintext', async () => {
      const plaintext = 'CorrectHorse99!';
      const hash = await hashPassword(plaintext);
      const result = await verifyPassword(plaintext, hash);
      expect(result).toBe(true);
    });

    it('returns false for wrong plaintext', async () => {
      const hash = await hashPassword('realPassword');
      const result = await verifyPassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('returns false for empty string against a real hash', async () => {
      const hash = await hashPassword('notEmpty');
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('handles special characters in plaintext', async () => {
      const plaintext = 'P@$$w0rd!™£€#%^&*()';
      const hash = await hashPassword(plaintext);
      expect(await verifyPassword(plaintext, hash)).toBe(true);
      expect(await verifyPassword('P@$$w0rd!', hash)).toBe(false);
    });

    it('returns false against a completely invalid hash string', async () => {
      const result = await verifyPassword('anything', 'not-a-valid-hash');
      expect(result).toBe(false);
    });
  });
});
