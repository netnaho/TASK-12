/**
 * Re-exports from the canonical security/encryption module.
 * This file exists only for backward compatibility with code that imported
 * from config/encryption.  All new code should import from security/encryption.
 */
export {
  encrypt,
  decrypt,
  encryptField,
  decryptField,
  hashForLookup,
  encryptEmployeeId,
  decryptEmployeeId,
  type EncryptedPayload,
} from '../security/encryption';
