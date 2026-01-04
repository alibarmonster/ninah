import { Kdf } from '@/lib/crypto/kdf';
import { KeyError } from '@/lib/helpers/errors';
import type { DerivedKeys, PublicKeys, KeyInitParams } from '@/lib/keys/types';
import { Secp256k1 } from '@/lib/crypto/secp256k1';

/**
 * Key derivation utilities for NinjaRupiah
 *
 * Implements two-factor key derivation combining:
 * 1. Password (something you know) - Hashed with Argon2id
 * 2. Wallet signature (something you have) - Deterministic signature from Privy wallet
 *
 * ## Key Derivation Flow:
 * ```
 * Password → Argon2id → Password Hash (32 bytes)
 *                                      ↓
 * Wallet + UserID → signMessage → Wallet Sig (32 bytes)
 *                                      ↓
 *                    HKDF-Keccak256 → Master Key (32 bytes)
 *                                      ↓
 *                              ┌───────┴───────┐
 *                              ↓               ↓
 *                    Storage Encryption Key   Meta Keys
 *                         (32 bytes)      (viewing + spending)
 * ```
 *
 * ## Security Features:
 * - Argon2id memory-hard password hashing (64MB, 3 iterations)
 * - HKDF-Keccak256 for Ethereum-native key derivation
 * - Deterministic wallet signatures for reproducibility
 * - Automatic memory wiping of intermediate values
 * - Constant-time key validation
 */
export class Derivation {
  /**
   * Derive all cryptographic keys from password and wallet
   *
   * ## Two-Factor Key Derivation:
   * 1. **Password Hash**: Argon2id(password, salt) → 32 bytes
   * 2. **Wallet Signature**: wallet.signMessage(userIdentifier) → 32 bytes
   * 3. **Master Key**: HKDF-Keccak256(passwordHash || walletSig) → 32 bytes
   * 4. **Sub-Keys**: Derived from master key using domain separation
   *
   * ## Process:
   * 1. Generate random salt (first time) or use provided salt (unlock)
   * 2. Hash password with Argon2id (memory-hard, 64MB, 3 iterations)
   * 3. Get deterministic wallet signature from Privy wallet
   * 4. Combine password hash + wallet signature using HKDF-Keccak256
   * 5. Derive sub-keys (storage encryption, viewing, spending)
   * 6. Generate public keys from private keys (secp256k1)
   * 7. Zero intermediate values from memory
   *
   * ## Security:
   * - Requires BOTH password AND Privy wallet access
   * - Deterministic (same inputs → same keys)
   * - Intermediate values zeroed from memory
   * - Salt prevents rainbow table attacks
   *
   * @param params - Initialization parameters (password, wallet, userIdentifier, authMethod)
   * @param salt - Optional Argon2 salt (16 bytes). If not provided, generates new random salt
   * @returns Object containing derived keys and salt used
   * @throws {KeyError} If key derivation fails
   *
   * @example
   * ```typescript
   * // First-time initialization (generates new salt)
   * const { keys, salt } = await Derivation.deriveKeys({
   *   password: "SecurePass123!",
   *   wallet: privyWallet,
   *   userIdentifier: "user@gmail.com",
   *   authMethod: 'email'
   * });
   *
   * // Unlock (use stored salt)
   * const stored = await Storage.loadKeysFromStorage(wallet.address);
   * const { keys } = await Derivation.deriveKeys(params, Bytes.base64ToBytes(stored.salt));
   * ```
   */
  static async deriveKeys(params: KeyInitParams, salt?: Uint8Array): Promise<{ keys: DerivedKeys; salt: Uint8Array }> {
    const { password, wallet, userIdentifier } = params;

    try {
      // Generate or use provided salt
      const argon2Salt = salt || Kdf.generateArgon2Salt(16);

      // Hash password with Argon2
      const passwordHash = await Kdf.derivePasswordHash(password, argon2Salt);

      // Get deterministic wallet signature
      const walletSig = await Kdf.deriveWalletSignature(wallet, userIdentifier);

      // Derive master key from password hash + wallet signature
      const masterKey = Kdf.deriveMasterKey(passwordHash, walletSig);

      // SECURITY: Clear sensitive intermediate values from memory
      passwordHash.fill(0);
      walletSig.fill(0);

      // Derive sub-keys
      const storageEncryptionKey = Kdf.deriveStorageEncryptionKey(masterKey);
      const metaViewingPriv = Kdf.deriveMetaViewingKey(masterKey);
      const metaSpendingPriv = Kdf.deriveMetaSpendingKey(masterKey);

      // Derive public keys
      const metaViewingPub = Secp256k1.privateKeyToPublicKey(metaViewingPriv);
      const metaSpendingPub = Secp256k1.privateKeyToPublicKey(metaSpendingPriv);

      const keys: DerivedKeys = {
        masterKey,
        storageEncryptionKey,
        metaViewingPriv,
        metaSpendingPriv,
        metaViewingPub,
        metaSpendingPub,
      };

      return { keys, salt: argon2Salt };
    } catch (error) {
      throw new KeyError(`Failed to derive keys: ${(error as Error).message}`, 'KEY_DERIVATION_FAILED');
    }
  }

  /**
   * Extract public keys from DerivedKeys
   *
   * Returns only the public keys (viewing and spending) which are safe to expose.
   * These keys are registered on-chain with the username and used by senders
   * to generate stealth addresses.
   *
   * ## Usage:
   * - On-chain username registration
   * - Sharing with payment senders
   * - QR code generation for receiving payments
   *
   * @param keys - Full derived keys including private keys
   * @returns Public keys only (metaViewingPub, metaSpendingPub)
   *
   * @example
   * ```typescript
   * const keys = keyManager.getKeys();
   * const publicKeys = Derivation.exportPublicKeys(keys);
   *
   * // Register on-chain
   * await contract.registerUsername(
   *   username,
   *   publicKeys.metaViewingPub,
   *   publicKeys.metaSpendingPub
   * );
   * ```
   */
  static exportPublicKeys(keys: DerivedKeys): PublicKeys {
    return {
      metaViewingPub: keys.metaViewingPub,
      metaSpendingPub: keys.metaSpendingPub,
    };
  }

  /**
   * Zero out all private keys from memory
   *
   * ## Security:
   * Overwrites all private key bytes with zeros to prevent:
   * - Memory dumps from exposing keys
   * - Swap file leakage
   * - Process memory inspection
   *
   * ## Important:
   * - Does NOT zero public keys (they're not sensitive)
   * - Call this when locking keys or before deriving new keys
   * - Keys are unusable after zeroing
   *
   * @param keys - Keys to zero (will be modified in-place)
   *
   * @example
   * ```typescript
   * // Lock keys when done
   * const keys = keyManager.getKeys();
   * Derivation.zeroKeys(keys);
   * // keys.masterKey, keys.metaViewingPriv, etc. are now all zeros
   * ```
   */
  static zeroKeys(keys: DerivedKeys): void {
    keys.masterKey.fill(0);
    keys.storageEncryptionKey.fill(0);
    keys.metaViewingPriv.fill(0);
    keys.metaSpendingPriv.fill(0);
  }

  /**
   * Validate that derived keys are correctly formed
   *
   * ## Validation Checks:
   * 1. **Length validation**: All keys must have correct byte lengths
   *    - Private keys: 32 bytes
   *    - Public keys: 33 bytes (compressed)
   * 2. **Consistency check**: Public keys must match their private keys
   *    - Re-derives public keys from private keys
   *    - Compares using constant-time comparison
   *
   * ## Security:
   * - Uses constant-time comparison to prevent timing side-channel attacks
   * - Prevents accepting malformed or tampered keys
   * - Validates secp256k1 curve membership
   *
   * @param keys - Keys to validate
   * @returns true if all keys are valid, false otherwise
   *
   * @example
   * ```typescript
   * const { keys } = await Derivation.deriveKeys(params);
   * if (!Derivation.validateKeys(keys)) {
   *   throw new KeyError('Derived keys are invalid');
   * }
   * ```
   */
  static validateKeys(keys: DerivedKeys): boolean {
    try {
      if (keys.masterKey.length !== 32) return false;
      if (keys.storageEncryptionKey.length !== 32) return false;
      if (keys.metaViewingPriv.length !== 32) return false;
      if (keys.metaViewingPub.length !== 33) return false;
      if (keys.metaSpendingPriv.length !== 32) return false;
      if (keys.metaSpendingPub.length !== 33) return false;

      const derivedViewingPub = Secp256k1.privateKeyToPublicKey(keys.metaViewingPriv);
      const derivedSpendingPub = Secp256k1.privateKeyToPublicKey(keys.metaSpendingPriv);

      // Constant-time comparison to prevent timing attacks
      let viewingMatch = 0;
      for (let i = 0; i < 33; i++) {
        viewingMatch |= derivedViewingPub[i] ^ keys.metaViewingPub[i];
      }

      let spendingMatch = 0;
      for (let i = 0; i < 33; i++) {
        spendingMatch |= derivedSpendingPub[i] ^ keys.metaSpendingPub[i];
      }

      return viewingMatch === 0 && spendingMatch === 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a deep copy of DerivedKeys
   *
   * ## Use Cases:
   * - Preserving keys before password update
   * - Creating isolated key instances
   * - Testing and validation
   *
   * ## Important:
   * - Creates NEW Uint8Array instances (not references)
   * - Original and copy are independent
   * - Remember to zero BOTH copies when done
   *
   * @param keys - Keys to copy
   * @returns New DerivedKeys instance with copied bytes
   *
   * @example
   * ```typescript
   * const originalKeys = keyManager.getKeys();
   * const backupKeys = Derivation.copyKeys(originalKeys);
   *
   * // Use originalKeys...
   * // Later, zero both copies
   * Derivation.zeroKeys(originalKeys);
   * Derivation.zeroKeys(backupKeys);
   * ```
   */
  static copyKeys(keys: DerivedKeys): DerivedKeys {
    return {
      masterKey: new Uint8Array(keys.masterKey),
      storageEncryptionKey: new Uint8Array(keys.storageEncryptionKey),
      metaViewingPriv: new Uint8Array(keys.metaViewingPriv),
      metaViewingPub: new Uint8Array(keys.metaViewingPub),
      metaSpendingPriv: new Uint8Array(keys.metaSpendingPriv),
      metaSpendingPub: new Uint8Array(keys.metaSpendingPub),
    };
  }
}
