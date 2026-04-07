import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptField, decryptField, encryptEmployeeId, decryptEmployeeId, hashForLookup } from '../../src/security/encryption';

// The encryption module uses env.AES_ENCRYPTION_KEY (set in tests/setup.ts to 'a'.repeat(64))
// All tests run with that key.

describe('Encryption utilities', () => {
  describe('encrypt / decrypt roundtrip', () => {
    it('produces the original text after roundtrip', () => {
      const { ciphertext, iv } = encrypt('Hello, World!');
      const result = decrypt(ciphertext, iv);
      expect(result).toBe('Hello, World!');
    });

    it('handles empty string', () => {
      const { ciphertext, iv } = encrypt('');
      const result = decrypt(ciphertext, iv);
      expect(result).toBe('');
    });

    it('handles long strings', () => {
      const text = 'a'.repeat(10000);
      const { ciphertext, iv } = encrypt(text);
      const result = decrypt(ciphertext, iv);
      expect(result).toBe(text);
    });

    it('handles unicode text', () => {
      const text = 'Helloこんにちは🌍';
      const { ciphertext, iv } = encrypt(text);
      const result = decrypt(ciphertext, iv);
      expect(result).toBe(text);
    });
  });

  describe('different texts produce different ciphertexts', () => {
    it('encrypts different texts to different ciphertexts', () => {
      const { ciphertext: c1 } = encrypt('text1');
      const { ciphertext: c2 } = encrypt('text2');
      expect(c1.equals(c2)).toBe(false);
    });
  });

  describe('randomness — different IVs for same text', () => {
    it('produces different IVs for the same plaintext', () => {
      const { iv: iv1 } = encrypt('same text');
      const { iv: iv2 } = encrypt('same text');
      expect(iv1.equals(iv2)).toBe(false);
    });

    it('produces different ciphertexts for the same plaintext due to random IV', () => {
      const { ciphertext: c1 } = encrypt('same text');
      const { ciphertext: c2 } = encrypt('same text');
      expect(c1.equals(c2)).toBe(false);
    });
  });

  describe('encryptField / decryptField', () => {
    it('roundtrips correctly', () => {
      const { ciphertext, iv } = encryptField('secret');
      const result = decryptField(ciphertext, iv);
      expect(result).toBe('secret');
    });

    it('throws for empty value', () => {
      expect(() => encryptField('')).toThrow('Cannot encrypt empty value');
    });

    it('returns null for null inputs', () => {
      expect(decryptField(null, null)).toBeNull();
    });
  });

  describe('encryptEmployeeId / decryptEmployeeId roundtrip', () => {
    it('roundtrips correctly using config key', () => {
      const { ciphertext, iv } = encryptEmployeeId('EMP-12345');
      const result = decryptEmployeeId(ciphertext, iv);
      expect(result).toBe('EMP-12345');
    });

    it('throws for empty employee ID (via encryptField)', () => {
      expect(() => encryptEmployeeId('')).toThrow();
    });
  });

  describe('hashForLookup', () => {
    it('produces a consistent SHA-256 hex string', () => {
      const hash = hashForLookup('EMP-001');
      expect(hash).toHaveLength(64);
      expect(hashForLookup('EMP-001')).toBe(hash);
    });

    it('is case-insensitive and trims whitespace', () => {
      expect(hashForLookup('EMP-001')).toBe(hashForLookup('emp-001'));
      expect(hashForLookup(' EMP-001 ')).toBe(hashForLookup('EMP-001'));
    });

    it('produces different hashes for different values', () => {
      expect(hashForLookup('EMP-001')).not.toBe(hashForLookup('EMP-002'));
    });
  });
});
