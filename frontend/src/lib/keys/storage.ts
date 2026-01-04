import { Encryption } from '@/lib/crypto';
import { Bytes } from '@/lib/helpers/bytes';
import { StorageError } from '@/lib/helpers/errors';
import { KEY_DERIVATION_VERSION } from '@/lib/helpers/constants';
import type { DerivedKeys, EncryptedKeyStorage, AuthMethod } from '@/lib/keys/types';

/**
 * Serialize DerivedKeys to binary format for encryption
 *
 * ## Binary Format:
 * ```
 * Offset | Length | Field
 * -------|--------|------------------
 * 0      | 32     | masterKey
 * 32     | 32     | storageEncryptionKey
 * 64     | 32     | metaViewingPriv
 * 96     | 33     | metaViewingPub (compressed)
 * 129    | 32     | metaSpendingPriv
 * 161    | 33     | metaSpendingPub (compressed)
 * -------|--------|------------------
 * Total: 194 bytes
 * ```
 *
 * @param keys - DerivedKeys to serialize
 * @returns Binary-packed key data (194 bytes)
 */
function serializeKeys(keys: DerivedKeys): Uint8Array {
  const totalLength = 32 + 32 + 32 + 33 + 32 + 33; // 194 bytes
  const buffer = new Uint8Array(totalLength);

  let offset = 0;

  buffer.set(keys.masterKey, offset);
  offset += 32;

  buffer.set(keys.storageEncryptionKey, offset);
  offset += 32;

  buffer.set(keys.metaViewingPriv, offset);
  offset += 32;

  buffer.set(keys.metaViewingPub, offset);
  offset += 33;

  buffer.set(keys.metaSpendingPriv, offset);
  offset += 32;

  buffer.set(keys.metaSpendingPub, offset);
  offset += 33;

  return buffer;
}

/**
 * Deserialize binary data back to DerivedKeys
 *
 * Reverses the serialization performed by serializeKeys().
 * Validates that the buffer has the expected length (194 bytes).
 *
 * @param buffer - Binary-packed key data (must be exactly 194 bytes)
 * @returns Deserialized DerivedKeys
 * @throws {StorageError} If buffer length is not 194 bytes
 */
function deserializeKeys(buffer: Uint8Array): DerivedKeys {
  if (buffer.length !== 194) {
    throw new StorageError('Invalid serialized keys length', 'INVALID_KEY_FORMAT');
  }

  let offset = 0;

  const masterKey = buffer.slice(offset, offset + 32);
  offset += 32;

  const storageEncryptionKey = buffer.slice(offset, offset + 32);
  offset += 32;

  const metaViewingPriv = buffer.slice(offset, offset + 32);
  offset += 32;

  const metaViewingPub = buffer.slice(offset, offset + 33);
  offset += 33;

  const metaSpendingPriv = buffer.slice(offset, offset + 32);
  offset += 32;

  const metaSpendingPub = buffer.slice(offset, offset + 33);
  offset += 33;

  return {
    masterKey,
    storageEncryptionKey,
    metaViewingPriv,
    metaViewingPub,
    metaSpendingPriv,
    metaSpendingPub,
  };
}

/**
 * Open or create IndexedDB database for NinjaRupiah
 *
 * ## Database Schema:
 * - **Database Name**: `NinjaRupiah`
 * - **Version**: 1
 *
 * ## Object Stores:
 * 1. **keys** - Stores encrypted user keys
 *    - No auto-incrementing key
 *    - Manual keys: wallet addresses
 *
 * 2. **payments** - Stores stealth payment records
 *    - Key path: `stealthAddress`
 *
 * 3. **settings** - Stores application settings
 *    - No auto-incrementing key
 *
 * @returns Promise resolving to IDBDatabase instance
 * @throws {DOMException} If IndexedDB is unavailable or blocked
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NinjaRupiah', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }

      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'stealthAddress' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
  });
}

/**
 * Storage utilities for encrypted key persistence
 *
 * ## Storage Architecture:
 * - **Backend**: IndexedDB (browser-native persistent storage)
 * - **Encryption**: AES-256-GCM with AAD binding
 * - **Key Binding**: Wallet address used as AAD prevents key swapping
 * - **Format**: Base64-encoded versioned ciphertext
 *
 * ## Security Features:
 * 1. **AAD Binding**: Wallet address bound to ciphertext (prevents swapping)
 * 2. **Authenticated Encryption**: AES-GCM provides authenticity + confidentiality
 * 3. **Version Prefix**: Enables future migration and backward compatibility
 * 4. **Binary Serialization**: Efficient 194-byte key storage
 *
 * ## Storage Flow:
 * ```
 * DerivedKeys → Serialize (194 bytes)
 *            → Encrypt with AAD (wallet address)
 *            → Base64 encode
 *            → Store in IndexedDB
 * ```
 *
 * @see {@link EncryptedKeyStorage} for storage format
 */
export class Storage {
  /**
   * Encrypt DerivedKeys for storage in IndexedDB
   *
   * ## Process:
   * 1. Serialize keys to binary (194 bytes)
   * 2. Encrypt with AES-256-GCM using unlock key (password-only derived)
   * 3. Bind wallet address as AAD (prevents key swapping attacks)
   * 4. Base64 encode ciphertext
   * 5. Create EncryptedKeyStorage object with metadata
   *
   * ## Security:
   * - **AAD Binding**: Wallet address must match during decryption
   * - **Version Prefix**: Enables future migration
   * - **Authenticated Encryption**: Detects tampering
   * - **Password-only unlock**: Unlock key is derived from password only for better UX
   *
   * @param keys - DerivedKeys to encrypt
   * @param unlockKey - Unlock key derived from password only (32 bytes)
   * @param walletAddress - Ethereum wallet address (used as AAD)
   * @param userIdentifier - User identifier from Privy auth
   * @param authMethod - Privy authentication method used
   * @param salt - Argon2 salt used for master key derivation (16-32 bytes)
   * @param unlockSalt - Argon2 salt used for unlock key derivation (16-32 bytes)
   * @returns EncryptedKeyStorage object ready for IndexedDB
   * @throws {StorageError} If encryption fails
   *
   * @example
   * ```typescript
   * const encrypted = await Storage.encryptKeys(
   *   keys,
   *   unlockKey,
   *   wallet.address,
   *   "user@gmail.com",
   *   'email',
   *   salt,
   *   unlockSalt
   * );
   * await Storage.saveKeysToStorage(encrypted);
   * ```
   */
  static async encryptKeys(
    keys: DerivedKeys,
    unlockKey: Uint8Array,
    walletAddress: string,
    userIdentifier: string,
    authMethod: AuthMethod,
    salt: Uint8Array,
    unlockSalt: Uint8Array,
  ): Promise<EncryptedKeyStorage> {
    try {
      // Serialize keys to binary
      const serialized = serializeKeys(keys);

      // Use wallet address as AAD (prevents swapping encrypted keys between wallets)
      const aad = Bytes.stringToBytes(walletAddress);

      // Encrypt with Encryption.encryptBytes (includes version, nonce, tag, ciphertext in base64)
      const encryptedKeys = await Encryption.encryptBytes(serialized, unlockKey, aad);

      const storage: EncryptedKeyStorage = {
        version: KEY_DERIVATION_VERSION,
        walletAddress,
        userIdentifier,
        authMethod,
        salt: Bytes.bytesToBase64(salt),
        unlockSalt: Bytes.bytesToBase64(unlockSalt),
        encryptedKeys, // Single base64 string with [version | nonce | tag | ciphertext]
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return storage;
    } catch (error) {
      throw new StorageError(`Failed to encrypt keys: ${(error as Error).message}`, 'CRYPTO_ENCRYPTION_FAILED');
    }
  }

  /**
   * Decrypt EncryptedKeyStorage back to DerivedKeys
   *
   * ## Process:
   * 1. Extract wallet address from storage (used as AAD)
   * 2. Decrypt ciphertext using AES-256-GCM with AAD
   * 3. Deserialize decrypted binary to DerivedKeys
   * 4. Return keys for use
   *
   * ## Security:
   * - **AAD Verification**: Wallet address must match encryption AAD
   * - **Authentication Tag**: Verifies integrity and authenticity
   * - **Automatic Validation**: Encryption.decryptBytes validates tag
   * - **Password-only unlock**: Only needs unlock key (no wallet signature)
   *
   * @param storage - EncryptedKeyStorage loaded from IndexedDB
   * @param unlockKey - Unlock key derived from password only (32 bytes)
   * @returns Decrypted DerivedKeys
   * @throws {StorageError} If decryption fails (wrong key, tampered data, AAD mismatch)
   *
   * @example
   * ```typescript
   * const encrypted = await Storage.loadKeysFromStorage(wallet.address);
   * const unlockKey = await Kdf.deriveUnlockKey(password, unlockSalt);
   * const keys = await Storage.decryptKeys(encrypted, unlockKey);
   * ```
   */
  static async decryptKeys(storage: EncryptedKeyStorage, unlockKey: Uint8Array): Promise<DerivedKeys> {
    try {
      // Use wallet address as AAD (must match encryption AAD)
      const aad = Bytes.stringToBytes(storage.walletAddress);

      // Decrypt using Encryption.decryptBytes
      const decrypted = await Encryption.decryptBytes(storage.encryptedKeys, unlockKey, aad);

      // Deserialize binary back to DerivedKeys
      const keys = deserializeKeys(decrypted);

      return keys;
    } catch (error) {
      throw new StorageError(`Failed to decrypt keys: ${(error as Error).message}`, 'CRYPTO_DECRYPTION_FAILED');
    }
  }

  /**
   * Save encrypted keys to IndexedDB
   *
   * Persists EncryptedKeyStorage to the 'keys' object store using wallet address as the key.
   *
   * @param storage - EncryptedKeyStorage to save
   * @throws {StorageError} If IndexedDB write fails
   *
   * @example
   * ```typescript
   * const encrypted = await Storage.encryptKeys(...);
   * await Storage.saveKeysToStorage(encrypted);
   * ```
   */
  static async saveKeysToStorage(storage: EncryptedKeyStorage): Promise<void> {
    try {
      const db = await openDatabase();

      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');

      await new Promise<void>((resolve, reject) => {
        const request = store.put(storage, storage.walletAddress);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      throw new StorageError(`Failed to save keys to storage: ${(error as Error).message}`, 'STORAGE_WRITE_FAILED');
    }
  }

  /**
   * Load encrypted keys from IndexedDB
   *
   * Retrieves EncryptedKeyStorage from the 'keys' object store by wallet address.
   *
   * @param walletAddress - Ethereum wallet address (checksummed or not)
   * @returns EncryptedKeyStorage if found, null if no keys exist for this address
   * @throws {StorageError} If IndexedDB read fails
   *
   * @example
   * ```typescript
   * const encrypted = await Storage.loadKeysFromStorage(wallet.address);
   * if (encrypted) {
   *   const keys = await Storage.decryptKeys(encrypted, encryptionKey);
   * }
   * ```
   */
  static async loadKeysFromStorage(walletAddress: string): Promise<EncryptedKeyStorage | null> {
    try {
      const db = await openDatabase();

      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');

      const storage = await new Promise<EncryptedKeyStorage | null>((resolve, reject) => {
        const request = store.get(walletAddress);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      db.close();
      return storage;
    } catch (error) {
      throw new StorageError(`Failed to load keys from storage: ${(error as Error).message}`, 'STORAGE_READ_FAILED');
    }
  }

  /**
   * Delete keys from IndexedDB
   *
   * ## WARNING:
   * This permanently deletes encrypted keys. User will need to re-initialize
   * with password + wallet to generate new keys.
   *
   * @param walletAddress - Ethereum wallet address
   * @throws {StorageError} If IndexedDB delete fails
   *
   * @example
   * ```typescript
   * await Storage.deleteKeysFromStorage(wallet.address);
   * ```
   */
  static async deleteKeysFromStorage(walletAddress: string): Promise<void> {
    try {
      const db = await openDatabase();

      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(walletAddress);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      throw new StorageError(`Failed to delete keys from storage: ${(error as Error).message}`, 'STORAGE_WRITE_FAILED');
    }
  }

  /**
   * Check if keys exist in storage for a given wallet address
   *
   * ## Use Cases:
   * - Determine if user needs to initialize or unlock
   * - Show appropriate UI (setup vs login)
   * - Pre-flight check before unlock
   *
   * @param walletAddress - Ethereum wallet address to check
   * @returns true if keys exist for this address, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await Storage.keyExistsInStorage(wallet.address);
   * if (exists) {
   *   // Show unlock UI
   * } else {
   *   // Show initialization UI
   * }
   * ```
   */
  static async keyExistsInStorage(walletAddress: string): Promise<boolean> {
    try {
      const storage = await this.loadKeysFromStorage(walletAddress);
      return storage !== null;
    } catch {
      return false;
    }
  }
}
