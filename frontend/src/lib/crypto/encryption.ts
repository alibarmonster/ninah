import { Nonce } from '@/lib/crypto/nonce';
import { Bytes } from '@/lib/helpers/bytes';
import { CryptoError } from '@/lib/helpers/errors';

/**
 * Encrypted data structure with nonce and authentication tag
 */
export interface EncryptedData {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  tag: Uint8Array;
  aad?: Uint8Array; // Additional Authenticated Data (optional)
}

/**
 * Serialized encrypted data for storage/transmission
 * Format: [version(1) | nonce(12) | tag(16) | ciphertext(...)]
 */
export interface SerializedEncryption {
  version: number;
  data: string; // Base64-encoded
}

const ENCRYPTION_VERSION = 1;
const NONCE_LENGTH = 12; // 96 bits (recommended for AES-GCM)
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits (AES-256)
const MAX_PLAINTEXT_SIZE = 64 * 1024 * 1024; // 64MB max

/**
 * AES-256-GCM Encryption/Decryption for NinjaRupiah
 *
 * ## Security Features:
 * - AES-256-GCM: Industry standard authenticated encryption
 * - Automatic nonce generation: Prevents nonce reuse vulnerabilities
 * - Authentication tags: Detects tampering and corruption
 * - Additional Authenticated Data (AAD): Binds context to ciphertext
 * - Constant-time errors: Prevents timing side-channels
 * - Version prefixing: Future-proof encrypted data format
 *
 * ## Usage:
 * ```typescript
 * // Encrypt data
 * const key = Kdf.deriveStorageEncryptionKey(masterKey);
 * const encrypted = await Encryption.encrypt(plaintext, key);
 *
 * // Decrypt data
 * const decrypted = await Encryption.decrypt(
 *   encrypted.ciphertext,
 *   key,
 *   encrypted.nonce,
 *   encrypted.tag
 * );
 *
 * // Encrypt JSON for storage
 * const encryptedJson = await Encryption.encryptJson({ privateKey: "..." }, key);
 * const decrypted = await Encryption.decryptJson<{ privateKey: string }>(encryptedJson, key);
 * ```
 *
 * ## Security Notes:
 * - Never reuse the same key+nonce combination
 * - Nonces are automatically generated (cryptographically random)
 * - Keys must be 32 bytes (AES-256)
 * - Store nonces with ciphertext (they're not secret)
 * - Authentication tags must be verified (automatic in decrypt)
 */
export class Encryption {
  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * ## Security:
   * - Generates random 12-byte nonce automatically
   * - Creates 16-byte authentication tag
   * - Supports optional Additional Authenticated Data (AAD)
   *
   * @param plaintext - Data to encrypt
   * @param key - 32-byte AES-256 key
   * @param aad - Optional additional authenticated data (e.g., context, version)
   * @returns Encrypted data with nonce and authentication tag
   *
   * @throws CryptoError if key length invalid, plaintext too large, or encryption fails
   *
   * @example
   * ```typescript
   * const plaintext = new TextEncoder().encode("secret data");
   * const key = Kdf.deriveStorageEncryptionKey(masterKey);
   *
   * // Basic encryption
   * const encrypted = await Encryption.encrypt(plaintext, key);
   *
   * // With AAD (binds context to ciphertext)
   * const context = new TextEncoder().encode("user-123-storage-v1");
   * const encrypted = await Encryption.encrypt(plaintext, key, context);
   * ```
   */
  static async encrypt(plaintext: Uint8Array, key: Uint8Array, aad?: Uint8Array): Promise<EncryptedData> {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
      throw new CryptoError(`Key must be ${KEY_LENGTH} bytes for AES-256-GCM`, 'INVALID_KEY_LENGTH');
    }

    // Validate plaintext
    if (plaintext.length === 0) {
      throw new CryptoError('Plaintext cannot be empty', 'EMPTY_PLAINTEXT');
    }

    if (plaintext.length > MAX_PLAINTEXT_SIZE) {
      throw new CryptoError(`Plaintext too large (max ${MAX_PLAINTEXT_SIZE} bytes)`, 'PLAINTEXT_TOO_LARGE');
    }

    // Check for all-zero key (weak key)
    const isZeroKey = key.every((byte) => byte === 0);
    if (isZeroKey) {
      throw new CryptoError('Key cannot be all zeros', 'WEAK_KEY');
    }

    // Generate cryptographically random nonce
    const nonce = Nonce.generateNonce(NONCE_LENGTH);

    try {
      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
      );

      // Encrypt with AES-GCM
      const encryptParams: AesGcmParams = {
        name: 'AES-GCM',
        iv: nonce as BufferSource,
        tagLength: TAG_LENGTH * 8, // bits
      };

      // Add AAD if provided
      if (aad && aad.length > 0) {
        encryptParams.additionalData = aad as BufferSource;
      }

      const encrypted = await crypto.subtle.encrypt(encryptParams, cryptoKey, plaintext as BufferSource);

      // Split ciphertext and tag (Web Crypto appends tag to ciphertext)
      const encryptedArray = new Uint8Array(encrypted);
      const ciphertext = encryptedArray.slice(0, -TAG_LENGTH);
      const tag = encryptedArray.slice(-TAG_LENGTH);

      return {
        ciphertext,
        nonce,
        tag,
        aad,
      };
    } catch (_error) {
      // Constant error message to prevent timing attacks
      throw new CryptoError('Encryption operation failed', 'ENCRYPTION_FAILED');
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   *
   * ## Security:
   * - Verifies authentication tag (detects tampering)
   * - Requires exact nonce used during encryption
   * - AAD must match if it was used during encryption
   *
   * @param ciphertext - Encrypted data
   * @param key - 32-byte AES-256 key (must match encryption key)
   * @param nonce - 12-byte nonce used during encryption
   * @param tag - 16-byte authentication tag from encryption
   * @param aad - Optional AAD (must match encryption AAD if used)
   * @returns Decrypted plaintext
   *
   * @throws CryptoError if authentication fails, key wrong, or parameters invalid
   *
   * @example
   * ```typescript
   * const decrypted = await Encryption.decrypt(
   *   encrypted.ciphertext,
   *   key,
   *   encrypted.nonce,
   *   encrypted.tag,
   *   encrypted.aad // Include if AAD was used
   * );
   * ```
   */
  static async decrypt(
    ciphertext: Uint8Array,
    key: Uint8Array,
    nonce: Uint8Array,
    tag: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
      throw new CryptoError(`Key must be ${KEY_LENGTH} bytes for AES-256-GCM`, 'INVALID_KEY_LENGTH');
    }

    // Validate nonce length (FIXED: was checking !== 32, now !== 12)
    if (nonce.length !== NONCE_LENGTH) {
      throw new CryptoError(`Nonce must be ${NONCE_LENGTH} bytes for AES-GCM`, 'INVALID_NONCE_LENGTH');
    }

    // Validate tag length
    if (tag.length !== TAG_LENGTH) {
      throw new CryptoError(`Authentication tag must be ${TAG_LENGTH} bytes`, 'INVALID_TAG_LENGTH');
    }

    // Validate ciphertext
    if (ciphertext.length === 0) {
      throw new CryptoError('Ciphertext cannot be empty', 'EMPTY_CIPHERTEXT');
    }

    try {
      // Import key for Web Crypto API
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );

      // Combine ciphertext + tag (Web Crypto expects them together)
      const combined = new Uint8Array(ciphertext.length + tag.length);
      combined.set(ciphertext, 0);
      combined.set(tag, ciphertext.length);

      // Decrypt with AES-GCM
      const decryptParams: AesGcmParams = {
        name: 'AES-GCM',
        iv: nonce as BufferSource,
        tagLength: TAG_LENGTH * 8, // bits
      };

      // Add AAD if provided
      if (aad && aad.length > 0) {
        decryptParams.additionalData = aad as BufferSource;
      }

      const decrypted = await crypto.subtle.decrypt(decryptParams, cryptoKey, combined as BufferSource);

      return new Uint8Array(decrypted);
    } catch (_error) {
      // Constant error message to prevent timing attacks
      // Could be wrong key, tampered data, or wrong AAD
      throw new CryptoError('Decryption operation failed', 'DECRYPTION_FAILED');
    }
  }

  /**
   * Encrypt JSON object to base64 string
   * Convenient for storing encrypted data in localStorage or databases
   *
   * Format: [version(1) | nonce(12) | tag(16) | ciphertext(...)] → Base64
   *
   * @param obj - Any JSON-serializable object
   * @param key - 32-byte AES-256 key
   * @param aad - Optional AAD
   * @returns Base64-encoded encrypted data with version prefix
   *
   * @example
   * ```typescript
   * const encrypted = await Encryption.encryptJson(
   *   { privateKey: "0x...", username: "alice" },
   *   storageKey
   * );
   * localStorage.setItem('user_keys', encrypted);
   * ```
   */
  static async encryptJson<T = unknown>(obj: T, key: Uint8Array, aad?: Uint8Array): Promise<string> {
    // Serialize to JSON
    const json = JSON.stringify(obj);
    const plaintext = Bytes.stringToBytes(json);

    // Encrypt
    const encrypted = await this.encrypt(plaintext, key, aad);

    // Build format: [version | nonce | tag | ciphertext]
    const version = new Uint8Array([ENCRYPTION_VERSION]);
    const combined = Bytes.concatBytes(version, encrypted.nonce, encrypted.tag, encrypted.ciphertext);

    // Encode to base64
    return Bytes.bytesToBase64(combined);
  }

  /**
   * Decrypt base64 string to JSON object
   *
   * @param encryptedBase64 - Base64 string from encryptJson
   * @param key - 32-byte AES-256 key
   * @param aad - Optional AAD (must match encryption AAD)
   * @returns Decrypted and parsed JSON object
   *
   * @throws CryptoError if version mismatch, decryption fails, or invalid JSON
   *
   * @example
   * ```typescript
   * const encrypted = localStorage.getItem('user_keys');
   * const decrypted = await Encryption.decryptJson<UserKeys>(encrypted, storageKey);
   * ```
   */
  static async decryptJson<T = unknown>(encryptedBase64: string, key: Uint8Array, aad?: Uint8Array): Promise<T> {
    try {
      // Decode from base64
      const combined = Bytes.base64ToBytes(encryptedBase64);

      // Validate minimum length: version(1) + nonce(12) + tag(16) = 29 bytes
      if (combined.length < 29) {
        throw new CryptoError('Invalid encrypted data format', 'INVALID_FORMAT');
      }

      // Parse format: [version | nonce | tag | ciphertext]
      const version = combined[0];
      const nonce = combined.slice(1, 1 + NONCE_LENGTH);
      const tag = combined.slice(1 + NONCE_LENGTH, 1 + NONCE_LENGTH + TAG_LENGTH);
      const ciphertext = combined.slice(1 + NONCE_LENGTH + TAG_LENGTH);

      // Check version
      if (version !== ENCRYPTION_VERSION) {
        throw new CryptoError(
          `Unsupported encryption version ${version} (expected ${ENCRYPTION_VERSION})`,
          'VERSION_MISMATCH',
        );
      }

      // Decrypt
      const decrypted = await this.decrypt(ciphertext, key, nonce, tag, aad);

      // Parse JSON
      const json = Bytes.bytesToString(decrypted);
      return JSON.parse(json) as T;
    } catch (error) {
      if (error instanceof CryptoError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new CryptoError('Decrypted data is not valid JSON', 'INVALID_JSON');
      }
      throw new CryptoError('Failed to decrypt JSON', 'DECRYPTION_FAILED');
    }
  }

  /**
   * Encrypt string to EncryptedData structure
   * Useful when you need to keep nonce/tag separate
   *
   * @param str - String to encrypt
   * @param key - 32-byte AES-256 key
   * @param aad - Optional AAD
   * @returns EncryptedData structure
   *
   * @example
   * ```typescript
   * const encrypted = await Encryption.encryptString("secret message", key);
   * // Store separately: encrypted.ciphertext, encrypted.nonce, encrypted.tag
   * ```
   */
  static async encryptString(str: string, key: Uint8Array, aad?: Uint8Array): Promise<EncryptedData> {
    const plaintext = Bytes.stringToBytes(str);
    return this.encrypt(plaintext, key, aad);
  }

  /**
   * Decrypt EncryptedData structure to string
   *
   * @param encrypted - EncryptedData from encryptString
   * @param key - 32-byte AES-256 key
   * @returns Decrypted string
   *
   * @example
   * ```typescript
   * const decrypted = await Encryption.decryptString(encrypted, key);
   * ```
   */
  static async decryptString(encrypted: EncryptedData, key: Uint8Array): Promise<string> {
    const decrypted = await this.decrypt(encrypted.ciphertext, key, encrypted.nonce, encrypted.tag, encrypted.aad);
    return Bytes.bytesToString(decrypted);
  }

  /**
   * Encrypt bytes to base64 string (raw format, no JSON)
   *
   * @param data - Raw bytes to encrypt
   * @param key - 32-byte AES-256 key
   * @param aad - Optional AAD
   * @returns Base64-encoded encrypted bytes
   */
  static async encryptBytes(data: Uint8Array, key: Uint8Array, aad?: Uint8Array): Promise<string> {
    const encrypted = await this.encrypt(data, key, aad);

    // Format: [version | nonce | tag | ciphertext]
    const version = new Uint8Array([ENCRYPTION_VERSION]);
    const combined = Bytes.concatBytes(version, encrypted.nonce, encrypted.tag, encrypted.ciphertext);

    return Bytes.bytesToBase64(combined);
  }

  /**
   * Decrypt base64 string to bytes
   *
   * @param encryptedBase64 - Base64 from encryptBytes
   * @param key - 32-byte AES-256 key
   * @param aad - Optional AAD
   * @returns Decrypted bytes
   */
  static async decryptBytes(encryptedBase64: string, key: Uint8Array, aad?: Uint8Array): Promise<Uint8Array> {
    const combined = Bytes.base64ToBytes(encryptedBase64);

    if (combined.length < 29) {
      throw new CryptoError('Invalid encrypted data format', 'INVALID_FORMAT');
    }

    const version = combined[0];
    const nonce = combined.slice(1, 1 + NONCE_LENGTH);
    const tag = combined.slice(1 + NONCE_LENGTH, 1 + NONCE_LENGTH + TAG_LENGTH);
    const ciphertext = combined.slice(1 + NONCE_LENGTH + TAG_LENGTH);

    if (version !== ENCRYPTION_VERSION) {
      throw new CryptoError(
        `Unsupported encryption version ${version} (expected ${ENCRYPTION_VERSION})`,
        'VERSION_MISMATCH',
      );
    }

    return this.decrypt(ciphertext, key, nonce, tag, aad);
  }
}
